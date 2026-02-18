import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/rss-logs — Fetch RSS runs, feeds within runs, or items within feeds
 * 
 * Query modes:
 * 1. No runId: fetch all runs with pagination and stats
 * 2. runId only: fetch feed logs for that run
 * 3. runId + feedId + action: fetch item details for that feed/action
 */
export const GET = withLogging(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const runId = searchParams.get('runId');
        const feedId = searchParams.get('feedId');
        const action = searchParams.get('action');

        // Mode 3: Fetch items for specific run/feed/action
        if (runId && feedId && action) {
            const items = await query(
                `SELECT * FROM rss_fetch_items 
                WHERE run_id = ? AND feed_id = ? AND action = ?
                ORDER BY created_at DESC`,
                [runId, parseInt(feedId), action]
            );

            return NextResponse.json({
                success: true,
                data: { items },
            });
        }

        // Mode 2: Fetch feed logs for specific run
        if (runId) {
            const feeds = await query(
                `SELECT * FROM rss_fetch_logs 
                WHERE run_id = ?
                ORDER BY started_at ASC`,
                [runId]
            );

            return NextResponse.json({
                success: true,
                data: { feeds },
            });
        }

        // Mode 1: Fetch all runs with pagination and stats
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const [runsResult, countResult, statsResult] = await Promise.all([
            query(
                `SELECT id, run_id, trigger_type, triggered_by, 
                    total_feeds as total_feeds_processed, 
                    total_items_fetched, total_new_articles, total_skipped, total_errors, 
                    overall_status, duration_ms, started_at, completed_at
                FROM rss_fetch_runs 
                ORDER BY started_at DESC 
                LIMIT ${limit} OFFSET ${offset}`
            ),
            query<Array<{ total: number }>>(
                'SELECT COUNT(*) as total FROM rss_fetch_runs',
                []
            ),
            query<Array<{
                total_runs: number;
                total_feeds_processed: number;
                total_new_articles: number;
                total_skipped: number;
                total_errors: number;
                avg_duration: number;
                success_count: number;
            }>>(
                `SELECT 
                    COUNT(*) as total_runs,
                    SUM(total_feeds) as total_feeds_processed,
                    SUM(total_new_articles) as total_new_articles,
                    SUM(total_skipped) as total_skipped,
                    SUM(total_errors) as total_errors,
                    AVG(duration_ms) as avg_duration,
                    SUM(CASE WHEN overall_status = 'success' THEN 1 ELSE 0 END) as success_count
                FROM rss_fetch_runs`
            ),
        ]);

        const total = countResult[0]?.total || 0;
        const stats = statsResult[0] || {
            total_runs: 0,
            total_feeds_processed: 0,
            total_new_articles: 0,
            total_skipped: 0,
            total_errors: 0,
            avg_duration: 0,
            success_count: 0,
        };

        // Calculate success rate
        const successRate = stats.total_runs > 0
            ? ((stats.success_count / stats.total_runs) * 100).toFixed(1)
            : '0.0';

        return NextResponse.json({
            success: true,
            data: {
                runs: runsResult,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                stats: {
                    ...stats,
                    success_rate: parseFloat(successRate),
                },
            },
        });
    } catch (error) {
        console.error('Failed to fetch RSS logs:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch RSS logs' },
            { status: 500 }
        );
    }
});
