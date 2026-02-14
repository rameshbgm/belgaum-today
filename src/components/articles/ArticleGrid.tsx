import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';

interface ArticleGridProps {
    articles: Article[];
    priority?: boolean;
}

export function ArticleGrid({ articles, priority = false }: ArticleGridProps) {
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

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, index) => (
                <ArticleCard
                    key={article.id}
                    article={article}
                    priority={priority && index < 3}
                />
            ))}
        </div>
    );
}
