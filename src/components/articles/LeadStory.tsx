import Image from 'next/image';
import Link from 'next/link';
import { Article, CATEGORY_META } from '@/types';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';

/**
 * Full-bleed editorial lead story — the "front page cover".
 * Large image with an ink overlay and an oversized serif headline.
 */
export function LeadStory({ article }: { article: Article }) {
    const cat = CATEGORY_META[article.category];

    return (
        <article className="group relative overflow-hidden rounded-sm">
            <Link
                href={`/article/${article.slug}`}
                className="block relative aspect-[4/3] md:aspect-[16/10]"
            >
                {article.featured_image ? (
                    <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        priority
                        sizes="(max-width: 1024px) 100vw, 66vw"
                        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
                    />
                ) : (
                    <NewsFallbackImage seed={article.id} />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#120F0B] via-[#120F0B]/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                    <span className="inline-block mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FDBA74]">
                        {cat?.name} · Lead Story
                    </span>
                    <h2 className="font-display text-3xl md:text-5xl font-black leading-[1.04] text-white tracking-[-0.02em] max-w-3xl">
                        {article.title}
                    </h2>
                    <p className="hidden md:block mt-4 text-base text-white/80 max-w-2xl leading-relaxed">
                        {truncate(article.excerpt || '', 200)}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wider text-white/70">
                        <span className="font-semibold text-white">{article.source_name}</span>
                        <span className="w-1 h-1 rounded-full bg-white/40" />
                        <span>{formatRelativeTime(article.published_at || article.created_at)}</span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
