import { fileLogger } from '@/lib/fileLogger';
import { AI_INTERVAL_MS, AI_JOB, RSS_INTERVAL_MS, RSS_JOB } from './constants';
import { beatError, beatSuccess, claimDueHeartbeat } from './heartbeat';

let rssRunning = false;
let aiRunning = false;
export type ScheduledResult<T> = { ran: false; reason: 'not-due' | 'already-running' } | { ran: true; result: T };

export async function runRssIfDue(triggeredBy = 'scheduler'): Promise<ScheduledResult<Awaited<ReturnType<typeof import('./rss-service')['runRssFetch']>>>> {
    if (rssRunning) return { ran: false, reason: 'already-running' };
    if (!(await claimDueHeartbeat(RSS_JOB, RSS_INTERVAL_MS))) return { ran: false, reason: 'not-due' };
    rssRunning = true;
    try {
        const { runRssFetch } = await import('./rss-service');
        const { runStoryTracker } = await import('./story-tracker');
        const result = await runRssFetch({ triggerType: 'scheduled', triggeredBy });
        if (result.errors > 0) throw new Error(`RSS completed with ${result.errors} feed or item error(s)`);
        await runStoryTracker();
        await beatSuccess(RSS_JOB);
        return { ran: true, result };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await beatError(message, RSS_JOB);
        fileLogger.error('cron', 'Scheduled RSS run failed', { triggeredBy, error: message });
        throw error;
    } finally { rssRunning = false; }
}

export async function runAiIfDue(triggeredBy = 'scheduler'): Promise<ScheduledResult<Awaited<ReturnType<typeof import('./trending-service')['runTrendingAnalysis']>>>> {
    if (aiRunning) return { ran: false, reason: 'already-running' };
    if (!(await claimDueHeartbeat(AI_JOB, AI_INTERVAL_MS))) return { ran: false, reason: 'not-due' };
    aiRunning = true;
    try {
        const { runTrendingAnalysis } = await import('./trending-service');
        const result = await runTrendingAnalysis({ triggerType: 'scheduled', triggeredBy });
        if (result.failures > 0) throw new Error(`AI analysis failed for ${result.failures} categor${result.failures === 1 ? 'y' : 'ies'}`);
        await beatSuccess(AI_JOB);
        return { ran: true, result };
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        await beatError(message, AI_JOB);
        fileLogger.error('ai', 'Scheduled AI analysis failed', { triggeredBy, error: message });
        throw error;
    } finally { aiRunning = false; }
}

export async function runDueSchedulers(triggeredBy = 'scheduler'): Promise<void> {
    await runRssIfDue(triggeredBy).catch(() => undefined);
    await runAiIfDue(triggeredBy).catch(() => undefined);
}
