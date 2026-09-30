import { NextRequest, NextResponse } from 'next/server';
import { transaction } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';

// POST /api/track/view - Track article view
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const articleId = Number(body.articleId);
        if (!Number.isSafeInteger(articleId) || articleId <= 0) {
            return NextResponse.json({ success: false, error: 'A valid article is required' }, { status: 400 });
        }

        const userAgent = request.headers.get('user-agent')?.slice(0, 2000) || null;
        const referrer = request.headers.get('referer')?.slice(0, 500) || null;
        // Proxies commonly send a comma-separated chain. Persist only the
        // originating address so it always fits the VARCHAR(45) column.
        const forwardedFor = request.headers.get('x-forwarded-for');
        const ip = (forwardedFor?.split(',')[0] || request.headers.get('x-real-ip') || '').trim().slice(0, 45) || null;

        const viewCount = await transaction(async connection => {
            const [updated] = await connection.execute(
                `UPDATE articles SET view_count = COALESCE(view_count, 0) + 1
                 WHERE id = ? AND status = 'published'`,
                [articleId],
            );
            if (!('affectedRows' in updated) || updated.affectedRows === 0) return null;
            await connection.execute(
                `INSERT INTO article_views (article_id, user_agent, referrer, ip_address) VALUES (?, ?, ?, ?)`,
                [articleId, userAgent, referrer, ip],
            );
            const [rows] = await connection.execute(
                'SELECT view_count FROM articles WHERE id = ? LIMIT 1',
                [articleId],
            );
            const row = Array.isArray(rows) ? rows[0] as { view_count?: number } | undefined : undefined;
            return Number(row?.view_count ?? 0);
        });

        if (viewCount === null) {
            return NextResponse.json({ success: false, error: 'Article not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, counted: true, viewCount });
    } catch (error) {
        console.error('View tracking failed:', error);
        return NextResponse.json({ success: false, error: 'Could not record view' }, { status: 500 });
    }
});
