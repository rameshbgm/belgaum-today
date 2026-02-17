import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
    ChevronRight,
    Briefcase,
    Cpu,
    Trophy,
    Film,
    Globe,
    MapPin,
    Clock,
    Newspaper,
} from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { CategoryArticleList } from '@/components/articles';
import { Sidebar } from '@/components/layout';
import { getSubCategories } from '@/lib/category-filters';
import { TrendingCarousel, TrendingArticle } from '@/components/TrendingCarousel';
import { TrackingProvider } from '@/components/TrackingProvider';

const validCategories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

/* ── Per-category theme configuration ── */
const CATEGORY_THEME: Record<Category, {
    gradient: string;
    icon: React.ElementType;
    accentColor: string;
    title: string;
    tagline: string;
}> = {
    business: {
        gradient: 'from-emerald-700 via-emerald-600 to-teal-500',
        icon: Briefcase,
        accentColor: 'emerald',
        title: 'Business News',
        tagline: 'Markets, Economy & Industry Updates',
    },
    technology: {
        gradient: 'from-blue-700 via-cyan-600 to-blue-500',
        icon: Cpu,
        accentColor: 'blue',
        title: 'Technology News',
        tagline: 'Latest Tech, Science & Innovation',
    },
    sports: {
        gradient: 'from-red-700 via-red-600 to-orange-500',
        icon: Trophy,
        accentColor: 'red',
        title: 'Sports News',
        tagline: 'Cricket, Football, Tennis & More',
    },
    entertainment: {
        gradient: 'from-rose-700 via-pink-600 to-fuchsia-500',
        icon: Film,
        accentColor: 'rose',
        title: 'Entertainment News',
        tagline: 'Bollywood, Movies, Music & TV',
    },
    india: {
        gradient: 'from-orange-600 via-orange-500 to-amber-500',
        icon: Globe,
        accentColor: 'orange',
        title: 'India News',
        tagline: 'Latest Headlines & Breaking Stories',
    },
    belgaum: {
        gradient: 'from-purple-700 via-purple-600 to-indigo-500',
        icon: MapPin,
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
            `SELECT * FROM articles WHERE status = 'published' AND category = ? ORDER BY published_at DESC LIMIT 20`,
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
    const meta = CATEGORY_META[typedCategory];
    const theme = CATEGORY_THEME[typedCategory];
    const Icon = theme.icon;

    const [articles, trendingArticles, lastUpdated, sourceCount] = await Promise.all([
        getCategoryArticles(typedCategory),
        getTrendingArticles(typedCategory),
        getLastUpdated(typedCategory),
        getSourceCount(typedCategory),
    ]);

    const subCategories = getSubCategories(typedCategory);

    return (
        <TrackingProvider category={typedCategory}>
            {/* ── Themed Gradient Header ── */}
            <section className={`relative bg-gradient-to-r ${theme.gradient} text-white overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 py-10 md:py-14 relative z-10">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-white/70 mb-4">
                        <Link href="/" className="hover:text-white transition-colors">
                            Home
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="font-medium text-white">{meta.name}</span>
                    </nav>

                    <div className="flex items-center gap-4 mb-3">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Icon className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
                                {theme.title}
                            </h1>
                            <p className="text-white/80 text-base md:text-lg mt-1">
                                {theme.tagline}
                            </p>
                        </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-white/70">
                        <span className="flex items-center gap-1.5">
                            <Newspaper className="w-4 h-4" />
                            {articles.length} articles
                        </span>
                        {sourceCount > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Globe className="w-4 h-4" />
                                {sourceCount} sources
                            </span>
                        )}
                        {lastUpdated && (
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </span>
                        )}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-8">
                {/* ── Trending Carousel ── */}
                {trendingArticles.length > 0 && (
                    <div className="mb-10">
                        <TrendingCarousel articles={trendingArticles} accentColor={theme.accentColor} />
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        <CategoryArticleList
                            initialArticles={articles}
                            category={typedCategory}
                            subCategories={subCategories}
                        />
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1 mt-8 lg:mt-0">
                        <Sidebar showCategories />
                    </aside>
                </div>
            </div>
        </TrackingProvider>
    );
}
