/**
 * Trending Article Analysis — LangChain-powered AI ranking
 *
 * Uses LangChain JS with OpenAI's gpt-4o-mini model.
 * Configuration is loaded from environment variables at startup (.env.local).
 * No database configuration, no admin panel for AI settings.
 *
 * Performance tuning:
 *   - Model: gpt-4o-mini (cost-effective, fast)
 *   - Temperature: 0.3 (consistent rankings)
 *   - Max Tokens: 1000 (sufficient for JSON output)
 *   - Timeout: 45 seconds
 *
 * Every call is logged to:
 *   - logs/ai-YYYY-MM-DD.log (detailed request/response/metrics)
 *   - Console output (structured logging with logData)
 */

import { config } from '@/lib/ai/config';
import { getSystemPrompt, getDefaultSystemPrompt } from '@/lib/ai/system-prompt';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';
import { fileLogger } from '@/lib/fileLogger';

// LangChain imports
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { BaseChatModel } from '@langchain/core/language_models/chat_models';

// ── Types ──

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

// ── Logging (File-only, no database) ──

async function logAgentCall(data: {
    model: string;
    category: string;
    status: 'success' | 'error' | 'fallback';
    inputArticles: number;
    outputTrending: number;
    promptTokens: number;
    durationMs: number;
    errorMessage?: string;
    requestSummary?: string;
    responseSummary?: string;
    systemPrompt?: string;
    userPrompt?: string;
    rawResponse?: string;
}): Promise<void> {
    const logData: Record<string, unknown> = {
        model: data.model,
        category: data.category,
        status: data.status,
        inputArticles: data.inputArticles,
        outputTrending: data.outputTrending,
        promptTokens: data.promptTokens,
        durationMs: data.durationMs,
    };

    if (data.errorMessage) logData.error = data.errorMessage;
    if (data.requestSummary) logData.requestSummary = data.requestSummary;
    if (data.responseSummary) logData.responseSummary = data.responseSummary;

    if (data.status === 'success') {
        fileLogger.info('ai', `✓ AI CALL SUCCESS [OpenAI/${data.model}] for [${data.category}] (${data.durationMs}ms)`, logData);
    } else if (data.status === 'error') {
        fileLogger.error('ai', `✕ AI CALL ERROR [OpenAI/${data.model}] for [${data.category}] (${data.durationMs}ms)`, logData);
    } else {
        fileLogger.warn('ai', `⚠ AI FALLBACK for [${data.category}]: ${data.errorMessage}`, logData);
    }

    // Log full request/response to file (debug level)
    if (data.systemPrompt) {
        fileLogger.debug('ai', `[REQUEST] System Prompt for [${data.category}]:`, {
            model: data.model,
            prompt: data.systemPrompt,
        });
    }
    if (data.userPrompt) {
        fileLogger.debug('ai', `[REQUEST] User Prompt for [${data.category}]:`, {
            model: data.model,
            prompt: data.userPrompt.substring(0, 3000),
        });
    }
    if (data.rawResponse) {
        fileLogger.debug('ai', `[RESPONSE] Raw AI response for [${data.category}]:`, {
            model: data.model,
            response: data.rawResponse.substring(0, 5000),
        });
    }
}

/** Rough token estimate (~4 chars per token) */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}



// ── LangChain Model Factory ──

/**
 * Create a ChatOpenAI instance using configuration from .env
 * Model: gpt-4o-mini (configured via OPENAI_MODEL)
 * Temperature, max_tokens, and other settings come from AiConfig
 */
async function createLangChainModel(): Promise<BaseChatModel> {
    fileLogger.info('ai', `🔗 LangChain: Creating ChatOpenAI model (${config.model})`);

    const { ChatOpenAI } = await import('@langchain/openai');
    const model = new ChatOpenAI({
        apiKey: config.apiKey,
        modelName: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeout: config.requestTimeoutMs,
    });

    fileLogger.info('ai', `🔗 LangChain: ChatOpenAI created`, {
        model: config.model,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeoutMs: config.requestTimeoutMs,
    });

    return model;
}

/**
 * Call the LangChain model with system + user messages.
 * Returns the raw text response.
 */
async function callLangChainModel(
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    const model = await createLangChainModel();

    fileLogger.info('ai', `🚀 LangChain invoke: ${config.model}`, {
        systemPromptLength: systemPrompt.length,
        userPromptLength: userPrompt.length,
    });

    const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
    ]);

    // Extract text content from the response
    const content = typeof response.content === 'string'
        ? response.content.trim()
        : Array.isArray(response.content)
            ? response.content
                .filter((c): c is { type: 'text'; text: string } => typeof c === 'object' && 'type' in c && c.type === 'text')
                .map(c => c.text)
                .join('')
                .trim()
            : String(response.content).trim();

    // Log usage metadata if available
    const usage = response.usage_metadata as Record<string, number> | undefined;
    if (usage) {
        fileLogger.info('ai', `📊 LangChain usage: ${config.model}`, {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            totalTokens: usage.total_tokens,
        });
    }

    fileLogger.info('ai', `📥 LangChain response received (${content.length} chars)`, {
        model: config.model,
        responsePreview: content.substring(0, 300),
    });

    return content;
}

