import Image from 'next/image';
import Link from 'next/link';
import { Article, CATEGORY_META } from '@/types';
import { formatRelativeTime, truncate, stripHtml } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';

/**
 * Editorial story card. Two shapes share one component:
 * - `feature` (default): stacked image-on-top with a larger serif headline
 * - `brief`: text-only entry (no image) for a denser, mixed broadsheet rhythm
 */
export function StoryCard({ article, variant = 'feature' }: { article: Article; variant?: 'feature' | 'brief' }) {
    const cat = CATEGORY_META[article.category];

    if (variant === 'brief') {
        return (
            <article className="group border-l-2 border-primary/70 pl-4 py-1">
                <Link href={`/article/${article.slug}`} className="block">
                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{cat?.name}</span>
                    <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink group-hover:text-primary transition-colors">
                        {article.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                        {truncate(stripHtml(article.excerpt || ''), 140)}
                    </p>
                    <span className="mt-2 block text-[11px] uppercase tracking-wider text-muted">
                        {article.source_name} · {formatRelativeTime(article.published_at || article.created_at)}
                    </span>
                </Link>
            </article>
        );
    }

    return (
        <article className="group">
            <Link href={`/article/${article.slug}`} className="block">
                <div className="relative aspect-[3/2] overflow-hidden rounded-sm mb-3">
                    {article.featured_image ? (
                        <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                    ) : (
                        <NewsFallbackImage seed={article.id} />
                    )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{cat?.name}</span>
                <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-ink group-hover:text-primary transition-colors">
                    {article.title}
                </h3>
                <span className="mt-2 block text-[11px] uppercase tracking-wider text-muted">
                    {article.source_name} · {formatRelativeTime(article.published_at || article.created_at)}
                </span>
            </Link>
        </article>
    );
}
