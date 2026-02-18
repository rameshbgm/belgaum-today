import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';

interface ArticleGridProps {
    articles: Article[];
    priority?: boolean;
    columns?: 1 | 2 | 3;
    compact?: boolean;
}

export function ArticleGrid({ articles, priority = false, columns = 3, compact = false }: ArticleGridProps) {
    if (articles.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    No articles found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                    Check back later for more news updates.
                </p>
            </div>
        );
    }

    const gridClass = columns === 1
        ? "flex flex-col gap-4"
        : "grid grid-cols-2 gap-3 sm:gap-4 md:gap-5";

    return (
        <div className={gridClass}>
            {articles.map((article, index) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    priority={priority && index < 3}
                    compact={compact}
                />
            ))}
        </div>
    );
}
