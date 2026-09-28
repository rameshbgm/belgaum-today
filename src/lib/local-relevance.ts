import type { RssItem } from '@/lib/rss';
import { callLunaJson } from '@/lib/ai/luna';

const CERTAIN_LOCAL = /\b(belagavi|belgaum|belgaon)\b/i;

const classificationSchema = {
    type: 'object', additionalProperties: false,
    properties: {
        india: { type: 'boolean' },
        local: { type: 'boolean' },
        certain: { type: 'boolean' },
    },
    required: ['india', 'local', 'certain'],
};

/** One classification covers country focus and Belagavi district relevance. */
export async function classifyIndiaStory(item: Pick<RssItem, 'title' | 'description'>): Promise<{ india: boolean; local: boolean; certain: boolean }> {
    return callLunaJson(
        'india_relevance',
        'Classify whether the story is substantially about India or has an explicit India connection. India sport teams, Indian people and Indian policy abroad count. A foreign-only event does not. Classify local true only when substantially about Belagavi city or district, Karnataka. Set certain false when title and excerpt do not establish the scope.',
        { title: item.title, excerpt: item.description.slice(0, 700) },
        classificationSchema,
        12000,
    );
}

/** Classify a bounded feed batch in one model call; missing rows stay pending. */
export async function classifyIndiaStories(items: Array<Pick<RssItem, 'title' | 'description'>>): Promise<Array<{ india: boolean; local: boolean; certain: boolean }>> {
    if (items.length === 0) return [];
    const batchSchema = {
        type: 'object', additionalProperties: false,
        properties: {
            results: { type: 'array', items: {
                type: 'object', additionalProperties: false,
                properties: { index: { type: 'integer' }, india: { type: 'boolean' }, local: { type: 'boolean' }, certain: { type: 'boolean' } },
                required: ['index', 'india', 'local', 'certain'],
            } },
        },
        required: ['results'],
    };
    const result = await callLunaJson<{ results: Array<{ index: number; india: boolean; local: boolean; certain: boolean }> }>(
        'india_relevance_batch',
        'For every supplied index, classify whether its news story is substantially about India or has an explicit India connection. Indian sport teams, Indian people and Indian policy abroad count. Foreign-only events do not. Set local true only when substantially about Belagavi city or district, Karnataka. Set certain false when title and excerpt do not establish scope. Return each index exactly once.',
        items.map((item, index) => ({ index, title: item.title, excerpt: item.description.slice(0, 350) })),
        batchSchema,
        30000,
    );
    const byIndex = new Map(result.results.filter(row => Number.isInteger(row.index) && row.index >= 0 && row.index < items.length).map(row => [row.index, row]));
    return items.map((_, index) => byIndex.get(index) || { india: false, local: false, certain: false });
}

/** Retained for existing callers; uncertain stories stay out of local coverage. */
export async function isBelagaviStory(item: Pick<RssItem, 'title' | 'description'>, _localFeed: boolean): Promise<boolean> {
    void _localFeed;
    if (CERTAIN_LOCAL.test(item.title)) return true;
    try {
        const result = await classifyIndiaStory(item);
        return result.certain && result.local;
    } catch {
        return false;
    }
}
