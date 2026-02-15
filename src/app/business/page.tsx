import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ExternalLink, TrendingUp, ChevronRight, Rss, Briefcase, BarChart3, Building2, Wheat, Globe } from 'lucide-react';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';
import { TrendingCarousel, TrendingArticle } from '@/components/TrendingCarousel';
import { TrackingProvider } from '@/components/TrackingProvider';

export const metadata: Metadata = {
    title: 'Business News — Markets, Economy & Industry Updates',
    description: 'Stay ahead with the latest business news covering markets, economy, industry, agri-business, and budget updates from Hindustan Times and The Hindu.',
    openGraph: {
        title: 'Business News — Belgaum Today',
        description: 'Latest business news — Markets, Economy, Industry & more',
        type: 'website',
    },
};

export const dynamic = 'force-dynamic';
export const revalidate = 300;

const SOURCE_COLORS: Record<string, { bg: string }> = {
    'Hindustan Times': { bg: 'bg-orange-500' },
    'The Hindu': { bg: 'bg-blue-600' },
};

const SUB_CATEGORIES = [
    { name: 'All Business', icon: Briefcase, active: true },
    { name: 'Markets', icon: BarChart3 },
    { name: 'Economy', icon: Globe },
    { name: 'Industry', icon: Building2 },
    { name: 'Agri-Business', icon: Wheat },
];

