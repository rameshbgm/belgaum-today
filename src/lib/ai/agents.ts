/**
 * Multi-Agent System — Unified interface for 5 LLM providers.
 * 
 * Each agent uses the same prompt and returns TrendingResult[].
 * The active agent is determined by the default provider + model in the DB.
 * 
 * Supported providers:
 *   - OpenAI (openai-compatible SDK)
 *   - Anthropic (anthropic SDK)
 *   - DeepSeek (openai-compatible, custom base_url)
 *   - Gemini (Google Generative AI)
 *   - SarvamAI (openai-compatible, custom base_url)
 */

import { query } from '@/lib/db';
import { decryptApiKey } from '@/lib/ai/crypto';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/ai/prompts';
import { logger } from '@/lib/logger';

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
}

// ── Get Active Agent from DB ──

async function getActiveAgent(): Promise<ActiveAgent | null> {
    try {
        // Get default provider
        const providers = await query<Array<{
            id: number; name: string; display_name: string; base_url: string; api_format: string;
        }>>(
            `SELECT id, name, display_name, base_url, api_format
             FROM ai_providers
             WHERE is_default = true AND is_active = true
             LIMIT 1`
        );

        if (providers.length === 0) {
            // Fallback: get any active provider
            const anyProvider = await query<Array<{
                id: number; name: string; display_name: string; base_url: string; api_format: string;
            }>>(
                'SELECT id, name, display_name, base_url, api_format FROM ai_providers WHERE is_active = true LIMIT 1'
            );
            if (anyProvider.length === 0) return null;
            providers.push(anyProvider[0]);
        }

        const provider = providers[0];

        // Get default model for this provider
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
            // Fallback: any active model for this provider
            const anyModel = await query<Array<{
                model_id: string; display_name: string; max_tokens: number; temperature: number;
            }>>(
                'SELECT model_id, display_name, max_tokens, temperature FROM ai_models WHERE provider_id = ? AND is_active = true LIMIT 1',
                [provider.id]
            );
            if (anyModel.length === 0) return null;
            models.push(anyModel[0]);
        }

        const model = models[0];

        // Get active API key for this provider
        const keys = await query<Array<{ api_key_encrypted: string }>>(
            `SELECT api_key_encrypted FROM ai_api_keys
             WHERE provider_id = ? AND is_active = true
             ORDER BY created_at DESC LIMIT 1`,
            [provider.id]
        );

        if (keys.length === 0) return null;

        // Update last_used_at
        await query(
            'UPDATE ai_api_keys SET last_used_at = NOW() WHERE provider_id = ? AND is_active = true',
            [provider.id]
        );

        return {
            providerName: provider.name,
            displayName: provider.display_name,
            baseUrl: provider.base_url,
            apiFormat: provider.api_format as ActiveAgent['apiFormat'],
            modelId: model.model_id,
            modelDisplayName: model.display_name,
            maxTokens: model.max_tokens,
            temperature: model.temperature,
            apiKey: decryptApiKey(keys[0].api_key_encrypted),
        };
    } catch (error) {
        console.error('Failed to load active agent:', error);
        return null;
    }
}

// ── Agent Implementations ──

async function callOpenAICompatible(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
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

    return response.choices[0]?.message?.content?.trim() || '';
}

async function callAnthropic(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    // Use fetch since @anthropic-ai/sdk may not be installed
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
    return textBlock?.text?.trim() || '';
}

async function callGemini(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    const url = `${agent.baseUrl}/v1beta/models/${agent.modelId}:generateContent?key=${agent.apiKey}`;

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
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

// ── Dispatcher ──

async function callAgent(
    agent: ActiveAgent,
    systemPrompt: string,
    userPrompt: string
): Promise<string> {
    switch (agent.apiFormat) {
        case 'openai':
            return callOpenAICompatible(agent, systemPrompt, userPrompt);
        case 'anthropic':
            return callAnthropic(agent, systemPrompt, userPrompt);
        case 'gemini':
            return callGemini(agent, systemPrompt, userPrompt);
        default:
            // Custom format — try openai-compatible as default
            return callOpenAICompatible(agent, systemPrompt, userPrompt);
    }
}

// ── Public API ──

/**
 * Analyze articles using the active AI agent and return trending results.
 * Falls back to recency-based selection if no agent is configured.
 */
export async function analyzeTrendingArticles(
    articles: ArticleForAnalysis[],
    category: string,
    count: number = 7
): Promise<TrendingResult[]> {
    if (articles.length === 0) return [];

    if (articles.length <= count) {
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
        return fallbackTrending(articles, count);
    }

    const startTime = Date.now();
    await logger.aiCallStart(agent.providerName, agent.modelId, category);

    try {
        const systemPrompt = buildSystemPrompt(category, count);
        const userPrompt = buildUserPrompt(articles, category, count);

        const rawResponse = await callAgent(agent, systemPrompt, userPrompt);

        if (!rawResponse) throw new Error('Empty response from agent');

        // Parse JSON — handle potential markdown wrapping
        const jsonStr = rawResponse.replace(/^```json?\n?/, '').replace(/\n?```$/, '');
        const results: TrendingResult[] = JSON.parse(jsonStr);

        const durationMs = Date.now() - startTime;
        await logger.aiCallComplete(agent.providerName, agent.modelId, category, durationMs);

        // Validate and ensure proper ranking
        return results
            .filter((r) => r.articleId && r.rank && articles.some((a) => a.id === r.articleId))
            .sort((a, b) => a.rank - b.rank)
            .slice(0, count)
            .map((r, i) => ({ ...r, rank: i + 1 }));
    } catch (error) {
        const durationMs = Date.now() - startTime;
        const errorType = error instanceof Error ? error.message : String(error);
        await logger.aiCallError(agent.providerName, agent.modelId, errorType);
        console.error(`AI analysis failed (${agent.providerName}/${agent.modelId}):`, errorType);
        return fallbackTrending(articles, count);
    }
}

/**
 * Fallback when no AI agent is available — pick most recent articles.
 */
function fallbackTrending(articles: ArticleForAnalysis[], count: number): TrendingResult[] {
    return articles
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
        .slice(0, count)
        .map((a, i) => ({
            articleId: a.id,
            rank: i + 1,
            score: 90 - i * 5,
            reasoning: 'Selected by recency (AI agent unavailable)',
        }));
}
