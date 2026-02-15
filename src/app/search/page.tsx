'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, SlidersHorizontal, History } from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { ArticleGrid } from '@/components/articles';
import { Article, CATEGORY_META, Category } from '@/types';
import { debounce } from '@/lib/utils';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [category, setCategory] = useState<Category | ''>(searchParams.get('category') as Category || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');
    const [sortBy, setSortBy] = useState<'newest' | 'views' | 'relevant'>(
        (searchParams.get('sortBy') as 'newest' | 'views' | 'relevant') || 'newest'
    );

    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    // Load search history from localStorage
    useEffect(() => {
        const history = localStorage.getItem('searchHistory');
        if (history) {
            setSearchHistory(JSON.parse(history));
        }
    }, []);

    // Save search to history
    const saveToHistory = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        const newHistory = [
            searchQuery,
            ...searchHistory.filter(h => h !== searchQuery),
        ].slice(0, 5);

        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
    }, [searchHistory]);

    // Perform search
    const performSearch = useCallback(async () => {
        setIsLoading(true);

        // Update URL params
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (category) params.set('category', category);
        if (startDate) params.set('startDate', startDate);
        if (endDate) params.set('endDate', endDate);
        if (sortBy !== 'newest') params.set('sortBy', sortBy);

        router.replace(`/search?${params.toString()}`, { scroll: false });

        try {
            const response = await fetch(`/api/search?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                setArticles(data.data);
                if (query) saveToHistory(query);
            } else {
                setArticles([]);
            }
        } catch (error) {
            console.error('Search error:', error);
            setArticles([]);
        } finally {
            setIsLoading(false);
        }
    }, [query, category, startDate, endDate, sortBy, router, saveToHistory]);

    // Debounced search
    const debouncedSearch = useCallback(
        debounce(() => {
            performSearch();
        }, 300),
        [performSearch]
    );

    // Trigger search on filter changes
    useEffect(() => {
        debouncedSearch();
    }, [query, category, startDate, endDate, sortBy]);

    // Clear all filters
    const clearFilters = () => {
        setQuery('');
        setCategory('');
        setStartDate('');
        setEndDate('');
        setSortBy('newest');
    };

    // Use history item
    const useHistoryItem = (item: string) => {
        setQuery(item);
    };

    // Clear history
    const clearHistory = () => {
        setSearchHistory([]);
        localStorage.removeItem('searchHistory');
    };

    const hasFilters = category || startDate || endDate || sortBy !== 'newest';

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
                Advanced Search
            </h1>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <Input
                            type="text"
                            placeholder="Search articles..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            icon={<Search className="w-5 h-5" />}
                            className="pr-10"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                aria-label="Clear search"
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        Filters
                        {hasFilters && (
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                    </Button>
                </div>

                {/* Filters Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Category */}
                        <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Category
                            </label>
                            <select
                                id="category"
                                value={category}
                                onChange={(e) => setCategory(e.target.value as Category | '')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Categories</option>
                                {categories.map((cat) => (
                                    <option key={cat} value={cat}>
                                        {CATEGORY_META[cat].name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                From Date
                            </label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                To Date
                            </label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>

                        {/* Sort By */}
                        <div>
                            <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                                Sort By
                            </label>
                            <select
                                id="sortBy"
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'newest' | 'views' | 'relevant')}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="newest">Newest First</option>
                                <option value="views">Most Viewed</option>
                                <option value="relevant">Most Relevant</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Clear Filters */}
                {hasFilters && (
                    <div className="mt-4 flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-gray-500">Active filters:</span>
                        {category && (
                            <Badge variant="info" size="sm" className="flex items-center gap-1">
                                {CATEGORY_META[category].name}
                                <button onClick={() => setCategory('')} aria-label={`Remove ${CATEGORY_META[category].name} filter`}>
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        {startDate && (
                            <Badge variant="info" size="sm" className="flex items-center gap-1">
                                From: {startDate}
                                <button onClick={() => setStartDate('')} aria-label="Remove start date filter">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        {endDate && (
                            <Badge variant="info" size="sm" className="flex items-center gap-1">
                                To: {endDate}
                                <button onClick={() => setEndDate('')} aria-label="Remove end date filter">
                                    <X className="w-3 h-3" />
                                </button>
                            </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                            Clear All
                        </Button>
                    </div>
                )}
            </div>

            {/* Search History */}
            {!query && searchHistory.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                            <History className="w-4 h-4" />
                            Recent Searches
                        </h3>
                        <button
                            onClick={clearHistory}
                            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                            Clear
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {searchHistory.map((item, index) => (
                            <button
                                key={index}
                                onClick={() => useHistoryItem(item)}
                                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {item}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Results */}
            <div className="mb-4">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-r-transparent" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
                    </div>
                ) : (
                    <>
                        {query && (
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                {articles.length} results for &quot;{query}&quot;
                            </p>
                        )}
                        <ArticleGrid articles={articles} />
                    </>
                )}
            </div>
        </div>
    );
}

function SearchLoading() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="animate-pulse">
                <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchLoading />}>
            <SearchContent />
        </Suspense>
    );
}
