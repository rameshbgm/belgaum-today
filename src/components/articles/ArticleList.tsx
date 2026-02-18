'use client';

import { useState } from 'react';
import { Article } from '@/types';
import { ArticleGrid } from './ArticleGrid';
import { Button } from '@/components/ui';

interface ArticleListProps {
    initialArticles: Article[];
    category?: string;
    columns?: 1 | 2 | 3;
    compact?: boolean;
}

export function ArticleList({ initialArticles, category, columns = 3, compact = false }: ArticleListProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length >= 20);

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
            });

            if (category && category !== 'all') {
                params.append('category', category);
            }

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
            <ArticleGrid articles={articles} columns={columns} compact={compact} />
            
            {hasMore && (
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
            
            {!hasMore && articles.length > 0 && (
                <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    No more articles to load
                </div>
            )}
        </div>
    );
}
