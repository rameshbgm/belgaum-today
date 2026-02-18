import { NextRequest, NextResponse } from 'next/server';
import { query, execute, insert } from '@/lib/db';
import { fetchAllFeeds, RssFeedConfig } from '@/lib/rss';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/cron — Trigger RSS fetch ad-hoc (authenticated)
 * Body: { feedIds?: number[] } — if empty, runs all active feeds
 */
export const POST = withLogging(async (request: NextRequest) => {
    const runStart = Date.now();
    
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const feedIds: number[] | undefined = body.feedIds;
        const categories: string[] | undefined = body.categories;

        // Generate unique run ID
        const runId = `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Get feeds to process — by explicit IDs, by categories, or all active
        let feeds: RssFeedConfig[];
        if (feedIds && feedIds.length > 0) {
            feeds = await query<RssFeedConfig[]>(
                `SELECT * FROM rss_feed_config WHERE id IN (${feedIds.map(() => '?').join(',')}) AND is_active = true`,
                feedIds
            );
        } else if (categories && categories.length > 0) {
            feeds = await query<RssFeedConfig[]>(
                `SELECT * FROM rss_feed_config WHERE category IN (${categories.map(() => '?').join(',')}) AND is_active = true`,
                categories
            );
        } else {
            feeds = await query<RssFeedConfig[]>(
                'SELECT * FROM rss_feed_config WHERE is_active = true'
            );
        }

        if (feeds.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active feeds to process',
                feedsProcessed: 0,
                newArticles: 0,
                skipped: 0,
            });
        }

        // Create run record
        await insert(
            `INSERT INTO rss_fetch_runs (run_id, trigger_type, triggered_by, total_feeds, started_at)
             VALUES (?, ?, ?, ?, ?)`,
            [runId, 'manual', user.email, feeds.length, new Date(runStart)]
        );

        // Fetch all feeds in parallel — NO AI analysis here
        const feedResults = await fetchAllFeeds(feeds);

        let totalNew = 0;
        let totalSkipped = 0;
        let totalItemsFetched = 0;
        let totalErrors = 0;
        const feedSummaries: Array<{ name: string; category: string; fetched: number; new: number; skipped: number }> = [];
        const errors: string[] = [];

        for (const { feedId, items } of feedResults) {
            const feed = feeds.find((f) => f.id === feedId);
            if (!feed) continue;

            const feedStart = Date.now();
            let feedNew = 0;
            let feedSkipped = 0;
            const feedErrors: string[] = [];
            totalItemsFetched += items.length;

            for (const item of items) {
                try {
                    const existing = await query<{ id: number }[]>(
                        'SELECT id FROM articles WHERE source_url = ? OR title = ? LIMIT 1',
                        [item.link, item.title]
                    );

                    if (existing.length > 0) {
                        feedSkipped++;
                        // Log skipped item
                        await insert(
                            `INSERT INTO rss_fetch_items (run_id, feed_id, feed_name, item_title, item_url, item_pub_date, action, skip_reason)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [runId, feed.id, feed.name, item.title, item.link, item.pubDate, 'skipped', 'Duplicate: Article already exists in database']
                        );
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

                    const articleId = await insert(
                        `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, view_count, reading_time, published_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.title, slug, item.description || item.title, item.description || item.title,
                            item.imageUrl, feed.category, item.sourceName, item.link,
                            'published', false, false, 0, readingTime, item.pubDate,
                        ]
                    );

                    feedNew++;
                    // Log new item
                    await insert(
                        `INSERT INTO rss_fetch_items (run_id, feed_id, feed_name, item_title, item_url, item_pub_date, action, article_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [runId, feed.id, feed.name, item.title, item.link, item.pubDate, 'new', articleId]
                    );
                } catch (itemError) {
                    const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
                    feedErrors.push(`${item.title.substring(0, 100)}: ${errMsg}`);
                    errors.push(`Failed: ${item.title}`);
                    totalErrors++;
                    // Log error item
                    await insert(
                        `INSERT INTO rss_fetch_items (run_id, feed_id, feed_name, item_title, item_url, item_pub_date, action, error_message)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                        [runId, feed.id, feed.name, item.title, item.link, item.pubDate, 'error', errMsg]
                    ).catch(() => {}); // Ignore logging errors for error logs
                }
            }

            await execute(
                'UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?',
                [feedId]
            );

            const feedDuration = Date.now() - feedStart;
            totalNew += feedNew;
            totalSkipped += feedSkipped;

            // Insert RSS fetch log to database with run_id
            const logStatus = feedErrors.length === items.length ? 'error' : 
                             (feedErrors.length > 0 ? 'partial' : 'success');
            try {
                await insert(
                    `INSERT INTO rss_fetch_logs 
                    (run_id, feed_id, feed_name, category, status, items_fetched, new_articles, 
                     skipped_articles, errors_count, error_details, duration_ms, started_at, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        runId,
                        feed.id,
                        feed.name,
                        feed.category,
                        logStatus,
                        items.length,
                        feedNew,
                        feedSkipped,
                        feedErrors.length,
                        feedErrors.length > 0 ? feedErrors.join('\n---\n') : null,
                        feedDuration,
                        new Date(feedStart)
                    ]
                );
            } catch (logError) {
                console.error('Failed to log RSS fetch to database:', logError);
            }

            feedSummaries.push({
                name: feed.name,
                category: feed.category,
                fetched: items.length,
                new: feedNew,
                skipped: feedSkipped,
            });
        }

        // Update run record with totals
        const runDuration = Date.now() - runStart;
        const overallStatus = totalErrors === totalItemsFetched ? 'error' : 
                             (totalErrors > 0 ? 'partial' : 'success');
        await execute(
            `UPDATE rss_fetch_runs 
             SET total_items_fetched = ?, total_new_articles = ?, total_skipped = ?, 
                 total_errors = ?, overall_status = ?, duration_ms = ?, completed_at = NOW()
             WHERE run_id = ?`,
            [totalItemsFetched, totalNew, totalSkipped, totalErrors, overallStatus, runDuration, runId]
        );

        return NextResponse.json({
            success: true,
            message: 'RSS fetch completed',
            runId,
            feedsProcessed: feedSummaries.length,
            newArticles: totalNew,
            skipped: totalSkipped,
            errors: totalErrors,
            feeds: feedSummaries,
        });
    } catch (error) {
        console.error('Admin cron error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
});
