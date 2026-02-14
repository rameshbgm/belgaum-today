import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { FeaturedArticle, ArticleGrid } from '@/components/articles';
import { Sidebar } from '@/components/layout';

// Mock data for development when database is not available
const mockArticles: Article[] = [
  {
    id: 1,
    title: 'Belgaum Celebrates Annual Cultural Festival',
    slug: 'belgaum-celebrates-annual-cultural-festival',
    excerpt: 'The historic city of Belgaum came alive this weekend with vibrant cultural performances and traditional festivities.',
    content: 'Full content here...',
    featured_image: null,
    category: 'belgaum',
    source_name: 'Belgaum Times',
    source_url: 'https://example.com/belgaum-festival',
    status: 'published',
    featured: true,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 1250,
    reading_time: 3,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 2,
    title: 'Tech Giants Announce Major Investments in Karnataka',
    slug: 'tech-giants-announce-major-investments-karnataka',
    excerpt: 'Several multinational technology companies have announced significant investments in Karnataka state.',
    content: 'Full content here...',
    featured_image: null,
    category: 'technology',
    source_name: 'Tech India',
    source_url: 'https://example.com/tech-investment',
    status: 'published',
    featured: false,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 890,
    reading_time: 4,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 3,
    title: 'India Wins Historic Cricket Match',
    slug: 'india-wins-historic-cricket-match',
    excerpt: 'The Indian cricket team secured a memorable victory in the international championship finals.',
    content: 'Full content here...',
    featured_image: null,
    category: 'sports',
    source_name: 'Sports Today',
    source_url: 'https://example.com/cricket-match',
    status: 'published',
    featured: true,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 2340,
    reading_time: 2,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 4,
    title: 'Stock Markets React to New Economic Policy',
    slug: 'stock-markets-react-new-economic-policy',
    excerpt: 'Financial markets showed mixed reactions to the government new economic reform announcements.',
    content: 'Full content here...',
    featured_image: null,
    category: 'business',
    source_name: 'Financial Express',
    source_url: 'https://example.com/markets',
    status: 'published',
    featured: false,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 567,
    reading_time: 3,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 5,
    title: 'New Bollywood Film Breaks Box Office Records',
    slug: 'new-bollywood-film-breaks-box-office-records',
    excerpt: 'The latest Bollywood blockbuster has shattered opening weekend records at the box office.',
    content: 'Full content here...',
    featured_image: null,
    category: 'entertainment',
    source_name: 'Bollywood Buzz',
    source_url: 'https://example.com/bollywood',
    status: 'published',
    featured: false,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 1890,
    reading_time: 2,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
  {
    id: 6,
    title: 'Parliament Passes Important Healthcare Bill',
    slug: 'parliament-passes-healthcare-bill',
    excerpt: 'A landmark healthcare reform bill was passed by both houses of Parliament yesterday.',
    content: 'Full content here...',
    featured_image: null,
    category: 'india',
    source_name: 'National News',
    source_url: 'https://example.com/healthcare-bill',
    status: 'published',
    featured: true,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 3200,
    reading_time: 4,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
  },
];

async function getArticles(): Promise<{ featured: Article | null; articles: Article[] }> {
  try {
    // Try to fetch from database
    const featured = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published' AND featured = true ORDER BY published_at DESC LIMIT 1`
    );

    const articles = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 20`
    );

    return {
      featured: featured.length > 0 ? featured[0] : null,
      articles: articles,
    };
  } catch (error) {
    // Fallback to mock data if database is not available
    console.log('Database not available, using mock data');
    const featured = mockArticles.find(a => a.featured) || null;
    return {
      featured,
      articles: mockArticles,
    };
  }
}

export default async function HomePage() {
  const { featured, articles } = await getArticles();
  const regularArticles = articles.filter(a => !featured || a.id !== featured.id);

  return (
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
            <ArticleGrid articles={regularArticles} priority />
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-1 mt-8 lg:mt-0">
          <Sidebar />
        </aside>
      </div>
    </div>
  );
}
