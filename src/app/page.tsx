import Link from 'next/link';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { LeadCarousel, LatestRail, MostRead, HomepageMoreStories, SectionHeading, StoryCard } from '@/components/articles';
import type { LeadCarouselArticle } from '@/components/articles';
import { TopicPreferences } from '@/components/articles/TopicPreferences';
import { DailyDigestSignup } from '@/components/articles/DailyDigestSignup';
import { digestConfigured } from '@/lib/digest';
import { distinctStories } from '@/lib/story-clusters';

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
}

const LATEST_CATEGORIES = ['belgaum', 'india', 'world', 'business', 'technology', 'entertainment', 'sports'] as const;

async function getArticles(): Promise<{
  articles: Article[];
  trendingArticles: TrendingArticle[];
  mostViewedArticles: MostViewedArticle[];
  categorySections: Array<{ category: typeof LATEST_CATEGORIES[number]; articles: Article[] }>;
  localArticles: Article[];
  indiaArticles: Article[];
}> {
  try {
    const [localArticles, indiaArticles] = await Promise.all(['belgaum', 'india'].map(category =>
      query<Article[]>(
        `SELECT * FROM articles WHERE status = 'published' AND category = ?
         AND source_url NOT LIKE 'https://news.google.com/%'
         ORDER BY COALESCE(published_at, created_at) DESC LIMIT 4`, [category]
      )
    ));
    const articles = await query<Article[]>(
      `SELECT * FROM articles WHERE status = 'published'
       AND source_url NOT LIKE 'https://news.google.com/%'
       ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20`
    );

    // Get trending articles across all categories (top 10)
    const trendingRows = await query<TrendingRow[]>(
      `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image, a.category,
              a.source_name, a.source_url, a.published_at,
              ta.ai_score, ta.ai_reasoning, ta.rank_position
       FROM trending_articles ta
       JOIN articles a ON ta.article_id = a.id
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
    }));

    // Rank publisher opens from the last 10 days.
    const mostViewed = await query<MostViewedArticle[]>(
      `SELECT a.id, a.title, a.slug, a.source_name, a.source_url, a.published_at,
              COUNT(sc.id) AS view_count
       FROM source_clicks sc JOIN articles a ON a.id = sc.article_id
       WHERE a.status = 'published' AND a.source_url NOT LIKE 'https://news.google.com/%'
         AND sc.created_at >= DATE_SUB(NOW(), INTERVAL 10 DAY)
       GROUP BY a.id, a.title, a.slug, a.source_name, a.source_url, a.published_at
       ORDER BY view_count DESC
       LIMIT 15`
    );

    // Fetch 3 latest articles per category for the scrollable Latest rail
    const categoryArticles = await Promise.all(
      LATEST_CATEGORIES.map(async (cat) => {
        const rows = await query<Article[]>(
          `SELECT id, title, slug, excerpt, category, source_name, source_url, published_at, created_at, view_count, reading_time, featured_image, status, featured, ai_generated, ai_confidence, requires_review
           FROM articles
           WHERE status = 'published' AND category = ? AND source_url NOT LIKE 'https://news.google.com/%'
           ORDER BY COALESCE(published_at, created_at) DESC LIMIT 3`,
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
      localArticles: distinctStories(localArticles),
      indiaArticles: distinctStories(indiaArticles),
    };
  } catch (error) {
    console.error('Homepage DB error:', error instanceof Error ? error.message : error);
    return { articles: [], trendingArticles: [], mostViewedArticles: [], categorySections: [], localArticles: [], indiaArticles: [] };
  }
}

export default async function HomePage() {
  const { articles, trendingArticles, mostViewedArticles, categorySections, localArticles, indiaArticles } = await getArticles();

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
      }));

  // Compose the broadsheet sections
  const rest = articles.slice(0);
  const latest = rest.slice(0, 6);                // fallback flat list
  const moreStories = rest.slice(6);              // date-grouped feed

  return (
    <div className="container mx-auto px-4 py-8 md:py-10">
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 pb-10 border-b-2 border-ink/85" aria-label="Local and India news">
        {([
          { title: 'Belagavi', href: '/belgaum', stories: localArticles, empty: 'Fresh English local stories will appear here as publisher feeds update.' },
          { title: 'India', href: '/india', stories: indiaArticles, empty: 'The latest India stories will appear here.' },
        ] as const).map(section => (
          <div key={section.title} className="min-w-0">
            <div className="mb-5 flex items-end justify-between gap-4 border-b border-hairline pb-3">
              <h2 className="font-display text-3xl md:text-4xl font-bold text-ink">{section.title}</h2>
              <Link href={section.href} className="text-xs font-bold uppercase tracking-widest text-primary hover:underline">More stories</Link>
            </div>
            {section.stories.length > 0 ? (
              <div className="space-y-5">
                <StoryCard article={section.stories[0]} />
                <div className="grid gap-4 sm:grid-cols-2">
                  {section.stories.slice(1, 3).map(story => <StoryCard key={story.id} article={story} variant="brief" />)}
                </div>
              </div>
            ) : <p className="py-12 text-sm text-muted">{section.empty}</p>}
          </div>
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

      {/* ── More Stories + Most Opened ── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 pt-10">
        <HomepageMoreStories initialArticles={moreStories} />

        {/* Most Opened sidebar */}
        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-20">
            <SectionHeading accent>Most Opened</SectionHeading>
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
