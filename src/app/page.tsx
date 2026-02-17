import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { FeaturedArticle, ArticleList } from '@/components/articles';
import { Sidebar } from '@/components/layout';
import { BreakingNewsTicker, TickerArticle } from '@/components/BreakingNewsTicker';

async function getArticles(): Promise<{ 
  featured: Article | null; 
  articles: Article[];
  tickerArticles: TickerArticle[];
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

    return {
      featured: featured.length > 0 ? featured[0] : null,
      articles: articles,
      tickerArticles: ticker,
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { featured: null, articles: [], tickerArticles: [] };
  }
}

export default async function HomePage() {
  const { featured, articles, tickerArticles } = await getArticles();
  const regularArticles = articles.filter(a => !featured || a.id !== featured.id);

  return (
    <>
      {/* Breaking News Ticker */}
      <BreakingNewsTicker articles={tickerArticles} />

      <div className="container mx-auto px-4 py-8">
      {/* Featured Article */}
      {featured && (
        <section className="mb-10">
          <FeaturedArticle article={featured} />
        </section>
      )}

      <div className="lg:grid lg:grid-cols-4 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Latest News
              </h2>
              <div className="flex gap-2">
                {(Object.keys(CATEGORY_META) as Category[]).slice(0, 4).map((cat) => (
                  <a
                    key={cat}
                    href={`/${cat}`}
                    className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all hidden md:block"
                  >
                    {CATEGORY_META[cat].name}
                  </a>
                ))}
              </div>
            </div>
            <ArticleList initialArticles={regularArticles} category="all" />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <Sidebar />
        </aside>
      </div>
    </div>
    </>
  );
}
