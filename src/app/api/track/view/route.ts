import { NextRequest, NextResponse } from 'next/server';
import { insert, execute } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';
import { getCurrentUser } from '@/lib/auth';

// POST /api/track/view - Track article view
export const POST = withLogging(async (request: NextRequest) => {
    try {
        // Editorial visits should not influence reader trends or article counts.
        const user = await getCurrentUser();
        if (user?.role === 'admin' || user?.role === 'editor') {
            return NextResponse.json({ success: true, counted: false });
        }
        const body = await request.json();
        const { articleId, category, pageView } = body;

        const userAgent = request.headers.get('user-agent') || null;
        const referrer = request.headers.get('referer') || null;
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null;

        if (articleId) {
            // Track individual article view
            await insert(
                `INSERT INTO article_views (article_id, user_agent, referrer, ip_address) VALUES (?, ?, ?, ?)`,
                [articleId, userAgent, referrer, ip]
            );
            // Also increment the denormalized view_count
            await execute(
                `UPDATE articles SET view_count = view_count + 1 WHERE id = ?`,
                [articleId]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        // Silently fail for tracking
        console.log('View tracking failed:', error);
        return NextResponse.json({ success: true });
    }
});
