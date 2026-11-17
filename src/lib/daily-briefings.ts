import { query } from '@/lib/db';
import { assembleBriefing, BRIEFING_SOURCE, validBriefingDate, type BriefingContent } from './briefing-content';

export type SavedBriefing = { title: string; excerpt: string; content: string; featured_image: string | null; published_at: Date; updated_at: Date; slug: string };
export const briefingSlug = (date: string) => `india-daily-briefing-${date}`;
export const dateFromBriefing = (briefing: Pick<SavedBriefing, 'slug'>) => briefing.slug.replace('india-daily-briefing-', '');

export function parseBriefing(row: SavedBriefing): BriefingContent | null {
    try {
        const value = JSON.parse(row.content) as BriefingContent;
        if (value.version !== 1 || value.date !== dateFromBriefing(row)) return null;
        return assembleBriefing(value.date, { introduction: value.introduction, stories: value.stories.map(story => ({ articleId: story.source.id, summary: story.summary })) }, value.stories.map(story => story.source));
    } catch { return null; }
}

export async function getDailyBriefing(date: string): Promise<SavedBriefing | null> {
    if (!validBriefingDate(date)) return null;
    const [row] = await query<SavedBriefing[]>(`SELECT title, excerpt, content, featured_image, published_at, updated_at, slug
        FROM articles WHERE slug = ? AND source_name = ? AND status = 'published' LIMIT 1`, [briefingSlug(date), BRIEFING_SOURCE]);
    return row && parseBriefing(row) ? row : null;
}

export async function listDailyBriefings(limit = 30, offset = 0): Promise<SavedBriefing[]> {
    const take = Math.min(1000, Math.max(1, Math.trunc(limit)));
    const skip = Math.max(0, Math.trunc(offset));
    const rows = await query<SavedBriefing[]>(`SELECT title, excerpt, content, featured_image, published_at, updated_at, slug
        FROM articles WHERE source_name = ? AND status = 'published'
        ORDER BY published_at DESC, id DESC LIMIT ${take} OFFSET ${skip}`, [BRIEFING_SOURCE]);
    return rows.filter(row => parseBriefing(row));
}
