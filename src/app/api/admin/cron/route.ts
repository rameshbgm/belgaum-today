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
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const feedIds: number[] | undefined = body.feedIds;
        const categories: string[] | undefined = body.categories;

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

        // Fetch all feeds in parallel — NO AI analysis here
        const feedResults = await fetchAllFeeds(feeds);

        let totalNew = 0;
        let totalSkipped = 0;
        const feedSummaries: Array<{ name: string; category: string; fetched: number; new: number; skipped: number }> = [];
        const errors: string[] = [];

        for (const { feedId, items } of feedResults) {
            const feed = feeds.find((f) => f.id === feedId);
            if (!feed) continue;

            const feedStart = Date.now();
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

                    await insert(
                        `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, view_count, reading_time, published_at)
                         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            item.title, slug, item.description || item.title, item.description || item.title,
                            item.imageUrl, feed.category, item.sourceName, item.link,
                            'published', false, false, 0, readingTime, item.pubDate,
                        ]
                    );

                    feedNew++;
                } catch (itemError) {
                    const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
                    feedErrors.push(`${item.title.substring(0, 100)}: ${errMsg}`);
                    errors.push(`Failed: ${item.title}`);
                }
            }

            await execute(
                'UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?',
                [feedId]
            );

            const feedDuration = Date.now() - feedStart;
            totalNew += feedNew;
            totalSkipped += feedSkipped;

            // Insert RSS fetch log to database
            const logStatus = feedErrors.length === items.length ? 'error' : 
                             (feedErrors.length > 0 ? 'partial' : 'success');
            try {
                await insert(
                    `INSERT INTO rss_fetch_logs 
                    (feed_id, feed_name, category, status, items_fetched, new_articles, 
                     skipped_articles, errors_count, error_details, duration_ms, started_at, completed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
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

        return NextResponse.json({
            success: true,
            message: 'RSS fetch completed',
            feedsProcessed: feedSummaries.length,
            newArticles: totalNew,
            skipped: totalSkipped,
            feeds: feedSummaries,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Admin cron error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
});
