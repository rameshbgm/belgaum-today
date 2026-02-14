import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/articles — List articles with pagination and filters
 */
export async function GET(request: NextRequest) {
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
            data: articles,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        });
    } catch (error) {
        console.error('Error fetching articles:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

/**
 * PATCH /api/admin/articles — Update article status
 * Body: { id: number, status: 'published' | 'draft' | 'archived' }
 */
export async function PATCH(request: NextRequest) {
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
}

/**
 * DELETE /api/admin/articles — Delete an article
 * Query: ?id=<number>
 */
export async function DELETE(request: NextRequest) {
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
}
