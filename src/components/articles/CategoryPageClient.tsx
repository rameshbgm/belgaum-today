'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, Search, X, Briefcase, Cpu, Trophy, Film, Globe, MapPin } from 'lucide-react';
import { Article, Category, CATEGORY_META } from '@/types';
import { ArticleGrid } from './ArticleGrid';
import { Button } from '@/components/ui';
import { SubCategory } from './CategorySearchHeader';
import { TrendingCarousel, TrendingArticle } from '@/components/TrendingCarousel';
import { Sidebar } from '@/components/layout';
import { TrackingProvider } from '@/components/TrackingProvider';

// Icon mapping
const ICON_MAP: Record<string, React.ElementType> = {
    Briefcase,
    Cpu,
    Trophy,
    Film,
    Globe,
    MapPin,
};

interface CategoryPageClientProps {
    category: Category;
    initialArticles: Article[];
    subCategories: SubCategory[];
    trendingArticles: TrendingArticle[];
    theme: {
        gradient: string;
        iconName: string;
        accentColor: string;
        title: string;
        tagline: string;
    };
    stats: {
        articleCount: number;
        sourceCount: number;
        lastUpdated: string | null;
    };
}

export function CategoryPageClient({
    category,
    initialArticles,
    subCategories,
    trendingArticles,
    theme,
    stats,
}: CategoryPageClientProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length >= 20);
    const [showSearch, setShowSearch] = useState(false);

    const categoryMeta = CATEGORY_META[category];
    const Icon = ICON_MAP[theme.iconName] || MapPin; // Fallback to MapPin if icon not found

    // Client-side filtering
    const filteredArticles = useMemo(() => {
        let filtered = articles;

        // Filter by subcategory
        if (selectedSubCategory !== 'all') {
            const searchTerm = selectedSubCategory.toLowerCase();
            filtered = articles.filter(
                (article) =>
                    article.title.toLowerCase().includes(searchTerm) ||
                    article.excerpt?.toLowerCase().includes(searchTerm) ||
                    article.content.toLowerCase().includes(searchTerm)
            );
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (article) =>
                    article.title.toLowerCase().includes(query) ||
                    article.excerpt?.toLowerCase().includes(query) ||
                    article.source_name.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [articles, selectedSubCategory, searchQuery]);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const oldestArticle = articles[articles.length - 1];
            // Use published_at if available, fallback to created_at
            const dateToUse = oldestArticle.published_at || oldestArticle.created_at;
            const beforeTimestamp = new Date(dateToUse).toISOString();

            const params = new URLSearchParams({
                before: beforeTimestamp,
                limit: '20',
                category: category,
            });

            const response = await fetch(`/api/articles?${params.toString()}`);
            const data = await response.json();

            if (data.success && data.data.items.length > 0) {
                // Filter out articles we already have (by ID) to avoid duplicates
                const existingIds = new Set(articles.map(a => a.id));
                const newArticles = data.data.items.filter((a: Article) => !existingIds.has(a.id));
                
                if (newArticles.length > 0) {
                    setArticles((prev) => [...prev, ...newArticles]);
                    setHasMore(data.data.items.length >= 20);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error('Error loading more articles:', error);
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <TrackingProvider category={category}>
            {/* ── Themed Gradient Header with Filters ── */}
            <section className={`relative bg-gradient-to-r ${theme.gradient} text-white overflow-hidden`}>
                {/* Background decoration */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl" />
                    <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-white rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 py-3 md:py-6 relative z-10">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-white/70 mb-2 md:mb-3">
                        <Link href="/" className="hover:text-white transition-colors">
                            Home
                        </Link>
                        <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="font-medium text-white">{categoryMeta.name}</span>
                    </nav>

                    {/* Title Row with Search */}
                    <div className="flex items-center justify-between gap-2 sm:gap-4 mb-3 md:mb-4">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                            {categoryMeta.name}
                        </h1>

                        {/* Search Button */}
                        <button
                            onClick={() => setShowSearch(!showSearch)}
                            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg transition-all border border-white/20"
                        >
                            {showSearch ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Search className="w-4 h-4 sm:w-5 sm:h-5" />}
                            <span className="hidden sm:inline text-sm">Search</span>
                        </button>
                    </div>

                    {/* Expandable Search Input */}
                    {showSearch && (
                        <div className="mb-3 md:mb-4">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search in ${categoryMeta.name}...`}
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30"
                                autoFocus
                            />
                            {searchQuery && (
                                <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-white/70">
                                    Found {filteredArticles.length} {filteredArticles.length === 1 ? 'article' : 'articles'}
                                </p>
                            )}
                        </div>
                    )}

                    {/* Subcategory Filter Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1">
                        {subCategories.map((sub) => (
                            <button
                                key={sub.id}
                                onClick={() => setSelectedSubCategory(sub.id)}
                                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                                    selectedSubCategory === sub.id
                                        ? 'bg-white text-gray-900 shadow-lg'
                                        : 'bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20'
                                }`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            <div className="container mx-auto px-4 py-6">
                {/* ── Trending Carousel ── */}
                {trendingArticles.length > 0 && (
                    <div className="mb-6">
                        <TrendingCarousel articles={trendingArticles} accentColor={theme.accentColor} />
                    </div>
                )}

                <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-3">
                        {/* Article Grid */}
                        <ArticleGrid articles={filteredArticles} columns={2} compact={true} />

                        {/* No results message */}
                        {filteredArticles.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div className="text-gray-400 dark:text-gray-500 mb-2">
                                    <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                </div>
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                                    No articles found
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                    {searchQuery
                                        ? `No results for "${searchQuery}"`
                                        : `No articles in ${selectedSubCategory !== 'all' ? subCategories.find(s => s.id === selectedSubCategory)?.label : categoryMeta.name}`}
                                </p>
                            </div>
                        )}

                        {/* Load More Button */}
                        {!searchQuery && selectedSubCategory === 'all' && hasMore && filteredArticles.length > 0 && (
                            <div className="mt-8 text-center">
                                <Button
                                    onClick={loadMore}
                                    disabled={loading}
                                    className="px-8 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                                >
                                    {loading ? 'Loading...' : 'Load More'}
                                </Button>
                            </div>
                        )}

                        {!searchQuery && selectedSubCategory === 'all' && !hasMore && articles.length > 0 && (
                            <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                No more articles to load
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <aside className="lg:col-span-1 mt-8 lg:mt-0">
                        <Sidebar showCategories={false} showRss={false} showAds={true} />
                    </aside>
                </div>
            </div>
        </TrackingProvider>
    );
}
