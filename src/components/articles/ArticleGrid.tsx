import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';
export function ArticleGrid({ articles, columns = 3, compact = false, priority = false }: { articles: Article[]; columns?: 1 | 2 | 3 | 4; compact?: boolean; priority?: boolean }) {
    return <div className={`archive-grid ${columns === 2 ? 'two-columns' : columns === 1 ? 'one-column' : ''}`}>{articles.map((article, index) => <ArticleCard key={article.id} article={article} priority={priority && index === 0} compact={compact} />)}</div>;
}
