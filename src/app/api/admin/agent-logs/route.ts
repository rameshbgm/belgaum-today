import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/agent-logs — Fetch AI agent call logs with filtering and pagination
 */
export const GET = withLogging(async (request: NextRequest) => {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '30');
        const status = searchParams.get('status');
        const category = searchParams.get('category');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const offset = (page - 1) * limit;

        let countSql = 'SELECT COUNT(*) as total FROM ai_agent_logs WHERE 1=1';
        let dataSql = 'SELECT * FROM ai_agent_logs WHERE 1=1';
        let statsSql = 'SELECT COUNT(*) as total_calls, SUM(CASE WHEN status = \'success\' THEN 1 ELSE 0 END) as success_count, SUM(CASE WHEN status = \'error\' THEN 1 ELSE 0 END) as error_count, SUM(CASE WHEN status = \'fallback\' THEN 1 ELSE 0 END) as fallback_count, ROUND(AVG(duration_ms)) as avg_duration, SUM(prompt_tokens) as total_tokens FROM ai_agent_logs WHERE 1=1';
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

        if (startDate) {
            countSql += ' AND DATE(created_at) >= ?';
            dataSql += ' AND DATE(created_at) >= ?';
            statsSql += ' AND DATE(created_at) >= ?';
            params.push(startDate);
            countParams.push(startDate);
            statsParams.push(startDate);
        }

        if (endDate) {
            countSql += ' AND DATE(created_at) <= ?';
            dataSql += ' AND DATE(created_at) <= ?';
            statsSql += ' AND DATE(created_at) <= ?';
            params.push(endDate);
            countParams.push(endDate);
            statsParams.push(endDate);
        }

        dataSql += ` ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [countResult, logs, statsResult] = await Promise.all([
            query<Array<{ total: number }>>(countSql, countParams),
            query(dataSql, params),
            query<Array<{
                total_calls: number;
                success_count: number;
                error_count: number;
                fallback_count: number;
                avg_duration: number;
                total_tokens: number;
            }>>(statsSql, statsParams),
        ]);

        const total = countResult[0]?.total || 0;
        const stats = statsResult[0] || {
            total_calls: 0, success_count: 0, error_count: 0, fallback_count: 0,
            avg_duration: 0, total_tokens: 0,
        };

        return NextResponse.json({
            success: true,
            data: {
                items: logs,
                total,
                page,
                totalPages: Math.ceil(total / limit),
                stats,
            },
        });
    } catch (error) {
        console.error('Failed to fetch agent logs:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch agent logs' }, { status: 500 });
    }
});