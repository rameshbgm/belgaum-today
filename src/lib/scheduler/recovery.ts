/**
 * A request can wake a reaped shared-hosting process. Database-backed claims
 * still enforce each .env interval across processes, so this hot-path call
 * cannot create extra scheduled runs.
 */
export async function reviveSchedulerIfStale(): Promise<void> {
    if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_BACKGROUND_SCHEDULER === '1') return;
    const { runDueSchedulers } = await import('@/lib/scheduler/runner');
    void runDueSchedulers('homepage-recovery');
}
