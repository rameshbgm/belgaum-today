import { Article } from '@/types';
import { ArticleCard } from './ArticleCard';
import { NewsRow } from './NewsRow';
export function StoryCard({ article, variant = 'feature' }: { article: Article; variant?: 'feature' | 'brief' }) {
    return variant === 'brief' ? <NewsRow article={article} /> : <ArticleCard article={article} />;
}
