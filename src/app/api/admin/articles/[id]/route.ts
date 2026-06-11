import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { generateSlug, calculateReadingTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/articles/[id] — Update an article
 */
export const PUT = withLogging(async (request: NextRequest, context) => {
    const resolvedParams = await context?.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ success: false, error: 'Missing article ID' }, { status: 400 });
    }

    try {
        const user = await getCurrentUser();
        if (!user || (user.role !== 'admin' && user.role !== 'editor')) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            title, excerpt, content, featured_image, category,
            source_name, source_url, status, featured, tags = [],
        } = body;

        const updates: string[] = [];
        const values: unknown[] = [];

        if (title !== undefined) {
            updates.push('title = ?', 'slug = ?');
            values.push(title, generateSlug(title));
        }
        if (excerpt !== undefined) { updates.push('excerpt = ?'); values.push(excerpt); }
        if (content !== undefined) {
            updates.push('content = ?', 'reading_time = ?');
            values.push(content, calculateReadingTime(content));
        }
        if (featured_image !== undefined) { updates.push('featured_image = ?'); values.push(featured_image); }
        if (category !== undefined) { updates.push('category = ?'); values.push(category); }
        if (source_name !== undefined) { updates.push('source_name = ?'); values.push(source_name); }
        if (source_url !== undefined) { updates.push('source_url = ?'); values.push(source_url); }
        if (featured !== undefined) { updates.push('featured = ?'); values.push(featured ? 1 : 0); }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
            if (status === 'published') {
                updates.push('published_at = COALESCE(published_at, NOW())');
            } else if (status === 'draft') {
                updates.push('published_at = NULL');
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const affected = await execute(
            `UPDATE articles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        if (affected === 0) {
            return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        }

        // Sync tags if provided
        if (tags.length >= 0) {
            await execute('DELETE FROM article_tags WHERE article_id = ?', [id]);
            for (const tagName of tags) {
                const trimmed = typeof tagName === 'string' ? tagName.trim() : '';
                if (!trimmed) continue;
                const tagSlug = generateSlug(trimmed);
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

        return NextResponse.json({ success: true, data: { id: parseInt(id) } });
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});

/**
 * DELETE /api/admin/articles/[id] — Delete an article
 */
export const DELETE = withLogging(async (request: NextRequest, context) => {
    const resolvedParams = await context?.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json({ success: false, error: 'Missing article ID' }, { status: 400 });
    }

    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const affected = await execute('DELETE FROM articles WHERE id = ?', [id]);
        if (affected === 0) {
            return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: { deleted: true } });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
});
