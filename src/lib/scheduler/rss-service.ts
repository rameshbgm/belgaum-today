import { randomUUID } from 'node:crypto';
import { query, execute, insert } from '@/lib/db';
import { fetchAllFeeds, RssFeedConfig, dueForScheduledFetch } from '@/lib/rss';
import { publisherDomainUrl, assertSourcePolicyConfigured, directPublisherFeed, hasNonEnglishScript, isBlockedSource } from '@/lib/source-policy';
import { classifyIndiaStories } from '@/lib/local-relevance';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { fileLogger } from '@/lib/fileLogger';

type FetchItemLog = {
    title: string;
    url: string | null;
    pubDate: Date | null;
    action: 'new' | 'skipped' | 'error';
    skipReason?: string;
    errorMessage?: string;
    articleId?: number | null;
};

async function saveFetchItems(runId: string, feed: RssFeedConfig, items: FetchItemLog[]): Promise<void> {
    for (let offset = 0; offset < items.length; offset += 100) {
        const batch = items.slice(offset, offset + 100);
        const unresolved = batch.filter(item => !item.articleId && item.url)
            .map(item => ({ item, sourceUrl: publisherDomainUrl(item.url!, feed.publisher_domain!) }))
            .filter((entry): entry is { item: FetchItemLog; sourceUrl: string } => Boolean(entry.sourceUrl));
        const sourceUrls = [...new Set(unresolved.map(entry => entry.sourceUrl))];
        if (sourceUrls.length) {
            const existing = await query<Array<{ id: number; source_url: string }>>(
                `SELECT id, source_url FROM articles WHERE source_url IN (${sourceUrls.map(() => '?').join(', ')})`, sourceUrls
            );
            const articleIds = new Map(existing.map(article => [article.source_url, article.id]));
            for (const { item, sourceUrl } of unresolved) {
                item.url = sourceUrl;
                item.articleId = articleIds.get(sourceUrl) ?? null;
            }
        }
        const values = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
        const params = batch.flatMap(item => [
            runId, feed.id, feed.name.slice(0, 100), item.title.slice(0, 500), item.url?.slice(0, 1000) || null,
            item.pubDate && Number.isFinite(item.pubDate.getTime()) ? item.pubDate : null,
            item.action, item.skipReason?.slice(0, 200) || null, item.errorMessage || null, item.articleId ?? null,
        ]);
        await execute(
            `INSERT INTO rss_fetch_items
             (run_id, feed_id, feed_name, item_title, item_url, item_pub_date, action, skip_reason, error_message, article_id)
             VALUES ${values}`,
            params,
        );
    }
}

