import { queryOne } from '@/lib/db';
import { SCHEDULER_STALE_AFTER_MS } from '@/lib/scheduler/constants';

/**
 * Self-healing recovery for the in-process scheduler.
 *
 * Problem: on Hostinger shared hosting the Node process (and its setInterval)
 * gets reaped when idle. `register()` in instrumentation.node.ts only re-runs
 * when a brand-new process boots — which won't happen until a web request
 * arrives. So after a quiet period the scheduler can be silently dead.
 *
 * This helper is meant to be called from a lightweight, frequently-hit path
 * (e.g. the homepage data fetch or a middleware-adjacent route). It reads the
 * heartbeat and decides whether the scheduler looks dead and should be revived.
 *
 * DESIGN DECISION (your contribution):
 *   How stale is "dead"? And what should we do when it's stale?
 *   - Too short a threshold → we may try to revive a scheduler that's just
 *     mid-tick on a slow fetch, causing duplicate work.
 *   - Too long → the site stays stale for a long time before self-healing.
 *   - The scheduler ticks every 6 minutes. A single tick can take a while
 *     (dozens of feeds + an AI call). Pick a threshold that tolerates a slow
 *     tick but still catches a genuinely dead timer quickly.
 *
 * Return `true` if the scheduler appears dead and the caller should trigger a
 * fresh fetch (e.g. by firing the cron endpoint or re-running the job inline).
 */
export async function isSchedulerStale(): Promise<boolean> {
    const row = await queryOne<{ last_started_at: string | null }>(
        `SELECT last_started_at FROM scheduler_heartbeat WHERE job_name = 'rss-scheduler'`,
    );

    // No heartbeat row at all → never started → definitely needs reviving.
    if (!row || !row.last_started_at) return true;

    const lastStarted = new Date(row.last_started_at).getTime();
    const ageMs = Date.now() - lastStarted;

    // Stale after ~3 missed 6-min ticks (see constants.ts). Long enough to
    // tolerate one slow tick, short enough to self-heal quickly.
    return ageMs > SCHEDULER_STALE_AFTER_MS;
}

// In-process guard so concurrent requests don't all kick off a recovery fetch.
let recovering = false;

/**
 * Self-heal entry point. Safe to call from a hot request path (e.g. homepage):
 * it's cheap when healthy (one indexed SELECT) and fires a single background
 * fetch when the scheduler looks dead. Fire-and-forget — never awaited by the
 * caller, so it can't slow the page down.
 */
export async function reviveSchedulerIfStale(): Promise<void> {
    // Fast in-process guard — blocks repeat triggers within this process.
    if (recovering) return;
    recovering = true;

    try {
        const { claimStaleHeartbeat, beatSuccess, beatError } = await import('@/lib/scheduler/heartbeat');

        // Atomic cross-process claim: only the caller whose UPDATE actually
        // marks the stale row as 'running' proceeds. Everyone else backs off.
        // This prevents the "recovery storm" of many requests each launching a
        // fetch (which previously caused 7+ concurrent runs against prod).
        if (!(await claimStaleHeartbeat())) {
            recovering = false;
            return;
        }

        console.warn('[Scheduler] Heartbeat stale — triggering recovery fetch');

        const { runRssFetch } = await import('@/lib/scheduler/rss-service');
        const { runTrendingAnalysis } = await import('@/lib/scheduler/trending-service');

        // Don't await the body — let the page render while this runs.
        void (async () => {
            try {
                await runRssFetch();
                await runTrendingAnalysis();
                await beatSuccess();
            } catch (err) {
                const msg = err instanceof Error ? err.message : String(err);
                console.error('[Scheduler] Recovery fetch failed:', msg);
                await beatError(`recovery: ${msg}`);
            } finally {
                recovering = false;
            }
        })();
    } catch {
        recovering = false;
    }
}
