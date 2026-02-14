import { NextRequest, NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { Article, ApiResponse, PaginatedResponse } from '@/types';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { getCurrentUser } from '@/lib/auth';

// Mock articles for development
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

// GET /api/articles - Get paginated articles
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    try {
        let sql = `SELECT * FROM articles WHERE status = 'published'`;
        const params: unknown[] = [];

        if (category) {
            sql += ` AND category = ?`;
            params.push(category);
        }

        sql += ` ORDER BY published_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        const articles = await query<Article[]>(sql, params);

        // Get total count
        let countSql = `SELECT COUNT(*) as total FROM articles WHERE status = 'published'`;
        const countParams: unknown[] = [];
        if (category) {
            countSql += ` AND category = ?`;
            countParams.push(category);
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
        console.log('Database not available, returning mock data');
        // Filter mock data by category if specified
        let filtered = mockArticles;
        if (category) {
            filtered = mockArticles.filter(a => a.category === category);
        }

        const response: ApiResponse<PaginatedResponse<Article>> = {
            success: true,
            data: {
                items: filtered.slice(offset, offset + limit),
                total: filtered.length,
                page,
                limit,
                totalPages: Math.ceil(filtered.length / limit),
            },
        };

        return NextResponse.json(response);
    }
}

// POST /api/articles - Create new article (admin only)
export async function POST(request: NextRequest) {
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
}
