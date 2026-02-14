import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';

// Mock data for development
const mockArticles: Article[] = [
    {
        id: 1,
        title: 'Belgaum Celebrates Annual Cultural Festival',
        slug: 'belgaum-celebrates-annual-cultural-festival',
        excerpt: 'The historic city of Belgaum came alive this weekend with vibrant cultural performances.',
        content: 'Full content here...',
        featured_image: null,
        category: 'belgaum',
        source_name: 'Belgaum Times',
        source_url: 'https://example.com/belgaum-festival',
        status: 'published',
        featured: true,
        ai_generated: false,
        ai_confidence: null,
        requires_review: false,
        view_count: 1250,
        reading_time: 3,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    },
    {
        id: 2,
        title: 'Tech Giants Announce Major Investments in Karnataka',
        slug: 'tech-giants-announce-major-investments-karnataka',
        excerpt: 'Several multinational technology companies have announced significant investments.',
        content: 'Full content here...',
        featured_image: null,
        category: 'technology',
        source_name: 'Tech India',
        source_url: 'https://example.com/tech-investment',
        status: 'published',
        featured: false,
        ai_generated: false,
        ai_confidence: null,
        requires_review: false,
        view_count: 890,
        reading_time: 4,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    },
];

// GET /api/search - Full-text search
export async function GET(request: NextRequest) {
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
                // Relevance is handled by full-text search ranking
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
        console.log('Database not available, using mock search');

        // Mock search fallback
        let filtered = mockArticles;

        if (q) {
            const searchLower = q.toLowerCase();
            filtered = filtered.filter(a =>
                a.title.toLowerCase().includes(searchLower) ||
                a.excerpt?.toLowerCase().includes(searchLower)
            );
        }

        if (category) {
            filtered = filtered.filter(a => a.category === category);
        }

        return NextResponse.json({
            success: true,
            data: filtered,
        });
    }
}
