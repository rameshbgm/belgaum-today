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
        gradient: 'from-teal-800 via-teal-700 to-emerald-600',
        iconName: 'Briefcase',
        accentColor: 'saffron',
        title: 'Business News',
        tagline: 'Markets, Economy & Industry Updates',
    },
    technology: {
        gradient: 'from-[#1A1712] via-teal-800 to-teal-600',
        iconName: 'Cpu',
        accentColor: 'saffron',
        title: 'Technology News',
        tagline: 'Latest Tech, Science & Innovation',
    },
    sports: {
        gradient: 'from-[#7C2D12] via-[#C2410C] to-[#E8590C]',
        iconName: 'Trophy',
        accentColor: 'saffron',
        title: 'Sports News',
        tagline: 'Cricket, Football, Tennis & More',
    },
    entertainment: {
        gradient: 'from-[#881337] via-rose-700 to-[#E8590C]',
        iconName: 'Film',
        accentColor: 'saffron',
        title: 'Entertainment News',
        tagline: 'Bollywood, Movies, Music & TV',
    },
    india: {
        gradient: 'from-[#9A3412] via-[#C2410C] to-[#E8590C]',
        iconName: 'Globe',
        accentColor: 'saffron',
        title: 'India News',
        tagline: 'Latest Headlines & Breaking Stories',
    },
    belgaum: {
        gradient: 'from-[#1A1712] via-[#7C2D12] to-[#C2410C]',
        iconName: 'MapPin',
        accentColor: 'saffron',
        title: 'Belgaum News',
        tagline: 'Local News from Belgaum Region',
    },
    travel: {
        gradient: 'from-[#0c4a6e] via-[#0369a1] to-[#0ea5e9]',
        iconName: 'Plane',
        accentColor: 'saffron',
        title: 'Travel',
        tagline: 'Destinations, Guides & Adventures',
    },
    science: {
        gradient: 'from-[#4c1d95] via-[#6d28d9] to-[#7c3aed]',
        iconName: 'Microscope',
        accentColor: 'saffron',
        title: 'Science',
        tagline: 'Discoveries, Research & Innovation',
    },
    health: {
        gradient: 'from-[#064e3b] via-[#059669] to-[#10b981]',
        iconName: 'Heart',
        accentColor: 'saffron',
        title: 'Health',
        tagline: 'Wellness, Medicine & Healthy Living',
    },
    lifestyle: {
        gradient: 'from-[#831843] via-[#db2777] to-[#f472b6]',
        iconName: 'Sparkles',
        accentColor: 'saffron',
        title: 'Lifestyle',
        tagline: 'Fashion, Personal Growth & Living Well',
    },
    food: {
        gradient: 'from-[#78350f] via-[#d97706] to-[#f59e0b]',
        iconName: 'UtensilsCrossed',
        accentColor: 'saffron',
        title: 'Food',
        tagline: 'Recipes, Cuisine & Food Culture',
    },
    education: {
        gradient: 'from-[#1e3a8a] via-[#2563eb] to-[#3b82f6]',
        iconName: 'BookOpen',
        accentColor: 'saffron',
        title: 'Education',
        tagline: 'Learning, Schools & Skill Development',
    },
    environment: {
        gradient: 'from-[#14532d] via-[#16a34a] to-[#22c55e]',
        iconName: 'Leaf',
        accentColor: 'saffron',
        title: 'Environment',
        tagline: 'Climate, Sustainability & Green Living',
    },
    culture: {
        gradient: 'from-[#581c87] via-[#9333ea] to-[#a855f7]',
        iconName: 'Palette',
        accentColor: 'saffron',
        title: 'Culture',
        tagline: 'Art, Heritage & Society',
    },
    finance: {
        gradient: 'from-[#713f12] via-[#ca8a04] to-[#eab308]',
        iconName: 'TrendingUp',
        accentColor: 'saffron',
        title: 'Finance',
        tagline: 'Personal Finance, Investing & Markets',
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
            `SELECT a.id, a.title, a.slug, a.excerpt, a.featured_image,
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
