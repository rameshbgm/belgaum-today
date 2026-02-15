/**
 * Multi-Agent System — LangChain-powered trending article analysis.
 *
 * Uses LangChain JS to provide a unified interface across LLM providers.
 * The active provider, model, and API key are read from the database
 * (managed via admin panel). Falls back to .env keys when no DB key exists.
 *
 * Supported providers (via LangChain):
 *   - OpenAI     → ChatOpenAI          (@langchain/openai)
 *   - Anthropic  → ChatAnthropic       (@langchain/anthropic)
 *   - Google     → ChatGoogleGenerativeAI (@langchain/google-genai)
 *   - DeepSeek   → ChatOpenAI + custom baseURL (OpenAI-compatible)
 *   - SarvamAI   → ChatOpenAI + custom baseURL (OpenAI-compatible)
 *
 * Every call is logged to:
 *   - ai_agent_logs DB table (request/response summaries)
 *   - logs/ai-YYYY-MM-DD.log (full request/response details)
 */

import { query, insert as dbInsert } from '@/lib/db';
import { decryptApiKey } from '@/lib/ai/crypto';
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

interface ActiveAgent {
    providerName: string;
    displayName: string;
    baseUrl: string;
    apiFormat: 'openai' | 'anthropic' | 'gemini' | 'custom';
    modelId: string;
    modelDisplayName: string;
    maxTokens: number;
    temperature: number;
    apiKey: string;
    keySource: 'database' | 'env';
}

// ── Log Agent Call to ai_agent_logs table + detailed file log ──

