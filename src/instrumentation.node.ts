// Node.js-only instrumentation — the in-process RSS + AI scheduler.
// Next.js loads this once per Node.js process. On shared hosting the process
// (and this setInterval) can be reaped at any time; the heartbeat table makes
// that death visible, and the overlap guard keeps slow ticks from stacking.

import { beatStart, beatSuccess, beatError } from '@/lib/scheduler/heartbeat';

const RSS_INTERVAL_MS = 6 * 60 * 1000; // 6 minutes
const STARTUP_DELAY_MS = 10_000;

// Overlap guard: a tick that runs long must not stack with the next one.
let isRunning = false;

export async function register() {
    const { runRssFetch } = await import('@/lib/scheduler/rss-service');
    const { runTrendingAnalysis } = await import('@/lib/scheduler/trending-service');

    async function fetchAndAnalyze() {
        // Skip this tick if the previous one is still running.
        if (isRunning) {
            console.warn('[Scheduler] Previous tick still running — skipping this interval');
            return;
        }
        isRunning = true;

        await beatStart();
        let failed = false;

        try {
            await runRssFetch();
        } catch (err) {
            failed = true;
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[Scheduler] RSS fetch error:', err);
            await beatError(`RSS: ${msg}`);
        }

        try {
            await runTrendingAnalysis();
        } catch (err) {
            failed = true;
            const msg = err instanceof Error ? err.message : String(err);
            console.error('[Scheduler] Trending analysis error:', err);
            await beatError(`Trending: ${msg}`);
        }

        if (!failed) {
            await beatSuccess();
        }

        isRunning = false;
    }

    setTimeout(() => {
        fetchAndAnalyze();
        setInterval(fetchAndAnalyze, RSS_INTERVAL_MS);
    }, STARTUP_DELAY_MS);

    console.log(`[Scheduler] RSS + AI trending scheduled every ${RSS_INTERVAL_MS / 60000} minutes (pid ${process.pid})`);
}
