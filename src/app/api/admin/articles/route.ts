import { NextRequest, NextResponse } from 'next/server';
import { query, execute, insert } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { generateSlug, calculateReadingTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/articles — List articles with pagination and filters
 */
export const GET = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const page = Math.max(1, Number(searchParams.get('page')) || 1);
        const limit = Math.min(50, Number(searchParams.get('limit')) || 20);
        const category = searchParams.get('category');
        const status = searchParams.get('status');
        const search = searchParams.get('search');
        const offset = (page - 1) * limit;

        let whereClause = 'WHERE 1=1';
        const params: (string | number)[] = [];

        if (category) {
            whereClause += ' AND category = ?';
            params.push(category);
        }
        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }
        if (search) {
            whereClause += ' AND (title LIKE ? OR source_name LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        const countResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM articles ${whereClause}`,
            params
        );
        const total = countResult[0]?.total || 0;

        const articles = await query<Array<{
            id: number; title: string; slug: string; category: string;
            source_name: string; status: string; view_count: number;
            featured: boolean; published_at: string; created_at: string;
        }>>(
            `SELECT id, title, slug, category, source_name, status, view_count, featured, published_at, created_at
             FROM articles ${whereClause} ORDER BY published_at DESC LIMIT ? OFFSET ?`,
            [...params, limit, offset]
        );

        return NextResponse.json({
            success: true,
            data: {
                items: articles,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});

/**
 * POST /api/admin/articles — Create a new article or blog post
 */
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
            is_blog = false,
            tags = [],
        } = body;

        if (!title?.trim()) {
            return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
        }
        if (!content?.trim()) {
            return NextResponse.json({ success: false, error: 'Content is required' }, { status: 400 });
        }
        if (!category) {
            return NextResponse.json({ success: false, error: 'Category is required' }, { status: 400 });
        }

        const slug = generateSlug(title);
        const readingTime = calculateReadingTime(content);
        const publishedAt = status === 'published' ? new Date() : null;
        const finalSourceName = source_name || 'Belgaum Today';
        const finalSourceUrl = source_url || `https://belgaum.today/blog/${slug}`;

        const id = await insert(
            `INSERT INTO articles
                (title, slug, excerpt, content, featured_image, category, source_name, source_url,
                 status, featured, ai_generated, requires_review, reading_time, published_at, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, FALSE, FALSE, ?, ?, NOW(), NOW())`,
            [
                title.trim(),
                slug,
                excerpt || title.substring(0, 150),
                content,
                featured_image || null,
                category,
                finalSourceName,
                finalSourceUrl,
                status,
                featured ? 1 : 0,
                readingTime,
                publishedAt,
            ]
        );

        // Insert tags if provided
        if (tags.length > 0) {
            for (const tagName of tags) {
                const trimmed = tagName.trim();
                if (!trimmed) continue;
                const tagSlug = generateSlug(trimmed);
                // Upsert tag
                await execute(
                    'INSERT INTO tags (name, slug) VALUES (?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [trimmed, tagSlug]
                );
                const tagRows = await query<[{ id: number }]>(
                    'SELECT id FROM tags WHERE slug = ? LIMIT 1',
                    [tagSlug]
                );
                if (tagRows[0]) {
                    await execute(
                        'INSERT IGNORE INTO article_tags (article_id, tag_id) VALUES (?, ?)',
                        [id, tagRows[0].id]
                    );
                }
            }
        }

        return NextResponse.json({ success: true, data: { id, slug } }, { status: 201 });
    } catch (error) {
        console.error('Error creating article:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});

/**
 * PATCH /api/admin/articles — Update article status
 * Body: { id: number, status: 'published' | 'draft' | 'archived' }
 */
export const PATCH = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!id || !['published', 'draft', 'archived'].includes(status)) {
            return NextResponse.json(
                { success: false, error: 'Valid id and status required' },
                { status: 400 }
            );
        }

        await execute(
            'UPDATE articles SET status = ? WHERE id = ?',
            [status, id]
        );

        return NextResponse.json({ success: true, message: `Article ${status}` });
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});
/**
 * DELETE /api/admin/articles — Delete an article
 * Query: ?id=<number>
 */
export const DELETE = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = Number(searchParams.get('id'));

        if (!id) {
            return NextResponse.json({ success: false, error: 'Article ID required' }, { status: 400 });
        }

        await execute('DELETE FROM articles WHERE id = ?', [id]);

        return NextResponse.json({ success: true, message: 'Article deleted' });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});