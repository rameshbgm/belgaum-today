import Link from 'next/link';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { LeadCarousel, LatestRail, MostRead, HomepageMoreStories, SectionHeading, SectionNewsCarousel } from '@/components/articles';
import type { LeadCarouselArticle } from '@/components/articles';
import { TopicPreferences } from '@/components/articles/TopicPreferences';
import { DailyDigestSignup } from '@/components/articles/DailyDigestSignup';
import { digestConfigured } from '@/lib/digest';
import { distinctStories } from '@/lib/story-clusters';
import type { Metadata } from 'next';
import { SITE_URL } from '@/lib/site-url';
import { safeJsonLd } from '@/lib/seo';
import { reviveSchedulerIfStale } from '@/lib/scheduler/recovery';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { alternates: { canonical: '/' } };

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

const LATEST_CATEGORIES = ['india', 'technology', 'sports', 'belgaum', 'business', 'entertainment'] as const;
const FRONT_PAGE_CATEGORIES = [
  { category: 'india', title: 'India', empty: 'India stories will appear here as feeds update.' },
  { category: 'technology', title: 'Technology', empty: 'Technology stories will appear here as feeds update.' },
  { category: 'sports', title: 'Sports', empty: 'Sports stories will appear here as feeds update.' },
  { category: 'belgaum', title: 'Belagavi', empty: 'Belagavi stories will appear here as feeds update.' },
] as const;

async function getArticles(): Promise<{
  articles: Article[];
  trendingArticles: TrendingArticle[];
  mostViewedArticles: MostViewedArticle[];
  categorySections: Array<{ category: typeof LATEST_CATEGORIES[number]; articles: Article[] }>;
}> {
  try {
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

    // Each front-page category scrolls independently; Latest uses its first three.
    const categoryArticles = await Promise.all(
      LATEST_CATEGORIES.map(async (cat) => {
        const rows = await query<Article[]>(
          `SELECT id, title, slug, excerpt, category, source_name, source_url, published_at, created_at, view_count, reading_time, featured_image, status, featured, ai_generated, ai_confidence, requires_review
           FROM public_articles
           WHERE status = 'published' AND category = ? AND source_url NOT LIKE 'https://news.google.com/%'
           ORDER BY COALESCE(published_at, created_at) DESC LIMIT 8`,
          [cat]
        );
        return { category: cat, articles: rows };
      })
    );

    return {
      articles: distinctStories(articles),
      trendingArticles: trending,
      mostViewedArticles: mostViewed.map(row => ({
        ...row,
        published_at: new Date(row.published_at).toISOString(),
      })),
      categorySections: categoryArticles.map(section => ({ ...section, articles: distinctStories(section.articles) })),
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { articles: [], trendingArticles: [], mostViewedArticles: [], categorySections: [] };
  }
}

export default async function HomePage() {
  // Shared hosting may reap the Node process and its interval. A homepage
  // request safely revives RSS + analysis when the heartbeat has gone stale.
  void reviveSchedulerIfStale();
  const { articles, trendingArticles, mostViewedArticles, categorySections } = await getArticles();

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

  const indiaLead = leadArticles.findIndex(article => article.category === 'india');
  if (indiaLead > 0) leadArticles.unshift(...leadArticles.splice(indiaLead, 1));

  // Compose the broadsheet sections
  const rest = articles.slice(0);
  const latest = rest.slice(0, 6);                // fallback flat list
  const moreStories = rest.slice(6);              // date-grouped feed

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Belgaum Today',
        alternateName: 'Belagavi Today',
        url: SITE_URL,
      }) }} />
      {/* ── Front page: lead carousel + scrollable latest rail ── */}
      <section className="grid grid-cols-1 gap-8 border-b-2 border-ink/85 pb-10 lg:h-[680px] lg:grid-cols-12 lg:items-stretch lg:gap-10 xl:h-[720px]">
        {/* Lead carousel — AI trending or latest fallback */}
        <div className="min-h-0 lg:col-span-8">
          <LeadCarousel articles={leadArticles} isFallback={isFallback} />
        </div>

        {/* Latest rail — same height as lead, scrollable, 3 per category */}
        <aside className="flex min-h-0 flex-col lg:col-span-4">
          <SectionHeading accent>Latest</SectionHeading>
          {/* overflow container: scrolls within the exact height of the lead image */}
          <div className="min-h-0 flex-1 overflow-y-auto rounded-sm border border-hairline p-3">
            {categorySections.length > 0 ? (
              <LatestRail articles={latest} categorySections={categorySections.map(section => ({ ...section, articles: section.articles.slice(0, 3) }))} />
            ) : latest.length > 0 ? (
              <LatestRail articles={latest} />
            ) : (
              <p className="text-sm text-muted">No stories yet.</p>
            )}
          </div>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-x-6 gap-y-9 border-b-2 border-ink/85 py-10 sm:grid-cols-2 xl:grid-cols-4" aria-label="News by category">
        {FRONT_PAGE_CATEGORIES.map(section => (
          <SectionNewsCarousel
            key={section.category}
            title={section.title}
            articles={categorySections.find(item => item.category === section.category)?.articles || []}
            empty={section.empty}
            compact
          />
        ))}
      </section>

      {/* ── News feed + Most Viewed ── */}
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

    </div>
  );
}
