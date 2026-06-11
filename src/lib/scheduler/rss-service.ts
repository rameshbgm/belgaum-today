import { query, execute, insert } from '@/lib/db';
import { fetchAllFeeds, RssFeedConfig } from '@/lib/rss';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { fileLogger } from '@/lib/fileLogger';

export async function runRssFetch(): Promise<{ newArticles: number; skipped: number; errors: number; feedsProcessed: number }> {
    const start = Date.now();
    fileLogger.info('cron', '═══ Scheduled RSS fetch started ═══');

    const feeds = await query<RssFeedConfig[]>(
        `SELECT * FROM rss_feed_config WHERE is_active = true`
    );

    if (feeds.length === 0) {
        fileLogger.info('cron', 'No active feeds found');
        return { newArticles: 0, skipped: 0, errors: 0, feedsProcessed: 0 };
    }

    fileLogger.info('cron', `Fetching ${feeds.length} active feeds`);

    const feedResults = await fetchAllFeeds(feeds);

    let totalNew = 0;
    let totalSkipped = 0;
    let totalErrors = 0;

    for (const { feedId, items } of feedResults) {
        const feed = feeds.find((f: RssFeedConfig) => f.id === feedId);
        if (!feed) continue;

        let feedNew = 0;
        let feedSkipped = 0;
        const feedErrors: string[] = [];

        for (const item of items) {
            try {
                const existing = await query<{ id: number }[]>(
                    'SELECT id FROM articles WHERE source_url = ? OR title = ? LIMIT 1',
                    [item.link, item.title]
                );

                if (existing.length > 0) {
                    feedSkipped++;
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

                try {
                    await insert(
                        `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, view_count, reading_time, published_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.title, slug, item.description || item.title, item.description || item.title,
                            item.imageUrl, feed.category, item.sourceName, item.link,
                            'published', false, false, 0, readingTime, item.pubDate,
                        ]
                    );
                } catch (insertErr) {
                    const msg = insertErr instanceof Error ? insertErr.message : String(insertErr);
                    if (msg.includes('Duplicate entry') && msg.includes("for key 'slug'")) {
                        await insert(
                            `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, view_count, reading_time, published_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                item.title, `${slug}-${Date.now()}`, item.description || item.title, item.description || item.title,
                                item.imageUrl, feed.category, item.sourceName, item.link,
                                'published', false, false, 0, readingTime, item.pubDate,
                            ]
                        );
                    } else if (msg.includes('Duplicate entry') && msg.includes("for key 'source_url'")) {
                        feedSkipped++;
                        continue;
                    } else {
                        throw insertErr;
                    }
                }

                feedNew++;
            } catch (itemError) {
                const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
                feedErrors.push(errMsg);
                fileLogger.error('cron', `Insert error: "${item.title.substring(0, 60)}"`, { error: errMsg });
            }
        }

        await execute('UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?', [feedId]);

        totalNew += feedNew;
        totalSkipped += feedSkipped;
        totalErrors += feedErrors.length;

        try {
            const logStatus = feedErrors.length === items.length ? 'error' : (feedErrors.length > 0 ? 'partial' : 'success');
            await insert(
                `INSERT INTO rss_fetch_logs (feed_id, feed_name, category, status, items_fetched, new_articles, skipped_articles, errors_count, error_details, duration_ms, started_at, completed_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [feed.id, feed.name, feed.category, logStatus, items.length, feedNew, feedSkipped, feedErrors.length,
                 feedErrors.length > 0 ? feedErrors.join('\n---\n') : null, Date.now() - start, new Date(start)]
            );
        } catch { /* log failure is non-fatal */ }

        fileLogger.info('cron', `Feed "${feed.name}": ${feedNew} new, ${feedSkipped} skipped, ${feedErrors.length} errors`);
    }

    const duration = Date.now() - start;
    fileLogger.info('cron', `═══ RSS fetch done in ${duration}ms — ${totalNew} new, ${totalSkipped} skipped, ${totalErrors} errors ═══`);

    return { newArticles: totalNew, skipped: totalSkipped, errors: totalErrors, feedsProcessed: feedResults.length };
}
