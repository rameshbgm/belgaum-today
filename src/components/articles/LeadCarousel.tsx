'use client';

import { useState, useEffect, useCallback } from 'react';
import { PublisherLink } from './PublisherLink';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_META } from '@/types';
import { formatRelativeTime, stripHtml, truncate } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';
import { ArticleViewCount } from './ArticleViewCount';

export interface LeadCarouselArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    category: string;
    source_name: string;
    source_url: string;
    published_at: string | Date | null;
    created_at?: string | Date;
    rank_position?: number;
    view_count: number;
}

interface LeadCarouselProps {
    articles: LeadCarouselArticle[];
    isFallback?: boolean;
}

export function LeadCarousel({ articles, isFallback = false }: LeadCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = articles.length;

    const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

    useEffect(() => {
        if (paused || total <= 1) return;
        const timer = setInterval(next, 3000);
        return () => clearInterval(timer);
    }, [paused, total, next]);

    if (total === 0) return null;

    const article = articles[current];
    const cat = CATEGORY_META[article.category as keyof typeof CATEGORY_META];
    const timestamp = article.published_at ?? (article as { created_at?: string | Date }).created_at;

    return (
        <article
            className="group relative flex h-full flex-col overflow-hidden bg-background"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <div className="relative min-h-[280px] overflow-hidden sm:aspect-[16/9] lg:min-h-0 lg:flex-[3_1_0%] lg:aspect-auto">
                <PublisherLink article={article} className="absolute inset-0 block">
                    {article.featured_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={article.featured_image}
                            alt={article.title}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                    ) : (
                        <div className="absolute inset-0">
                            <NewsFallbackImage seed={article.id} />
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#120F0B]/75 via-transparent to-transparent" />
                    <span className="absolute bottom-5 left-5 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FDBA74] md:left-7">
                        {!isFallback && <TrendingUp className="h-3 w-3" />}
                        {cat?.name}
                        {!isFallback && ` · Trending #${article.rank_position ?? current + 1}`}
                        {isFallback && ' · Latest'}
                    </span>
                </PublisherLink>

                {total > 1 && (
                    <>
                        <button
                            onClick={(e) => { e.preventDefault(); prev(); }}
                            className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:left-3 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                            aria-label="Previous story"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            onClick={(e) => { e.preventDefault(); next(); }}
                            className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-3 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
                            aria-label="Next story"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                        <div className="absolute bottom-5 right-5 flex gap-1.5 md:right-7">
                            {articles.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${
                                        i === current
                                            ? 'w-6 bg-[#FDBA74]'
                                            : 'w-1.5 bg-white/40 hover:bg-white/60'
                                    }`}
                                    aria-label={`Go to story ${i + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>

            <PublisherLink article={article} className="flex flex-1 flex-col justify-center border-b border-hairline px-1 py-5 md:px-0 md:py-6">
                <h2 className="line-clamp-3 max-w-4xl font-display text-2xl font-black leading-[1.08] tracking-[-0.02em] text-ink transition-colors group-hover:text-primary sm:text-3xl lg:text-4xl">
                    {article.title}
                </h2>
                {article.excerpt && (
                    <p className="mt-3 line-clamp-2 max-w-3xl text-sm leading-6 text-muted md:text-base">
                        {truncate(stripHtml(article.excerpt), 200)}
                    </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-wider text-muted sm:text-xs">
                    <span className="max-w-full truncate font-semibold text-ink">{article.source_name}</span>
                    {timestamp && (
                        <>
                            <span className="h-1 w-1 rounded-full bg-muted/50" />
                            <span>{formatRelativeTime(timestamp)}</span>
                        </>
                    )}
                    <ArticleViewCount count={article.view_count} className="text-muted" />
                </div>
            </PublisherLink>
        </article>
    );
}
