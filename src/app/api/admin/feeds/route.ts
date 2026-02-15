import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

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