/**
 * Structured logger — writes operational logs to BOTH:
 *   1. system_logs DB table (for admin UI viewing)
 *   2. File logger (for server-side log files)
 * 
 * Logs cron operations, AI calls, and admin actions.
 * IMPORTANT: Never log article content or user data — only operational info.
 */
import { execute } from '@/lib/db';
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
 * Write a log entry to system_logs table AND file logger.
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

    // 2. Write to DB (async, best-effort)
    try {
        await execute(
            'INSERT INTO system_logs (level, category, message, metadata) VALUES (?, ?, ?, ?)',
            [level, category, message, metadata ? JSON.stringify(metadata) : null]
        );
    } catch {
        // DB write failed — already logged to file, don't break the caller
    }
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
