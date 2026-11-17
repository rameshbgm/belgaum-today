export const BRIEFING_SOURCE = 'Belgaum Today Briefing';

export type BriefingSource = {
    id: number; title: string; source_name: string; source_url: string;
    featured_image: string | null; excerpt: string; published_at: Date | string | null;
};
export type BriefingContent = {
    version: 1;
    date: string;
    introduction: string;
    stories: Array<{ summary: string; source: BriefingSource }>;
};
export type BriefingDraft = { introduction: string; stories: Array<{ articleId: number; summary: string }> };

export function indiaDate(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function validBriefingDate(value: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(`${value}T00:00:00Z`)) &&
        new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
}

export function briefingLabel(date: string): string {
    return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(new Date(`${date}T00:00:00Z`));
}

/** Fail closed on incomplete output or invented source IDs. Keep source URLs out of model output. */
export function assembleBriefing(date: string, draft: BriefingDraft, sources: BriefingSource[]): BriefingContent {
    if (!validBriefingDate(date) || sources.length !== 5 || new Set(sources.map(s => s.id)).size !== 5 ||
        typeof draft?.introduction !== 'string' || !draft.introduction.trim() || draft.introduction.length > 1500 ||
        !Array.isArray(draft.stories) || draft.stories.length !== 5) throw new Error('Incomplete daily briefing');
    const summaries = new Map<number, string>();
    for (const item of draft.stories) {
        if (!sources.some(source => source.id === item.articleId) || summaries.has(item.articleId) ||
            typeof item.summary !== 'string' || item.summary.trim().length < 60 || item.summary.length > 1500) {
            throw new Error('Invalid daily briefing source or summary');
        }
        summaries.set(item.articleId, item.summary.trim());
    }
    for (const source of sources) {
        const url = new URL(source.source_url);
        if (!['https:', 'http:'].includes(url.protocol) || url.hostname === 'news.google.com') throw new Error('Invalid briefing source URL');
    }
    return { version: 1, date, introduction: draft.introduction.trim(), stories: sources.map(source => ({ summary: summaries.get(source.id)!, source })) };
}
