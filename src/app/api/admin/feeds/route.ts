import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { parseRssFeed } from '@/lib/rss';
import { FEED_CATEGORIES } from '@/types';
import { normalizePublisherDomain } from '@/lib/source-policy';

const VALID_CATEGORIES = FEED_CATEGORIES;

function derivePublisherDomain(items: Array<{ link: string }>, feedUrl: string): string | null {
    for (const value of [...items.map(item => item.link), feedUrl]) {
        try {
            const domain = normalizePublisherDomain(new URL(value).hostname);
            if (domain) return domain;
        } catch { /* Try the next article URL. */ }
    }
    return null;
}

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
            last_attempted_at: string | null;
            last_successful_at: string | null;
            last_status: string | null;
            last_error: string | null;
            last_items_fetched: number | null;
            new_articles_24h: number;
            error_runs_24h: number;
            empty_runs_24h: number;
        }>>(
            `SELECT f.*,
                    (SELECT COUNT(*) FROM articles a WHERE a.feed_id = f.id) AS article_count,
                    latest.started_at AS last_attempted_at,
                    (SELECT MAX(s.started_at) FROM rss_fetch_logs s
                     WHERE s.feed_id = f.id AND s.status IN ('success', 'partial') AND s.items_fetched > 0) AS last_successful_at,
                    latest.status AS last_status,
                    latest.error_details AS last_error,
                    latest.items_fetched AS last_items_fetched,
                    COALESCE(recent.new_articles_24h, 0) AS new_articles_24h,
                    COALESCE(recent.error_runs_24h, 0) AS error_runs_24h,
                    COALESCE(recent.empty_runs_24h, 0) AS empty_runs_24h
             FROM rss_feed_config f
             LEFT JOIN rss_fetch_logs latest ON latest.id = (
                 SELECT l.id FROM rss_fetch_logs l
                 WHERE l.feed_id = f.id ORDER BY l.started_at DESC, l.id DESC LIMIT 1
             )
             LEFT JOIN (
                 SELECT feed_id, SUM(new_articles) AS new_articles_24h,
                        SUM(status = 'error' AND (errors_count > 0 OR error_details IS NOT NULL)) AS error_runs_24h,
                        SUM(items_fetched = 0 AND (status = 'success' OR
                            (status = 'error' AND errors_count = 0 AND error_details IS NULL))) AS empty_runs_24h
                 FROM rss_fetch_logs
                 WHERE started_at >= NOW() - INTERVAL 24 HOUR
                 GROUP BY feed_id
             ) recent ON recent.feed_id = f.id
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
                { success: false, error: 'feedId and a feed state are required' },
                { status: 400 }
            );
        }
        const [feed] = await query<Array<{ id: number }>>('SELECT id FROM rss_feed_config WHERE id = ?', [feedId]);
        if (!feed) return NextResponse.json({ success: false, error: 'Feed not found' }, { status: 404 });
        await execute('UPDATE rss_feed_config SET is_active = ? WHERE id = ?', [is_active, feedId]);
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
        const { name, publisher_name, feed_url, category, is_active = true, fetch_interval_minutes = 120 } = body;

        // Validation
        if (!name || !publisher_name || !feed_url || !category) {
            return NextResponse.json(
                { success: false, error: 'name, publisher name, feed URL, and category are required' },
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
        if (!Number.isInteger(fetch_interval_minutes) || fetch_interval_minutes < 1 || fetch_interval_minutes > 1440) {
            return NextResponse.json({ success: false, error: 'Fetch interval must be 1 to 1440 minutes' }, { status: 400 });
        }

        // Validate that the URL is a reachable RSS feed with at least one item
        let feedItems: Awaited<ReturnType<typeof parseRssFeed>>;
        try {
            feedItems = await parseRssFeed(feed_url);
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
        const domain = derivePublisherDomain(feedItems, feed_url);
        if (!domain) return NextResponse.json({ success: false, error: 'Could not determine publisher attribution from this feed' }, { status: 422 });

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
            `INSERT INTO rss_feed_config (name, publisher_name, feed_url, publisher_domain, category, is_active, fetch_interval_minutes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, publisher_name, feed_url, domain, category.toLowerCase(), is_active, fetch_interval_minutes]
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
        const { id, name, publisher_name, feed_url, category, is_active, fetch_interval_minutes = 120 } = body;

        // Validation
        if (!id || !name || !publisher_name || !feed_url || !category) {
            return NextResponse.json(
                { success: false, error: 'id, name, publisher name, feed URL, and category are required' },
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
        if (!Number.isInteger(fetch_interval_minutes) || fetch_interval_minutes < 1 || fetch_interval_minutes > 1440) {
            return NextResponse.json({ success: false, error: 'Fetch interval must be 1 to 1440 minutes' }, { status: 400 });
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
        const feedItems = await parseRssFeed(feed_url);
        if (feedItems.length === 0) return NextResponse.json({ success: false, error: 'Feed has no valid entries' }, { status: 422 });
        const domain = derivePublisherDomain(feedItems, feed_url);
        if (!domain) return NextResponse.json({ success: false, error: 'Could not determine publisher attribution from this feed' }, { status: 422 });
        await execute(
            `UPDATE rss_feed_config
             SET name = ?, publisher_name = ?, feed_url = ?, publisher_domain = ?, category = ?, is_active = ?, fetch_interval_minutes = ?
             WHERE id = ?`,
            [name, publisher_name, feed_url, domain, category.toLowerCase(), is_active ?? true, fetch_interval_minutes, id]
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
