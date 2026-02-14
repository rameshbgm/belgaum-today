import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/logs — Fetch system logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const category = searchParams.get('category');
        const level = searchParams.get('level');
        const offset = (page - 1) * limit;

        let countSql = 'SELECT COUNT(*) as total FROM system_logs WHERE 1=1';
        let dataSql = 'SELECT * FROM system_logs WHERE 1=1';
        const params: string[] = [];
        const countParams: string[] = [];

        if (category) {
            countSql += ' AND category = ?';
            dataSql += ' AND category = ?';
            params.push(category);
            countParams.push(category);
        }

        if (level) {
            countSql += ' AND level = ?';
            dataSql += ' AND level = ?';
            params.push(level);
            countParams.push(level);
        }

        dataSql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(String(limit), String(offset));

        const [countResult, logs] = await Promise.all([
            query<Array<{ total: number }>>(countSql, countParams),
            query(dataSql, params),
        ]);

        const total = countResult[0]?.total || 0;

        return NextResponse.json({
            success: true,
            data: {
                items: logs,
                total,
                page,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Failed to fetch logs' }, { status: 500 });
    }
}
