import Link from 'next/link';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { LeadCarousel, LatestRail, MostRead, HomepageMoreStories, SectionHeading, SectionNewsCarousel } from '@/components/articles';
import type { LeadCarouselArticle } from '@/components/articles';
import { TopicPreferences } from '@/components/articles/TopicPreferences';
import { DailyDigestSignup } from '@/components/articles/DailyDigestSignup';
import { StorySummaryButton } from '@/components/story/StorySummaryButton';
import { digestConfigured } from '@/lib/digest';
import { distinctStories } from '@/lib/story-clusters';

export const dynamic = 'force-dynamic';

interface MostViewedArticle {
  id: number;
  title: string;
  slug: string;
  source_name: string;
  source_url: string;
  published_at: string;
  view_count: number;
}

interface TrendingRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  source_name: string;
  source_url: string;
  published_at: Date;
  ai_score: number;
  ai_reasoning: string;
  rank_position: number;
  view_count: number;
}

interface TrendingArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  source_name: string;
  source_url: string;
  published_at: string;
  rank_position: number;
  view_count: number;
}

interface StoryEventRow { id: number; title: string; category: string; last_updated_at: Date; report_count: number; latest_change: string | null }

const LATEST_CATEGORIES = ['belgaum', 'india', 'business', 'technology', 'entertainment', 'sports'] as const;

