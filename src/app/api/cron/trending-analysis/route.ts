import { NextRequest, NextResponse } from 'next/server';
import { query, execute, insert } from '@/lib/db';
import { analyzeTrendingArticles, ArticleForAnalysis } from '@/lib/openai';
import { logger } from '@/lib/logger';
import { fileLogger } from '@/lib/fileLogger';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * GET /api/cron/trending-analysis?secret=<TRENDING_CRON_SECRET>
 * Background job to run AI trending analysis for all categories.
 * 
 * This runs independently from RSS fetching to:
 * - Reduce coupling and complexity
 * - Control AI API costs with configurable intervals
 * - Allow trending to run even when no new articles are fetched
 * 
 * Interval: Configured via TRENDING_ANALYSIS_INTERVAL_HOURS env var (default: 4 hours)
 * External cron should call this endpoint every 4 hours
 * 
 * Detailed logs are written to logs/ai-YYYY-MM-DD.log and logs/cron-YYYY-MM-DD.log
 */
export const GET = withLogging(async (request: NextRequest) => {
    const cronStart = Date.now();
    fileLogger.cronStart('trending-analysis', {
        timestamp: new Date().toISOString(),
        pid: process.pid,
    });
    fileLogger.info('cron', '═══════════════════════════════════════════════════');
    fileLogger.info('cron', '  AI TRENDING ANALYSIS — Cron Job Started');
    fileLogger.info('cron', '═══════════════════════════════════════════════════');

    try {
        // Verify secret
        const { searchParams } = new URL(request.url);
        const secret = searchParams.get('secret');

        if (!secret || secret !== process.env.TRENDING_CRON_SECRET) {
            fileLogger.error('cron', '✕ Authentication failed: invalid or missing TRENDING_CRON_SECRET');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        fileLogger.info('cron', '✓ Authentication successful');

        // Get all active categories with published articles
        const categories = await query<{ category: string; article_count: number }[]>(
            `SELECT category, COUNT(*) as article_count 
             FROM articles 
             WHERE status = 'published' 
             GROUP BY category 
             HAVING article_count > 0`
        );

        if (categories.length === 0) {
            fileLogger.warn('cron', '⚠ No categories with published articles found. Exiting.');
            return NextResponse.json({
                message: 'No categories with published articles',
                categoriesProcessed: 0,
            });
        }

        fileLogger.info('cron', `🤖 Found ${categories.length} categories for AI trending analysis`, {
            categories: categories.map(c => ({ category: c.category, articles: c.article_count })),
        });

        const results: Array<{ category: string; trending: number; duration: number; error?: string }> = [];
        const errors: string[] = [];

        // Process each category
        for (const { category } of categories) {
            const trendingStart = Date.now();
            try {
                fileLogger.info('cron', `  ┌─ Category: "${category}"`);

                // Get recent articles for analysis (top 50 most recent)
                const recentArticles = await query<ArticleForAnalysis[]>(
                    `SELECT id, title, excerpt, source_name, published_at 
                     FROM articles 
                     WHERE category = ? AND status = 'published' 
                     ORDER BY published_at DESC LIMIT 50`,
                    [category]
                );

                fileLogger.info('cron', `  │ 🔍 Found ${recentArticles.length} recent articles for analysis`);

                if (recentArticles.length === 0) {
                    fileLogger.warn('cron', `  └─ ⚠ No articles found for ${category}, skipping`);
                    continue;
                }

                // Run AI analysis to select top 7 trending articles
                const trending = await analyzeTrendingArticles(recentArticles, category, 7);
                const batchId = `${category}-${Date.now()}`;

                // Clear old trending entries for this category
                await execute('DELETE FROM trending_articles WHERE category = ?', [category]);

                // Insert new trending articles
                for (const t of trending) {
                    await insert(
                        `INSERT INTO trending_articles (article_id, category, rank_position, ai_score, ai_reasoning, batch_id, expires_at)
                         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 4 HOUR))`,
                        [t.articleId, category, t.rank, t.score, t.reasoning, batchId]
                    );
                }

                const trendDuration = Date.now() - trendingStart;
                results.push({ category, trending: trending.length, duration: trendDuration });

                fileLogger.info('cron', `  └─ ✓ [${category}] Trending updated: ${trending.length} articles (${trendDuration}ms)`, {
                    category,
                    trendingCount: trending.length,
                    batchId,
                    durationMs: trendDuration,
                    trending: trending.map(t => ({ rank: t.rank, articleId: t.articleId, score: t.score })),
                });
            } catch (trendErr) {
                const errMsg = trendErr instanceof Error ? trendErr.message : String(trendErr);
                const trendDuration = Date.now() - trendingStart;
                
                results.push({ category, trending: 0, duration: trendDuration, error: errMsg });
                errors.push(`${category}: ${errMsg}`);

                fileLogger.error('cron', `  └─ ✕ [${category}] Trending analysis FAILED: ${errMsg}`, {
                    error: errMsg,
                    durationMs: trendDuration,
                    stack: trendErr instanceof Error ? trendErr.stack?.split('\n').slice(0, 5).join('\n') : undefined,
                });
            }
        }

        const durationMs = Date.now() - cronStart;
        const successCount = results.filter(r => !r.error).length;
        const failCount = results.filter(r => r.error).length;

        fileLogger.info('cron', '═══════════════════════════════════════════════════');
        fileLogger.info('cron', `  AI TRENDING ANALYSIS — Completed in ${durationMs}ms`);
        fileLogger.info('cron', `  Categories: ${categories.length} | Success: ${successCount} | Failed: ${failCount}`);
        fileLogger.info('cron', '═══════════════════════════════════════════════════');

        return NextResponse.json({
            message: 'Trending analysis completed',
            categoriesProcessed: categories.length,
            successCount,
            failCount,
            results,
            errors: errors.length > 0 ? errors : undefined,
            durationMs,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const durationMs = Date.now() - cronStart;
        const errorType = error instanceof Error ? error.message : String(error);

        fileLogger.error('cron', `✕ TRENDING ANALYSIS FAILED: ${errorType}`, {
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
