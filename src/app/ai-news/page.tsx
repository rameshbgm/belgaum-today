import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Newspaper, Sparkles } from 'lucide-react';
import { query } from '@/lib/db';
import { stripHtml, truncate } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AI_NEWS_ENABLED } from '@/lib/features';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = AI_NEWS_ENABLED ? {
    title: 'AI News & Story Tracker',
    description: 'Explore one AI-selected story per category, with publisher timelines and source-linked summaries from Belgaum Today.',
    alternates: { canonical: '/ai-news' },
    openGraph: { title: 'AI News & Story Tracker | Belgaum Today', url: '/ai-news', type: 'website' },
} : { title: 'Page not found', robots: { index: false, follow: false } };

type StoryCard = {
    id: number;
    title: string;
    category: string;
    report_count: number;
    publisher_count: number;
    image: string | null;
    publisher_excerpt: string | null;
    publishers: string | null;
};

async function getTrackedStories(): Promise<StoryCard[]> {
    return query<StoryCard[]>(`
        SELECT e.id, e.title, e.category,
               COUNT(DISTINCT a.id) AS report_count,
               COUNT(DISTINCT a.publisher_domain) AS publisher_count,
               GROUP_CONCAT(DISTINCT a.source_name ORDER BY a.source_name SEPARATOR ', ') AS publishers,
               chosen.excerpt AS publisher_excerpt,
               (SELECT p.featured_image FROM public_articles p
                WHERE p.story_event_id = e.id AND p.featured_image IS NOT NULL
                ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 1) AS image
        FROM ai_suggested_stories pick
        JOIN public_articles chosen ON chosen.id = pick.article_id
        JOIN story_events e ON e.id = pick.story_event_id AND e.category = pick.category
        JOIN story_event_summaries s ON s.story_event_id = e.id
        JOIN public_articles a ON a.story_event_id = e.id
        WHERE s.source_updated_at >= e.last_updated_at
        GROUP BY e.id, e.title, e.category, chosen.excerpt, pick.ai_score, pick.selected_at
        ORDER BY pick.ai_score DESC, pick.selected_at DESC
    `);
}

export default async function AiNewsPage() {
    if (!AI_NEWS_ENABLED) notFound();
    const stories = await getTrackedStories();
    const [lead, ...otherStories] = stories;

    return <main className="container mx-auto px-4 pb-20 pt-9 md:pt-14">
        <header className="flex flex-col gap-4 border-b-2 border-ink/85 pb-7 md:flex-row md:items-end md:justify-between md:pb-9">
            <div>
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white"><Sparkles aria-hidden="true" className="h-5 w-5" /></div>
                <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-6xl">AI News</h1>
            </div>
            <p className="max-w-sm text-sm leading-6 text-muted">One developing story selected from each news category. Open a story for its timeline and AI summary.</p>
        </header>

        {lead ? <>
            <section aria-labelledby="lead-story" className="grid gap-0 border-b border-hairline py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.85fr)] lg:py-10">
                <Link href={`/story/${lead.id}`} className="group relative block aspect-[16/10] overflow-hidden bg-hairline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent lg:aspect-[4/3]">
                    {lead.image ? <Image src={lead.image} alt="" fill unoptimized priority sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <NewsFallbackImage seed={lead.id} />}
                    <span className="absolute bottom-4 left-4 bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-primary">{lead.category}</span>
                </Link>
                <div className="flex min-w-0 flex-col justify-center border-b border-hairline py-6 lg:border-b-0 lg:pl-10 lg:pr-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Selected story · {lead.report_count} report{lead.report_count === 1 ? '' : 's'}</p>
                    <h2 id="lead-story" className="mt-4 break-words font-display text-[clamp(1.7rem,7vw,2.25rem)] font-bold leading-tight text-ink md:text-5xl"><Link href={`/story/${lead.id}`} className="hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent">{lead.title}</Link></h2>
                    {lead.publisher_excerpt && <p className="mt-5 max-w-prose text-base leading-7 text-muted">{truncate(stripHtml(lead.publisher_excerpt), 230)}</p>}
                    {lead.publishers && <p className="mt-5 text-xs leading-5 text-muted">Reported by {lead.publishers}</p>}
                    <Link href={`/story/${lead.id}`} className="mt-7 inline-flex min-h-11 w-fit items-center gap-2 border-b border-primary text-sm font-bold text-primary hover:border-primary-hover hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent">Open story and timeline <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></Link>
                </div>
            </section>

            {otherStories.length > 0 && <section aria-labelledby="more-ai-stories" className="pt-9">
                <h2 id="more-ai-stories" className="font-display text-2xl font-bold text-ink md:text-3xl">Across the news</h2>
                <div className="mt-6 grid gap-x-7 gap-y-10 sm:grid-cols-2 xl:grid-cols-3">
                    {otherStories.map(story => <Link key={story.id} href={`/story/${story.id}`} className="group block border-t border-ink/70 pt-4 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent">
                        <article>
                            <div className="relative aspect-[16/10] overflow-hidden bg-hairline">
                                {story.image ? <Image src={story.image} alt="" fill unoptimized sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <NewsFallbackImage seed={story.id} />}
                            </div>
                            <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">{story.category} <span className="px-1 text-hairline">·</span> {story.report_count} report{story.report_count === 1 ? '' : 's'}</p>
                            <h3 className="mt-2 font-display text-2xl font-bold leading-snug text-ink group-hover:text-primary">{story.title}</h3>
                            {story.publisher_excerpt && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{stripHtml(story.publisher_excerpt)}</p>}
                            {story.publishers && <p className="mt-4 line-clamp-1 text-xs text-muted">{story.publishers}</p>}
                            <span className="mt-5 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">Open story <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span>
                        </article>
                    </Link>)}
                </div>
            </section>}
        </> : <section className="flex max-w-2xl items-start gap-4 py-10">
            <Newspaper aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-accent" />
            <div><h2 className="font-display text-xl text-ink">AI picks are being prepared</h2><p className="mt-2 text-sm leading-6 text-muted">Stories appear after category analysis and a sourced summary are complete. Browse the <Link href="/" className="font-semibold text-accent underline underline-offset-2">latest news</Link> in the meantime.</p></div>
        </section>}

        <p className="mt-12 border-t border-hairline pt-3 text-[11px] leading-5 text-muted">AI generated text can make mistakes. The summary is hidden until you open a story; check its linked publisher reports for full context.</p>
    </main>;
}
