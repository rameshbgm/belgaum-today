import Link from 'next/link';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { LeadStory, LatestRail, MostRead, StoryCard, SectionHeading } from '@/components/articles';
import { TickerArticle } from '@/components/BreakingNewsTicker';
import type { TrendingArticle as TrendingCarouselArticle } from '@/components/TrendingCarousel';

interface MostViewedArticle {
  id: number;
  title: string;
  slug: string;
  source_name: string;
  published_at: string;
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
  published_at: Date;
  ai_score: number;
  ai_reasoning: string;
  rank_position: number;
}

async function getArticles(): Promise<{ 
  featured: Article | null; 
  articles: Article[];
  tickerArticles: TickerArticle[];
  trendingArticles: TrendingCarouselArticle[];
  mostViewedArticles: MostViewedArticle[];
}> {
  try {
    const featured = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published' AND featured = true ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1`
    );

    const articles = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20`
    );

    // Get recent articles for ticker (latest 10)
    const ticker = await query<TickerArticle[]>(
      `SELECT id, title, source_url, source_name FROM articles WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 10`
    );

    // Get trending articles across all categories (top 10)
    const trendingRows = await query<TrendingArticle[]>(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.category,
              a.source_name, a.source_url, a.published_at,
              ta.ai_score, ta.ai_reasoning, ta.rank_position
       FROM trending_articles ta
       JOIN articles a ON ta.article_id = a.id
       WHERE a.status = 'published'
       ORDER BY ta.rank_position ASC
       LIMIT 10`
    );

    // Convert Date objects to strings for TrendingCarousel component
    const trending: TrendingCarouselArticle[] = trendingRows.map(row => ({
      ...row,
      published_at: new Date(row.published_at).toISOString(),
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

    return {
      featured: featured.length > 0 ? featured[0] : null,
      articles: articles,
      tickerArticles: ticker,
      trendingArticles: trending,
      mostViewedArticles: mostViewed.map(row => ({
        ...row,
        published_at: new Date(row.published_at).toISOString(),
      })),
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { featured: null, articles: [], tickerArticles: [], trendingArticles: [], mostViewedArticles: [] };
  }
}

export default async function HomePage() {
  const { featured, articles, trendingArticles, mostViewedArticles } = await getArticles();

  // The lead is the featured article, or the most recent one as fallback.
  const lead = featured || articles[0] || null;
  const rest = articles.filter((a) => !lead || a.id !== lead.id);

  // Compose the broadsheet sections from the same data.
  const latest = rest.slice(0, 6);                // "Latest" rail
  const moreFeatures = rest.slice(6, 12);         // image story cards
  const briefs = rest.slice(12, 18);              // text-only briefs

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      {/* ── Front page: lead + rails ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b-2 border-ink/85">
        {/* Lead story */}
        <div className="lg:col-span-8">
          {lead && <LeadStory article={lead} />}
        </div>

        {/* Latest rail */}
        <aside className="lg:col-span-4">
          <SectionHeading accent>Latest</SectionHeading>
          {latest.length > 0 ? (
            <LatestRail articles={latest} />
          ) : (
            <p className="text-sm text-muted">No stories yet.</p>
          )}
        </aside>
      </section>

      {/* ── More Stories + Most Read ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
        <div className="lg:col-span-8">
          <SectionHeading>More Stories</SectionHeading>

          {/* Image features in a 2-col grid… */}
          {moreFeatures.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-10">
              {moreFeatures.map((a) => (
                <StoryCard key={a.id} article={a} variant="feature" />
              ))}
            </div>
          )}

          {/* …followed by a column of text-only briefs */}
          {briefs.length > 0 && (
            <div className="mt-12 space-y-7">
              {briefs.map((a) => (
                <StoryCard key={a.id} article={a} variant="brief" />
              ))}
            </div>
          )}
        </div>

        {/* Most Read sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <SectionHeading accent>Most Read</SectionHeading>
            {mostViewedArticles.length > 0 ? (
              <MostRead articles={mostViewedArticles.slice(0, 7)} />
            ) : trendingArticles.length > 0 ? (
              <MostRead articles={trendingArticles.slice(0, 7)} />
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
