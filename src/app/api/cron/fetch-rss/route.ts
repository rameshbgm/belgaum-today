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
 * 
 * Detailed logs are written to:
 *   - logs/cron-YYYY-MM-DD.log (RSS fetch details, per-feed stats)
 *   - logs/ai-YYYY-MM-DD.log (AI trending analysis details)
 */
export const GET = withLogging(async (request: NextRequest) => {
    const cronStart = Date.now();
    fileLogger.cronStart('fetch-rss', {
        timestamp: new Date().toISOString(),
        pid: process.pid,
    });
    fileLogger.info('cron', '═══════════════════════════════════════════════════');
    fileLogger.info('cron', '  RSS FEED FETCH — Cron Job Started');
    fileLogger.info('cron', '═══════════════════════════════════════════════════');

    try {
        // Verify secret
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (!secret || secret !== process.env.CRON_SECRET) {
            fileLogger.error('cron', '✕ Authentication failed: invalid or missing CRON_SECRET');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        fileLogger.info('cron', '✓ Authentication successful');

        // Get active RSS feed configs
        const feeds = await query<RssFeedConfig[]>(
            'SELECT * FROM rss_feed_config WHERE is_active = true'
        );

        if (feeds.length === 0) {
            fileLogger.warn('cron', '⚠ No active RSS feeds configured. Exiting.');
            return NextResponse.json({
                message: 'No active feeds configured',
                feedsProcessed: 0,
                newArticles: 0,
                skipped: 0,
            });
        }

        await logger.cronStart(feeds.length);
        fileLogger.info('cron', `📡 Found ${feeds.length} active RSS feeds`, {
            feeds: feeds.map(f => ({ id: f.id, name: f.name, category: f.category, feedUrl: f.feed_url?.substring(0, 80) })),
        });

        // Fetch all feeds in parallel
        const fetchStart = Date.now();
        const feedResults = await fetchAllFeeds(feeds);
        const fetchDuration = Date.now() - fetchStart;

        fileLogger.info('cron', `📥 RSS fetch completed in ${fetchDuration}ms`, {
            totalFeeds: feedResults.length,
            totalItems: feedResults.reduce((sum, r) => sum + r.items.length, 0),
            fetchDurationMs: fetchDuration,
        });

        let totalNew = 0;
        let totalSkipped = 0;
        const errors: string[] = [];

        for (const { feedId, items } of feedResults) {
            const feed = feeds.find((f: RssFeedConfig) => f.id === feedId);
            if (!feed) continue;

            const feedStart = Date.now();
            let feedNew = 0;
            let feedSkipped = 0;

            fileLogger.info('cron', `  ┌─ Feed: "${feed.name}" (${feed.category})`, {
                feedId: feed.id,
                feedUrl: feed.feed_url,
                itemCount: items.length,
            });

            for (const item of items) {
                try {
                    // Check for duplicate by source_url OR title
                    const existing = await query<{ id: number }[]>(
                        'SELECT id FROM articles WHERE source_url = ? OR title = ? LIMIT 1',
                        [item.link, item.title]
                    );

                    if (existing.length > 0) {
                        feedSkipped++;
                        fileLogger.debug('cron', `  │ ⏭ SKIP (duplicate): "${item.title.substring(0, 80)}..."`, {
                            existingId: existing[0].id,
                            sourceUrl: item.link,
                        });
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
                    fileLogger.debug('cron', `  │ ✓ NEW: "${item.title.substring(0, 80)}..."`, {
                        slug,
                        category: feed.category,
                        source: item.sourceName,
                        pubDate: item.pubDate,
                        readingTime,
                    });
                } catch (itemError) {
                    const errMsg = itemError instanceof Error ? itemError.message : String(itemError);
                    fileLogger.error('cron', `  │ ✕ ERROR inserting: "${item.title.substring(0, 80)}..."`, {
                        error: errMsg,
                        sourceUrl: item.link,
                    });
                    errors.push(`Failed to insert: ${item.title}`);
                }
            }

            await execute(
                'UPDATE rss_feed_config SET last_fetched_at = NOW() WHERE id = ?',
                [feedId]
            );

            const feedDuration = Date.now() - feedStart;
            totalNew += feedNew;
            totalSkipped += feedSkipped;

            await logger.cronFeedFetch(feed.name, feedNew, feedSkipped);
            fileLogger.info('cron', `  └─ Feed "${feed.name}": ${feedNew} new, ${feedSkipped} skipped (${feedDuration}ms)`, {
                feedId: feed.id,
                category: feed.category,
                newArticles: feedNew,
                skipped: feedSkipped,
                durationMs: feedDuration,
            });
        }

        fileLogger.info('cron', '───────────────────────────────────────────────────');
        fileLogger.info('cron', `  RSS Summary: ${totalNew} new articles, ${totalSkipped} skipped from ${feedResults.length} feeds`);
        fileLogger.info('cron', '───────────────────────────────────────────────────');

        // Update trending articles per category
        const categoriesWithFeeds = [...new Set(feeds.map((f) => f.category))];
        fileLogger.info('cron', `🤖 Starting AI trending analysis for ${categoriesWithFeeds.length} categories: [${categoriesWithFeeds.join(', ')}]`);

        for (const category of categoriesWithFeeds) {
            const trendingStart = Date.now();
            try {
                const recentArticles = await query<ArticleForAnalysis[]>(
                    `SELECT id, title, excerpt, source_name, published_at 
                     FROM articles 
                     WHERE category = ? AND status = 'published' 
                     ORDER BY published_at DESC LIMIT 50`,
                    [category]
                );

                fileLogger.info('cron', `  🔍 [${category}] Found ${recentArticles.length} recent articles for trending analysis`);

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

                    const trendDuration = Date.now() - trendingStart;
                    fileLogger.info('cron', `  ✓ [${category}] Trending updated: ${trending.length} articles, batch=${batchId} (${trendDuration}ms)`, {
                        category,
                        trendingCount: trending.length,
                        batchId,
                        durationMs: trendDuration,
                        trending: trending.map(t => ({ rank: t.rank, articleId: t.articleId, score: t.score })),
                    });
                }
            } catch (trendErr) {
                const errMsg = trendErr instanceof Error ? trendErr.message : String(trendErr);
                fileLogger.error('cron', `  ✕ [${category}] Trending analysis FAILED: ${errMsg}`, {
                    error: errMsg,
                    stack: trendErr instanceof Error ? trendErr.stack?.split('\n').slice(0, 5).join('\n') : undefined,
                });
                errors.push(`Trending for ${category}: ${String(trendErr)}`);
            }
        }

        const durationMs = Date.now() - cronStart;
        await logger.cronComplete(feedResults.length, totalNew, durationMs);

        fileLogger.info('cron', '═══════════════════════════════════════════════════');
        fileLogger.info('cron', `  RSS FEED FETCH — Completed in ${durationMs}ms`);
        fileLogger.info('cron', `  Feeds: ${feedResults.length} | New: ${totalNew} | Skipped: ${totalSkipped} | Errors: ${errors.length}`);
        fileLogger.info('cron', `  Trending updated: [${categoriesWithFeeds.join(', ')}]`);
        fileLogger.info('cron', '═══════════════════════════════════════════════════');

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

        fileLogger.error('cron', `✕ RSS FETCH FAILED: ${errorType}`, {
            durationMs,
            error: errorType,
            stack: error instanceof Error ? error.stack : undefined,
        });

        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
});
