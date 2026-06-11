import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { parseRssFeed } from '@/lib/rss';

const VALID_CATEGORIES = [
    'india', 'business', 'technology', 'sports', 'entertainment', 'belgaum',
    'travel', 'science', 'health', 'lifestyle', 'food', 'education', 'environment', 'culture', 'finance',
];

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/feeds — List all RSS feed configs with article counts
 */
export const GET = withLogging(async () => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const feeds = await query<Array<{
            id: number;
            name: string;
            feed_url: string;
            category: string;
            is_active: boolean;
            last_fetched_at: string | null;
            article_count: number;
        }>>(
            `SELECT f.*, 
                    (SELECT COUNT(*) FROM articles a WHERE a.source_name LIKE CONCAT('%', SUBSTRING_INDEX(f.name, ' - ', 1), '%') AND a.category = f.category) as article_count
             FROM rss_feed_config f
             ORDER BY f.category, f.name`
        );

        return NextResponse.json({ success: true, data: feeds });
    } catch (error) {
        console.error('Error fetching feeds:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});
/**
 * PATCH /api/admin/feeds — Toggle feed active/inactive
 * Body: { feedId: number, is_active: boolean }
 */
export const PATCH = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { feedId, is_active } = body;

        if (!feedId || typeof is_active !== 'boolean') {
            return NextResponse.json(
                { success: false, error: 'feedId and is_active are required' },
                { status: 400 }
            );
        }

        await execute(
            'UPDATE rss_feed_config SET is_active = ? WHERE id = ?',
            [is_active, feedId]
        );

        return NextResponse.json({ success: true, message: `Feed ${is_active ? 'activated' : 'deactivated'}` });
    } catch (error) {
        console.error('Error updating feed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * POST /api/admin/feeds — Create new RSS feed
 * Body: { name: string, feed_url: string, category: string, is_active?: boolean }
 */
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { name, feed_url, category, is_active = true } = body;

        // Validation
        if (!name || !feed_url || !category) {
            return NextResponse.json(
                { success: false, error: 'name, feed_url, and category are required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(feed_url);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid feed_url format' },
                { status: 400 }
            );
        }

        // Validate category
        if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
            return NextResponse.json(
                { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
                { status: 400 }
            );
        }

        // Validate that the URL is a reachable RSS feed with at least one item
        try {
            const feedItems = await parseRssFeed(feed_url);
            if (feedItems.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'Feed URL does not return any valid RSS items. Please check the URL and try again.' },
                    { status: 422 }
                );
            }
        } catch (feedError) {
            console.error('Feed validation error:', feedError);
            return NextResponse.json(
                { success: false, error: 'Could not fetch or parse the feed URL. Make sure it is a valid RSS/Atom feed.' },
                { status: 422 }
            );
        }

        // Check if feed URL already exists
        const existing = await query<Array<{ id: number }>>(
            'SELECT id FROM rss_feed_config WHERE feed_url = ?',
            [feed_url]
        );

        if (existing.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Feed URL already exists' },
                { status: 409 }
            );
        }

        // Insert new feed
        await execute(
            `INSERT INTO rss_feed_config (name, feed_url, category, is_active)
             VALUES (?, ?, ?, ?)`,
            [name, feed_url, category.toLowerCase(), is_active]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Feed created successfully',
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating feed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * PUT /api/admin/feeds — Update RSS feed
 * Body: { id: number, name: string, feed_url: string, category: string, fetch_interval_minutes?: number, is_active?: boolean }
 */
export const PUT = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, name, feed_url, category, is_active } = body;

        // Validation
        if (!id || !name || !feed_url || !category) {
            return NextResponse.json(
                { success: false, error: 'id, name, feed_url, and category are required' },
                { status: 400 }
            );
        }

        // Validate URL format
        try {
            new URL(feed_url);
        } catch {
            return NextResponse.json(
                { success: false, error: 'Invalid feed_url format' },
                { status: 400 }
            );
        }

        // Validate category
        if (!VALID_CATEGORIES.includes(category.toLowerCase())) {
            return NextResponse.json(
                { success: false, error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
                { status: 400 }
            );
        }

        // Check if feed exists
        const existing = await query<Array<{ id: number }>>(
            'SELECT id FROM rss_feed_config WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Feed not found' },
                { status: 404 }
            );
        }

        // Check if feed URL already exists for different feed
        const duplicate = await query<Array<{ id: number }>>(
            'SELECT id FROM rss_feed_config WHERE feed_url = ? AND id != ?',
            [feed_url, id]
        );

        if (duplicate.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Feed URL already exists for another feed' },
                { status: 409 }
            );
        }

        // Update feed
        await execute(
            `UPDATE rss_feed_config
             SET name = ?, feed_url = ?, category = ?, is_active = ?
             WHERE id = ?`,
            [name, feed_url, category.toLowerCase(), is_active ?? true, id]
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Feed updated successfully'
        });
    } catch (error) {
        console.error('Error updating feed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});

/**
 * DELETE /api/admin/feeds — Delete RSS feed
 * Query param: id
 */
export const DELETE = withLogging(async (request: NextRequest) => {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json(
                { success: false, error: 'Feed id is required' },
                { status: 400 }
            );
        }

        // Check if feed exists
        const existing = await query<Array<{ id: number }>>(
            'SELECT id FROM rss_feed_config WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Feed not found' },
                { status: 404 }
            );
        }

        // Delete feed
        await execute('DELETE FROM rss_feed_config WHERE id = ?', [id]);

        return NextResponse.json({ 
            success: true, 
            message: 'Feed deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting feed:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
});