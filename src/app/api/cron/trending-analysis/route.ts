import { NextRequest, NextResponse } from 'next/server';
import { AI_INTERVAL_MS } from '@/lib/scheduler/constants';
import { runAiIfDue } from '@/lib/scheduler/runner';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** External cron may call frequently; the database claim enforces the .env cadence. */
export const GET = withLogging(async (request: NextRequest) => {
    if (!process.env.TRENDING_CRON_SECRET
        || request.nextUrl.searchParams.get('secret') !== process.env.TRENDING_CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const scheduled = await runAiIfDue('external-cron');
        return NextResponse.json({
            success: true,
            ...scheduled,
            configuredIntervalHours: AI_INTERVAL_MS / 3_600_000,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
});
