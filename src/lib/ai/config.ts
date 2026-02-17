/**
 * AI Configuration Module — Runtime Settings from Environment
 *
 * All AI provider configuration is loaded from .env variables at startup.
 * No database queries, no admin panel — purely environment-based configuration.
 *
 * Required variables:
 *   OPENAI_API_KEY — OpenAI API key (required for actual AI calls)
 *   OPENAI_MODEL — Model name, defaults to 'gpt-4o-mini'
 *
 * Optional variables (with sensible defaults):
 *   OPENAI_TEMPERATURE — Sampling temperature (0-2), defaults to 0.3
 *   OPENAI_MAX_TOKENS — Max tokens in response, defaults to 1000
 *   OPENAI_REQUEST_TIMEOUT_MS — Request timeout in ms, defaults to 45000
 *
 * Configuration is loaded at module initialization. API key validation happens
 * at runtime when the config is actually used (not at build time).
 */

export interface AiConfig {
    apiKey: string;
    model: string;
    temperature: number;
    maxTokens: number;
    requestTimeoutMs: number;
    isValid: boolean;
}

/** Load AI config from environment variables (safe for build time and runtime) */
function loadConfig(): AiConfig {
    const apiKey = process.env.OPENAI_API_KEY?.trim() || '';

    const model = (process.env.OPENAI_MODEL || 'gpt-5-neno').trim();
    const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.3');
    const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '1000', 10);
    const requestTimeoutMs = parseInt(process.env.OPENAI_REQUEST_TIMEOUT_MS || '45000', 10);

    // Validate ranges
    if (temperature < 0 || temperature > 2) {
        console.warn(`[AI Config] OPENAI_TEMPERATURE ${temperature} is outside valid range [0, 2], clamping to 0.3`);
    }

    if (maxTokens <= 0) {
        console.warn(`[AI Config] OPENAI_MAX_TOKENS ${maxTokens} must be > 0, defaulting to 1000`);
    }

    const config: AiConfig = {
        apiKey,
        model,
        temperature: Math.min(2, Math.max(0, temperature)),
        maxTokens: maxTokens > 0 ? maxTokens : 1000,
        requestTimeoutMs,
        isValid: apiKey.length > 0,
    };

    if (config.isValid) {
        console.log('[AI Config] ✅ Loaded configuration:', {
            model: config.model,
            temperature: config.temperature,
            maxTokens: config.maxTokens,
            requestTimeoutMs: config.requestTimeoutMs,
            apiKeyLength: config.apiKey.length,
            keyPreview: config.apiKey.substring(0, 7) + '...',
        });
    } else {
        console.warn('[AI Config] ⚠️ OPENAI_API_KEY not configured — AI features will fail at runtime');
    }

    return config;
}

export const config = loadConfig();
