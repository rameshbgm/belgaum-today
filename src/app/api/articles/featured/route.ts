import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';

// GET /api/articles/featured - Get featured articles
export async function GET() {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published' AND featured = true ORDER BY published_at DESC LIMIT 5`
        );

        return NextResponse.json({
            success: true,
            data: articles,
        });
    } catch (error) {
        console.error('Error fetching featured articles:', error);
        return NextResponse.json({
            success: true,
            data: [],
        });
    }
}
