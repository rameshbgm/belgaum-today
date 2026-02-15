import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { withLogging } from '@/lib/withLogging';

// GET /api/search - Full-text search
export const GET = withLogging(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') || 'newest';

    try {
        let sql = `SELECT * FROM articles WHERE status = 'published'`;
        const params: unknown[] = [];

        // Full-text search
        if (q) {
            sql += ` AND MATCH(title, excerpt, content) AGAINST(? IN NATURAL LANGUAGE MODE)`;
            params.push(q);
        }

        // Category filter
        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        // Date range
        if (startDate) {
            sql += ` AND DATE(published_at) >= ?`;
            params.push(startDate);
        }
        if (endDate) {
            sql += ` AND DATE(published_at) <= ?`;
            params.push(endDate);
        }

        // Sorting
        switch (sortBy) {
            case 'views':
                sql += ` ORDER BY view_count DESC`;
                break;
            case 'relevant':
                if (q) {
                    sql += ` ORDER BY MATCH(title, excerpt, content) AGAINST(? IN NATURAL LANGUAGE MODE) DESC`;
                    params.push(q);
                } else {
                    sql += ` ORDER BY published_at DESC`;
                }
                break;
            default:
                sql += ` ORDER BY published_at DESC`;
        }

        sql += ` LIMIT 50`;

        const articles = await query<Article[]>(sql, params);

        return NextResponse.json({
            success: true,
            data: articles,
        });
    } catch (error) {
        console.error('Search error:', error instanceof Error ? error.message : error);
        return NextResponse.json({
            success: true,
            data: [],
        });
    }
});
