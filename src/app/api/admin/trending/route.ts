import { NextRequest, NextResponse } from 'next/server';
import { query, execute, insert } from '@/lib/db';
import { analyzeTrendingArticles, ArticleForAnalysis } from '@/lib/openai';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * POST /api/admin/trending — Trigger AI trending analysis (authenticated admin)
 * Body: { categories?: string[] }
 *   - If categories is empty/omitted → run all categories with published articles
 *   - If categories is an array → run only those categories
 */
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const requestedCategories: string[] | undefined = body.categories;

        // Resolve which categories to process
        let categoriesToProcess: string[];

        if (requestedCategories && requestedCategories.length > 0) {
            // Run only the requested categories (verify they have articles)
            const existing = await query<{ category: string }[]>(
                `SELECT DISTINCT category FROM articles 
                 WHERE status = 'published' AND category IN (${requestedCategories.map(() => '?').join(',')})`,
                requestedCategories
            );
            categoriesToProcess = existing.map((r) => r.category);
        } else {
            // Run all categories that have published articles
            const all = await query<{ category: string }[]>(
                `SELECT DISTINCT category FROM articles WHERE status = 'published'`
            );
            categoriesToProcess = all.map((r) => r.category);
        }

        if (categoriesToProcess.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No categories with published articles found',
                categoriesProcessed: 0,
                results: [],
            });
        }

        const results: Array<{
            category: string;
            trendingCount: number;
            durationMs: number;
            error?: string;
        }> = [];

        for (const category of categoriesToProcess) {
            const start = Date.now();
            try {
                // Get latest 50 articles for this category
                const recentArticles = await query<ArticleForAnalysis[]>(
                    `SELECT id, title, excerpt, source_name, published_at 
                     FROM articles 
                     WHERE category = ? AND status = 'published' 
                     ORDER BY published_at DESC LIMIT 50`,
                    [category]
                );

                if (recentArticles.length === 0) {
                    results.push({ category, trendingCount: 0, durationMs: Date.now() - start });
                    continue;
                }

                // Run AI trending analysis
                const trending = await analyzeTrendingArticles(recentArticles, category, 7);
                const batchId = `${category}-${Date.now()}`;

                // Replace old trending for this category
                await execute('DELETE FROM trending_articles WHERE category = ?', [category]);

                for (const t of trending) {
                    await insert(
                        `INSERT INTO trending_articles (article_id, category, rank_position, ai_score, ai_reasoning, batch_id, expires_at)
                         VALUES (?, ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 4 HOUR))`,
                        [t.articleId, category, t.rank, t.score, t.reasoning, batchId]
                    );
                }

                results.push({
                    category,
                    trendingCount: trending.length,
                    durationMs: Date.now() - start,
                });
            } catch (err) {
                results.push({
                    category,
                    trendingCount: 0,
                    durationMs: Date.now() - start,
                    error: err instanceof Error ? err.message : String(err),
                });
            }
        }

        const totalTrending = results.reduce((sum, r) => sum + r.trendingCount, 0);
        const errors = results.filter((r) => r.error).map((r) => `${r.category}: ${r.error}`);

        return NextResponse.json({
            success: true,
            message: 'AI trending analysis completed',
            categoriesProcessed: categoriesToProcess.length,
            totalTrendingArticles: totalTrending,
            results,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Admin trending error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 }
        );
    }
});
