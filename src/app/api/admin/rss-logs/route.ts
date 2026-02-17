import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/rss-logs — Fetch RSS feed fetch logs with filtering and pagination
 */
export const GET = withLogging(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '30');
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const feedId = searchParams.get('feedId');
        const feedName = searchParams.get('feedName'); // For search
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const offset = (page - 1) * limit;

        let countSql = 'SELECT COUNT(*) as total FROM rss_fetch_logs WHERE 1=1';
        let dataSql = 'SELECT * FROM rss_fetch_logs WHERE 1=1';
        let statsSql = `SELECT 
            COUNT(*) as total_fetches,
            SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success_count,
            SUM(CASE WHEN status = 'partial' THEN 1 ELSE 0 END) as partial_count,
            SUM(CASE WHEN status = 'error' THEN 1 ELSE 0 END) as error_count,
            ROUND(AVG(duration_ms)) as avg_duration,
            SUM(new_articles) as total_new_articles,
            SUM(items_fetched) as total_items_fetched,
            SUM(skipped_articles) as total_skipped,
            SUM(errors_count) as total_errors
            FROM rss_fetch_logs WHERE 1=1`;
        
        const params: (string | number)[] = [];
        const countParams: (string | number)[] = [];
        const statsParams: (string | number)[] = [];

        if (status) {
            countSql += ' AND status = ?';
            dataSql += ' AND status = ?';
            statsSql += ' AND status = ?';
            params.push(status);
            countParams.push(status);
            statsParams.push(status);
        }

        if (category) {
            countSql += ' AND category = ?';
            dataSql += ' AND category = ?';
            statsSql += ' AND category = ?';
            params.push(category);
            countParams.push(category);
            statsParams.push(category);
        }

        if (feedId) {
            countSql += ' AND feed_id = ?';
            dataSql += ' AND feed_id = ?';
            statsSql += ' AND feed_id = ?';
            params.push(parseInt(feedId));
            countParams.push(parseInt(feedId));
            statsParams.push(parseInt(feedId));
        }

        if (feedName) {
            countSql += ' AND feed_name LIKE ?';
            dataSql += ' AND feed_name LIKE ?';
            statsSql += ' AND feed_name LIKE ?';
            const searchTerm = `%${feedName}%`;
            params.push(searchTerm);
            countParams.push(searchTerm);
            statsParams.push(searchTerm);
        }

        if (startDate) {
            countSql += ' AND DATE(started_at) >= ?';
            dataSql += ' AND DATE(started_at) >= ?';
            statsSql += ' AND DATE(started_at) >= ?';
            params.push(startDate);
            countParams.push(startDate);
            statsParams.push(startDate);
        }

        if (endDate) {
            countSql += ' AND DATE(started_at) <= ?';
            dataSql += ' AND DATE(started_at) <= ?';
            statsSql += ' AND DATE(started_at) <= ?';
            params.push(endDate);
            countParams.push(endDate);
            statsParams.push(endDate);
        }

        dataSql += ` ORDER BY started_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [countResult, logs, statsResult] = await Promise.all([
            query<Array<{ total: number }>>(countSql, countParams),
            query(dataSql, params),
            query<Array<{
                total_fetches: number;
                success_count: number;
                partial_count: number;
                error_count: number;
                avg_duration: number;
                total_new_articles: number;
                total_items_fetched: number;
                total_skipped: number;
                total_errors: number;
            }>>(statsSql, statsParams),
        ]);

        const total = countResult[0]?.total || 0;
        const stats = statsResult[0] || {
            total_fetches: 0,
            success_count: 0,
            partial_count: 0,
            error_count: 0,
            avg_duration: 0,
            total_new_articles: 0,
            total_items_fetched: 0,
            total_skipped: 0,
            total_errors: 0,
        };

        // Calculate success rate
        const successRate = stats.total_fetches > 0 
            ? ((stats.success_count / stats.total_fetches) * 100).toFixed(1)
            : '0.0';

        return NextResponse.json({
            success: true,
            data: {
                items: logs,
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