export async function runRssFetch(options: {
    feedIds?: number[];
    categories?: string[];
    force?: boolean;
    triggerType?: 'manual' | 'cron' | 'scheduled';
    triggeredBy?: string;
} = {}): Promise<{ newArticles: number; skipped: number; errors: number; feedsProcessed: number }> {
    const start = Date.now();
    fileLogger.info('cron', '═══ Scheduled RSS fetch started ═══');

    assertSourcePolicyConfigured();
    const configuredFeeds = await query<RssFeedConfig[]>(
        `SELECT * FROM rss_feed_config WHERE is_active = true AND publisher_domain IS NOT NULL`
    );
    const feeds = configuredFeeds.filter(feed =>
        (options.force || dueForScheduledFetch(feed)) &&
        (!options.feedIds?.length || options.feedIds.includes(feed.id)) &&
        (!options.categories?.length || options.categories.includes(feed.category)) &&
        directPublisherFeed(feed.feed_url, feed.publisher_domain!) && !isBlockedSource(feed.feed_url, feed.name));

    if (feeds.length === 0) {
        fileLogger.info('cron', 'No active feeds found');
        return { newArticles: 0, skipped: 0, errors: 0, feedsProcessed: 0 };
    }

    const runId = randomUUID();
    await insert(
        `INSERT INTO rss_fetch_runs (run_id, trigger_type, triggered_by, total_feeds, started_at)
         VALUES (?, ?, ?, ?, ?)`,
        [runId, options.triggerType || (options.force ? 'manual' : 'scheduled'), options.triggeredBy || null, feeds.length, new Date(start)]
    );

    fileLogger.info('cron', `Fetching ${feeds.length} active feeds`);

    const feedResults = await fetchAllFeeds(feeds);

    let totalNew = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const { feedId, items, error: fetchError } of feedResults) {
        const feed = feeds.find((f: RssFeedConfig) => f.id === feedId);
        if (!feed) continue;

        let feedNew = 0;
        let feedSkipped = 0;
        const feedErrors: string[] = [];
        const itemLogs: FetchItemLog[] = [];
        if (fetchError) feedErrors.push(fetchError);

        // RSS feeds usually list newest items first. Bound first-run AI work.
        const batch = items.slice(0, 15);
        for (const item of items.slice(batch.length)) {
            feedSkipped++;
            itemLogs.push({ title: item.title || '(untitled item)', url: item.link || null, pubDate: item.pubDate, action: 'skipped', skipReason: 'batch_limit' });
        }
        let classifications: Awaited<ReturnType<typeof classifyIndiaStories>> = [];
        try { classifications = await classifyIndiaStories(batch); }
        catch (error) { fileLogger.warn('ai', 'Feed classification deferred', { feedId, error: String(error) }); }
        for (const [index, item] of batch.entries()) {
            try {
                if (isBlockedSource(item.link, feed.name) || hasNonEnglishScript(item.title)) {
                    feedSkipped++;
                    itemLogs.push({ title: item.title || '(untitled item)', url: item.link || null, pubDate: item.pubDate, action: 'skipped', skipReason: 'blocked_source_or_non_english' });
                    continue;
                }
                const sourceLink = publisherDomainUrl(item.link, feed.publisher_domain!);
                if (!sourceLink || isBlockedSource(sourceLink, item.sourceName)) {
                    feedSkipped++;
                    itemLogs.push({ title: item.title || '(untitled item)', url: item.link || null, pubDate: item.pubDate, action: 'skipped', skipReason: 'publisher_domain_mismatch' });
                    continue;
                }

                const existing = await query<Array<{ id: number; status: string; feed_id: number | null; geo_status: string }>>(
                    'SELECT id, status, feed_id, geo_status FROM articles WHERE source_url IN (?, ?) LIMIT 1',
                    [item.link, sourceLink]
                );

                let geoStatus: 'pending' | 'india' | 'excluded' = 'pending';
                let isLocal = false;
                try {
                    const classification = classifications[index];
                    if (!classification) throw new Error('Classification unavailable');
                    geoStatus = !classification.certain ? 'pending' : classification.india ? 'india' : 'excluded';
                    isLocal = geoStatus === 'india' && classification.local;
                } catch { /* Persist for automatic retry when the model is available. */ }
                if (geoStatus === 'excluded' || (feed.category === 'belgaum' && geoStatus === 'india' && !isLocal)) {
                    feedSkipped++;
                    itemLogs.push({ title: item.title, url: sourceLink, pubDate: item.pubDate, action: 'skipped', skipReason: 'outside_india_or_belagavi' });
                    continue;
                }
                const articleCategory = isLocal ? 'belgaum' : feed.category;

                if (existing.length > 0) {
                    const article = existing[0];
                    // An exact RSS item proves feed membership for legacy rows.
                    if (article.status !== 'archived' && article.geo_status === 'pending' &&
                        (article.feed_id === null || article.feed_id === feed.id)) {
                        const affected = await execute(
                            `UPDATE articles SET feed_id = ?, publisher_domain = ?, geo_status = ?,
                             status = ?, category = ?, source_name = ?
                             WHERE id = ? AND geo_status = 'pending' AND (feed_id IS NULL OR feed_id = ?)`,
                            [feed.id, feed.publisher_domain, geoStatus, geoStatus === 'india' ? 'published' : 'draft',
                             articleCategory, feed.publisher_name || feed.name, article.id, feed.id]
                        );
                        if (affected) {
                            feedNew++;
                            itemLogs.push({ title: item.title, url: sourceLink, pubDate: item.pubDate, action: 'new', articleId: article.id });
                            continue;
                        }
                    }
                    feedSkipped++;
                    itemLogs.push({ title: item.title, url: sourceLink, pubDate: item.pubDate, action: 'skipped', skipReason: 'already_ingested', articleId: article.id });
                    continue;
                }

                let slug = generateSlug(item.title);
                const slugExists = await query<{ id: number }[]>(
                    'SELECT id FROM articles WHERE slug = ? LIMIT 1',
                    [slug]
                );
                if (slugExists.length > 0) {
                    slug = `${slug}-${Date.now()}`;
                }

                const readingTime = calculateReadingTime(item.description || item.title);

                let articleId: number;
                try {
                    articleId = await insert(
                        `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, feed_id, publisher_domain, geo_status, status, featured, ai_generated, view_count, reading_time, published_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.title, slug, item.description || item.title, item.description || item.title,
                            item.imageUrl, articleCategory, feed.publisher_name || feed.name, sourceLink, feed.id, feed.publisher_domain, geoStatus,
                            geoStatus === 'india' ? 'published' : 'draft', false, false, 0, readingTime, item.pubDate,
                        ]
                        );
                } catch (insertErr) {
                    const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
                    if (msg.includes('Duplicate entry') && msg.includes("for key 'slug'")) {
                        articleId = await insert(
                            `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, feed_id, publisher_domain, geo_status, status, featured, ai_generated, view_count, reading_time, published_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                item.title, `${slug}-${Date.now()}`, item.description || item.title, item.description || item.title,
                                item.imageUrl, articleCategory, feed.publisher_name || feed.name, sourceLink, feed.id, feed.publisher_domain, geoStatus,
                                geoStatus === 'india' ? 'published' : 'draft', false, false, 0, readingTime, item.pubDate,
                            ]
                        );
                    } else if (msg.includes('Duplicate entry') && msg.includes("for key 'source_url'")) {
                        feedSkipped++;
                        itemLogs.push({ title: item.title, url: sourceLink, pubDate: item.pubDate, action: 'skipped', skipReason: 'duplicate_source_url' });
                        continue;
                    } else {
                        throw insertErr;
                    }
                }
                itemLogs.push({ title: item.title, url: sourceLink, pubDate: item.pubDate, action: 'new', articleId });

                feedNew++;
            } catch (itemError) {
                const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
                feedErrors.push(errMsg);
                itemLogs.push({ title: item.title || '(untitled item)', url: item.link || null, pubDate: item.pubDate, action: 'error', errorMessage: errMsg });
                fileLogger.error('cron', `Insert error: "${item.title.substring(0, 60)}"`, { error: errMsg });
            }
        }

        if (!fetchError) {
            await execute('UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?', [feedId]);
        }

        totalNew += feedNew;
        totalSkipped += feedSkipped;
        totalErrors += feedErrors.length;

        try {
            const logStatus = fetchError ? 'error' :
                (feedErrors.length > 0 ? (feedErrors.length === items.length ? 'error' : 'partial') : 'success');
            await insert(
                `INSERT INTO rss_fetch_logs (run_id, feed_id, feed_name, category, status, items_fetched, new_articles, skipped_articles, errors_count, error_details, duration_ms, started_at, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [runId, feed.id, feed.name, feed.category, logStatus, items.length, feedNew, feedSkipped, feedErrors.length,
                 feedErrors.length > 0 ? feedErrors.join('\n---\n') : null, Date.now() - start, new Date(start)]
            );
        } catch { /* log failure is non-fatal */ }

        try { await saveFetchItems(runId, feed, itemLogs); }
        catch (error) { fileLogger.warn('cron', 'RSS item log write failed', { runId, feedId: feed.id, error: String(error) }); }

        fileLogger.info('cron', `Feed "${feed.name}": ${feedNew} new, ${feedSkipped} skipped, ${feedErrors.length} errors`);
    }

    const duration = Date.now() - start;
    const overallStatus = totalErrors === 0 ? 'success' : totalNew + totalSkipped === 0 ? 'error' : 'partial';
    try {
        await execute(
            `UPDATE rss_fetch_runs SET total_items_fetched = ?, total_new_articles = ?, total_skipped = ?,
             total_errors = ?, overall_status = ?, duration_ms = ?, completed_at = NOW() WHERE run_id = ?`,
            [feedResults.reduce((sum, result) => sum + result.items.length, 0), totalNew, totalSkipped, totalErrors, overallStatus, duration, runId]
        );
    } catch (error) { fileLogger.warn('cron', 'RSS run summary update failed', { runId, error: String(error) }); }
    fileLogger.info('cron', `═══ RSS fetch done in ${duration}ms — ${totalNew} new, ${totalSkipped} skipped, ${totalErrors} errors ═══`);

    return { newArticles: totalNew, skipped: totalSkipped, errors: totalErrors, feedsProcessed: feedResults.length };
}
