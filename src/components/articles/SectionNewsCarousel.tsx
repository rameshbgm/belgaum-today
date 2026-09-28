'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Article } from '@/types';
import { formatRelativeTime, stripHtml, truncate } from '@/lib/utils';
import { PublisherLink } from './PublisherLink';
import { ArticleViewCount } from './ArticleViewCount';

interface SectionNewsCarouselProps {
    title: string;
    href: string;
    articles: Article[];
    empty: string;
}

export function SectionNewsCarousel({ title, href, articles, empty }: SectionNewsCarouselProps) {
    const track = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);
    const [visibleCount, setVisibleCount] = useState(1);
    const [paused, setPaused] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);

    const measure = useCallback(() => {
        const node = track.current;
        const first = node?.firstElementChild as HTMLElement | null;
        if (!node || !first) return;
        const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(node).columnGap || '0');
        if (step > 0) {
            setCurrent(Math.round(node.scrollLeft / step));
            setVisibleCount(Math.max(1, Math.round(node.clientWidth / step)));
        }
    }, []);

    const scrollToIndex = useCallback((index: number) => {
        const node = track.current;
        const first = node?.firstElementChild as HTMLElement | null;
        if (!node || !first) return;
        const step = first.getBoundingClientRect().width + parseFloat(getComputedStyle(node).columnGap || '0');
        const maxIndex = Math.max(0, articles.length - visibleCount);
        const nextIndex = index < 0 ? maxIndex : index > maxIndex ? 0 : index;
        node.scrollTo({ left: nextIndex * step, behavior: reducedMotion ? 'instant' : 'smooth' });
        setCurrent(nextIndex);
    }, [articles.length, reducedMotion, visibleCount]);

    useEffect(() => {
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReducedMotion(query.matches);
        update();
        query.addEventListener('change', update);
        return () => query.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        measure();
        window.addEventListener('resize', measure);
        return () => window.removeEventListener('resize', measure);
    }, [measure, articles.length]);

    useEffect(() => {
        if (paused || reducedMotion || articles.length <= visibleCount) return;
        const timer = window.setInterval(() => scrollToIndex(current + 1), 5200);
        return () => window.clearInterval(timer);
    }, [articles.length, current, paused, reducedMotion, scrollToIndex, visibleCount]);

    const pageCount = Math.max(1, Math.ceil(articles.length / visibleCount));
    const page = Math.min(pageCount - 1, Math.floor(current / visibleCount));
    const rangeEnd = Math.min(articles.length, current + visibleCount);

    return (
        <section className="min-w-0" aria-label={title + ' news'}>
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-hairline pb-3">
                <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">{title}</h2>
                <Link href={href} className="min-h-11 inline-flex items-center text-[11px] font-bold uppercase tracking-[0.14em] text-primary hover:underline sm:text-xs sm:tracking-widest">
                    More stories
                </Link>
            </div>

            {articles.length === 0 ? (
                <p className="py-8 text-sm text-muted">{empty}</p>
            ) : (
                <div
                    className="group/carousel"
                    role="region"
                    aria-roledescription="carousel"
                    aria-label={title + ' stories'}
                    onMouseEnter={() => setPaused(true)}
                    onMouseLeave={() => setPaused(false)}
                    onFocusCapture={() => setPaused(true)}
                    onBlurCapture={event => {
                        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
                    }}
                >
                    <div
                        ref={track}
                        className="section-news-track"
                        onScroll={measure}
                        onKeyDown={event => {
                            if (event.key === 'ArrowRight') { event.preventDefault(); scrollToIndex(current + 1); }
                            if (event.key === 'ArrowLeft') { event.preventDefault(); scrollToIndex(current - 1); }
                        }}
                        tabIndex={0}
                        aria-label="Swipe or use the arrow keys to browse stories"
                    >
                        {articles.map((article, index) => (
                            <article className="section-news-slide" key={article.id} role="group" aria-roledescription="slide" aria-label={(index + 1) + ' of ' + articles.length}>
                                <PublisherLink article={article} className="group/story flex min-h-36 h-full flex-col border-l border-primary/65 py-2 pl-3 pr-2 sm:min-h-40 sm:pl-4">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">{article.category === 'belgaum' ? 'Belagavi' : 'India'}</span>
                                    <h3 className="mt-1 font-display text-base font-semibold leading-snug text-ink transition-colors group-hover/story:text-primary sm:text-lg">
                                        {article.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted sm:text-sm">
                                        {truncate(stripHtml(article.excerpt || ''), 135)}
                                    </p>
                                    <span className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3 text-[10px] uppercase tracking-wide text-muted sm:text-[11px]">
                                        <span className="min-w-0 truncate">{article.source_name} · {formatRelativeTime(article.published_at || article.created_at)}</span>
                                        <ArticleViewCount count={article.view_count} className="shrink-0 normal-case tracking-normal" />
                                    </span>
                                </PublisherLink>
                            </article>
                        ))}
                    </div>

                    {articles.length > visibleCount && (
                        <div className="mt-3 flex min-h-11 items-center justify-between gap-3">
                            <p className="text-[11px] tabular-nums text-muted" aria-live="off">
                                {current + 1}–{rangeEnd} of {articles.length}
                            </p>
                            <div className="flex items-center gap-1">
                                <button type="button" onClick={() => scrollToIndex(current - 1)} aria-label={'Previous ' + title + ' stories'} className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <span className="sr-only">Page {page + 1} of {pageCount}</span>
                                <button type="button" onClick={() => scrollToIndex(current + 1)} aria-label={'Next ' + title + ' stories'} className="inline-flex h-11 w-11 items-center justify-center text-ink transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
