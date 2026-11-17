import Link from 'next/link';
import './home.css';
import type { Metadata } from 'next';
import { cache } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight } from 'lucide-react';
import { HomeMotion } from '@/components/home/HomeMotion';
import { HomeStoryCarousel } from '@/components/home/HomeStoryCarousel';
import { ArticleCard } from '@/components/articles/ArticleCard';
import { NewsPhoto } from '@/components/articles/NewsPhoto';
import { PublisherLink } from '@/components/articles/PublisherLink';
import { PublisherMetadata } from '@/components/articles/PublisherMetadata';
import { ArticleViewCount } from '@/components/articles/ArticleViewCount';
import { TrackingProvider } from '@/components/TrackingProvider';
import { query } from '@/lib/db';
import { distinctStories } from '@/lib/story-clusters';
import { reviveSchedulerIfStale } from '@/lib/scheduler/recovery';
import { Article, CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { dateFromBriefing, listDailyBriefings } from '@/lib/daily-briefings';
import { safeJsonLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';
export async function generateMetadata(): Promise<Metadata> {
    const [lead] = await aiRankedInCategory('india');
    const title = 'India News & Daily Briefing | Belgaum Today';
    const description = 'Follow India’s important stories with AI-selected headlines, dated daily briefings, and linked publisher reports across business, technology and Belagavi.';
    const images = lead?.featured_image ? [{ url: lead.featured_image }] : [{ url: '/images/belgaum-today-logo.png' }];
    return { title: { absolute: title }, description, alternates: { canonical: '/' },
        openGraph: { title, description, url: '/', type: 'website', images },
        twitter: { card: 'summary_large_image', title, description, images },
    };
}

const descriptions: Record<string, string> = {
    india: 'The national conversation.',
    business: 'Markets, enterprise and the economy.',
    technology: 'Ideas shaping what comes next.',
    sports: 'The games. The people. The moments.',
    entertainment: 'Cinema, culture and what’s on.',
    belgaum: 'Stories from closer to home.',
};

const aiRankedInCategory = cache(async (category: string): Promise<Article[]> => {
    try {
        return distinctStories(await query<Article[]>(
            `SELECT a.* FROM trending_articles t JOIN public_articles a ON a.id = t.article_id
             WHERE t.category = ? AND a.category = ? AND a.status = 'published'
             AND a.source_url NOT LIKE 'https://news.google.com/%'
             AND t.expires_at > NOW()
             AND COALESCE(a.published_at, a.created_at) >= NOW() - INTERVAL 7 DAY
             ORDER BY t.rank_position LIMIT 7`, [category, category],
        ));
    } catch (error) {
        console.error('Home headlines unavailable:', error instanceof Error ? error.message : error);
        return [];
    }
});

async function latestLocalStory(): Promise<Article | undefined> {
    try {
        const rows = await query<Article[]>(`SELECT * FROM public_articles
            WHERE status = 'published' AND category = 'belgaum'
            AND source_url NOT LIKE 'https://news.google.com/%'
            ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`);
        return rows[0];
    } catch (error) {
        console.error('Local headlines unavailable:', error instanceof Error ? error.message : error);
        return undefined;
    }
}

export default async function HomePage() {
    void reviveSchedulerIfStale();
    const [sections, localStory, editions] = await Promise.all([
        Promise.all(['india', 'business', 'technology'].map(aiRankedInCategory)),
        latestLocalStory(),
        listDailyBriefings(1).catch(() => []),
    ]);
    const previews = sections.flatMap(articles => articles.slice(0, 1));
    const coverStories = sections[0].slice(0, 5).map(({ id, title, featured_image, source_name, source_url }) => ({ id, title, featured_image, source_name, source_url }));
    const edition = editions[0];

    return <TrackingProvider category="home"><HomeMotion>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({ '@context': 'https://schema.org', '@type': 'WebSite', name: 'Belgaum Today', url: SITE_URL, description: 'India news and daily briefings with linked publisher reports.' }) }} />
        <section className="home-cover" data-home-cover aria-labelledby="home-title">
            <div className="container home-cover-inner">
                <div className="home-cover-copy">
                    <h1 id="home-title"><span>Make </span><span>sense of </span><span>today.</span></h1>
                    <div className="home-cover-intro">
                        <p>India’s important stories. AI-selected, with the sources in view.</p>
                        <Link className="home-white-action" href="/briefing">Read the briefing <ArrowRight size={23} aria-hidden="true" /></Link>
                        <a className="home-explore-action" href="#explore">Explore categories <ArrowDown size={19} aria-hidden="true" /></a>
                    </div>
                </div>
                <HomeStoryCarousel stories={coverStories} />
            </div>
        </section>

        <section className="container home-introduction" aria-labelledby="home-perspective">
            <h2 id="home-perspective">Across India.<br />Closer to home.</h2>
            <p>Discover a headline, see its publisher, and read the original report.</p>
        </section>

        <section className="container home-latest" aria-labelledby="home-latest-heading">
            <div className="home-section-heading"><h2 id="home-latest-heading">Today&rsquo;s briefing</h2><Link href="/briefing">View all <ArrowRight size={19} aria-hidden="true" /></Link></div><p>AI-selected stories from India, business and technology.</p>
            {previews.length ? <div className="home-story-grid">{previews.map(article => <ArticleCard key={article.id} article={article} compact />)}</div> : <div className="home-empty"><p>The latest headlines are taking a moment to load.</p><Link href="/briefing">Open the briefing <ArrowRight size={18} aria-hidden="true" /></Link></div>}
            <div className="home-edition-links">{edition && <Link href={`/briefing/${dateFromBriefing(edition)}`}>{edition.title}<ArrowRight size={18} aria-hidden="true" /></Link>}<Link href="/briefing/archive">Browse daily briefings<ArrowRight size={18} aria-hidden="true" /></Link></div>
        </section>

        <section id="explore" className="home-discover" aria-labelledby="home-discover-heading">
            <div className="container home-discover-inner">
                <div className="home-discover-copy"><h2 id="home-discover-heading">Follow your<br />curiosity.</h2><p>Big conversations. Fresh ideas. The stories you make time for.</p></div>
                <nav className="home-category-index" aria-label="Explore news categories">{TOP_LEVEL_CATEGORIES.map(category => <Link key={category} href={`/${category}`}><div><span>{CATEGORY_META[category].name}</span><p>{descriptions[category]}</p></div><ArrowUpRight size={26} aria-hidden="true" /></Link>)}</nav>
            </div>
        </section>

        <section className="container home-local" aria-labelledby="home-local-heading">
            <div className="home-local-intro"><h2 id="home-local-heading">Belgaum.<br />Always in view.</h2><p>Keep a place for the stories closest to you. Explore local reports from publishers covering Belgaum and its community.</p><Link className="home-cobalt-action" href="/belgaum">Explore Belgaum <ArrowRight size={20} aria-hidden="true" /></Link></div>
            {localStory ? <article className="home-local-story">
                {localStory.featured_image && <PublisherLink article={localStory} className="home-local-photo" ariaLabel={localStory.title}><NewsPhoto src={localStory.featured_image} /></PublisherLink>}
                <h3><PublisherLink article={localStory}>{localStory.title}</PublisherLink></h3>
                <div className="story-metadata"><PublisherMetadata article={localStory} /><ArticleViewCount count={localStory.view_count} /></div>
            </article> : <div className="home-local-note"><p>A local perspective, whenever you need it.</p><Link href="/belgaum">Browse Belgaum reports <ArrowUpRight size={20} aria-hidden="true" /></Link></div>}
        </section>

        <section className="home-close" aria-labelledby="home-close-heading"><div className="container home-close-inner"><h2 id="home-close-heading">Your next good read<br />starts here.</h2><Link className="home-white-action" href="/briefing">Open today&rsquo;s briefing <ArrowRight size={23} aria-hidden="true" /></Link></div></section>
    </HomeMotion></TrackingProvider>;
}
