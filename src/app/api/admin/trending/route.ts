import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { runTrendingAnalysis } from '@/lib/scheduler/trending-service';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Manual admin runs intentionally bypass the scheduled cadence. */
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
        const body = await request.json().catch(() => ({}));
        const categories = Array.isArray(body.categories)
            ? body.categories.filter((value: unknown): value is string => typeof value === 'string' && value.length > 0)
            : undefined;
        const result = await runTrendingAnalysis({
            categories,
            triggerType: 'manual',
            triggeredBy: user.email,
        });
        return NextResponse.json({
            success: result.failures === 0,
            message: result.failures === 0 ? 'AI trending analysis completed' : 'AI analysis completed with errors',
            categoriesProcessed: result.categoriesProcessed,
            totalTrendingArticles: result.totalTrending,
            results: result.results,
            errors: result.results.filter(item => item.error).map(item => `${item.category}: ${item.error}`),
        }, { status: result.failures === 0 ? 200 : 502 });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: String(error) },
            { status: 500 },
        );
    }
});
