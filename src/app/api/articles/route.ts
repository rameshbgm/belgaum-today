import { NextRequest, NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { Article, ApiResponse, PaginatedResponse } from '@/types';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

// GET /api/articles - Get paginated articles
export const GET = withLogging(async (request: NextRequest) => {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const before = searchParams.get('before'); // Date filter for loading previous days
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    try {
        let sql = `SELECT * FROM articles WHERE status = 'published'`;
        const params: unknown[] = [];

        if (category && category !== 'all') {
            sql += ` AND category = ?`;
            params.push(category);
        }

        // Add date filter for loading previous days
        if (before) {
            sql += ` AND DATE(COALESCE(published_at, created_at)) < ?`;
            params.push(before);
        }

        sql += ` ORDER BY COALESCE(published_at, created_at) DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const articles = await query<Article[]>(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM articles WHERE status = 'published'`;
        const countParams: unknown[] = [];
        if (category && category !== 'all') {
            countSql += ` AND category = ?`;
            countParams.push(category);
        }
        if (before) {
            countSql += ` AND DATE(COALESCE(published_at, created_at)) < ?`;
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

// POST /api/articles - Create new article (admin only)
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();

        if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', code: 401 },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            title,
            excerpt,
            content,
            featured_image,
            category,
            source_name,
            source_url,
            status = 'draft',
            featured = false,
            ai_generated = false,
            ai_confidence,
            requires_review = false,
            tags = [],
        } = body;

        // Validation
        if (!title || !content || !category || !source_name || !source_url) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields', code: 400 },
                { status: 400 }
            );
        }

        const slug = generateSlug(title);
        const reading_time = calculateReadingTime(content);
        const published_at = status === 'published' ? new Date() : null;

        const articleId = await insert(
            `INSERT INTO articles (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, ai_confidence, requires_review, reading_time, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, ai_confidence, requires_review, reading_time, published_at]
        );

        return NextResponse.json({
            success: true,
            data: { id: articleId, slug },
        });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to create article', code: 500 },
            { status: 500 }
        );
    }
});
