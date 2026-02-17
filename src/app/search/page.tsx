'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, X, History } from 'lucide-react';
import { Button, Input, Badge } from '@/components/ui';
import { ArticleGrid } from '@/components/articles';
import { Article, CATEGORY_META, Category } from '@/types';

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
    const [hasSearched, setHasSearched] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);
    const [validationError, setValidationError] = useState<string>('');

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

    // Validate required fields
    const validateSearch = useCallback(() => {
        if (!query.trim()) {
            setValidationError('Search text is required');
            return false;
        }
        if (!category) {
            setValidationError('Category is required');
            return false;
        }
        if (!startDate) {
            setValidationError('From date is required');
            return false;
        }
        if (!endDate) {
            setValidationError('To date is required');
            return false;
        }
        if (new Date(startDate) > new Date(endDate)) {
            setValidationError('From date must be before To date');
            return false;
        }
        setValidationError('');
        return true;
    }, [query, category, startDate, endDate]);

    // Perform search
    const performSearch = useCallback(async () => {
        if (!validateSearch()) {
            return;
        }

        setIsLoading(true);
        setHasSearched(true);

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
    }, [query, category, startDate, endDate, sortBy, router, saveToHistory, validateSearch]);

    // Handle Enter key press
    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    }, [performSearch]);

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
                            onKeyPress={handleKeyPress}
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
                        onClick={performSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 min-w-[120px]"
                    >
                        <Search className="w-4 h-4" />
                        {isLoading ? 'Searching...' : 'Search'}
                    </Button>
                </div>

                {/* Validation Error */}
                {validationError && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                    </div>
                )}

                {/* Filters Panel - Always Visible */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                            Category <span className="text-red-500">*</span>
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
                            From Date <span className="text-red-500">*</span>
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
                            To Date <span className="text-red-500">*</span>
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
                {!hasSearched ? (
                    <div className="text-center py-16">
                        <Search className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Search for Articles
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                            Fill in the search criteria and click Search to find articles
                        </p>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-r-transparent" />
                        <p className="mt-4 text-gray-600 dark:text-gray-400">Searching...</p>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <p className="text-gray-600 dark:text-gray-400">
                                {articles.length} {articles.length === 1 ? 'result' : 'results'} found{query && <> for &quot;{query}&quot;</>}
                            </p>
                        </div>
                        {articles.length > 0 ? (
                            <ArticleGrid articles={articles} />
                        ) : (
                            <div className="text-center py-16">
                                <X className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    No Results Found
                                </h3>
                                <p className="text-gray-500 dark:text-gray-400">
                                    Try adjusting your search criteria
                                </p>
                            </div>
                        )}
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
