import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { fetchAllFeeds, RssFeedConfig } from '@/lib/rss';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { insert } from '@/lib/db';
import { analyzeTrendingArticles, ArticleForAnalysis } from '@/lib/openai';
import { logger } from '@/lib/logger';
import { fileLogger } from '@/lib/fileLogger';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/fetch-rss?secret=<CRON_SECRET>
 * Background job to fetch RSS feeds, store articles, and update trending.
 */
export const GET = withLogging(async (request: NextRequest) => {
    const cronStart = Date.now();
    fileLogger.cronStart('fetch-rss', { timestamp: new Date().toISOString() });

    try {
        // Verify secret
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (!secret || secret !== process.env.CRON_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get active RSS feed configs
        const feeds = await query<RssFeedConfig[]>(
            'SELECT * FROM rss_feed_config WHERE is_active = true'
        );

        if (feeds.length === 0) {
            return NextResponse.json({
                message: 'No active feeds configured',
                feedsProcessed: 0,
                newArticles: 0,
                skipped: 0,
            });
        }

        await logger.cronStart(feeds.length);
        fileLogger.cronStep('fetch-rss', `Found ${feeds.length} active feeds`);

        // Fetch all feeds in parallel
        const feedResults = await fetchAllFeeds(feeds);

        let totalNew = 0;
        let totalSkipped = 0;
        const errors: string[] = [];

        for (const { feedId, items } of feedResults) {
            const feed = feeds.find((f: RssFeedConfig) => f.id === feedId);
            if (!feed) continue;

            let feedNew = 0;
            let feedSkipped = 0;

            for (const item of items) {
                try {
                    // Check for duplicate by source_url OR title
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
                    console.error(`Error inserting article: ${item.title}`, itemError);
                    errors.push(`Failed to insert: ${item.title}`);
                }
            }

            await execute(
                'UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?',
                [feedId]
            );

            totalNew += feedNew;
            totalSkipped += feedSkipped;

            await logger.cronFeedFetch(feed.name, feedNew, feedSkipped);
            fileLogger.cronStep('fetch-rss', `Feed: ${feed.name}`, { newArticles: feedNew, skipped: feedSkipped, category: feed.category });
        }

        // Update trending articles per category
        const categoriesWithFeeds = [...new Set(feeds.map((f) => f.category))];
        for (const category of categoriesWithFeeds) {
            try {
                const recentArticles = await query<ArticleForAnalysis[]>(
                    `SELECT id, title, excerpt, source_name, published_at 
                     FROM articles 
                     WHERE category = ? AND status = 'published' 
                     ORDER BY published_at DESC LIMIT 50`,
                    [category]
                );

                if (recentArticles.length > 0) {
                    const trending = await analyzeTrendingArticles(recentArticles, category, 7);
                    const batchId = `${category}-${Date.now()}`;

                    await execute('DELETE FROM trending_articles WHERE category = ?', [category]);

                    for (const t of trending) {
                        await insert(
                            `INSERT INTO trending_articles (article_id, category, rank_position, ai_score, ai_reasoning, batch_id, expires_at)
                             VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 4 HOUR))`,
                            [t.articleId, category, t.rank, t.score, t.reasoning, batchId]
                        );
                    }
                }
            } catch (trendErr) {
                errors.push(`Trending for ${category}: ${String(trendErr)}`);
            }
        }

        const durationMs = Date.now() - cronStart;
        await logger.cronComplete(feedResults.length, totalNew, durationMs);
        fileLogger.cronComplete('fetch-rss', durationMs, { feedsProcessed: feedResults.length, newArticles: totalNew, skipped: totalSkipped, trendingUpdated: categoriesWithFeeds });

        return NextResponse.json({
            message: 'RSS fetch completed',
            feedsProcessed: feedResults.length,
            newArticles: totalNew,
            skipped: totalSkipped,
            trendingUpdated: categoriesWithFeeds,
            errors: errors.length > 0 ? errors : undefined,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const durationMs = Date.now() - cronStart;
        const errorType = error instanceof Error ? error.message : String(error);
        await logger.cronError(errorType);
        fileLogger.cronError('fetch-rss', error);
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
});