// ── Public API ──

/**
 * Analyze articles using OpenAI gpt-4o-mini and return trending results.
 * Configuration is loaded from environment variables at startup.
 * Falls back to recency-based selection if AI call fails or config is incomplete.
 */
export async function analyzeTrendingArticles(
    articles: ArticleForAnalysis[],
    category: string,
    count: number = 7
): Promise<TrendingResult[]> {
    // Check if AI config is valid before proceeding
    if (!config.isValid) {
        fileLogger.warn('ai', `[${category}] AI config not available — OPENAI_API_KEY not set`);
        await logger.aiFallback('AI config not available (missing OPENAI_API_KEY)');
        return fallbackTrending(articles, count);
    }

    fileLogger.info('ai', `━━━ Trending Analysis [${config.model}] for [${category}] ━━━`, {
        articleCount: articles.length, requestedCount: count,
    });

    if (articles.length === 0) {
        fileLogger.warn('ai', `No articles provided for [${category}], returning empty`);
        return [];
    }

    if (articles.length <= count) {
        fileLogger.info('ai', `Only ${articles.length} articles for [${category}] (≤ ${count}), including all without AI`);
        return articles.map((a, i) => ({
            articleId: a.id, rank: i + 1, score: 100 - i * 10,
            reasoning: 'Included — fewer articles than requested trending count',
        }));
    }

    const startTime = Date.now();
    await logger.aiCallStart('OpenAI', config.model, category);

    try {
        const systemPrompt = getSystemPrompt(category, count);
        const userPrompt = buildUserPrompt(articles, category, count);
        const totalPromptTokens = estimateTokens(systemPrompt + userPrompt);

        fileLogger.info('ai', `📝 Prompts built for [${category}]`, {
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length,
            estimatedTokens: totalPromptTokens,
            articleIds: articles.map(a => a.id),
        });

        // Call LangChain model
        const rawResponse = await callLangChainModel(systemPrompt, userPrompt);

        if (!rawResponse) throw new Error('Empty response from LangChain model');

        // Parse JSON — handle potential markdown wrapping
        const jsonStr = rawResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const results: TrendingResult[] = JSON.parse(jsonStr);

        const durationMs = Date.now() - startTime;
        await logger.aiCallComplete('OpenAI', config.model, category, durationMs);

        // Validate and ensure proper ranking
        const validated = results
            .filter((r) => r.articleId && r.rank && articles.some((a) => a.id === r.articleId))
            .sort((a, b) => a.rank - b.rank)
            .slice(0, count)
            .map((r, i) => ({ ...r, rank: i + 1 }));

        // Build summaries for the log
        const articleTitles = articles.slice(0, 5).map(a => a.title).join('; ');
        const requestSummary = `${articles.length} articles for "${category}". Top titles: ${articleTitles}${articles.length > 5 ? '...' : ''}`;
        const responseSummary = validated.map(r => `#${r.rank} id=${r.articleId} score=${r.score} "${r.reasoning}"`).join(' | ');

        fileLogger.info('ai', `🏆 Trending results for [${category}]:`, {
            model: config.model,
            durationMs, validatedCount: validated.length, rawResultCount: results.length,
            results: validated,
        });

        await logAgentCall({
            model: config.model, category, status: 'success',
            inputArticles: articles.length, outputTrending: validated.length,
            promptTokens: totalPromptTokens, durationMs,
            requestSummary, responseSummary,
            systemPrompt, userPrompt, rawResponse,
        });

        return validated;
    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorType = error instanceof Error ? error.message : String(error);
        await logger.aiCallError('OpenAI', config.model, errorType);

        fileLogger.error('ai', `✕ AI analysis FAILED [${config.model}] for [${category}]`, {
            model: config.model,
            durationMs, error: errorType,
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        });

        await logAgentCall({
            model: config.model, category, status: 'error',
            inputArticles: articles.length, outputTrending: 0,
            promptTokens: 0, durationMs,
            errorMessage: errorType.substring(0, 2000),
            requestSummary: `${articles.length} articles for "${category}" — LangChain call failed`,
        });

        return fallbackTrending(articles, count);
    }
}

/** Fallback when AI call fails — pick most recent articles */
function fallbackTrending(articles: ArticleForAnalysis[], count: number): TrendingResult[] {
    fileLogger.info('ai', `📋 Fallback trending: selecting ${count} most recent articles by date`);
    return articles
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, count)
        .map((a, i) => ({
            articleId: a.id, rank: i + 1, score: 90 - i * 5,
            reasoning: 'Selected by recency (AI call failed)',
        }));
}
