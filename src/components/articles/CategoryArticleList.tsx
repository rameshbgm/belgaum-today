'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { Article, Category, CATEGORY_META } from '@/types';
import { ArticleGrid } from './ArticleGrid';
import { CategorySearchHeader, SubCategory } from './CategorySearchHeader';
import { Button } from '@/components/ui';

interface CategoryArticleListProps {
    initialArticles: Article[];
    category: Category;
    subCategories: SubCategory[];
}

export function CategoryArticleList({ initialArticles, category, subCategories }: CategoryArticleListProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('all');
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length >= 20);

    const categoryMeta = CATEGORY_META[category];

    // Client-side filtering by subcategory and search query
    const filteredArticles = useMemo(() => {
        let filtered = articles;

        // Filter by subcategory (if not "all")
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
            {/* Category Header with Search and Filters */}
            <CategorySearchHeader
                category={category}
                subCategories={subCategories}
                selectedSubCategory={selectedSubCategory}
                onSubCategoryChange={setSelectedSubCategory}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                categoryName={categoryMeta.name}
                categoryColor={categoryMeta.color}
            />

            {/* Article Grid */}
            <ArticleGrid articles={filteredArticles} />

            {/* No results message */}
            {filteredArticles.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-gray-400 dark:text-gray-500 mb-2">
                        <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        No articles found
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {searchQuery
                            ? `No results for "${searchQuery}" in ${selectedSubCategory !== 'all' ? selectedSubCategory : categoryMeta.name}`
                            : `No articles available in ${selectedSubCategory !== 'all' ? selectedSubCategory : categoryMeta.name}`}
                    </p>
                </div>
            )}

            {/* Load More Button - only show when not filtering */}
            {!searchQuery && selectedSubCategory === 'all' && hasMore && filteredArticles.length > 0 && (
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

            {!searchQuery && selectedSubCategory === 'all' && !hasMore && articles.length > 0 && (
                <div className="mt-8 text-center text-gray-500 dark:text-gray-400">
                    No more articles to load
                </div>
            )}
        </div>
    );
}
