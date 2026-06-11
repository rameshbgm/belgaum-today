import Link from 'next/link';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { LeadCarousel, LatestRail, MostRead, HomepageMoreStories, SectionHeading } from '@/components/articles';
import type { LeadCarouselArticle } from '@/components/articles';

interface MostViewedArticle {
  id: number;
  title: string;
  slug: string;
  source_name: string;
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
}

interface TrendingArticle {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string | null;
  category: string;
  source_name: string;
  published_at: string;
  rank_position: number;
}

const LATEST_CATEGORIES = ['india', 'business', 'technology', 'entertainment', 'sports'] as const;

async function getArticles(): Promise<{
  articles: Article[];
  trendingArticles: TrendingArticle[];
  mostViewedArticles: MostViewedArticle[];
  categorySections: Array<{ category: typeof LATEST_CATEGORIES[number]; articles: Article[] }>;
}> {
  try {
    const articles = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20`
    );

    // Get trending articles across all categories (top 10)
    const trendingRows = await query<TrendingRow[]>(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.category,
              a.source_name, a.source_url, a.published_at,
              ta.ai_score, ta.ai_reasoning, ta.rank_position
       FROM trending_articles ta
       JOIN articles a ON ta.article_id = a.id
       WHERE a.status = 'published'
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
      published_at: new Date(row.published_at).toISOString(),
      rank_position: row.rank_position,
    }));

    // Get most viewed articles from last 10 days
    const mostViewed = await query<MostViewedArticle[]>(
      `SELECT id, title, slug, source_name, published_at, view_count
       FROM articles
       WHERE status = 'published'
         AND published_at >= DATE_SUB(NOW(), INTERVAL 10 DAY)
       ORDER BY view_count DESC
       LIMIT 15`
    );

    // Fetch 3 latest articles per category for the scrollable Latest rail
    const categoryArticles = await Promise.all(
      LATEST_CATEGORIES.map(async (cat) => {
        const rows = await query<Article[]>(
          `SELECT id, title, slug, excerpt, category, source_name, source_url, published_at, created_at, view_count, reading_time, featured_image, status, featured, ai_generated, ai_confidence, requires_review
           FROM articles
           WHERE status = 'published' AND category = ?
           ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3`,
          [cat]
        );
        return { category: cat, articles: rows };
      })
    );

    return {
      articles,
      trendingArticles: trending,
      mostViewedArticles: mostViewed.map(row => ({
        ...row,
        published_at: new Date(row.published_at).toISOString(),
      })),
      categorySections: categoryArticles,
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { articles: [], trendingArticles: [], mostViewedArticles: [], categorySections: [] };
  }
}

export default async function HomePage() {
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
        published_at: t.published_at,
        rank_position: t.rank_position,
      }));

  // Compose the broadsheet sections
  const rest = articles.slice(0);
  const latest = rest.slice(0, 6);                // fallback flat list
  const moreStories = rest.slice(6);              // date-grouped feed

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      {/* ── Front page: lead carousel + scrollable latest rail ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b-2 border-ink/85 lg:items-stretch">
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

      {/* ── More Stories + Most Read ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
        <HomepageMoreStories initialArticles={moreStories} />

        {/* Most Read sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <SectionHeading accent>Most Read</SectionHeading>
            {mostViewedArticles.length > 0 ? (
              <MostRead articles={mostViewedArticles.slice(0, 15)} />
            ) : trendingArticles.length > 0 ? (
              <MostRead articles={trendingArticles.slice(0, 15)} />
            ) : (
              <p className="text-sm text-muted">Nothing trending yet.</p>
            )}

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
