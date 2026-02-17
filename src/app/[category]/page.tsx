import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { CategoryPageClient } from '@/components/articles';
import { getSubCategories } from '@/lib/category-filters';
import { TrendingArticle } from '@/components/TrendingCarousel';

const validCategories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

/* ── Per-category theme configuration ── */
const CATEGORY_THEME: Record<Category, {
    gradient: string;
    iconName: string;
    accentColor: string;
    title: string;
    tagline: string;
}> = {
    business: {
        gradient: 'from-emerald-700 via-emerald-600 to-teal-500',
        iconName: 'Briefcase',
        accentColor: 'emerald',
        title: 'Business News',
        tagline: 'Markets, Economy & Industry Updates',
    },
    technology: {
        gradient: 'from-blue-700 via-cyan-600 to-blue-500',
        iconName: 'Cpu',
        accentColor: 'blue',
        title: 'Technology News',
        tagline: 'Latest Tech, Science & Innovation',
    },
    sports: {
        gradient: 'from-red-700 via-red-600 to-orange-500',
        iconName: 'Trophy',
        accentColor: 'red',
        title: 'Sports News',
        tagline: 'Cricket, Football, Tennis & More',
    },
    entertainment: {
        gradient: 'from-rose-700 via-pink-600 to-fuchsia-500',
        iconName: 'Film',
        accentColor: 'rose',
        title: 'Entertainment News',
        tagline: 'Bollywood, Movies, Music & TV',
    },
    india: {
        gradient: 'from-orange-600 via-orange-500 to-amber-500',
        iconName: 'Globe',
        accentColor: 'orange',
        title: 'India News',
        tagline: 'Latest Headlines & Breaking Stories',
    },
    belgaum: {
        gradient: 'from-purple-700 via-purple-600 to-indigo-500',
        iconName: 'MapPin',
        accentColor: 'orange',
        title: 'Belgaum News',
        tagline: 'Local News from Belgaum Region',
    },
};

type Props = {
    params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;

    if (!validCategories.includes(category as Category)) {
        return { title: 'Not Found' };
    }

    const cat = category as Category;
    const theme = CATEGORY_THEME[cat];
    const meta = CATEGORY_META[cat];
    return {
        title: `${theme.title} — ${theme.tagline}`,
        description: meta.description,
        openGraph: {
            title: `${theme.title} — ${theme.tagline} | Belgaum Today`,
            description: meta.description,
        },
    };
}

export async function generateStaticParams() {
    return validCategories.map((category) => ({ category }));
}

async function getCategoryArticles(category: Category): Promise<Article[]> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published' AND category = ? ORDER BY COALESCE(published_at, created_at) DESC LIMIT 20`,
            [category]
        );
        return articles;
    } catch (error) {
        console.error(`[${category}] DB error:`, error instanceof Error ? error.message : error);
        return [];
    }
}

async function getTrendingArticles(category: Category): Promise<TrendingArticle[]> {
    try {
        const rows = await query<TrendingArticle[]>(
            `SELECT a.id, a.title, a.excerpt, a.featured_image,
                    a.source_name, a.source_url, a.published_at,
                    ta.ai_score, ta.ai_reasoning, ta.rank_position
             FROM trending_articles ta
             JOIN articles a ON ta.article_id = a.id
             WHERE ta.category = ?
             ORDER BY ta.rank_position ASC
             LIMIT 5`,
            [category]
        );
        return rows;
    } catch {
        return [];
    }
}

async function getLastUpdated(category: Category): Promise<string | null> {
    try {
        const rows = await query<{ last_fetched_at: string }[]>(
            `SELECT MAX(last_fetched_at) as last_fetched_at FROM rss_feed_config WHERE category = ? AND is_active = 1`,
            [category]
        );
        return rows[0]?.last_fetched_at || null;
    } catch {
        return null;
    }
}

async function getSourceCount(category: Category): Promise<number> {
    try {
        const rows = await query<{ cnt: number }[]>(
            `SELECT COUNT(*) as cnt FROM rss_feed_config WHERE category = ? AND is_active = 1`,
            [category]
        );
        return rows[0]?.cnt || 0;
    } catch {
        return 0;
    }
}

export default async function CategoryPage({ params }: Props) {
    const { category } = await params;

    if (!validCategories.includes(category as Category)) {
        notFound();
    }

    const typedCategory = category as Category;
    const theme = CATEGORY_THEME[typedCategory];

    const [articles, trendingArticles, lastUpdated, sourceCount] = await Promise.all([
        getCategoryArticles(typedCategory),
        getTrendingArticles(typedCategory),
        getLastUpdated(typedCategory),
        getSourceCount(typedCategory),
    ]);

    const subCategories = getSubCategories(typedCategory);

    return (
        <CategoryPageClient
            category={typedCategory}
            initialArticles={articles}
            subCategories={subCategories}
            trendingArticles={trendingArticles}
            theme={theme}
            stats={{
                articleCount: articles.length,
                sourceCount,
                lastUpdated,
            }}
        />
    );
}
