'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, ArrowRight, ChevronLeft, ChevronRight, TrendingUp } from 'lucide-react';
import { formatRelativeTime, truncate } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';

export interface TrendingArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string | null;
    source_name: string;
    source_url: string;
    published_at: string;
    ai_score?: number;
    ai_reasoning?: string;
    rank_position?: number;
}

interface TrendingCarouselProps {
    articles: TrendingArticle[];
    accentColor?: string; // e.g. 'orange', 'emerald'
}

export function TrendingCarousel({ articles, accentColor = 'orange' }: TrendingCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = articles.length;

    const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
    const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

    // Auto-rotate every 5 seconds
    useEffect(() => {
        if (paused || total <= 1) return;
        const timer = setInterval(next, 5000);
        return () => clearInterval(timer);
    }, [paused, total, next]);

    if (total === 0) return null;

    const article = articles[current];

    const colorMap: Record<string, { badge: string; btn: string; dot: string; gradient: string }> = {
        orange: {
            badge: 'bg-orange-500',
            btn: 'text-orange-400 hover:text-orange-300',
            dot: 'bg-orange-500',
            gradient: 'from-orange-950 via-black/80',
        },
        emerald: {
            badge: 'bg-emerald-500',
            btn: 'text-emerald-400 hover:text-emerald-300',
            dot: 'bg-emerald-500',
            gradient: 'from-emerald-950 via-black/80',
        },
        blue: {
            badge: 'bg-blue-500',
            btn: 'text-blue-400 hover:text-blue-300',
            dot: 'bg-blue-500',
            gradient: 'from-blue-950 via-black/80',
        },
        rose: {
            badge: 'bg-rose-500',
            btn: 'text-rose-400 hover:text-rose-300',
            dot: 'bg-rose-500',
            gradient: 'from-rose-950 via-black/80',
        },
        red: {
            badge: 'bg-red-500',
            btn: 'text-red-400 hover:text-red-300',
            dot: 'bg-red-500',
            gradient: 'from-red-950 via-black/80',
        },
    };
    const colors = colorMap[accentColor] || colorMap.orange;

    // Source brand colors
    const sourceColors: Record<string, string> = {
        'Hindustan Times': 'bg-orange-500',
        'The Hindu': 'bg-blue-600',
    };

    return (
        <div
            className="group relative rounded-2xl overflow-hidden shadow-2xl"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Carousel slide */}
            <Link
                href={`/article/${article.slug}`}
                data-article-id={article.id}
                data-source-name={article.source_name}
                className="block relative aspect-[16/6] md:aspect-[16/5]"
            >
                {/* Image */}
                {article.featured_image ? (
                    <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority={current === 0}
                        sizes="(max-width: 768px) 100vw, 66vw"
                        unoptimized
                    />
                ) : (
                    <NewsFallbackImage />
                )}

                {/* Gradient overlay */}
                <div className={`absolute inset-0 bg-gradient-to-t ${colors.gradient} to-transparent`} />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-10">
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Trending #{current + 1}
                        </span>
                        <span className={`px-3 py-1 ${sourceColors[article.source_name] || 'bg-gray-500'} text-white text-xs font-semibold rounded-full`}>
                            {article.source_name}
                        </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-3 leading-tight max-w-3xl transition-colors">
                        {article.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-gray-300 text-base md:text-lg mb-4 line-clamp-2 max-w-2xl">
                        {truncate(article.excerpt || '', 250)}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {formatRelativeTime(article.published_at)}
                        </span>
                        <span className={`flex items-center gap-1.5 ${colors.btn} font-medium`}>
                            Read Article
                            <ArrowRight className="w-4 h-4" />
                        </span>
                    </div>
                </div>
            </Link>

            {/* Navigation arrows */}
            {total > 1 && (
                <>
                    <button
                        onClick={(e) => { e.preventDefault(); prev(); }}
                        className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous slide"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={(e) => { e.preventDefault(); next(); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next slide"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </>
            )}

            {/* Dot indicators */}
            {total > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {articles.map((_, i) => (
                        <button
                            key={i}
                            onClick={(e) => { e.preventDefault(); setCurrent(i); }}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current
                                ? `${colors.dot} w-6`
                                : 'bg-white/40 hover:bg-white/60'
                                }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
