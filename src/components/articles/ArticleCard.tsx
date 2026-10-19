import { ArticleViewCount } from './ArticleViewCount';
import { Article, CATEGORY_META } from '@/types';
import { PublisherLink } from './PublisherLink';
import { PublisherMetadata } from './PublisherMetadata';
import { NewsPhoto } from './NewsPhoto';
import { stripHtml, truncate } from '@/lib/utils';

export function ArticleCard({ article, priority = false, compact = false }: { article: Article; priority?: boolean; compact?: boolean }) {
    return <article className={`news-card ${article.featured_image ? '' : 'no-photo'}`}>
        {article.featured_image && <PublisherLink article={article} className="news-card-photo" ariaLabel={article.title}><NewsPhoto src={article.featured_image} priority={priority} /></PublisherLink>}
        <div className="news-card-copy">
            <span className="story-category">{CATEGORY_META[article.category]?.name || 'News'}</span>
            <h3><PublisherLink article={article}>{article.title}</PublisherLink></h3>
            {!compact && article.excerpt && <p className="news-card-excerpt line-clamp-2">{truncate(stripHtml(article.excerpt), 160)}</p>}
            <div className="story-metadata"><PublisherMetadata article={article} /><ArticleViewCount count={article.view_count} /></div>
        </div>
    </article>;
}
