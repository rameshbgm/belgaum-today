import { ArticleViewCount } from './ArticleViewCount';
import type { Article } from '@/types';
import { CATEGORY_META } from '@/types';
import { PublisherLink } from './PublisherLink';
import { PublisherMetadata } from './PublisherMetadata';
import { NewsPhoto } from './NewsPhoto';
import { stripHtml, truncate } from '@/lib/utils';

export function NewsRow({ article, excerpt = true }: { article: Article; excerpt?: boolean }) {
    return <article className="news-row">
        <div className="news-row-copy">
            <span className="story-category">{CATEGORY_META[article.category]?.name || 'News'}</span>
            <h3><PublisherLink article={article}>{article.title}</PublisherLink></h3>
            {excerpt && article.excerpt && <p className="line-clamp-2">{truncate(stripHtml(article.excerpt), 130)}</p>}
            <div className="story-metadata"><PublisherMetadata article={article} /><ArticleViewCount count={article.view_count} /></div>
        </div>
        {article.featured_image && <PublisherLink article={article} className="news-row-photo" ariaLabel={article.title}><NewsPhoto src={article.featured_image} /></PublisherLink>}
    </article>;
}