async function logAgentCall(data: {
    provider: string;
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
    keySource?: string;
    systemPrompt?: string;
    userPrompt?: string;
    rawResponse?: string;
}): Promise<void> {
    // 1. Write to ai_agent_logs DB table (summary only)
    try {
        await dbInsert(
            `INSERT INTO ai_agent_logs (provider, model, category, status, input_articles, output_trending, prompt_tokens, duration_ms, error_message, request_summary, response_summary)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.provider,
                data.model,
                data.category,
                data.status,
                data.inputArticles,
                data.outputTrending,
                data.promptTokens,
                data.durationMs,
                data.errorMessage || null,
                data.requestSummary || null,
                data.responseSummary || null,
            ]
        );
    } catch (err) {
        console.error('[ai_agent_logs] Failed to log agent call:', err);
    }

    // 2. Write DETAILED log to file
    const logData: Record<string, unknown> = {
        provider: data.provider,
        model: data.model,
        category: data.category,
        status: data.status,
        keySource: data.keySource || 'unknown',
        inputArticles: data.inputArticles,
        outputTrending: data.outputTrending,
        promptTokens: data.promptTokens,
        durationMs: data.durationMs,
    };

    if (data.errorMessage) logData.error = data.errorMessage;
    if (data.requestSummary) logData.requestSummary = data.requestSummary;
    if (data.responseSummary) logData.responseSummary = data.responseSummary;

    if (data.status === 'success') {
        fileLogger.info('ai', `✓ AI CALL SUCCESS [LangChain]: ${data.provider}/${data.model} for [${data.category}] (${data.durationMs}ms)`, logData);
    } else if (data.status === 'error') {
        fileLogger.error('ai', `✕ AI CALL ERROR [LangChain]: ${data.provider}/${data.model} for [${data.category}] (${data.durationMs}ms)`, logData);
    } else {
        fileLogger.warn('ai', `⚠ AI FALLBACK for [${data.category}]: ${data.errorMessage}`, logData);
    }

    // 3. Log full request/response to file (debug level)
    if (data.systemPrompt) {
        fileLogger.debug('ai', `[REQUEST] System Prompt for [${data.category}]:`, {
            provider: data.provider, model: data.model,
            prompt: data.systemPrompt,
        });
    }
    if (data.userPrompt) {
        fileLogger.debug('ai', `[REQUEST] User Prompt for [${data.category}]:`, {
            provider: data.provider, model: data.model,
            prompt: data.userPrompt.substring(0, 3000),
        });
    }
    if (data.rawResponse) {
        fileLogger.debug('ai', `[RESPONSE] Raw AI response for [${data.category}]:`, {
            provider: data.provider, model: data.model,
            response: data.rawResponse.substring(0, 5000),
        });
    }
}

/** Rough token estimate (~4 chars per token) */
function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
}

// ── Get Active Agent from DB (with .env fallback) ──

async function getActiveAgent(): Promise<ActiveAgent | null> {
    fileLogger.info('ai', '🔍 Agent Selection: Starting agent lookup...');

    try {
        // Step 1: Get default active provider
        const providers = await query<Array<{
            id: number; name: string; display_name: string; base_url: string; api_format: string;
        }>>(
            `SELECT id, name, display_name, base_url, api_format
             FROM ai_providers
             WHERE is_default = true AND is_active = true
             LIMIT 1`
        );

        if (providers.length === 0) {
            fileLogger.info('ai', '🔍 Agent Selection: No default provider, trying any active provider...');
            const anyProvider = await query<Array<{
                id: number; name: string; display_name: string; base_url: string; api_format: string;
            }>>(
                'SELECT id, name, display_name, base_url, api_format FROM ai_providers WHERE is_active = true LIMIT 1'
            );
            if (anyProvider.length === 0) {
                fileLogger.warn('ai', '🔍 Agent Selection: No active providers in database');
                return tryEnvFallback();
            }
            providers.push(anyProvider[0]);
        }

        const provider = providers[0];
        fileLogger.info('ai', `🔍 Agent Selection: Provider "${provider.display_name}" (${provider.name}, format=${provider.api_format})`, {
            providerId: provider.id, providerName: provider.name, baseUrl: provider.base_url,
        });

        // Step 2: Get default model for this provider
        const models = await query<Array<{
            model_id: string; display_name: string; max_tokens: number; temperature: number;
        }>>(
            `SELECT model_id, display_name, max_tokens, temperature
             FROM ai_models
             WHERE provider_id = ? AND is_default = true AND is_active = true
             LIMIT 1`,
            [provider.id]
        );

        if (models.length === 0) {
            fileLogger.info('ai', `🔍 Agent Selection: No default model for "${provider.name}", trying any active model...`);
            const anyModel = await query<Array<{
                model_id: string; display_name: string; max_tokens: number; temperature: number;
            }>>(
                'SELECT model_id, display_name, max_tokens, temperature FROM ai_models WHERE provider_id = ? AND is_active = true LIMIT 1',
                [provider.id]
            );
            if (anyModel.length === 0) {
                fileLogger.warn('ai', `🔍 Agent Selection: No active models for "${provider.name}"`);
                return tryEnvFallback();
            }
            models.push(anyModel[0]);
        }

        const model = models[0];
        fileLogger.info('ai', `🔍 Agent Selection: Model "${model.display_name}" (${model.model_id})`, {
            modelId: model.model_id, maxTokens: model.max_tokens, temperature: model.temperature,
        });

        // Step 3: Get active API key
        const keys = await query<Array<{ api_key_encrypted: string }>>(
            `SELECT api_key_encrypted FROM ai_api_keys
             WHERE provider_id = ? AND is_active = true
             ORDER BY created_at DESC LIMIT 1`,
            [provider.id]
        );

        let apiKey: string;
        let keySource: 'database' | 'env';

        if (keys.length > 0) {
            apiKey = decryptApiKey(keys[0].api_key_encrypted);
            keySource = 'database';
            fileLogger.info('ai', `🔍 Agent Selection: Using API key from DATABASE for "${provider.name}"`);
        } else {
            fileLogger.warn('ai', `🔍 Agent Selection: No API key in DB for "${provider.name}", checking .env...`);
            const envKey = getEnvKeyForProvider(provider.name);
            if (envKey) {
                apiKey = envKey;
                keySource = 'env';
                fileLogger.info('ai', `🔍 Agent Selection: Using API key from .env for "${provider.name}" (${envKey.substring(0, 8)}...)`);
            } else {
                fileLogger.error('ai', `🔍 Agent Selection: NO API KEY for "${provider.name}" — not in DB and not in .env`);
                return tryEnvFallback();
            }
        }

        // Update last_used_at for DB keys
        if (keySource === 'database') {
            await query(
                'UPDATE ai_api_keys SET last_used_at = NOW() WHERE provider_id = ? AND is_active = true',
                [provider.id]
            );
        }

        const agent: ActiveAgent = {
            providerName: provider.name,
            displayName: provider.display_name,
            baseUrl: provider.base_url,
            apiFormat: provider.api_format as ActiveAgent['apiFormat'],
            modelId: model.model_id,
            modelDisplayName: model.display_name,
            maxTokens: model.max_tokens,
            temperature: model.temperature,
            apiKey,
            keySource,
        };

        fileLogger.info('ai', `✅ Agent Selection Complete: ${agent.displayName} / ${agent.modelDisplayName} (key from ${keySource})`, {
            provider: agent.providerName, model: agent.modelId, keySource, baseUrl: agent.baseUrl,
        });

        return agent;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        fileLogger.error('ai', `✕ Agent Selection FAILED: ${msg}`, { error: msg });
        return tryEnvFallback();
    }
}

/** Get API key from .env for a given provider name */
function getEnvKeyForProvider(providerName: string): string | null {
    const mapping: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        gemini: 'GOOGLE_API_KEY',
        sarvam: 'SARVAM_API_KEY',
    };
    const envVar = mapping[providerName.toLowerCase()];
    if (!envVar) return null;
    const value = process.env[envVar];
    return value && value.length > 0 ? value : null;
}

/** Last resort: use OPENAI_API_KEY from .env with gpt-4o-mini defaults */
function tryEnvFallback(): ActiveAgent | null {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey && envKey.length > 0) {
        fileLogger.info('ai', `🔄 ENV Fallback: Using OPENAI_API_KEY from .env (${envKey.substring(0, 8)}...)`);
        return {
            providerName: 'openai',
            displayName: 'OpenAI (env fallback)',
            baseUrl: 'https://api.openai.com/v1',
            apiFormat: 'openai',
            modelId: 'gpt-4o-mini',
            modelDisplayName: 'GPT-4o Mini (env default)',
            maxTokens: 1000,
            temperature: 0.3,
            apiKey: envKey,
            keySource: 'env',
        };
    }
    fileLogger.error('ai', '❌ No AI agent available — no DB config and no OPENAI_API_KEY in .env');
    return null;
}

// ── LangChain Model Factory ──

/**
 * Create a LangChain chat model instance based on the active agent's provider.
 * Maps DB `api_format` to the correct LangChain class:
 *   openai    → ChatOpenAI (also handles DeepSeek, SarvamAI via baseURL)
 *   anthropic → ChatAnthropic
 *   gemini    → ChatGoogleGenerativeAI
 *   custom    → ChatOpenAI (OpenAI-compatible fallback)
 */
async function createLangChainModel(agent: ActiveAgent): Promise<BaseChatModel> {
    fileLogger.info('ai', `🔗 LangChain: Creating ${agent.apiFormat} model for ${agent.providerName}/${agent.modelId}`);

    switch (agent.apiFormat) {
        case 'openai':
        case 'custom': {
            const { ChatOpenAI } = await import('@langchain/openai');
            const model = new ChatOpenAI({
                openAIApiKey: agent.apiKey,
                modelName: agent.modelId,
                temperature: agent.temperature,
                maxTokens: agent.maxTokens,
                configuration: {
                    baseURL: agent.baseUrl,
                },
            });
            fileLogger.info('ai', `🔗 LangChain: ChatOpenAI created (baseURL=${agent.baseUrl})`, {
                model: agent.modelId, temperature: agent.temperature, maxTokens: agent.maxTokens,
            });
            return model;
        }

        case 'anthropic': {
            const { ChatAnthropic } = await import('@langchain/anthropic');
            const model = new ChatAnthropic({
                anthropicApiKey: agent.apiKey,
                modelName: agent.modelId,
                temperature: agent.temperature,
                maxTokens: agent.maxTokens,
            });
            fileLogger.info('ai', `🔗 LangChain: ChatAnthropic created`, {
                model: agent.modelId, temperature: agent.temperature, maxTokens: agent.maxTokens,
            });
            return model;
        }

        case 'gemini': {
            const { ChatGoogleGenerativeAI } = await import('@langchain/google-genai');
            const model = new ChatGoogleGenerativeAI({
                apiKey: agent.apiKey,
                model: agent.modelId,
                temperature: agent.temperature,
                maxOutputTokens: agent.maxTokens,
            });
            fileLogger.info('ai', `🔗 LangChain: ChatGoogleGenerativeAI created`, {
                model: agent.modelId, temperature: agent.temperature, maxTokens: agent.maxTokens,
            });
            return model;
        }

        default: {
            // Unknown format — try OpenAI-compatible
            fileLogger.warn('ai', `🔗 LangChain: Unknown api_format "${agent.apiFormat}", defaulting to ChatOpenAI`);
            const { ChatOpenAI } = await import('@langchain/openai');
            return new ChatOpenAI({
                openAIApiKey: agent.apiKey,
                modelName: agent.modelId,
                temperature: agent.temperature,
                maxTokens: agent.maxTokens,
                configuration: { baseURL: agent.baseUrl },
            });
        }
    }
}

/**
 * Call the LangChain model with system + user messages.
 * Returns the raw text response.
 */
async function callLangChainModel(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    const model = await createLangChainModel(agent);

    fileLogger.info('ai', `🚀 LangChain invoke: ${agent.providerName}/${agent.modelId}`, {
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
        fileLogger.info('ai', `📊 LangChain usage: ${agent.providerName}/${agent.modelId}`, {
            inputTokens: usage.input_tokens,
            outputTokens: usage.output_tokens,
            totalTokens: usage.total_tokens,
        });
    }

    fileLogger.info('ai', `📥 LangChain response received (${content.length} chars)`, {
        provider: agent.providerName,
        model: agent.modelId,
        responsePreview: content.substring(0, 300),
    });

    return content;
}

// ── Public API ──

/**
 * Analyze articles using the active AI agent (via LangChain) and return trending results.
 * Falls back to recency-based selection if no agent is configured.
 */
export async function analyzeTrendingArticles(
    articles: ArticleForAnalysis[],
    category: string,
    count: number = 7
): Promise<TrendingResult[]> {
    fileLogger.info('ai', `━━━ Trending Analysis [LangChain] for [${category}] ━━━`, {
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

    const agent = await getActiveAgent();

    if (!agent) {
        await logger.aiFallback('No active agent or API key configured');
        await logAgentCall({
            provider: 'none', model: 'none', category, status: 'fallback',
            inputArticles: articles.length, outputTrending: Math.min(count, articles.length),
            promptTokens: 0, durationMs: 0,
            errorMessage: 'No active agent or API key configured — checked DB and .env',
            requestSummary: `${articles.length} articles for "${category}" — no agent available`,
        });
        return fallbackTrending(articles, count);
    }

    const startTime = Date.now();
    await logger.aiCallStart(agent.providerName, agent.modelId, category);

    try {
        const systemPrompt = buildSystemPrompt(category, count);
        const userPrompt = buildUserPrompt(articles, category, count);
        const totalPromptTokens = estimateTokens(systemPrompt + userPrompt);

        fileLogger.info('ai', `📝 Prompts built for [${category}]`, {
            systemPromptLength: systemPrompt.length,
            userPromptLength: userPrompt.length,
            estimatedTokens: totalPromptTokens,
            articleIds: articles.map(a => a.id),
        });

        // Call LangChain model
        const rawResponse = await callLangChainModel(agent, systemPrompt, userPrompt);

        if (!rawResponse) throw new Error('Empty response from LangChain model');

        // Parse JSON — handle potential markdown wrapping
        const jsonStr = rawResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const results: TrendingResult[] = JSON.parse(jsonStr);

        const durationMs = Date.now() - startTime;
        await logger.aiCallComplete(agent.providerName, agent.modelId, category, durationMs);

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
            provider: agent.providerName, model: agent.modelId, keySource: agent.keySource,
            durationMs, validatedCount: validated.length, rawResultCount: results.length,
            results: validated,
        });

        await logAgentCall({
            provider: agent.providerName, model: agent.modelId, category, status: 'success',
            inputArticles: articles.length, outputTrending: validated.length,
            promptTokens: totalPromptTokens, durationMs,
            requestSummary, responseSummary,
            keySource: agent.keySource, systemPrompt, userPrompt, rawResponse,
        });

        return validated;
    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorType = error instanceof Error ? error.message : String(error);
        await logger.aiCallError(agent.providerName, agent.modelId, errorType);

        fileLogger.error('ai', `✕ AI analysis FAILED [LangChain] for [${category}]`, {
            provider: agent.providerName, model: agent.modelId, keySource: agent.keySource,
            durationMs, error: errorType,
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        });

        await logAgentCall({
            provider: agent.providerName, model: agent.modelId, category, status: 'error',
            inputArticles: articles.length, outputTrending: 0,
            promptTokens: 0, durationMs,
            errorMessage: errorType.substring(0, 2000),
            requestSummary: `${articles.length} articles for "${category}" — LangChain call failed`,
            keySource: agent.keySource,
        });

        return fallbackTrending(articles, count);
    }
}

/** Fallback when no AI agent is available — pick most recent articles */
function fallbackTrending(articles: ArticleForAnalysis[], count: number): TrendingResult[] {
    fileLogger.info('ai', `📋 Fallback trending: selecting ${count} most recent articles by date`);
    return articles
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, count)
        .map((a, i) => ({
            articleId: a.id, rank: i + 1, score: 90 - i * 5,
            reasoning: 'Selected by recency (AI agent unavailable)',
        }));
}
