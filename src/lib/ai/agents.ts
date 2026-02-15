/**
 * Multi-Agent System — Unified interface for 5 LLM providers.
 * 
 * Each agent uses the same prompt and returns TrendingResult[].
 * The active agent is determined by:
 *   1. Default provider + model + API key from the admin panel (DB)
 *   2. Fallback: OPENAI_API_KEY from .env if no DB key is configured
 * 
 * Supported providers:
 *   - OpenAI (openai-compatible SDK)
 *   - Anthropic (anthropic SDK)
 *   - DeepSeek (openai-compatible, custom base_url)
 *   - Gemini (Google Generative AI)
 *   - SarvamAI (openai-compatible, custom base_url)
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
    keySource: 'database' | 'env';  // Track where the key came from
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

    // 2. Write DETAILED log to file (includes full prompt and response)
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

    if (data.errorMessage) {
        logData.error = data.errorMessage;
    }
    if (data.requestSummary) {
        logData.requestSummary = data.requestSummary;
    }
    if (data.responseSummary) {
        logData.responseSummary = data.responseSummary;
    }

    // Log to file based on status
    if (data.status === 'success') {
        fileLogger.info('ai', `✓ AI CALL SUCCESS: ${data.provider}/${data.model} for [${data.category}] (${data.durationMs}ms)`, logData);
    } else if (data.status === 'error') {
        fileLogger.error('ai', `✕ AI CALL ERROR: ${data.provider}/${data.model} for [${data.category}] (${data.durationMs}ms)`, logData);
    } else {
        fileLogger.warn('ai', `⚠ AI FALLBACK for [${data.category}]: ${data.errorMessage}`, logData);
    }

    // 3. Log full request/response to file (separate entries for readability)
    if (data.systemPrompt) {
        fileLogger.debug('ai', `[REQUEST] System Prompt for [${data.category}]:`, {
            provider: data.provider,
            model: data.model,
            prompt: data.systemPrompt,
        });
    }
    if (data.userPrompt) {
        fileLogger.debug('ai', `[REQUEST] User Prompt for [${data.category}]:`, {
            provider: data.provider,
            model: data.model,
            prompt: data.userPrompt.substring(0, 3000), // Cap at 3KB
        });
    }
    if (data.rawResponse) {
        fileLogger.debug('ai', `[RESPONSE] Raw AI response for [${data.category}]:`, {
            provider: data.provider,
            model: data.model,
            response: data.rawResponse.substring(0, 5000), // Cap at 5KB
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
            fileLogger.info('ai', '🔍 Agent Selection: No default provider found, trying any active provider...');
            // Fallback: get any active provider
            const anyProvider = await query<Array<{
                id: number; name: string; display_name: string; base_url: string; api_format: string;
            }>>(
                'SELECT id, name, display_name, base_url, api_format FROM ai_providers WHERE is_active = true LIMIT 1'
            );
            if (anyProvider.length === 0) {
                fileLogger.warn('ai', '🔍 Agent Selection: No active providers found in database at all');
                return tryEnvFallback();
            }
            providers.push(anyProvider[0]);
        }

        const provider = providers[0];
        fileLogger.info('ai', `🔍 Agent Selection: Using provider "${provider.display_name}" (${provider.name}, format=${provider.api_format})`, {
            providerId: provider.id,
            providerName: provider.name,
            baseUrl: provider.base_url,
            apiFormat: provider.api_format,
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
                fileLogger.warn('ai', `🔍 Agent Selection: No active models for provider "${provider.name}"`);
                return tryEnvFallback();
            }
            models.push(anyModel[0]);
        }

        const model = models[0];
        fileLogger.info('ai', `🔍 Agent Selection: Using model "${model.display_name}" (${model.model_id})`, {
            modelId: model.model_id,
            maxTokens: model.max_tokens,
            temperature: model.temperature,
        });

        // Step 3: Get active API key for this provider
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
            fileLogger.info('ai', `🔍 Agent Selection: Using API key from DATABASE (encrypted) for "${provider.name}"`);
        } else {
            // No DB key — try .env fallback for this specific provider
            fileLogger.warn('ai', `🔍 Agent Selection: No API key in DB for "${provider.name}", checking .env fallback...`);

            const envKey = getEnvKeyForProvider(provider.name);
            if (envKey) {
                apiKey = envKey;
                keySource = 'env';
                fileLogger.info('ai', `🔍 Agent Selection: Using API key from .env for "${provider.name}" (key starts with: ${envKey.substring(0, 8)}...)`);
            } else {
                fileLogger.error('ai', `🔍 Agent Selection: NO API KEY found for "${provider.name}" — not in DB and not in .env`);
                return tryEnvFallback();
            }
        }

        // Update last_used_at (only for DB keys)
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
            provider: agent.providerName,
            model: agent.modelId,
            keySource,
            baseUrl: agent.baseUrl,
        });

        return agent;
    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        fileLogger.error('ai', `✕ Agent Selection FAILED: ${msg}`, { error: msg });
        return tryEnvFallback();
    }
}

/**
 * Get API key from .env for a given provider name.
 */
