import { execute } from '@/lib/db';
import { RSS_JOB } from '@/lib/scheduler/constants';

/** Atomically claim a job only after its configured interval has elapsed. */
export async function claimDueHeartbeat(job: string, intervalMs: number): Promise<boolean> {
    const dueSeconds = Math.max(1, Math.floor(intervalMs / 1000));
    try {
        const inserted = await execute(
            `INSERT IGNORE INTO scheduler_heartbeat (job_name, last_started_at, last_status, tick_count, process_pid)
             VALUES (?, NOW(), 'running', 1, ?)`, [job, process.pid],
        );
        if (inserted > 0) return true;
        const claimed = await execute(
            `UPDATE scheduler_heartbeat
             SET last_started_at = NOW(), last_status = 'running', last_error = NULL,
                 tick_count = tick_count + 1, process_pid = ?
             WHERE job_name = ?
               AND (last_started_at IS NULL OR last_started_at <= NOW() - INTERVAL ? SECOND)`,
            [process.pid, job, dueSeconds],
        );
        return claimed > 0;
    } catch {
        return false;
    }
}

export async function beatSuccess(job = RSS_JOB): Promise<void> {
    try {
        await execute(`UPDATE scheduler_heartbeat SET last_success_at = NOW(), last_status = 'success', last_error = NULL WHERE job_name = ?`, [job]);
    } catch { /* heartbeat is non-fatal */ }
}

export async function beatError(message: string, job = RSS_JOB): Promise<void> {
    try {
        await execute(`UPDATE scheduler_heartbeat SET last_status = 'error', last_error = ? WHERE job_name = ?`, [message.slice(0, 1000), job]);
    } catch { /* heartbeat is non-fatal */ }
}
