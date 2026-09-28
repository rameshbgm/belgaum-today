import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Newspaper, Sparkles } from 'lucide-react';
import { query } from '@/lib/db';
import { NewsFallbackImage } from '@/components/articles';

export const dynamic = 'force-dynamic';

type StoryCard = {
    id: number; title: string; category: string; report_count: number;
    publisher_count: number; image: string | null; description: string | null;
};

async function getTrackedStories(): Promise<StoryCard[]> {
    return query<StoryCard[]>(`
        SELECT e.id, e.title, e.category,
               COUNT(DISTINCT a.id) AS report_count,
               COUNT(DISTINCT a.publisher_domain) AS publisher_count,
               (SELECT p.featured_image FROM public_articles p
                WHERE p.story_event_id = e.id AND p.featured_image IS NOT NULL
                ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 1) AS image,
               COALESCE(
                   (SELECT u.change_text FROM story_event_updates u JOIN public_articles p ON p.id = u.article_id
                    WHERE u.story_event_id = e.id AND u.change_text IS NOT NULL ORDER BY u.created_at DESC LIMIT 1),
                   (SELECT p.excerpt FROM public_articles p WHERE p.story_event_id = e.id
                    ORDER BY COALESCE(p.published_at, p.created_at) DESC LIMIT 1)
               ) AS description
        FROM story_events e
        JOIN public_articles a ON a.story_event_id = e.id
        LEFT JOIN trending_articles t ON t.article_id = a.id
        WHERE e.last_updated_at >= NOW() - INTERVAL 14 DAY
        GROUP BY e.id, e.title, e.category, e.last_updated_at
        HAVING COUNT(DISTINCT a.id) >= 2
           AND (COUNT(DISTINCT a.publisher_domain) >= 2
                OR COALESCE(MAX(t.ai_score), 0) >= 60
                OR COALESCE(SUM(a.view_count), 0) >= 5)
        ORDER BY (COALESCE(MAX(t.ai_score), 0) * 2 + LEAST(COUNT(DISTINCT a.id), 6) * 12
                  + LEAST(COALESCE(SUM(a.view_count), 0), 1000) / 20) DESC,
                 e.last_updated_at DESC
        LIMIT 18
    `);
}

export default async function AiNewsPage() {
    const stories = await getTrackedStories();
    return <main className="container mx-auto px-4 pb-20 pt-10 md:pt-14">
        <header className="max-w-4xl border-b-2 border-ink/85 pb-8 md:pb-10">
            <div className="flex items-start gap-4">
                <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-white md:h-14 md:w-14"><Sparkles aria-hidden="true" className="h-6 w-6" /></span>
                <div>
                    <h1 className="font-display text-4xl font-bold leading-none text-ink md:text-6xl">AI News</h1>
                    <p className="mt-4 max-w-2xl text-base leading-7 text-muted md:text-lg">Follow the stories people are reading as new reports arrive. Open a card for the full timeline, a short AI summary, and links to the original publishers.</p>
                </div>
            </div>
        </header>
        <section aria-labelledby="tracked-stories" className="pt-8 md:pt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <h2 id="tracked-stories" className="font-display text-2xl font-bold text-ink md:text-3xl">Story tracker</h2>
                <p className="text-xs text-muted">Stories with two or more reports</p>
            </div>
            {stories.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-12">
                {stories.map((story, index) => <Link key={story.id} href={`/story/${story.id}`} className={`group overflow-hidden rounded-xl bg-surface shadow-[0_8px_28px_-20px_rgba(26,23,18,0.35)] outline outline-1 outline-hairline transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_16px_35px_-18px_rgba(26,23,18,0.3)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-accent ${index === 0 ? 'lg:col-span-7' : index === 1 ? 'lg:col-span-5' : 'lg:col-span-4'}`}>
                    <article className="flex h-full flex-col">
                        <div className={`relative overflow-hidden bg-hairline ${index === 0 ? 'aspect-[16/9]' : 'aspect-[16/10]'}`}>
                            {story.image ? <Image src={story.image} alt="" fill unoptimized sizes="(max-width: 768px) 100vw, 50vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.03]" /> : <NewsFallbackImage seed={story.id} />}
                            <span className="absolute bottom-3 left-3 rounded bg-background/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">{story.category}</span>
                        </div>
                        <div className="flex flex-1 flex-col p-5 md:p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-accent">{story.report_count} reports · {story.publisher_count} publisher{story.publisher_count === 1 ? '' : 's'}</p>
                            <h3 className="mt-3 font-display text-2xl font-bold leading-snug text-ink group-hover:text-primary">{story.title}</h3>
                            {story.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">{story.description}</p>}
                            <span className="mt-auto inline-flex items-center gap-1 pt-5 text-xs font-bold uppercase tracking-wider text-primary">Explore story <ArrowUpRight aria-hidden="true" className="h-4 w-4" /></span>
                        </div>
                    </article>
                </Link>)}
            </div> : <div className="flex max-w-2xl items-start gap-4 border-t border-hairline py-8">
                <Newspaper aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-accent" />
                <div><h3 className="font-display text-xl text-ink">More reports are coming in</h3><p className="mt-2 text-sm leading-6 text-muted">A story appears here when reports about the same event are available. Browse the <Link href="/" className="font-semibold text-accent underline underline-offset-2">latest news</Link> while we track them.</p></div>
            </div>}
        </section>
        <p className="mt-10 border-t border-hairline pt-3 text-[11px] leading-5 text-muted">AI generated summaries can make mistakes. Check the linked publisher reports for full context.</p>
    </main>;
}