async function getArticles(): Promise<{
  articles: Article[];
  trendingArticles: TrendingArticle[];
  mostViewedArticles: MostViewedArticle[];
  categorySections: Array<{ category: typeof LATEST_CATEGORIES[number]; articles: Article[] }>;
  localArticles: Article[];
  indiaArticles: Article[];
  storyEvents: StoryEventRow[];
}> {
  try {
    const [localArticles, indiaArticles] = await Promise.all(['belgaum', 'india'].map(category =>
      query<Article[]>(
        `SELECT * FROM public_articles WHERE status = 'published' AND category = ?
         AND source_url NOT LIKE 'https://news.google.com/%'
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 4`, [category]
      )
    ));
    const articles = await query<Article[]>(
      `SELECT * FROM public_articles WHERE status = 'published'
       AND source_url NOT LIKE 'https://news.google.com/%'
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20`
    );

    // Get trending articles across all categories (top 10)
    const trendingRows = await query<TrendingRow[]>(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.category,
              a.source_name, a.source_url, a.published_at, a.view_count,
              ta.ai_score, ta.ai_reasoning, ta.rank_position
       FROM trending_articles ta
       JOIN public_articles a ON ta.article_id = a.id
       WHERE a.status = 'published' AND a.source_url NOT LIKE 'https://news.google.com/%'
       ORDER BY ta.rank_position ASC
       LIMIT 10`
    );

    const trending: TrendingArticle[] = trendingRows.map(row => ({
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt,
      featured_image: row.featured_image,
      category: row.category,
      source_name: row.source_name,
      source_url: row.source_url,
      published_at: new Date(row.published_at).toISOString(),
      rank_position: row.rank_position,
      view_count: row.view_count,
    }));

    // Rank by article-page views.
    const mostViewed = await query<MostViewedArticle[]>(
      `SELECT a.id, a.title, a.slug, a.source_name, a.source_url, a.published_at, a.view_count
       FROM public_articles a
       WHERE a.status = 'published' AND a.source_url NOT LIKE 'https://news.google.com/%'
         AND a.view_count > 0
       ORDER BY a.view_count DESC, COALESCE(a.published_at, a.created_at) DESC
       LIMIT 15`
    );

    // Fetch 3 latest articles per category for the scrollable Latest rail
    const categoryArticles = await Promise.all(
      LATEST_CATEGORIES.map(async (cat) => {
        const rows = await query<Article[]>(
          `SELECT id, title, slug, excerpt, category, source_name, source_url, published_at, created_at, view_count, reading_time, featured_image, status, featured, ai_generated, ai_confidence, requires_review
           FROM public_articles
           WHERE status = 'published' AND category = ? AND source_url NOT LIKE 'https://news.google.com/%'
           ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3`,
          [cat]
        );
        return { category: cat, articles: rows };
      })
    );

    const storyEvents = await query<StoryEventRow[]>(
      `SELECT e.id, e.title, e.category, e.last_updated_at, COUNT(a.id) AS report_count,
        (SELECT u.change_text FROM story_event_updates u JOIN public_articles pa ON pa.id = u.article_id
         WHERE u.story_event_id = e.id AND u.change_text IS NOT NULL ORDER BY u.created_at DESC, u.id DESC LIMIT 1) AS latest_change
       FROM story_events e JOIN public_articles a ON a.story_event_id = e.id
       GROUP BY e.id, e.title, e.category, e.last_updated_at
       ORDER BY e.last_updated_at DESC LIMIT 6`
    );
    return {
      articles: distinctStories(articles),
      trendingArticles: trending,
      mostViewedArticles: mostViewed.map(row => ({
        ...row,
        published_at: new Date(row.published_at).toISOString(),
      })),
      categorySections: categoryArticles.map(section => ({ ...section, articles: distinctStories(section.articles) })),
      localArticles: distinctStories(localArticles),
      indiaArticles: distinctStories(indiaArticles),
      storyEvents,
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { articles: [], trendingArticles: [], mostViewedArticles: [], categorySections: [], localArticles: [], indiaArticles: [], storyEvents: [] };
  }
}

export default async function HomePage() {
  const { articles, trendingArticles, mostViewedArticles, categorySections, localArticles, indiaArticles, storyEvents } = await getArticles();

  // Build lead carousel: AI trending if available, else latest 10 as fallback
  const isFallback = trendingArticles.length === 0;
  const leadArticles: LeadCarouselArticle[] = isFallback
    ? articles.slice(0, 10).map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        featured_image: a.featured_image,
        category: a.category,
        source_name: a.source_name,
        source_url: a.source_url,
        view_count: a.view_count,
        published_at: a.published_at ? new Date(a.published_at).toISOString() : null,
        created_at: new Date(a.created_at).toISOString(),
      }))
    : trendingArticles.map((t) => ({
        id: t.id,
        title: t.title,
        slug: t.slug,
        excerpt: t.excerpt,
        featured_image: t.featured_image,
        category: t.category,
        source_name: t.source_name,
        source_url: t.source_url,
        published_at: t.published_at,
        rank_position: t.rank_position,
        view_count: t.view_count,
      }));

  // Compose the broadsheet sections
  const rest = articles.slice(0);
  const latest = rest.slice(0, 6);                // fallback flat list
  const moreStories = rest.slice(6);              // date-grouped feed

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10 border-b-2 border-ink/85" aria-label="Local and India news">
        {([
          { title: 'Belagavi', href: '/belgaum', articles: localArticles, empty: 'Fresh English local stories will appear here as publisher feeds update.' },
          { title: 'India', href: '/india', articles: indiaArticles, empty: 'The latest India stories will appear here.' },
        ] as const).map(section => (
          <SectionNewsCarousel key={section.title} {...section} />
        ))}
      </section>
      {/* ── Front page: lead carousel + scrollable latest rail ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 py-10 border-b-2 border-ink/85 lg:items-stretch">
        {/* Lead carousel — AI trending or latest fallback */}
        <div className="lg:col-span-8">
          <LeadCarousel articles={leadArticles} isFallback={isFallback} />
        </div>

        {/* Latest rail — same height as lead, scrollable, 3 per category */}
        <aside className="lg:col-span-4 flex flex-col">
          <SectionHeading accent>Latest</SectionHeading>
          {/* overflow container: scrolls within the exact height of the lead image */}
          <div className="flex-1 overflow-y-auto border border-hairline rounded-sm p-3"
               style={{ maxHeight: 'min(68vw, 520px)' }}>
            {categorySections.length > 0 ? (
              <LatestRail articles={latest} categorySections={categorySections} />
            ) : latest.length > 0 ? (
              <LatestRail articles={latest} />
            ) : (
              <p className="text-sm text-muted">No stories yet.</p>
            )}
          </div>
        </aside>
      </section>

      {/* ── More Stories + Most Viewed ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
        <HomepageMoreStories initialArticles={moreStories} />

        {/* Most Viewed sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <SectionHeading accent>Most Viewed</SectionHeading>
            {mostViewedArticles.length > 0 ? (
              <MostRead articles={mostViewedArticles.slice(0, 15)} />
            ) : trendingArticles.length > 0 ? (
              <MostRead articles={trendingArticles.slice(0, 15)} />
            ) : (
              <p className="text-sm text-muted">Nothing trending yet.</p>
            )}

            <TopicPreferences articles={articles} />
            {digestConfigured() && <DailyDigestSignup />}

            {/* RSS pull-quote block */}
            <div className="mt-10 border-t-2 border-ink/85 pt-6">
              <p className="font-display text-lg leading-snug text-ink">
                Belagavi&rsquo;s news, gathered from across the web and delivered every day.
              </p>
              <Link
                href="/feed.xml"
                className="mt-3 inline-block text-xs font-bold uppercase tracking-[0.18em] text-accent hover:text-primary transition-colors"
              >
                Subscribe via RSS →
              </Link>
            </div>
          </div>
        </aside>
      </section>

      {storyEvents.length > 0 && <section className="mt-12 border-y-2 border-ink/85 py-8 md:py-10" aria-labelledby="story-tracker-heading">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
          <div>
            <h2 id="story-tracker-heading" className="font-display text-2xl font-bold uppercase tracking-[0.06em] text-primary md:text-3xl">Story Tracker</h2>
            <p className="mt-2 max-w-prose text-sm leading-6 text-muted">See how recent stories develop across Indian publishers. Expand an AI summary to compare reports.</p>
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">Latest developing stories</span>
        </div>
        <div className="grid gap-x-10 md:grid-cols-2">
          {storyEvents.map(event => <article key={event.id} className="border-t border-hairline py-5">
            <p className="text-xs font-bold uppercase tracking-wider text-accent">{event.category} <span aria-hidden="true">·</span> {event.report_count} publisher report{event.report_count === 1 ? '' : 's'}</p>
            <h3 className="mt-2 font-display text-xl leading-snug text-ink">
              <Link href={`/story/${event.id}`} className="decoration-accent/50 underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">{event.title}</Link>
            </h3>
            {event.latest_change && <p className="mt-2 text-sm leading-5 text-muted">Latest update: {event.latest_change}</p>}
            <div className="flex flex-wrap items-center gap-x-5">
              <StorySummaryButton storyId={event.id} />
              <Link href={`/story/${event.id}`} className="mt-4 inline-flex min-h-10 items-center text-xs font-bold uppercase tracking-wider text-accent underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent">View timeline <span aria-hidden="true" className="ml-1">→</span></Link>
            </div>
          </article>)}
        </div>
      </section>}
    </div>
  );
}
