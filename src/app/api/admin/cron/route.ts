import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runRssFetch } from '@/lib/scheduler/rss-service';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export const POST = withLogging(async (request: NextRequest) => {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    try {
        const body = await request.json().catch(() => ({}));
        const feedIds = Array.isArray(body.feedIds) ? body.feedIds.filter((id: unknown) => Number.isInteger(id)) : undefined;
        const categories = Array.isArray(body.categories) ? body.categories.filter((value: unknown) => typeof value === 'string') : undefined;
        const result = await runRssFetch({ feedIds, categories, force: true, triggerType: 'manual', triggeredBy: 'admin' });
        return NextResponse.json({ success: true, ...result });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
});
