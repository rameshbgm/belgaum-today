/**
 * Structured logger — writes operational logs to FILE ONLY.
 * (Database logging for system_logs is disabled, but ai_agent_logs are still separate)
 * 
 * Logs cron operations, AI calls, and admin actions.
 * IMPORTANT: Never log article content or user data — only operational info.
 */
import { fileLogger } from '@/lib/fileLogger';

type LogLevel = 'info' | 'warn' | 'error';
type LogCategory = 'cron' | 'ai' | 'admin' | 'system';

interface LogMetadata {
    duration_ms?: number;
    model?: string;
    provider?: string;
    feed_count?: number;
    article_count?: number;
    token_count?: number;
    error_type?: string;
    [key: string]: string | number | boolean | undefined;
}

// Map LogCategory to file logger channels
function toChannel(category: LogCategory) {
    if (category === 'cron') return 'cron' as const;
    if (category === 'ai') return 'ai' as const;
    return 'app' as const;
}

/**
 * Write a log entry to file logger ONLY.
 * (Database logging for system_logs has been disabled per configuration)
 */
async function writeLog(level: LogLevel, category: LogCategory, message: string, metadata?: LogMetadata): Promise<void> {
    // 1. Always write to file logger (fast, synchronous)
    const channel = toChannel(category);
    const data = metadata as Record<string, unknown> | undefined;

    if (level === 'error') {
        fileLogger.error(channel, `[${category}] ${message}`, data);
    } else if (level === 'warn') {
        fileLogger.warn(channel, `[${category}] ${message}`, data);
    } else {
        fileLogger.info(channel, `[${category}] ${message}`, data);
    }

    // 2. Database logging skipped for system_logs
    // We only log AI agent calls to DB (via ai/agents.ts -> ai_agent_logs)
}

export const logger = {
    // ── Cron Logs ──
    cronStart: (feedCount: number) =>
        writeLog('info', 'cron', `Cron job started`, { feed_count: feedCount }),

    cronComplete: (feedCount: number, newArticles: number, durationMs: number) =>
        writeLog('info', 'cron', `Cron job completed`, {
            feed_count: feedCount,
            article_count: newArticles,
            duration_ms: durationMs,
        }),

    cronError: (errorType: string) =>
        writeLog('error', 'cron', `Cron job failed`, { error_type: errorType }),

    cronFeedFetch: (feedName: string, newCount: number, skippedCount: number) =>
        writeLog('info', 'cron', `Feed fetched: ${feedName}`, {
            article_count: newCount,
            feed_count: skippedCount,
        }),

    // ── AI Logs ──
    aiCallStart: (provider: string, model: string, category: string) =>
        writeLog('info', 'ai', `AI analysis started for ${category}`, { provider, model }),

    aiCallComplete: (provider: string, model: string, category: string, durationMs: number, tokenCount?: number) =>
        writeLog('info', 'ai', `AI analysis completed for ${category}`, {
            provider,
            model,
            duration_ms: durationMs,
            token_count: tokenCount,
        }),

    aiCallError: (provider: string, model: string, errorType: string) =>
        writeLog('error', 'ai', `AI analysis failed`, { provider, model, error_type: errorType }),

    aiFallback: (reason: string) =>
        writeLog('warn', 'ai', `Using fallback trending (no AI)`, { error_type: reason }),

    // ── Admin Logs ──
    adminAction: (action: string) =>
        writeLog('info', 'admin', action),

    // ── Generic ──
    info: (category: LogCategory, message: string, metadata?: LogMetadata) =>
        writeLog('info', category, message, metadata),

    warn: (category: LogCategory, message: string, metadata?: LogMetadata) =>
        writeLog('warn', category, message, metadata),

    error: (category: LogCategory, message: string, metadata?: LogMetadata) =>
        writeLog('error', category, message, metadata),
};