function getEnvKeyForProvider(providerName: string): string | null {
    const mapping: Record<string, string> = {
        openai: 'OPENAI_API_KEY',
        anthropic: 'ANTHROPIC_API_KEY',
        deepseek: 'DEEPSEEK_API_KEY',
        gemini: 'GEMINI_API_KEY',
        sarvam: 'SARVAM_API_KEY',
    };

    const envVar = mapping[providerName.toLowerCase()];
    if (!envVar) return null;

    const value = process.env[envVar];
    return value && value.length > 0 ? value : null;
}

/**
 * Last resort: if DB has no providers/models/keys, try OPENAI_API_KEY from .env.
 */
function tryEnvFallback(): ActiveAgent | null {
    const envKey = process.env.OPENAI_API_KEY;
    if (envKey && envKey.length > 0) {
        fileLogger.info('ai', `🔄 ENV Fallback: Using OPENAI_API_KEY from .env (starts with: ${envKey.substring(0, 8)}...)`, {
            keyLength: envKey.length,
        });
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

// ── Agent Implementations ──

async function callOpenAICompatible(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    fileLogger.debug('ai', `📡 Calling OpenAI-compatible API: ${agent.baseUrl}`, {
        model: agent.modelId,
        temperature: agent.temperature,
        maxTokens: agent.maxTokens,
    });

    const { default: OpenAI } = await import('openai');
    const client = new OpenAI({
        apiKey: agent.apiKey,
        baseURL: agent.baseUrl,
    });

    const response = await client.chat.completions.create({
        model: agent.modelId,
        temperature: agent.temperature,
        max_tokens: agent.maxTokens,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ],
    });

    const content = response.choices[0]?.message?.content?.trim() || '';
    const usage = response.usage;

    fileLogger.debug('ai', `📡 OpenAI response received`, {
        model: agent.modelId,
        finishReason: response.choices[0]?.finish_reason,
        promptTokens: usage?.prompt_tokens,
        completionTokens: usage?.completion_tokens,
        totalTokens: usage?.total_tokens,
        responseLength: content.length,
    });

    return content;
}

async function callAnthropic(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    fileLogger.debug('ai', `📡 Calling Anthropic API: ${agent.baseUrl}/v1/messages`, {
        model: agent.modelId,
    });

    const response = await fetch(`${agent.baseUrl}/v1/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': agent.apiKey,
            'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
            model: agent.modelId,
            max_tokens: agent.maxTokens,
            system: systemPrompt,
            messages: [
                { role: 'user', content: userPrompt },
            ],
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const textBlock = data.content?.find((c: { type: string }) => c.type === 'text');
    const content = textBlock?.text?.trim() || '';

    fileLogger.debug('ai', `📡 Anthropic response received`, {
        model: agent.modelId,
        stopReason: data.stop_reason,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
        responseLength: content.length,
    });

    return content;
}

async function callGemini(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    const url = `${agent.baseUrl}/v1beta/models/${agent.modelId}:generateContent?key=${agent.apiKey}`;
    fileLogger.debug('ai', `📡 Calling Gemini API: ${agent.baseUrl}/v1beta/models/${agent.modelId}:generateContent`, {
        model: agent.modelId,
    });

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            system_instruction: { parts: [{ text: systemPrompt }] },
            contents: [{ parts: [{ text: userPrompt }] }],
            generationConfig: {
                temperature: agent.temperature,
                maxOutputTokens: agent.maxTokens,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

    fileLogger.debug('ai', `📡 Gemini response received`, {
        model: agent.modelId,
        finishReason: data.candidates?.[0]?.finishReason,
        promptTokenCount: data.usageMetadata?.promptTokenCount,
        candidatesTokenCount: data.usageMetadata?.candidatesTokenCount,
        responseLength: content.length,
    });

    return content;
}

// ── Dispatcher ──

async function callAgent(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    fileLogger.info('ai', `🚀 Dispatching AI call to ${agent.apiFormat} provider: ${agent.providerName}/${agent.modelId}`);

    switch (agent.apiFormat) {
        case 'openai':
            return callOpenAICompatible(agent, systemPrompt, userPrompt);
        case 'anthropic':
            return callAnthropic(agent, systemPrompt, userPrompt);
        case 'gemini':
            return callGemini(agent, systemPrompt, userPrompt);
        default:
            // Custom format — try openai-compatible as default
            fileLogger.info('ai', `Using openai-compatible as default for custom format: ${agent.apiFormat}`);
            return callOpenAICompatible(agent, systemPrompt, userPrompt);
    }
}

// ── Public API ──

/**
 * Analyze articles using the active AI agent and return trending results.
 * Falls back to recency-based selection if no agent is configured.
 * Every call is logged to:
 *   - ai_agent_logs DB table (summaries)
 *   - logs/ai-YYYY-MM-DD.log (full details with request/response)
 */
export async function analyzeTrendingArticles(
    articles: ArticleForAnalysis[],
    category: string,
    count: number = 7
): Promise<TrendingResult[]> {
    fileLogger.info('ai', `━━━ Trending Analysis for [${category}] ━━━`, {
        articleCount: articles.length,
        requestedCount: count,
    });

    if (articles.length === 0) {
        fileLogger.warn('ai', `No articles provided for [${category}], returning empty`);
        return [];
    }

    if (articles.length <= count) {
        fileLogger.info('ai', `Only ${articles.length} articles for [${category}] (≤ ${count}), including all without AI`);
        return articles.map((a, i) => ({
            articleId: a.id,
            rank: i + 1,
            score: 100 - i * 10,
            reasoning: 'Included — fewer articles than requested trending count',
        }));
    }

    const agent = await getActiveAgent();

    if (!agent) {
        await logger.aiFallback('No active agent or API key configured');
        await logAgentCall({
            provider: 'none',
            model: 'none',
            category,
            status: 'fallback',
            inputArticles: articles.length,
            outputTrending: Math.min(count, articles.length),
            promptTokens: 0,
            durationMs: 0,
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

        const rawResponse = await callAgent(agent, systemPrompt, userPrompt);

        if (!rawResponse) throw new Error('Empty response from agent');

        fileLogger.info('ai', `📥 Raw response received (${rawResponse.length} chars)`, {
            provider: agent.providerName,
            model: agent.modelId,
            responsePreview: rawResponse.substring(0, 500),
        });

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
            provider: agent.providerName,
            model: agent.modelId,
            keySource: agent.keySource,
            durationMs,
            validatedCount: validated.length,
            rawResultCount: results.length,
            results: validated,
        });

        // Log to DB + file
        await logAgentCall({
            provider: agent.providerName,
            model: agent.modelId,
            category,
            status: 'success',
            inputArticles: articles.length,
            outputTrending: validated.length,
            promptTokens: totalPromptTokens,
            durationMs,
            requestSummary,
            responseSummary,
            keySource: agent.keySource,
            systemPrompt,
            userPrompt,
            rawResponse,
        });

        return validated;
    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorType = error instanceof Error ? error.message : String(error);
        await logger.aiCallError(agent.providerName, agent.modelId, errorType);

        fileLogger.error('ai', `✕ AI analysis FAILED for [${category}]`, {
            provider: agent.providerName,
            model: agent.modelId,
            keySource: agent.keySource,
            durationMs,
            error: errorType,
            stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5).join('\n') : undefined,
        });

        // Log error to DB + file
        await logAgentCall({
            provider: agent.providerName,
            model: agent.modelId,
            category,
            status: 'error',
            inputArticles: articles.length,
            outputTrending: 0,
            promptTokens: 0,
            durationMs,
            errorMessage: errorType.substring(0, 2000),
            requestSummary: `${articles.length} articles for "${category}" — call failed`,
            keySource: agent.keySource,
        });

        return fallbackTrending(articles, count);
    }
}

/**
 * Fallback when no AI agent is available — pick most recent articles.
 */
function fallbackTrending(articles: ArticleForAnalysis[], count: number): TrendingResult[] {
    fileLogger.info('ai', `📋 Fallback trending: selecting ${count} most recent articles by date`);

    const result = articles
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, count)
        .map((a, i) => ({
            articleId: a.id,
            rank: i + 1,
            score: 90 - i * 5,
            reasoning: 'Selected by recency (AI agent unavailable)',
        }));

    fileLogger.info('ai', `📋 Fallback results:`, {
        results: result.map(r => `#${r.rank} id=${r.articleId}`).join(', '),
    });

    return result;
}
