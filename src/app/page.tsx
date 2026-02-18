import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { FeaturedArticle, ArticleList } from '@/components/articles';
import { Sidebar } from '@/components/layout';
import { BreakingNewsTicker, TickerArticle } from '@/components/BreakingNewsTicker';
import { TrendingCarousel } from '@/components/TrendingCarousel';
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
  const { featured, articles, tickerArticles, trendingArticles, mostViewedArticles } = await getArticles();
  const regularArticles = articles.filter(a => !featured || a.id !== featured.id);

  return (
    <>
      {/* Breaking News Ticker */}
      <BreakingNewsTicker articles={tickerArticles} />

      <div className="container mx-auto px-4 py-8">
      {/* Trending Carousel */}
      {trendingArticles.length > 0 && (
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🔥</span>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Trending Now
            </h2>
          </div>
          <TrendingCarousel articles={trendingArticles} accentColor="#3b82f6" />
        </section>
      )}

      {/* Featured Article */}
      {featured && (
        <section className="mb-10">
          <FeaturedArticle article={featured} />
        </section>
      )}

      <div className="lg:grid lg:grid-cols-6 lg:gap-8">
        {/* Left Sidebar - Most Viewed */}
        <aside className="lg:col-span-1 mb-8 lg:mb-0">
          <Sidebar showCategories={false} showRss={false} mostViewedArticles={mostViewedArticles} />
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-4">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest News
              </h2>
            </div>
            <ArticleList initialArticles={regularArticles} category="all" />
          </section>
        </div>

        {/* Right Sidebar - Trending */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <Sidebar showCategories={false} showRss={false} trendingArticles={trendingArticles} />
        </aside>
      </div>
    </div>
    </>
  );
}
