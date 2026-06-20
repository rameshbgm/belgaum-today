'use client';

import Link from 'next/link';
import { Eye } from 'lucide-react';
import { Article, CATEGORY_META, Category } from '@/types';
import { formatRelativeTime, formatNumber } from '@/lib/utils';

interface CategorySection {
    category: Category;
    articles: Article[];
}

interface LatestRailProps {
    articles: Article[];
    categorySections?: CategorySection[];
}

/**
 * "Latest" rail — scrollable, fixed height matching the lead story image.
 * Shows 3 articles per category for India, Business, Technology, Entertainment, Sports.
 */
export function LatestRail({ articles, categorySections }: LatestRailProps) {
    // If categorySections provided, use them; otherwise fall back to flat list
    const sections: CategorySection[] = categorySections ?? [];
    const showSections = sections.length > 0;

    return (
        <div className="h-[calc(100%)] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ink/15 hover:scrollbar-thumb-ink/30"
            style={{ maxHeight: 'inherit' }}>
            {showSections ? (
                <div className="divide-y divide-hairline">
                    {sections.map(({ category, articles: catArticles }) => {
                        const meta = CATEGORY_META[category];
                        return (
                            <div key={category} className="py-3">
                                <Link
                                    href={`/${category}`}
                                    className="block text-[10px] font-bold uppercase tracking-[0.22em] mb-2 transition-colors hover:opacity-80"
                                    style={{ color: meta?.color }}
                                >
                                    {meta?.name}
                                </Link>
                                <ul className="space-y-3">
                                    {catArticles.map((a) => (
                                        <li key={a.id}>
                                            <Link href={`/article/${a.slug}`} className="group block">
                                                <h3 className="font-display text-[14px] font-semibold leading-snug text-ink group-hover:text-primary transition-colors line-clamp-2">
                                                    {a.title}
                                                </h3>
                                                <span className="mt-0.5 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                                                    <span className="truncate">{a.source_name} · {formatRelativeTime(a.published_at || a.created_at)}</span>
                                                    <span className="flex items-center gap-0.5 normal-case tracking-normal shrink-0">
                                                        <Eye className="w-3 h-3" />
                                                        {formatNumber(a.view_count ?? 0)}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <ul className="divide-y divide-hairline">
                    {articles.map((a) => (
                        <li key={a.id}>
                            <Link href={`/article/${a.slug}`} className="group block py-3.5">
                                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                                    {CATEGORY_META[a.category]?.name}
                                </span>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <h3 className="font-display text-[15px] font-semibold leading-snug text-ink group-hover:text-primary transition-colors">
                                        {a.title}
                                    </h3>
                                </div>
                                <span className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
                                    <span className="truncate">{a.source_name} · {formatRelativeTime(a.published_at || a.created_at)}</span>
                                    <span className="flex items-center gap-0.5 normal-case tracking-normal shrink-0">
                                        <Eye className="w-3 h-3" />
                                        {formatNumber(a.view_count ?? 0)}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
