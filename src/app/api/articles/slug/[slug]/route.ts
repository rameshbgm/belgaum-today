import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { withLogging } from '@/lib/withLogging';

// GET /api/articles/slug/[slug] - Get article by slug
export const GET = withLogging(async (request: NextRequest, context) => {
    const resolvedParams = await context?.params;
    const slug = resolvedParams?.slug;

    if (!slug) {
        return NextResponse.json(
            { success: false, error: 'Missing article slug', code: 400 },
            { status: 400 }
        );
    }

    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`,
            [slug]
        );

        if (articles.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Article not found', code: 404 },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: articles[0],
        });
    } catch (error) {
        console.error('Error fetching article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch article', code: 500 },
            { status: 500 }
        );
    }
});
