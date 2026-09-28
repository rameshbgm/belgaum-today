import { callLunaJson } from '@/lib/ai/luna';
import { query, execute, insert } from '@/lib/db';
import { fileLogger } from '@/lib/fileLogger';

type StoryArticle = { id: number; title: string; excerpt: string; category: string; source_name: string; published_at: Date | null; story_event_id: number | null };
type Candidate = { id: number; title: string; excerpt: string; category: string };

const matchSchema = {
    type: 'object', additionalProperties: false,
    properties: {
        sameEvent: { type: 'boolean' },
        supportedChange: { type: 'boolean' },
        changeText: { type: ['string', 'null'] },
    },
    required: ['sameEvent', 'supportedChange', 'changeText'],
};

function titleWords(value: string): Set<string> {
    const stop = new Set(['the', 'and', 'for', 'with', 'from', 'this', 'that', 'news', 'india', 'indian', 'after', 'over']);
    return new Set(value.toLowerCase().match(/[a-z]{4,}/g)?.filter(word => !stop.has(word)) || []);
}

function relatedTitles(a: string, b: string): boolean {
    const left = titleWords(a);
    const right = titleWords(b);
    if (!left.size || !right.size) return false;
    const shared = [...left].filter(word => right.has(word));
    return shared.length >= 2 || shared.some(word => word.length >= 9);
}

export async function runStoryTracker(): Promise<{ classified: number; clustered: number; pending: number }> {
    let clustered = 0;
    // Use item-level RSS run links so the four-cycle window includes only
    // reports actually returned by configured publisher feeds.
    const recentRunIds = `
        SELECT run_id FROM (
            SELECT run_id FROM rss_fetch_runs
            WHERE completed_at IS NOT NULL
            ORDER BY completed_at DESC LIMIT 4
        ) recent_runs
    `;
    const recentArticleIds = `
        SELECT article_id FROM rss_fetch_items
        WHERE action IN ('new', 'skipped') AND article_id IS NOT NULL AND run_id IN (${recentRunIds})
    `;
    const articles = await query<StoryArticle[]>(
        `SELECT id, title, excerpt, category, source_name, published_at, story_event_id
         FROM public_articles WHERE story_event_id IS NULL AND id IN (${recentArticleIds})
           AND COALESCE(published_at, created_at) >= NOW() - INTERVAL 7 DAY
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 60`
    );
    for (const article of articles) {
        try {
            const candidates = await query<Candidate[]>(
                 `SELECT e.id, e.title, a.excerpt, e.category FROM story_events e
                 JOIN public_articles a ON a.story_event_id = e.id
                 WHERE e.last_updated_at >= NOW() - INTERVAL 14 DAY
                 ORDER BY e.last_updated_at DESC LIMIT 100`
            );
            const related = candidates.filter(candidate => relatedTitles(article.title, candidate.title)).slice(0, 8);
            let eventId: number | null = null;
            let changeText: string | null = null;
            let createdEvent = false;
            for (const candidate of related) {
                const result = await callLunaJson<{ sameEvent: boolean; supportedChange: boolean; changeText: string | null }>(
                    'story_match',
                    'Decide whether both reports describe the same specific real-world event. If the new report explicitly adds a fact absent from the previous report, give one plain sentence supported by the excerpts. Otherwise return null changeText and supportedChange false. Do not infer consequences.',
                    { previous: candidate, incoming: article }, matchSchema, 12000,
                );
                if (result.sameEvent) {
                    eventId = candidate.id;
                    changeText = result.supportedChange && result.changeText ? result.changeText.slice(0, 320) : null;
                    break;
                }
            }
            if (!eventId) {
                eventId = await insert(
                    `INSERT INTO story_events (title, category, first_seen_at, last_updated_at) VALUES (?, ?, NOW(), NOW())`,
                    [article.title.slice(0, 255), article.category]
                );
                createdEvent = true;
            }
            const claimed = await execute('UPDATE articles SET story_event_id = ? WHERE id = ? AND story_event_id IS NULL', [eventId, article.id]);
            if (!claimed) {
                if (createdEvent) await execute('DELETE FROM story_events WHERE id = ?', [eventId]);
                continue;
            }
            await insert(
                `INSERT IGNORE INTO story_event_updates (story_event_id, article_id, change_text) VALUES (?, ?, ?)`,
                [eventId, article.id, changeText]
            );
            await execute('UPDATE story_events SET last_updated_at = NOW() WHERE id = ?', [eventId]);
            clustered++;
        } catch (error) {
            fileLogger.warn('ai', 'Story clustering deferred', { articleId: article.id, error: String(error) });
            break;
        }
    }
    return { classified: 0, clustered, pending: 0 };
}
