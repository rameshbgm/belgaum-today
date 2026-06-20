'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Article, CATEGORY_META } from '@/types';
import { stripHtml, formatRelativeTime, formatNumber } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';
import { SectionHeading } from './SectionHeading';

interface HomepageMoreStoriesProps {
    initialArticles: Article[];
}

function dateParts(date: Date): { month: string; day: string; weekday: string } {
    return {
        month: date.toLocaleDateString('en-IN', { month: 'short' }),
        day: date.toLocaleDateString('en-IN', { day: 'numeric' }),
        weekday: date.toLocaleDateString('en-IN', { weekday: 'long' }),
    };
}

function dayKey(article: Article): string {
    const d = article.published_at || article.created_at;
    const date = new Date(d);
    // YYYY-MM-DD key for grouping
    return date.toISOString().slice(0, 10);
}

function groupByDay(articles: Article[]): Array<{ key: string; date: Date; articles: Article[] }> {
    const map = new Map<string, Article[]>();
    for (const a of articles) {
        const k = dayKey(a);
        if (!map.has(k)) map.set(k, []);
        map.get(k)!.push(a);
    }
    // Sort days latest first; articles within a day latest first
    return Array.from(map.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([key, arts]) => ({
            key,
            date: new Date(key + 'T12:00:00'),
            articles: arts.sort(
                (a, b) =>
                    new Date(b.published_at || b.created_at).getTime() -
                    new Date(a.published_at || a.created_at).getTime()
            ),
        }));
}

function ArticleRow({ article }: { article: Article }) {
    const cat = CATEGORY_META[article.category];
    const excerpt = stripHtml(article.excerpt || '');
    const timestamp = article.published_at || article.created_at;
    const [imgFailed, setImgFailed] = useState(false);
    const showImg = article.featured_image && !imgFailed;

    return (
        <article className="group">
            <Link href={`/article/${article.slug}`} className="flex gap-3 sm:gap-4 items-start">
                {/* Thumbnail — smaller on mobile */}
                <div className="relative w-20 h-16 sm:w-28 sm:h-20 shrink-0 overflow-hidden rounded-sm bg-surface">
                    {showImg ? (
                        <Image
                            src={article.featured_image!}
                            alt={article.title}
                            fill
                            sizes="(max-width: 640px) 80px, 112px"
                            className="object-cover"
                            unoptimized
                            onError={() => setImgFailed(true)}
                        />
                    ) : (
                        <NewsFallbackImage seed={article.id} />
                    )}
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <span
                        className="text-[10px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: cat?.color ?? '#E8590C' }}
                    >
                        {cat?.name}
                    </span>
                    <h3 className="mt-0.5 font-display text-[15px] font-semibold leading-snug text-ink group-hover:text-primary transition-colors line-clamp-2">
                        {article.title}
                    </h3>
                    {excerpt && (
                        <p className="mt-1 text-[13px] text-muted leading-snug line-clamp-2">
                            {excerpt}
                        </p>
                    )}
                    <span className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                        <span className="truncate">{article.source_name} · {formatRelativeTime(timestamp)}</span>
                        <span className="flex items-center gap-0.5 normal-case tracking-normal shrink-0">
                            <Eye className="w-3 h-3" />
                            {formatNumber(article.view_count ?? 0)}
                        </span>
                    </span>
                </div>
            </Link>
        </article>
    );
}

export function HomepageMoreStories({ initialArticles }: HomepageMoreStoriesProps) {
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    // Track the week cursor — start = 7 days before the oldest loaded article
    const [weekEnd, setWeekEnd] = useState<string | null>(null);

    const grouped = useMemo(() => groupByDay(articles), [articles]);

    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true);

        try {
            // Cursor: oldest article timestamp, or now if first load-more
            const allDates = articles.map((a) =>
                new Date(a.published_at || a.created_at).getTime()
            );
            const cursorMs = weekEnd
                ? new Date(weekEnd).getTime()
                : Math.min(...allDates);

            const before = new Date(cursorMs).toISOString();
            // Fetch one week window: 7 days * 24h * potentially many articles — use limit 50
            const res = await fetch(
                `/api/articles?before=${encodeURIComponent(before)}&limit=50`
            );
            const data = await res.json();

            if (data.success && data.data?.items?.length > 0) {
                const existingIds = new Set(articles.map((a) => a.id));
                const newItems: Article[] = data.data.items.filter(
                    (a: Article) => !existingIds.has(a.id)
                );

                if (newItems.length > 0) {
                    // Only keep articles within 7 days of the cursor
                    const weekAgoMs = cursorMs - 7 * 24 * 60 * 60 * 1000;
                    const weekItems = newItems.filter(
                        (a) => new Date(a.published_at || a.created_at).getTime() >= weekAgoMs
                    );

                    setArticles((prev) => [...prev, ...newItems]);
                    // Next cursor is 7 days before current cursor
                    setWeekEnd(new Date(weekAgoMs).toISOString());
                    setHasMore(weekItems.length > 0 && data.data.items.length >= 50);
                } else {
                    setHasMore(false);
                }
            } else {
                setHasMore(false);
            }
        } catch {
            setHasMore(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="lg:col-span-8">
            <SectionHeading>More Stories</SectionHeading>

            <div className="space-y-12">
                {grouped.map(({ key, date, articles: dayArticles }) => {
                    const { month, day, weekday } = dateParts(date);
                    return (
                        <div key={key} className="flex gap-4 sm:gap-6">
                            {/* Date block — sticky on the side */}
                            <div className="w-14 sm:w-20 shrink-0">
                                <div className="sticky top-20 text-center border-t-2 border-ink/85 pt-2">
                                    <span className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                                        {month}
                                    </span>
                                    <span className="block font-display text-3xl sm:text-5xl font-black leading-none text-ink mt-0.5">
                                        {day}
                                    </span>
                                    <span className="hidden sm:block text-[10px] uppercase tracking-wider text-muted mt-1.5">
                                        {weekday}
                                    </span>
                                </div>
                            </div>

                            {/* Articles for this day */}
                            <div className="flex-1 min-w-0 space-y-5 border-t border-hairline pt-4">
                                {dayArticles.map((a) => (
                                    <div key={a.id} className="border-b border-hairline pb-5 last:border-0 last:pb-0">
                                        <ArticleRow article={a} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Load More */}
            {hasMore && (
                <div className="mt-10 flex flex-col items-center gap-2">
                    <button
                        onClick={loadMore}
                        disabled={loading}
                        className="px-8 py-2.5 border-2 border-ink/70 text-ink text-sm font-bold uppercase tracking-[0.18em] hover:bg-ink hover:text-paper transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Loading…' : 'Load Previous Week'}
                    </button>
                    <span className="text-[11px] text-muted uppercase tracking-wider">
                        loads one week at a time
                    </span>
                </div>
            )}

            {!hasMore && articles.length > 0 && (
                <p className="mt-10 text-center text-xs uppercase tracking-[0.18em] text-muted">
                    You&rsquo;ve reached the end
                </p>
            )}
        </div>
    );
}
