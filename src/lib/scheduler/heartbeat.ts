import { execute } from '@/lib/db';
import { SCHEDULER_STALE_AFTER_MS } from '@/lib/scheduler/constants';

/**
 * Scheduler heartbeat — writes liveness info to the `scheduler_heartbeat` table
 * so the dashboard can tell whether the in-process timer is actually alive.
 *
 * On Hostinger shared hosting the Node process (and its setInterval) can be
 * reaped at any time. These helpers don't keep the process alive — they make
 * its death *observable*: a stale `last_started_at` means the timer is gone.
 *
 * All writes are best-effort: a heartbeat failure must never break a fetch.
 */

const JOB = 'rss-scheduler';

/**
 * Atomically claim a recovery slot. Marks the heartbeat as running and bumps
 * last_started_at to NOW(), but ONLY if the row is currently stale (or missing).
 * Returns true if THIS caller won the claim — i.e. it should run the fetch.
 *
 * This is the cross-process guard: even if many requests check staleness at the
 * same instant, only the one whose UPDATE actually changes a row proceeds. The
 * staleness window is computed in SQL so the read+write is a single statement.
 */
export async function claimStaleHeartbeat(): Promise<boolean> {
    const staleSeconds = Math.floor(SCHEDULER_STALE_AFTER_MS / 1000);
    try {
        // Insert the row if it has never existed — that caller wins by definition.
        const inserted = await execute(
            `INSERT IGNORE INTO scheduler_heartbeat (job_name, last_started_at, last_status, tick_count, process_pid)
             VALUES (?, NOW(), 'running', 1, ?)`,
            [JOB, process.pid],
        );
        if (inserted > 0) return true;

        // Row exists: claim it only if stale. affectedRows > 0 means we won.
        const claimed = await execute(
            `UPDATE scheduler_heartbeat
             SET last_started_at = NOW(), last_status = 'running',
                 tick_count = tick_count + 1, process_pid = ?
             WHERE job_name = ?
               AND (last_started_at IS NULL
                    OR last_started_at < NOW() - INTERVAL ? SECOND)`,
            [process.pid, JOB, staleSeconds],
        );
        return claimed > 0;
    } catch {
        // On any error, don't claim — safer to skip recovery than to storm.
        return false;
    }
}

/** Record that a scheduler tick has started. */
export async function beatStart(): Promise<void> {
    try {
        await execute(
            `INSERT INTO scheduler_heartbeat (job_name, last_started_at, last_status, tick_count, process_pid)
             VALUES (?, NOW(), 'running', 1, ?)
             ON DUPLICATE KEY UPDATE
                last_started_at = NOW(),
                last_status     = 'running',
                tick_count      = tick_count + 1,
                process_pid     = VALUES(process_pid)`,
            [JOB, process.pid],
        );
    } catch {
        /* heartbeat is non-fatal */
    }
}

/** Record that a scheduler tick finished successfully. */
export async function beatSuccess(): Promise<void> {
    try {
        await execute(
            `UPDATE scheduler_heartbeat
             SET last_success_at = NOW(), last_status = 'success', last_error = NULL
             WHERE job_name = ?`,
            [JOB],
        );
    } catch {
        /* heartbeat is non-fatal */
    }
}

/** Record that a scheduler tick failed. */
export async function beatError(message: string): Promise<void> {
    try {
        await execute(
            `UPDATE scheduler_heartbeat
             SET last_status = 'error', last_error = ?
             WHERE job_name = ?`,
            [message.slice(0, 1000), JOB],
        );
    } catch {
        /* heartbeat is non-fatal */
    }
}
