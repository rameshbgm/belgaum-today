import { NextRequest, NextResponse } from 'next/server';
import { runRssFetch } from '@/lib/scheduler/rss-service';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const GET = withLogging(async (request: NextRequest) => {
    if (!process.env.CRON_SECRET || request.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const result = await runRssFetch({ triggerType: 'cron', triggeredBy: 'cron' });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
});
