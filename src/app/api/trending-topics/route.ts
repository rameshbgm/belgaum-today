import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 300; // Cache for 5 minutes

/**
 * GET /api/trending-topics — Returns the most mentioned keywords from recent articles.
 * Derives trending topics from articles published in the last 7 days by extracting
 * common title/excerpt keywords, grouping, and counting occurrences.
 */
export async function GET() {
    try {
        // Strategy 1: Get trending from tags table (if tags exist and are populated)
        const tagTopics = await query<Array<{ name: string; count: number }>>(`
            SELECT t.name, COUNT(at.article_id) as count
            FROM tags t
            JOIN article_tags at ON t.id = at.tag_id
            JOIN articles a ON at.article_id = a.id
            WHERE a.status = 'published'
              AND a.published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY t.id, t.name
            ORDER BY count DESC
            LIMIT 10
        `);

        if (tagTopics.length >= 3) {
            return NextResponse.json({
                success: true,
                data: tagTopics.map(t => ({ name: t.name, count: Number(t.count) })),
            });
        }

        // Strategy 2: Get most covered source names as proxies for trending topics
        const sourceTopics = await query<Array<{ name: string; count: number }>>(`
            SELECT source_name as name, COUNT(*) as count
            FROM articles
            WHERE status = 'published'
              AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY source_name
            ORDER BY count DESC
            LIMIT 5
        `);

        if (sourceTopics.length >= 1) {
            // Also get most active categories as topics
            const categoryTopics = await query<Array<{ name: string; count: number }>>(`
                SELECT category as name, COUNT(*) as count
                FROM articles
                WHERE status = 'published'
                  AND published_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                GROUP BY category
                ORDER BY count DESC
                LIMIT 5
            `);

            // Combine and capitalize category names
            const categoryFormatted = categoryTopics.map(c => ({
                name: c.name.charAt(0).toUpperCase() + c.name.slice(1) + ' News',
                count: Number(c.count),
            }));

            // Interleave categories and sources for variety
            const combined: Array<{ name: string; count: number }> = [];
            const maxLen = Math.max(categoryFormatted.length, sourceTopics.length);
            for (let i = 0; i < maxLen && combined.length < 8; i++) {
                if (i < categoryFormatted.length) combined.push(categoryFormatted[i]);
                if (i < sourceTopics.length) combined.push({ name: sourceTopics[i].name, count: Number(sourceTopics[i].count) });
            }

            return NextResponse.json({
                success: true,
                data: combined.slice(0, 8),
            });
        }

        // Strategy 3: No recent articles - return empty
        return NextResponse.json({ success: true, data: [] });
    } catch (error) {
        console.error('Trending topics error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ success: true, data: [] });
    }
}
