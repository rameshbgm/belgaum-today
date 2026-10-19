import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, SlidersHorizontal } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { ArticleCard, HomepageMoreStories, MostRead, SectionHeading } from '@/components/articles';
import { NewsPhoto } from '@/components/articles/NewsPhoto';
import { NewsRow } from '@/components/articles/NewsRow';
import { PublisherLink } from '@/components/articles/PublisherLink';
import { PublisherMetadata } from '@/components/articles/PublisherMetadata';
import { TopicPreferences } from '@/components/articles/TopicPreferences';
import { DailyDigestSignup } from '@/components/articles/DailyDigestSignup';
import { digestConfigured } from '@/lib/digest';
import { distinctStories } from '@/lib/story-clusters';
import { stripHtml, truncate } from '@/lib/utils';
import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo';
import { reviveSchedulerIfStale } from '@/lib/scheduler/recovery';
import { ArticleViewCount } from '@/components/articles/ArticleViewCount';
import { ReloadButton } from '@/components/ui/ReloadButton';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Today’s briefing', alternates: { canonical: '/briefing' } };
const fields = 'id, title, slug, excerpt, featured_image, category, source_name, source_url, published_at, created_at, view_count, reading_time';
const eligible = "status = 'published' AND source_url NOT LIKE 'https://news.google.com/%'";
async function readArticles(sql: string, params: unknown[] = []) {
    try { return distinctStories(await query<Article[]>(sql, params)); }
    catch (error) { console.error('Briefing content unavailable:', error instanceof Error ? error.message : error); return []; }
}

export default async function BriefingPage() {
    void reviveSchedulerIfStale();
    const [latest, ranked, mostRead, ...sections] = await Promise.all([
        readArticles(`SELECT ${fields} FROM public_articles WHERE ${eligible} ORDER BY COALESCE(published_at, created_at) DESC LIMIT 24`),
        readArticles(`SELECT ${fields.split(', ').map(field => `a.${field}`).join(', ')} FROM trending_articles t JOIN public_articles a ON a.id = t.article_id WHERE a.status = 'published' AND a.source_url NOT LIKE 'https://news.google.com/%' ORDER BY t.rank_position LIMIT 12`),
        readArticles(`SELECT ${fields} FROM public_articles WHERE ${eligible} AND view_count > 0 ORDER BY view_count DESC LIMIT 6`),
        ...TOP_LEVEL_CATEGORIES.map(category => readArticles(`SELECT ${fields} FROM public_articles WHERE ${eligible} AND category = ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT 6`, [category])),
    ]);
    const lead = ranked.find(article => article.category === 'india') || sections[0]?.[0] || latest[0];
    const supporting = distinctStories([
        ...sections.slice(1, 4).map(articles => articles[0]).filter((article): article is Article => Boolean(article)),
        ...ranked, ...latest,
    ]).filter(article => article.id !== lead?.id).slice(0, 3);
    const featuredIds = new Set([lead?.id, ...supporting.map(article => article.id)]);
    const today = new Date();
    const dateline = new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }).format(today);
    return <div className="container briefing-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Belgaum Today', alternateName: 'Belagavi Today', url: SITE_URL }) }} />
        <div className="briefing-heading">
            <div><h1>Today&rsquo;s briefing</h1><p><time dateTime={today.toISOString()}>{dateline}</time><span className="mx-2" aria-hidden="true">·</span>Headlines from across India.</p></div>
            <div className="briefing-actions"><a href="#your-topics"><SlidersHorizontal size={17} />Your topics</a>{mostRead.length > 0 && <a href="#most-read" className="text-primary">Most read <ArrowRight size={17} /></a>}</div>
        </div>
        {lead ? <section className="lead-layout" aria-label="Today's top stories">
            <article className="lead-article">
                <PublisherLink article={lead} className="lead-photo" ariaLabel={lead.title}><NewsPhoto src={lead.featured_image} priority /></PublisherLink>
                <div className="lead-copy"><Link href={`/${lead.category}`} className="story-category">{CATEGORY_META[lead.category]?.name || 'India'}</Link>
                    <h2><PublisherLink article={lead}>{lead.title}</PublisherLink></h2>
                    {lead.excerpt && <p className="lead-excerpt">{truncate(stripHtml(lead.excerpt), 220)}</p>}
                    <div className="lead-metadata story-metadata"><PublisherMetadata article={lead} /><ArticleViewCount count={lead.view_count} /></div>
                </div>
            </article>
            <div className="briefing-support"><h2>Latest stories</h2>{supporting.map(article => <NewsRow key={article.id} article={article} />)}</div>
        </section> : <section className="rounded-xl bg-surface p-8" role="status"><h2 className="font-display text-2xl font-semibold">The news is taking a moment</h2><p className="mt-3 text-muted">We couldn&rsquo;t load the briefing. Try again in a moment.</p><ReloadButton /></section>}
        {TOP_LEVEL_CATEGORIES.map((category, index) => {
            const articles = sections[index]?.filter(article => !featuredIds.has(article.id)).slice(0, 3) || [];
            return <section className="channel-section" key={category} aria-label={`${CATEGORY_META[category].name} news`}>
                <SectionHeading href={`/${category}`} linkText={`All ${CATEGORY_META[category].name}`}>{CATEGORY_META[category].name}</SectionHeading>
                {articles.length ? <div className="channel-grid">{articles.map(article => <ArticleCard key={article.id} article={article} />)}</div> : <p className="py-5 text-muted">More {CATEGORY_META[category].name} stories will appear as feeds update.</p>}
            </section>;
        })}
        <section className="latest-section" aria-label="News archive"><HomepageMoreStories initialArticles={latest.filter(article => !featuredIds.has(article.id)).slice(0, 12)} /></section>
        <details id="your-topics" className="topic-panel"><summary>Your topics, your briefing</summary><TopicPreferences /></details>
        {mostRead.length > 0 && <section id="most-read" className="channel-section"><SectionHeading>Most read</SectionHeading><MostRead articles={mostRead} /></section>}
        {digestConfigured() && <DailyDigestSignup />}
    </div>;
}
