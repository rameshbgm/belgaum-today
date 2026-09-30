import { randomUUID } from 'node:crypto';
import { query, execute, insert } from '@/lib/db';
import { analyzeTrendingArticles, ArticleForAnalysis } from '@/lib/openai';
import { fileLogger } from '@/lib/fileLogger';
import { selectAiSuggestion } from '@/lib/scheduler/ai-suggestions';
import { AI_INTERVAL_MS } from '@/lib/scheduler/constants';

export interface TrendingRunResult {
    categoriesProcessed: number;
    totalTrending: number;
    failures: number;
    results: Array<{ category: string; trendingCount: number; durationMs: number; error?: string }>;
}

export async function runTrendingAnalysis(options: {
    triggerType?: 'manual' | 'cron' | 'scheduled';
    triggeredBy?: string;
    categories?: string[];
} = {}): Promise<TrendingRunResult> {
    const runId = randomUUID();
    const requested = [...new Set((options.categories || []).filter(Boolean))];
    fileLogger.info('ai', '═══ AI trending analysis started ═══', {
        runId,
        triggerType: options.triggerType || 'scheduled',
        triggeredBy: options.triggeredBy || null,
    });

    const params: unknown[] = [];
    let categoryFilter = '';
    if (requested.length) {
        categoryFilter = ` AND category IN (${requested.map(() => '?').join(', ')})`;
        params.push(...requested);
    }
    const categories = await query<{ category: string }[]>(
        `SELECT DISTINCT category FROM public_articles
         WHERE status = 'published' AND category != ''${categoryFilter}`,
        params,
    );

    const results: TrendingRunResult['results'] = [];
    let totalTrending = 0;
    let failures = 0;
    const expiresAt = new Date(Date.now() + AI_INTERVAL_MS);

    for (const { category } of categories) {
        const startedAt = Date.now();
        try {
            const recentArticles = await query<ArticleForAnalysis[]>(
                `SELECT id, title, excerpt, source_name, published_at
                 FROM public_articles
                 WHERE category = ? AND status = 'published'
                 ORDER BY published_at DESC LIMIT 50`,
                [category],
            );
            if (recentArticles.length === 0) continue;

            const trending = await analyzeTrendingArticles(recentArticles, category, 7, true, {
                triggerType: options.triggerType || 'scheduled',
                triggeredBy: options.triggeredBy,
                runId,
            });
            if (!trending.length) throw new Error('AI did not return a valid category ranking');
            await selectAiSuggestion(category, trending);
            const batchId = `${category}-${Date.now()}`;

            await execute('DELETE FROM trending_articles WHERE category = ?', [category]);
            for (const item of trending) {
                await insert(
                    `INSERT INTO trending_articles (article_id, category, rank_position, ai_score, ai_reasoning, batch_id, expires_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [item.articleId, category, item.rank, item.score, item.reasoning, batchId, expiresAt],
                );
            }
            totalTrending += trending.length;
            results.push({ category, trendingCount: trending.length, durationMs: Date.now() - startedAt });
        } catch (error) {
            failures++;
            const message = error instanceof Error ? error.message : String(error);
            results.push({ category, trendingCount: 0, durationMs: Date.now() - startedAt, error: message });
            fileLogger.error('ai', `Trending analysis failed for "${category}"`, { runId, error: message });
        }
    }

    fileLogger.info('ai', '═══ AI trending analysis completed ═══', {
        runId,
        categoriesProcessed: categories.length,
        totalTrending,
        failures,
    });
    return { categoriesProcessed: categories.length, totalTrending, failures, results };
}
