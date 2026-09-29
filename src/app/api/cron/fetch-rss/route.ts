import { NextRequest, NextResponse } from 'next/server';
import { runRssFetch } from '@/lib/scheduler/rss-service';
import { withLogging } from '@/lib/withLogging';
import { beatError, beatStart, beatSuccess } from '@/lib/scheduler/heartbeat';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export const GET = withLogging(async (request: NextRequest) => {
    if (!process.env.CRON_SECRET || request.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    try {
        await beatStart();
        const feedIds = (request.nextUrl.searchParams.get('feedIds') || '')
            .split(',')
            .map(value => Number(value))
            .filter(id => Number.isSafeInteger(id) && id > 0);
        const result = await runRssFetch({
            feedIds: feedIds.length ? feedIds : undefined,
            force: feedIds.length > 0,
            triggerType: 'cron',
            triggeredBy: 'cron',
        });
        if (result.errors > 0) await beatError(`RSS cron completed with ${result.errors} feed or item error(s)`);
        else await beatSuccess();
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        await beatError(error instanceof Error ? error.message : String(error));
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
});
