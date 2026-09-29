import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowUpRight, Sparkles } from 'lucide-react';
import { query } from '@/lib/db';
import { NewsFallbackImage } from '@/components/articles';
import { StorySummaryButton, type StorySummary } from '@/components/story/StorySummaryButton';
import { StorySinceVisit } from '@/components/story/StorySinceVisit';
import { stripHtml } from '@/lib/utils';
import type { Metadata } from 'next';
import { AI_NEWS_ENABLED } from '@/lib/features';

export const dynamic = 'force-dynamic';

type Event = { id: number; title: string; category: string; first_seen_at: Date; last_updated_at: Date };
type Update = { id: number; change_text: string | null; created_at: Date; title: string; excerpt: string | null; featured_image: string | null; source_name: string; source_url: string; published_at: Date | null };

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    if (!AI_NEWS_ENABLED) return { title: 'Story not found', robots: { index: false } };
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id < 1) return { title: 'Story not found', robots: { index: false } };
    const [story] = await query<Array<Event & { report_count: number; image: string | null }>>(
        `SELECT e.*, COUNT(a.id) AS report_count, MAX(a.featured_image) AS image
         FROM ai_suggested_stories pick
         JOIN story_events e ON e.id = pick.story_event_id
         JOIN story_event_summaries s ON s.story_event_id = e.id
         JOIN public_articles a ON a.story_event_id = e.id
         WHERE e.id = ? AND s.source_updated_at >= e.last_updated_at
         GROUP BY e.id, e.title, e.category, e.first_seen_at, e.last_updated_at`, [id]
    );
    if (!story) return { title: 'Story not found', robots: { index: false } };
    const description = `Follow ${story.report_count} publisher report${story.report_count === 1 ? '' : 's'} on ${story.title}. Read the timeline and linked original sources.`;
    return {
        title: `${story.title} — Story Tracker`,
        description,
        alternates: { canonical: `/story/${id}` },
        openGraph: { title: story.title, description, url: `/story/${id}`, type: 'article', modifiedTime: new Date(story.last_updated_at).toISOString(), images: story.image ? [story.image] : [] },
        twitter: { card: 'summary_large_image', title: story.title, description, images: story.image ? [story.image] : [] },
    };
}

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
    if (!AI_NEWS_ENABLED) notFound();
    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id < 1) notFound();
    const [event] = await query<Event[]>(
        'SELECT e.* FROM story_events e JOIN ai_suggested_stories pick ON pick.story_event_id = e.id JOIN public_articles chosen ON chosen.id = pick.article_id WHERE e.id = ? LIMIT 1',
        [id]
    );
    if (!event) notFound();
    const [updates, cachedSummaries] = await Promise.all([query<Update[]>(`
        SELECT u.id, u.change_text, u.created_at, a.title, a.excerpt, a.featured_image,
               a.source_name, a.source_url, a.published_at
        FROM story_event_updates u JOIN public_articles a ON a.id = u.article_id
        WHERE u.story_event_id = ?
        ORDER BY COALESCE(a.published_at, u.created_at) ASC, u.id ASC`, [id]),
        query<Array<{ summary_json: string; source_updated_at: Date }>>(
            'SELECT summary_json, source_updated_at FROM story_event_summaries WHERE story_event_id = ? LIMIT 1', [id]
        ),
    ]);
    if (!updates.length) notFound();
    const latest = updates.at(-1)!;
    const image = [...updates].reverse().find(update => update.featured_image)?.featured_image;
    const visitUpdates = updates.map(update => ({ id: update.id, created_at: new Date(update.created_at).toISOString() }));
    let initialSummary: StorySummary | null = null;
    if (cachedSummaries[0] && new Date(cachedSummaries[0].source_updated_at).getTime() >= new Date(event.last_updated_at).getTime()) {
        try {
            const saved = JSON.parse(cachedSummaries[0].summary_json) as StorySummary;
            if (saved.version === 2 && saved.summary.split(/\s+/).length <= 75 && Array.isArray(saved.summarySourceNumbers)) initialSummary = saved;
        } catch { /* A malformed cache can be regenerated from the publisher reports. */ }
    }

    return <main className="container mx-auto max-w-6xl px-4 pb-20 pt-9 md:pt-12">
        <Link href="/ai-news" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"><ArrowLeft aria-hidden="true" className="h-4 w-4" /> AI News</Link>
        <header className="mt-8 max-w-4xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-primary"><Sparkles aria-hidden="true" className="h-4 w-4" /> Story tracker · {event.category}</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-tight text-ink md:text-6xl">{event.title}</h1>
            <p className="mt-5 text-sm text-muted">{updates.length} publisher report{updates.length === 1 ? '' : 's'} · Updated {new Date(event.last_updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
            <StorySinceVisit eventId={id} updates={visitUpdates} />
        </header>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.8fr)] lg:gap-12">
            <div>
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-hairline">
                    {image ? <Image src={image} alt="" fill unoptimized priority sizes="(max-width: 1024px) 100vw, 720px" className="object-cover" /> : <NewsFallbackImage seed={id} />}
                </div>
                {latest.excerpt && <p className="mt-5 max-w-prose text-base leading-7 text-muted">{stripHtml(latest.excerpt)}</p>}
                <section className="mt-10 border-t-2 border-ink/85 pt-7" aria-labelledby="timeline-heading">
                    <h2 id="timeline-heading" className="font-display text-3xl font-bold text-ink">How the story unfolded</h2>
                    <ol className="mt-7 border-l border-hairline pl-6">
                        {updates.map((update, index) => <li key={update.id} className="relative pb-9 last:pb-0">
                            <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                            <time className="text-xs font-semibold uppercase tracking-wider text-muted">{new Date(update.published_at || update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
                            <h3 className="mt-2 font-display text-xl font-semibold leading-snug text-ink">{index === 0 ? 'First report' : update.change_text || update.title}</h3>
                            <a href={update.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-start gap-1 text-sm leading-6 text-accent underline decoration-hairline underline-offset-2 hover:decoration-accent">{update.source_name}: {update.title} <ArrowUpRight aria-hidden="true" className="mt-1 h-3.5 w-3.5 shrink-0" /></a>
                        </li>)}
                    </ol>
                </section>
            </div>
            <aside className="lg:sticky lg:top-20 lg:self-start">
                <div className="rounded-xl bg-surface p-5 shadow-[0_10px_35px_-23px_rgba(26,23,18,0.35)] outline outline-1 outline-hairline md:p-7">
                    <div className="flex items-center gap-2 text-primary"><Sparkles aria-hidden="true" className="h-5 w-5" /><h2 className="font-display text-2xl font-bold text-ink">The story in brief</h2></div>
                    <p className="mt-3 text-sm leading-6 text-muted">A short summary made from the linked publisher reports.</p>
                    <StorySummaryButton storyId={id} initialSummary={initialSummary} />
                </div>
                <p className="mt-3 text-[11px] leading-5 text-muted">AI generated text can make mistakes. Check the original reports for full context.</p>
            </aside>
        </div>
    </main>;
}
