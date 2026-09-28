import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article, ApiResponse, PaginatedResponse } from '@/types';
import { withLogging } from '@/lib/withLogging';

// GET /api/articles - Get paginated articles
export const GET = withLogging(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const before = searchParams.get('before'); // Timestamp filter for loading previous articles
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    try {
        let sql = `SELECT * FROM public_articles WHERE status = 'published' AND source_url NOT LIKE 'https://news.google.com/%'`;
        const params: unknown[] = [];

        if (category && category !== 'all') {
            sql += ` AND category = ?`;
            params.push(category);
        }

        // Add date filter for loading previous articles
        if (before) {
            sql += ` AND COALESCE(published_at, created_at) < ?`;
            params.push(before);
        }

        sql += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT ${limit}`;

        // Only use OFFSET for page-based pagination (not timestamp-based)
        if (!before && page > 1) {
            const offset = (page - 1) * limit;
            sql += ` OFFSET ${offset}`;
        }

        const articles = await query<Article[]>(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM public_articles WHERE status = 'published' AND source_url NOT LIKE 'https://news.google.com/%'`;
        const countParams: unknown[] = [];
        if (category && category !== 'all') {
            countSql += ` AND category = ?`;
            countParams.push(category);
        }
        if (before) {
            countSql += ` AND COALESCE(published_at, created_at) < ?`;
            countParams.push(before);
        }
        const countResult = await query<[{ total: number }]>(countSql, countParams);
        const total = countResult[0]?.total || 0;

        const response: ApiResponse<PaginatedResponse<Article>> = {
            success: true,
            data: {
                items: articles,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error fetching articles:', error instanceof Error ? error.message : error);
        const response: ApiResponse<PaginatedResponse<Article>> = {
            success: true,
            data: {
                items: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
            },
        };
        return NextResponse.json(response);
    }
});

// News articles are created only by admin-configured RSS ingestion.
export const POST = withLogging(async () =>
    NextResponse.json({ success: false, error: 'News is published automatically from admin-added RSS feeds' }, { status: 405 })
);
