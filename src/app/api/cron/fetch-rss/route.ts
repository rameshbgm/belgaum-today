import { NextRequest, NextResponse } from 'next/server';
import { query, execute, insert } from '@/lib/db';
import { fetchAllFeeds, RssFeedConfig } from '@/lib/rss';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
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

        const feeds = await query<RssFeedConfig[]>(
            `SELECT * FROM rss_feed_config WHERE is_active = true`
        );

        if (feeds.length === 0) {
            fileLogger.info('cron', '✓ No active feeds found');
            return NextResponse.json({
                message: 'No active feeds found',
                feedsProcessed: 0,
                newArticles: 0,
                skipped: 0,
            });
        }

        await logger.cronStart(feeds.length);
        fileLogger.info('cron', `📡 Found ${feeds.length} active RSS feeds`, {
            feeds: feeds.map(f => ({
                id: f.id,
                name: f.name,
                category: f.category,
                lastFetched: f.last_fetched_at,
                feedUrl: f.feed_url?.substring(0, 80),
            })),
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
            const feedErrors: string[] = [];

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
                        // Slug race condition: two feeds inserted same slug concurrently — retry with unique suffix
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
                        } else {
                            throw insertErr;
                        }
                    }

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
                    // Treat duplicate source_url at DB level as a silent skip
                    if (errMsg.includes('Duplicate entry') && errMsg.includes("for key 'source_url'")) {
                        feedSkipped++;
                        continue;
                    }
                    fileLogger.error('cron', `  │ ✕ ERROR inserting: "${item.title.substring(0, 80)}..."`, {
                        error: errMsg,
                        sourceUrl: item.link,
                    });
                    feedErrors.push(`${item.title.substring(0, 100)}: ${errMsg}`);
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
                fileLogger.error('cron', `  │ ⚠ Failed to log RSS fetch to database`, {
                    error: logError instanceof Error ? logError.message : String(logError),
                });
            }

            await logger.cronFeedFetch(feed.name, feedNew, feedSkipped);
            fileLogger.info('cron', `  └─ Feed "${feed.name}": ${feedNew} new, ${feedSkipped} skipped, ${feedErrors.length} errors (${feedDuration}ms)`, {
                feedId: feed.id,
                category: feed.category,
                newArticles: feedNew,
                skipped: feedSkipped,
                errors: feedErrors.length,
                durationMs: feedDuration,
            });
        }

        fileLogger.info('cron', '───────────────────────────────────────────────────');
        fileLogger.info('cron', `  RSS Summary: ${totalNew} new articles, ${totalSkipped} skipped from ${feedResults.length} feeds`);
        fileLogger.info('cron', '───────────────────────────────────────────────────');

        // Note: Trending analysis is handled by separate cron endpoint (/api/cron/trending-analysis)
        // This keeps RSS fetching fast and independent from AI processing

        const durationMs = Date.now() - cronStart;
        await logger.cronComplete(feedResults.length, totalNew, durationMs);

        fileLogger.info('cron', '═══════════════════════════════════════════════════');
        fileLogger.info('cron', `  RSS FEED FETCH — Completed in ${durationMs}ms`);
        fileLogger.info('cron', `  Feeds: ${feedResults.length} | New: ${totalNew} | Skipped: ${totalSkipped} | Errors: ${errors.length}`);
        fileLogger.info('cron', '═══════════════════════════════════════════════════');

        return NextResponse.json({
            message: 'RSS fetch completed',
            feedsProcessed: feedResults.length,
            newArticles: totalNew,
            skipped: totalSkipped,
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
