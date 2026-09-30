import { callLunaJson } from '@/lib/ai/luna';
import { fileLogger } from '@/lib/fileLogger';
import { query } from '@/lib/db';

export interface ArticleForAnalysis {
    id: number;
    title: string;
    excerpt: string;
    source_name: string;
    published_at: string;
}

export interface TrendingResult {
    articleId: number;
    rank: number;
    score: number;
    reasoning: string;
}

const schema = {
    type: 'object', additionalProperties: false,
    properties: {
        articles: {
            type: 'array', items: {
                type: 'object', additionalProperties: false,
                properties: { articleId: { type: 'integer' }, score: { type: 'integer' }, reasoning: { type: 'string' } },
                required: ['articleId', 'score', 'reasoning'],
            },
        },
    },
    required: ['articles'],
};

export interface AiLogContext {
    triggerType?: 'manual' | 'cron' | 'scheduled';
    triggeredBy?: string;
    runId?: string;
}

export async function analyzeTrendingArticles(
    articles: ArticleForAnalysis[],
    category: string,
    count = 7,
    requireAi = false,
    logContext: AiLogContext = {},
): Promise<TrendingResult[]> {
    if (!requireAi && articles.length <= count) return articles.map((article, index) => ({
        articleId: article.id, rank: index + 1, score: 100 - index * 5, reasoning: 'Recent configured source',
    }));
    const start = Date.now();
    try {
        const result = await callLunaJson<{ articles: Array<{ articleId: number; score: number; reasoning: string }> }>(
            'trending_news',
            `Choose up to ${count} distinct, newsworthy ${category} stories. Use only the supplied article IDs. Return strongest first.`,
            articles.slice(0, 50).map(article => ({ ...article, excerpt: article.excerpt?.slice(0, 240) })),
            schema,
        );
        const allowed = new Set(articles.map(article => article.id));
        const seen = new Set<number>();
        const selected = result.articles.filter(item => {
            if (!allowed.has(item.articleId) || seen.has(item.articleId)) return false;
            seen.add(item.articleId);
            return true;
        }).slice(0, count).map((item, index) => ({
            articleId: item.articleId,
            rank: index + 1,
            score: Math.min(100, Math.max(0, item.score)),
            reasoning: item.reasoning.slice(0, 200),
        }));
        if (selected.length === 0) throw new Error('No valid article IDs in ranking');
        await logCall(category, 'success', articles.length, selected.length, Date.now() - start, logContext);
        return selected;
    } catch (error) {
        fileLogger.error('ai', 'Trending ranking failed', { category, error: String(error) });
        await logCall(
            category,
            requireAi ? 'error' : 'fallback',
            articles.length,
            requireAi ? 0 : Math.min(count, articles.length),
            Date.now() - start,
            logContext,
            error instanceof Error ? error.message : String(error),
        );
        if (requireAi) return [];
        return articles.slice().sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
            .slice(0, count).map((article, index) => ({
                articleId: article.id, rank: index + 1, score: 90 - index * 5, reasoning: 'Selected by recency',
            }));
    }
}

async function logCall(
    category: string,
    status: 'success' | 'error' | 'fallback',
    inputArticles: number,
    outputTrending: number,
    durationMs: number,
    context: AiLogContext,
    errorMessage?: string,
) {
    try {
        await query(
            `INSERT INTO ai_agent_logs (provider, model, category, status, input_articles, output_trending, prompt_tokens, duration_ms, error_message, request_summary)
             VALUES ('OpenAI', 'gpt-6-luna', ?, ?, ?, ?, 0, ?, ?, ?)`,
            [category, status, inputArticles, outputTrending, durationMs,
                errorMessage?.slice(0, 2000) || null, JSON.stringify(context)]
        );
    } catch (error) {
        fileLogger.warn('ai', 'Could not persist AI call log', { error: String(error) });
    }
}
