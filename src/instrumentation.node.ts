// Node.js-only instrumentation for the independent RSS and AI schedules.
import {
    AI_INTERVAL_MS,
    RSS_INTERVAL_MS,
    SCHEDULER_CHECK_INTERVAL_MS,
    STARTUP_DELAY_MS,
} from '@/lib/scheduler/constants';

let registered = false;

export async function register() {
    // Local development can read the configured database without launching
    // background ingestion jobs against it.
    if (process.env.NODE_ENV !== 'production' || process.env.DISABLE_BACKGROUND_SCHEDULER === '1') return;
    if (registered) return;
    registered = true;
    const { runDueSchedulers } = await import('@/lib/scheduler/runner');

    setTimeout(() => {
        void runDueSchedulers('in-process-startup');
        setInterval(() => void runDueSchedulers('in-process-timer'), SCHEDULER_CHECK_INTERVAL_MS);
    }, STARTUP_DELAY_MS);

    console.log(
        `[Scheduler] RSS every ${RSS_INTERVAL_MS / 60000} minutes; AI every ${AI_INTERVAL_MS / 3600000} hours (pid ${process.pid})`,
    );
}
