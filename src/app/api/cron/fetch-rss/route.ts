import { NextRequest, NextResponse } from 'next/server';
import { RSS_INTERVAL_MS } from '@/lib/scheduler/constants';
import { runRssIfDue } from '@/lib/scheduler/runner';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** External cron may call frequently; the database claim enforces the .env cadence. */
export const GET = withLogging(async (request: NextRequest) => {
    if (!process.env.CRON_SECRET || request.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const scheduled = await runRssIfDue('external-cron');
        return NextResponse.json({
            success: true,
            ...scheduled,
            configuredIntervalMinutes: RSS_INTERVAL_MS / 60_000,
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
});
