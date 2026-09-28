import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { Article, FEED_CATEGORIES } from '@/types';
import { publisherDomainUrl, assertSourcePolicyConfigured, hasNonEnglishScript, isBlockedSource } from '@/lib/source-policy';
import { getCurrentUser } from '@/lib/auth';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { withLogging } from '@/lib/withLogging';

// GET /api/articles/[id] - Get single article
export const GET = withLogging(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await context?.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Missing article ID', code: 400 },
            { status: 400 }
        );
    }

    try {
        const articles = await query<Article[]>(
            `SELECT * FROM public_articles WHERE id = ? LIMIT 1`,
            [id]
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

// PUT /api/articles/[id] - Update article
export const PUT = withLogging(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await context?.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Missing article ID', code: 400 },
            { status: 400 }
        );
    }

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
            status,
            featured,
            ai_generated,
            ai_confidence,
            requires_review,
        } = body;

        assertSourcePolicyConfigured();
        const existingArticle = await query<Array<{ title: string; category: string; source_name: string; source_url: string; publisher_domain: string | null }>>(
            'SELECT title, category, source_name, source_url, publisher_domain FROM articles WHERE id = ? LIMIT 1', [id]
        );
        if (!existingArticle[0]) return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        if (source_url !== undefined && existingArticle[0].publisher_domain && !publisherDomainUrl(source_url, existingArticle[0].publisher_domain)) {
            return NextResponse.json({ success: false, error: 'Source URL must remain on the publisher domain' }, { status: 422 });
        }
        const nextTitle = title ?? existingArticle[0].title;
        const nextCategory = category ?? existingArticle[0].category;
        if (!FEED_CATEGORIES.includes(nextCategory) || hasNonEnglishScript(nextTitle) ||
            isBlockedSource(source_url ?? existingArticle[0].source_url, `${source_name ?? existingArticle[0].source_name} ${nextTitle}`)) {
            return NextResponse.json({ success: false, error: 'This category, language, or publisher is not eligible for publication' }, { status: 422 });
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: unknown[] = [];

        if (title !== undefined) {
            updates.push('title = ?');
            values.push(title);
            updates.push('slug = ?');
            values.push(generateSlug(title));
        }
        if (excerpt !== undefined) {
            updates.push('excerpt = ?');
            values.push(excerpt);
        }
        if (content !== undefined) {
            updates.push('content = ?');
            values.push(content);
            updates.push('reading_time = ?');
            values.push(calculateReadingTime(content));
        }
        if (featured_image !== undefined) {
            updates.push('featured_image = ?');
            values.push(featured_image);
        }
        if (category !== undefined) {
            updates.push('category = ?');
            values.push(category);
        }
        if (source_name !== undefined) {
            updates.push('source_name = ?');
            values.push(source_name);
        }
        if (source_url !== undefined) {
            updates.push('source_url = ?');
            values.push(source_url);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);

            // Set published_at when publishing
            if (status === 'published') {
                updates.push('published_at = COALESCE(published_at, NOW())');
            } else if (status === 'draft') {
                updates.push('published_at = NULL');
            }
        }
        if (featured !== undefined) {
            updates.push('featured = ?');
            values.push(featured);
        }
        if (ai_generated !== undefined) {
            updates.push('ai_generated = ?');
            values.push(ai_generated);
        }
        if (ai_confidence !== undefined) {
            updates.push('ai_confidence = ?');
            values.push(ai_confidence);
        }
        if (requires_review !== undefined) {
            updates.push('requires_review = ?');
            values.push(requires_review);
        }

        if (updates.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No fields to update', code: 400 },
                { status: 400 }
            );
        }

        values.push(id);
        const affectedRows = await execute(
            `UPDATE articles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
            values
        );

        if (affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Article not found', code: 404 },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { id: parseInt(id) },
        });
    } catch (error) {
        console.error('Error updating article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to update article', code: 500 },
            { status: 500 }
        );
    }
});

// DELETE /api/articles/[id] - Delete article
export const DELETE = withLogging(async (request: NextRequest, context: { params: Promise<{ id: string }> }) => {
    const resolvedParams = await context?.params;
    const id = resolvedParams?.id;

    if (!id) {
        return NextResponse.json(
            { success: false, error: 'Missing article ID', code: 400 },
            { status: 400 }
        );
    }

    try {
        const user = await getCurrentUser();

        if (!user || user.role !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', code: 401 },
                { status: 401 }
            );
        }

        const affectedRows = await execute(
            `DELETE FROM articles WHERE id = ?`,
            [id]
        );

        if (affectedRows === 0) {
            return NextResponse.json(
                { success: false, error: 'Article not found', code: 404 },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: { deleted: true },
        });
    } catch (error) {
        console.error('Error deleting article:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete article', code: 500 },
            { status: 500 }
        );
    }
});
