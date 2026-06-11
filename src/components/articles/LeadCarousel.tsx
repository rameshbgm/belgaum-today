'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import { CATEGORY_META } from '@/types';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';

export interface LeadCarouselArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featured_image: string | null;
    category: string;
    source_name: string;
    published_at: string | Date | null;
    created_at?: string | Date;
    rank_position?: number;
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
            className="group relative overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <Link
                href={`/article/${article.slug}`}
                className="block relative"
            >
                {article.featured_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={article.featured_image}
                        alt={article.title}
                        className="w-full h-auto block"
                    />
                ) : (
                    <div className="aspect-[16/10]">
                        <NewsFallbackImage seed={article.id} />
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#120F0B] via-[#120F0B]/55 to-transparent" />

                <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#FDBA74]">
                            {!isFallback && <TrendingUp className="w-3 h-3" />}
                            {cat?.name}
                            {!isFallback && ` · Trending #${article.rank_position ?? current + 1}`}
                            {isFallback && ' · Latest'}
                        </span>
                    </div>

                    <h2 className="font-display text-3xl md:text-5xl font-black leading-[1.04] text-white tracking-[-0.02em] max-w-3xl">
                        {article.title}
                    </h2>
                    <p className="hidden md:block mt-4 text-base text-white/80 max-w-2xl leading-relaxed">
                        {truncate(article.excerpt || '', 200)}
                    </p>
                    <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-wider text-white/70">
                        <span className="font-semibold text-white">{article.source_name}</span>
                        {timestamp && (
                            <>
                                <span className="w-1 h-1 rounded-full bg-white/40" />
                                <span>{formatRelativeTime(timestamp)}</span>
                            </>
                        )}
                    </div>
                </div>
            </Link>

            {/* Navigation arrows */}
            {total > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous story"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); next(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next story"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {total > 1 && (
                <div className="absolute bottom-3 right-4 flex gap-1.5">
                    {articles.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                                i === current
                                    ? 'bg-[#FDBA74] w-6'
                                    : 'bg-white/40 hover:bg-white/60 w-1.5'
                            }`}
                            aria-label={`Go to story ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </article>
    );
}
