/** Server-side configuration for GPT-6 Luna news features. */
export interface AiConfig {
    apiKey: string;
    maxTokens: number;
    requestTimeoutMs: number;
    isValid: boolean;
}

function positiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config: AiConfig = {
    apiKey: process.env.OPENAI_API_KEY?.trim() || '',
    maxTokens: positiveInt(process.env.OPENAI_MAX_TOKENS, 1600),
    requestTimeoutMs: positiveInt(process.env.OPENAI_REQUEST_TIMEOUT_MS, 45000),
    isValid: Boolean(process.env.OPENAI_API_KEY?.trim()),
};
