import { query, insert } from '@/lib/db';
import { callLunaJson } from '@/lib/ai/luna';
import { assembleBriefing, briefingLabel, BRIEFING_SOURCE, indiaDate, type BriefingDraft, type BriefingSource } from '@/lib/briefing-content';
import { briefingSlug } from '@/lib/daily-briefings';
import { distinctStories } from '@/lib/story-clusters';
import { stripHtml, calculateReadingTime } from '@/lib/utils';
import { SITE_URL } from '@/lib/site-url';
import { fileLogger } from '@/lib/fileLogger';

const schema = {
    type: 'object', additionalProperties: false,
    properties: {
        introduction: { type: 'string' },
        stories: { type: 'array', minItems: 5, maxItems: 5, items: {
            type: 'object', additionalProperties: false,
            properties: { articleId: { type: 'integer' }, summary: { type: 'string' } },
            required: ['articleId', 'summary'],
        } },
    },
    required: ['introduction', 'stories'],
};

let publishing = false;

/** Publish one immutable snapshot per India calendar day, using already ranked reports. */
export async function publishDailyBriefing(now = new Date()): Promise<boolean> {
    if (publishing) return false;
    publishing = true;
    try {
        const date = indiaDate(now);
        const slug = briefingSlug(date);
        const existing = await query<Array<{ id: number }>>('SELECT id FROM articles WHERE slug = ? LIMIT 1', [slug]);
        if (existing.length) return false;
        const ranked = await query<BriefingSource[]>(`SELECT a.id, a.title, a.excerpt, a.featured_image, a.source_name, a.source_url, a.published_at
            FROM trending_articles t JOIN public_articles a ON a.id = t.article_id
            WHERE t.category = 'india' AND a.category = 'india' AND a.status = 'published'
              AND t.expires_at > NOW() AND a.source_url NOT LIKE 'https://news.google.com/%'
              AND COALESCE(a.published_at, a.created_at) >= NOW() - INTERVAL 2 DAY
            ORDER BY t.rank_position LIMIT 20`);
        const sources = distinctStories(ranked).slice(0, 5).map(source => ({ ...source, excerpt: stripHtml(source.excerpt || '').slice(0, 1000) }));
        if (sources.length !== 5) return false;
        const draft = await callLunaJson<BriefingDraft>('daily_india_briefing',
            `Write a concise daily India news briefing from the five supplied publisher reports, in the supplied order.
            Return a 35–60 word introduction connecting only themes actually present, and a 35–65 word original summary for each report.
            Use only supplied titles and excerpts. Attribute assertions and allegations to their source; preserve uncertainty.
            Do not copy sentences, invent context, add advice, infer consequences, or claim human review or original reporting.
            If an excerpt is limited, write a shorter factual summary rather than padding it. Return the original articleId for every report exactly once.`,
            { date, reports: sources.map(source => ({ articleId: source.id, title: source.title, excerpt: source.excerpt, publisher: source.source_name, publishedAt: source.published_at })) }, schema);
        const content = assembleBriefing(date, draft, sources);
        const title = `India daily briefing: ${briefingLabel(date)}`;
        const readingTime = calculateReadingTime([content.introduction, ...content.stories.map(story => story.summary)].join(' '));
        try {
            // Reuse the existing editorial article storage, without attributing this
            // original compilation to a publisher feed or exposing it as an RSS mirror.
            await insert(`INSERT INTO articles
                (title, slug, excerpt, content, featured_image, category, source_name, source_url, status, ai_generated, reading_time, published_at)
                VALUES (?, ?, ?, ?, ?, 'india', ?, ?, 'published', true, ?, ?)`,
                [title, slug, content.introduction, JSON.stringify(content), sources[0].featured_image, BRIEFING_SOURCE, `${SITE_URL}/briefing/${date}`, readingTime, now]);
        } catch (error) {
            if ((error as { code?: string }).code === 'ER_DUP_ENTRY') return false;
            throw error;
        }
        fileLogger.info('ai', 'Daily India briefing published', { date, stories: sources.length });
        return true;
    } finally { publishing = false; }
}
