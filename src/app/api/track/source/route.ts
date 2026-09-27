import { NextRequest, NextResponse } from 'next/server';
import { insert, query } from '@/lib/db';
import { withLogging } from '@/lib/withLogging';
import { publisherUrl } from '@/lib/source-policy';

// POST /api/track/source - Track source click
export const POST = withLogging(async (request: NextRequest) => {
    try {
        const body = await request.json();
        const articleId = Number(body.articleId);

        if (!Number.isInteger(articleId) || articleId < 1) {
            return NextResponse.json(
                { success: false, error: 'Article ID is required', code: 400 },
                { status: 400 }
            );
        }

        const articles = await query<Array<{ source_name: string; source_url: string }>>(
            `SELECT source_name, source_url FROM articles WHERE id = ? AND status = 'published' LIMIT 1`,
            [articleId]
        );
        if (!articles[0] || !publisherUrl(articles[0].source_url)) {
            return NextResponse.json({ success: false, error: 'Publisher story unavailable' }, { status: 404 });
        }

        // Insert click record
        await insert(
            `INSERT INTO source_clicks (source_name, article_id) VALUES (?, ?)`,
            [articles[0].source_name, articleId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        // Silently fail for tracking
        console.log('Source click tracking failed:', error);
        return NextResponse.json({ success: true });
    }
});
