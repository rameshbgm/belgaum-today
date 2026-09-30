function positiveNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const RSS_JOB = 'rss-scheduler';
export const AI_JOB = 'ai-trending-scheduler';
export const RSS_INTERVAL_MS = positiveNumber(process.env.RSS_FETCH_INTERVAL_MINUTES, 120) * 60 * 1000;
export const AI_INTERVAL_MS = positiveNumber(process.env.TRENDING_ANALYSIS_INTERVAL_HOURS, 4) * 60 * 60 * 1000;
export const SCHEDULER_CHECK_INTERVAL_MS = Math.max(
    60_000,
    Math.min(5 * 60_000, Math.floor(Math.min(RSS_INTERVAL_MS, AI_INTERVAL_MS) / 4)),
);
export const STARTUP_DELAY_MS = 10_000;

export function schedulerStaleAfterMs(intervalMs: number): number {
    return intervalMs + (SCHEDULER_CHECK_INTERVAL_MS * 2);
}

export const VIEW_TRACKING_STALE_AFTER_MS = 60 * 60 * 1000;
