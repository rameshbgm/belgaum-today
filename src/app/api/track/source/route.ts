import { NextRequest, NextResponse } from 'next/server';
import { insert } from '@/lib/db';

// POST /api/track/source - Track source click
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { sourceName, articleId } = body;

        if (!sourceName) {
            return NextResponse.json(
                { success: false, error: 'Source name is required', code: 400 },
                { status: 400 }
            );
        }

        // Insert click record
        await insert(
            `INSERT INTO source_clicks (source_name, article_id) VALUES (?, ?)`,
            [sourceName, articleId || null]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        // Silently fail for tracking
        console.log('Source click tracking failed:', error);
        return NextResponse.json({ success: true });
    }
}