export default async function BusinessNewsPage() {
    let articles: Article[] = [];
    let trendingArticles: TrendingArticle[] = [];
    let lastUpdated: string | null = null;

    try {
        // Get trending business articles
        trendingArticles = await query<TrendingArticle[]>(
            `SELECT a.id, a.title, a.excerpt, a.featured_image, a.source_name, a.source_url, a.published_at,
                    t.ai_score, t.ai_reasoning, t.rank_position
             FROM trending_articles t
             JOIN articles a ON t.article_id = a.id
             WHERE t.category = 'business' AND a.status = 'published'
             ORDER BY t.rank_position ASC
             LIMIT 5`
        );

        const trendingIds = trendingArticles.map(a => a.id);
        const excludeClause = trendingIds.length > 0
            ? `AND id NOT IN (${trendingIds.join(',')})`
            : '';

        articles = await query<Article[]>(
            `SELECT * FROM articles WHERE category = 'business' AND status = 'published' ${excludeClause} ORDER BY published_at DESC LIMIT 50`
        );

        // Fallback if no trending data
        if (trendingArticles.length === 0 && articles.length > 0) {
            trendingArticles = articles.slice(0, 5).map((a, i) => ({
                id: a.id,
                title: a.title,
                excerpt: a.excerpt || '',
                featured_image: a.featured_image || null,
                source_name: a.source_name,
                source_url: a.source_url,
                published_at: a.published_at as unknown as string,
                rank_position: i + 1,
            }));
            articles = articles.slice(5);
        }

        const feedStatus = await query<{ last_fetched_at: Date }[]>(
            `SELECT last_fetched_at FROM rss_feed_config WHERE category = 'business' AND is_active = true ORDER BY last_fetched_at DESC LIMIT 1`
        );
        if (feedStatus[0]?.last_fetched_at) {
            lastUpdated = formatRelativeTime(feedStatus[0].last_fetched_at);
        }
    } catch (error) {
        console.error('Error loading business news:', error);
    }

    const hasNews = trendingArticles.length > 0 || articles.length > 0;
    const sources = [...new Set([
        ...trendingArticles.map(t => t.source_name),
        ...articles.map(a => a.source_name)
    ])];

    return (
        <TrackingProvider category="business">
            <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
                {/* Page Header — Emerald theme */}
                <section className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500 dark:from-emerald-900 dark:via-emerald-800 dark:to-teal-700">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                                    <Briefcase className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-white">Business News</h1>
                                    <p className="text-emerald-100 text-sm mt-0.5">Markets, Economy, Industry & More</p>
                                </div>
                            </div>
                            <div className="hidden sm:flex items-center gap-4 text-sm text-emerald-100">
                                {lastUpdated && (
                                    <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                        <Rss className="w-3.5 h-3.5" />
                                        Updated {lastUpdated}
                                    </span>
                                )}
                                <span className="bg-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                                    {trendingArticles.length + articles.length} stories
                                </span>
                            </div>
                        </div>

                        {/* Sub-category pills */}
                        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {SUB_CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                return (
                                    <span
                                        key={cat.name}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${cat.active
                                                ? 'bg-white text-emerald-700'
                                                : 'bg-white/10 text-white/80 hover:bg-white/20'
                                            }`}
                                    >
                                        <Icon className="w-3.5 h-3.5" />
                                        {cat.name}
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {!hasNews ? (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                        <div className="text-center">
                            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Briefcase className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">No Business News Yet</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                Business news articles are being fetched from our sources. Please check back shortly.
                            </p>
                        </div>
                    </section>
                ) : (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                            {/* Main Content */}
                            <div className="lg:col-span-8 xl:col-span-9">
                                {/* Hero Carousel */}
                                {trendingArticles.length > 0 && (
                                    <div className="mb-8">
                                        <TrendingCarousel articles={trendingArticles} accentColor="emerald" />
                                    </div>
                                )}

                                {/* Section Title */}
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        <BarChart3 className="w-5 h-5 text-emerald-500" />
                                        Latest Business Stories
                                    </h2>
                                </div>

                                {/* News Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {articles.map((article, index) => (
                                        <a
                                            key={article.id}
                                            href={article.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            data-article-id={article.id}
                                            data-source-name={article.source_name}
                                            className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-emerald-400/50"
                                        >
                                            <div className="relative aspect-video overflow-hidden">
                                                {article.featured_image ? (
                                                    <Image
                                                        src={article.featured_image}
                                                        alt={article.title}
                                                        fill
                                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                        priority={index < 3}
                                                        unoptimized
                                                    />
                                                ) : (
                                                    <NewsFallbackImage />
                                                )}
                                                <div className="absolute top-3 left-3">
                                                    <span className={`px-2.5 py-1 ${SOURCE_COLORS[article.source_name]?.bg || 'bg-gray-500'} text-white text-xs font-semibold rounded-full shadow-lg`}>
                                                        {article.source_name}
                                                    </span>
                                                </div>
                                                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <span className="bg-black/60 text-white p-1.5 rounded-full flex items-center justify-center backdrop-blur-sm">
                                                        <ExternalLink className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="p-4">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-snug">
                                                    {article.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                                                    {truncate(article.excerpt || '', 120)}
                                                </p>
                                                <div className="flex items-center justify-between text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(article.published_at || article.created_at)}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-emerald-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                                                        Read <ChevronRight className="w-3 h-3" />
                                                    </span>
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            </div>

                            {/* Sidebar */}
                            <aside className="lg:col-span-4 xl:col-span-3 mt-8 lg:mt-0">
                                <div className="sticky top-24 space-y-6">
                                    {/* Sources */}
                                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                                            <Rss className="w-4 h-4 text-emerald-500" />
                                            News Sources
                                        </h3>
                                        <div className="space-y-3">
                                            {sources.map((source) => {
                                                const count = [...trendingArticles.map(t => t.source_name), ...articles.map(a => a.source_name)]
                                                    .filter(s => s === source).length;
                                                return (
                                                    <div key={source} className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2.5">
                                                            <span className={`w-2.5 h-2.5 rounded-full ${SOURCE_COLORS[source]?.bg || 'bg-gray-500'}`} />
                                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{source}</span>
                                                        </div>
                                                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                                                            {count}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* More Categories */}
                                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
                                            More Categories
                                        </h3>
                                        <div className="space-y-1">
                                            {[
                                                { name: 'India', slug: 'india', emoji: '🇮🇳' },
                                                { name: 'Technology', slug: 'technology', emoji: '💻' },
                                                { name: 'Sports', slug: 'sports', emoji: '⚽' },
                                                { name: 'Entertainment', slug: 'entertainment', emoji: '🎬' },
                                                { name: 'Belgaum', slug: 'belgaum', emoji: '🏛️' },
                                            ].map((cat) => (
                                                <Link
                                                    key={cat.slug}
                                                    href={`/${cat.slug}`}
                                                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 hover:bg-emerald-50 dark:hover:bg-gray-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                                                >
                                                    <span>{cat.emoji}</span>
                                                    <span>{cat.name}</span>
                                                    <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-50" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Info Card */}
                                    <div className="bg-gradient-to-br from-emerald-600 to-teal-600 rounded-xl p-5 text-white">
                                        <h3 className="font-bold mb-2 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Business Insights
                                        </h3>
                                        <p className="text-sm text-emerald-100 mb-3 leading-relaxed">
                                            Business news sourced from 6 specialized feeds covering markets, economy, industry, agri-business, and budget.
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-emerald-200">
                                            <Rss className="w-3.5 h-3.5" />
                                            6 RSS feeds • Auto-updated
                                        </div>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </div>
                )}
            </main>
        </TrackingProvider>
    );
}
