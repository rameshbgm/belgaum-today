'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Article } from '@/types';
import { ArticleGrid } from './ArticleGrid';
import { Button, Input } from '@/components/ui';

interface CategoryArticleListProps {
    initialArticles: Article[];
    category: string;
}

export function CategoryArticleList({ initialArticles, category }: CategoryArticleListProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length >= 20);

    // Client-side search filtering
    const filteredArticles = useMemo(() => {
        if (!searchQuery.trim()) return articles;

        const query = searchQuery.toLowerCase();
        return articles.filter(
            (article) =>
                article.title.toLowerCase().includes(query) ||
                article.excerpt?.toLowerCase().includes(query) ||
                article.source_name.toLowerCase().includes(query)
        );
    }, [articles, searchQuery]);

    const loadMore = async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            // Get the oldest article's published_at date
            const oldestArticle = articles[articles.length - 1];
            const beforeDate = new Date(oldestArticle.published_at);
            const beforeDateStr = beforeDate.toISOString().split('T')[0]; // YYYY-MM-DD format

            const params = new URLSearchParams({
                before: beforeDateStr,
                limit: '20',
                category: category,
            });

            const response = await fetch(`/api/articles?${params.toString()}`);
            const data = await response.json();

            if (data.success && data.data.items.length > 0) {
                setArticles((prev) => [...prev, ...data.data.items]);
                setHasMore(data.data.items.length >= 20);
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
        <div>
            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 py-2.5"
                    />
                </div>
                {searchQuery && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Found {filteredArticles.length} article{filteredArticles.length !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Article Grid */}
            <ArticleGrid articles={filteredArticles} />

            {/* No results message */}
            {searchQuery && filteredArticles.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 dark:text-gray-400">
                        No articles found for &quot;{searchQuery}&quot;
                    </p>
                </div>
            )}

            {/* Load More Button - only show when not searching */}
            {!searchQuery && hasMore && (
                <div className="mt-8 text-center">
                    <Button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-8 py-3"
                    >
                        {loading ? 'Loading...' : 'Load More'}
                    </Button>
                </div>
            )}

            {!searchQuery && !hasMore && articles.length > 0 && (
                <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    No more articles to load
                </div>
            )}
        </div>
    );
}
