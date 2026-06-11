import { query, execute, insert } from '@/lib/db';
import { analyzeTrendingArticles, ArticleForAnalysis } from '@/lib/openai';
import { fileLogger } from '@/lib/fileLogger';

export async function runTrendingAnalysis(): Promise<{ categoriesProcessed: number; totalTrending: number }> {
    fileLogger.info('ai', '═══ Scheduled AI trending analysis started ═══');

    const categories = await query<{ category: string }[]>(
        `SELECT DISTINCT category FROM articles WHERE status = 'published' AND category != ''`
    );

    if (categories.length === 0) {
        fileLogger.info('ai', 'No categories with articles found');
        return { categoriesProcessed: 0, totalTrending: 0 };
    }

    let totalTrending = 0;

    for (const { category } of categories) {
        try {
            const recentArticles = await query<ArticleForAnalysis[]>(
                `SELECT id, title, excerpt, source_name, published_at
                 FROM articles
                 WHERE category = ? AND status = 'published'
                 ORDER BY published_at DESC LIMIT 50`,
                [category]
            );

            if (recentArticles.length === 0) continue;

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

            totalTrending += trending.length;
            fileLogger.info('ai', `Category "${category}": ${trending.length} trending articles`);
        } catch (err) {
            fileLogger.error('ai', `Trending analysis failed for "${category}"`, {
                error: err instanceof Error ? err.message : String(err),
            });
        }
    }

    fileLogger.info('ai', `═══ AI trending done — ${totalTrending} trending across ${categories.length} categories ═══`);
    return { categoriesProcessed: categories.length, totalTrending };
}
