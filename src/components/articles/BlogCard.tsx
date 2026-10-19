import { ArticleViewCount } from './ArticleViewCount';
import Link from 'next/link';
import { NewsPhoto } from './NewsPhoto';
import { Article, CATEGORY_META } from '@/types';
import { stripHtml, truncate, formatDate } from '@/lib/utils';
export function BlogCard({ blog }: { blog: Article }) {
    return <article className={`news-card ${blog.featured_image ? '' : 'no-photo'}`}>{blog.featured_image && <Link className="news-card-photo" href={`/blog/post/${blog.slug}`} aria-label={blog.title}><NewsPhoto src={blog.featured_image} /></Link>}<div className="news-card-copy"><Link href={`/blog/category/${blog.category}`} className="story-category">{CATEGORY_META[blog.category]?.name || 'Blog'}</Link><h3><Link href={`/blog/post/${blog.slug}`}>{blog.title}</Link></h3>{blog.excerpt && <p className="news-card-excerpt line-clamp-2">{truncate(stripHtml(blog.excerpt), 160)}</p>}<p className="publisher-metadata">Belgaum Today<span>· {formatDate(blog.published_at || blog.created_at)}</span>{blog.reading_time > 0 && <span>· {blog.reading_time} min read</span>}</p><ArticleViewCount count={blog.view_count} className="mt-2 text-xs text-muted" /></div></article>;
}
