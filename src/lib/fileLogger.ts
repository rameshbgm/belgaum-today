/**
 * File-based structured logger — writes JSON-lines to daily rotating log files.
 * 
 * Log files are stored in the `logs/` directory at the project root:
 *   - app-YYYY-MM-DD.log    → all logs
 *   - error-YYYY-MM-DD.log  → errors only
 *   - api-YYYY-MM-DD.log    → HTTP request/response
 *   - cron-YYYY-MM-DD.log   → cron job details
 *   - ai-YYYY-MM-DD.log     → AI agent calls
 * 
 * Log level: debug (local/dev) | info (production)
 * Format: JSON-lines, daily rolling files
 * Zero external dependencies — uses Node.js fs only.
 */

import fs from 'fs';
import path from 'path';

// ── Types ──

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogChannel = 'app' | 'api' | 'cron' | 'ai' | 'error';

export interface LogEntry {
    timestamp: string;
    level: LogLevel;
    channel: LogChannel;
    message: string;
    data?: Record<string, unknown>;
}

// ── Configuration ──

const LOG_DIR = path.join(process.cwd(), 'logs');
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Log level priority: debug(0) < info(1) < warn(2) < error(3)
const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL: LogLevel = IS_PRODUCTION ? 'info' : 'debug';

function shouldLog(level: LogLevel): boolean {
    return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[MIN_LEVEL];
}

// ── Helpers ──

function ensureLogDir(): void {
    try {
        if (!fs.existsSync(LOG_DIR)) {
            fs.mkdirSync(LOG_DIR, { recursive: true });
        }
    } catch {
        // Silently fail — don't break the app if we can't create log dir
    }
}

function getDateString(): string {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function formatTimestamp(): string {
    return new Date().toISOString();
}

function writeToFile(channel: LogChannel, line: string): void {
    try {
        ensureLogDir();
        const date = getDateString();
        const filePath = path.join(LOG_DIR, `${channel}-${date}.log`);
        fs.appendFileSync(filePath, line + '\n', 'utf-8');
    } catch {
        // Silently fail — logging should never crash the app
    }
}

function formatConsole(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
        debug: '\x1b[90m',  // gray
        info: '\x1b[36m',   // cyan
        warn: '\x1b[33m',   // yellow
        error: '\x1b[31m',  // red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    const dataStr = entry.data ? ` ${JSON.stringify(entry.data)}` : '';
    return `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.channel}]${reset} ${entry.message}${dataStr}`;
}

// ── Core Write ──

function log(level: LogLevel, channel: LogChannel, message: string, data?: Record<string, unknown>): void {
    // Skip logs below minimum level (debug skipped in production)
    if (!shouldLog(level)) return;

    const entry: LogEntry = {
        timestamp: formatTimestamp(),
        level,
        channel,
        message,
        data,
    };

    // 1. Console output
    const consoleMsg = formatConsole(entry);
    if (level === 'error') {
        console.error(consoleMsg);
    } else if (level === 'warn') {
        console.warn(consoleMsg);
    } else {
        console.log(consoleMsg);
    }

    // 2. Write to channel-specific log file (JSON-lines, daily rolling)
    const jsonLine = JSON.stringify(entry);
    writeToFile(channel, jsonLine);

    // 3. Always mirror to app log
    if (channel !== 'app') {
        writeToFile('app', jsonLine);
    }

    // 4. Errors also go to error log
    if (level === 'error' && channel !== 'error') {
        writeToFile('error', jsonLine);
    }
}

// ── Public API ──

export const fileLogger = {
    // ── Generic ──
    debug: (channel: LogChannel, message: string, data?: Record<string, unknown>) =>
        log('debug', channel, message, data),

    info: (channel: LogChannel, message: string, data?: Record<string, unknown>) =>
        log('info', channel, message, data),

    warn: (channel: LogChannel, message: string, data?: Record<string, unknown>) =>
        log('warn', channel, message, data),

    error: (channel: LogChannel, message: string, data?: Record<string, unknown>) =>
        log('error', channel, message, data),

    // ── API Request/Response ──
    apiRequest: (method: string, path: string, data?: Record<string, unknown>) =>
        log('info', 'api', `→ ${method} ${path}`, data),

    apiResponse: (method: string, path: string, status: number, durationMs: number, data?: Record<string, unknown>) =>
        log(status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info', 'api',
            `← ${method} ${path} ${status} (${durationMs}ms)`, data),

    apiError: (method: string, path: string, error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        log('error', 'api', `✕ ${method} ${path} ERROR`, {
            error: err.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
        });
    },

    // ── Cron ──
    cronStart: (jobName: string, data?: Record<string, unknown>) =>
        log('info', 'cron', `▶ Cron started: ${jobName}`, data),

    cronStep: (jobName: string, step: string, data?: Record<string, unknown>) =>
        log('info', 'cron', `  ├ ${jobName}: ${step}`, data),

    cronComplete: (jobName: string, durationMs: number, data?: Record<string, unknown>) =>
        log('info', 'cron', `✓ Cron completed: ${jobName} (${durationMs}ms)`, data),

    cronError: (jobName: string, error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        log('error', 'cron', `✕ Cron failed: ${jobName}`, {
            error: err.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
        });
    },

    // ── AI Agent ──
    aiCallStart: (provider: string, model: string, category: string, data?: Record<string, unknown>) =>
        log('info', 'ai', `▶ AI call: ${provider}/${model} for [${category}]`, data),

    aiCallComplete: (provider: string, model: string, category: string, durationMs: number, data?: Record<string, unknown>) =>
        log('info', 'ai', `✓ AI call: ${provider}/${model} for [${category}] (${durationMs}ms)`, data),

    aiCallError: (provider: string, model: string, error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        log('error', 'ai', `✕ AI call failed: ${provider}/${model}`, {
            error: err.message,
            stack: err.stack?.split('\n').slice(0, 5).join('\n'),
        });
    },

    aiFallback: (category: string, reason: string) =>
        log('warn', 'ai', `⚠ AI fallback for [${category}]: ${reason}`),
};
