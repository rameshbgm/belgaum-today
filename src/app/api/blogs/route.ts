import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * GET /api/blogs — Public listing of admin-written blog posts
 * Query params: ?category=&page=&limit=&featured=
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.min(50, Number(searchParams.get('limit')) || 12);
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');
        const offset = (page - 1) * limit;

        const params: (string | number)[] = [];
        let whereClause = "WHERE status = 'published' AND source_name = 'Belgaum Today'";

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        if (featured === 'true') {
            whereClause += ' AND featured = TRUE';
        }

        const countResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM articles ${whereClause}`,
            params
        );
        const total = countResult[0]?.total ?? 0;

        const blogs = await query<Array<{
            id: number;
            title: string;
            slug: string;
            excerpt: string;
            featured_image: string | null;
            category: string;
            reading_time: number;
            view_count: number;
            featured: boolean;
            published_at: string;
        }>>(
            `SELECT id, title, slug, excerpt, featured_image, category, reading_time, view_count, featured, published_at
             FROM articles ${whereClause}
             ORDER BY featured DESC, published_at DESC
             LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({
            success: true,
            data: {
                items: blogs,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching blogs:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
