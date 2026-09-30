'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { Article, Category, CATEGORY_META } from '@/types';
import type { SubCategory } from './CategorySearchHeader';
import { TrendingCarousel, TrendingArticle } from '@/components/TrendingCarousel';
import { Sidebar } from '@/components/layout';
import { TrackingProvider } from '@/components/TrackingProvider';
import { ArchiveResults } from './ArchiveResults';
import { useArchiveSearch } from './useArchiveSearch';
import { ArticleGrid } from './ArticleGrid';

interface CategoryPageClientProps {
    category: Category;
    initialArticles: Article[];
    subCategories: SubCategory[];
    trendingArticles: TrendingArticle[];
    theme: { gradient: string; iconName: string; accentColor: string; title: string; tagline: string };
    stats: { articleCount: number; sourceCount: number; lastUpdated: string | null };
}

function CategorySearch({ query, onSearch, name }: { query: string; onSearch: (query: string) => void; name: string }) {
    const [draft, setDraft] = useState(query);
    return <form onSubmit={event => { event.preventDefault(); onSearch(draft.trim()); }} className="mt-5">
        <label htmlFor="category-query" className="mb-2 block text-sm font-medium">Search the full {name} archive</label>
        <div className="flex flex-col gap-2 sm:flex-row">
            <input id="category-query" type="search" maxLength={200} value={draft} onChange={event => setDraft(event.target.value)}
                placeholder="Search headlines, reports or publishers"
                className="min-h-11 min-w-0 flex-1 rounded-md border border-white/40 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-600" />
            <button type="submit" className="min-h-11 rounded-md border border-white/60 px-5 py-2 font-semibold hover:bg-white/10">Search</button>
        </div>
    </form>;
}

export function CategoryPageClient({ category, initialArticles, subCategories, trendingArticles, theme }: CategoryPageClientProps) {
    const router = useRouter();
    const search = useSearchParams();
    const query = search.get('q') || '';
    const selected = search.get('subcategory') || 'all';
    const params = new URLSearchParams(search.toString());
    params.set('category', category);
    const result = useArchiveSearch(params.toString());
    const name = CATEGORY_META[category].name;
    const filtered = Boolean(query || selected !== 'all' || search.has('page'));
    const href = (changes: Record<string, string | null>) => {
        const next = new URLSearchParams(search.toString());
        next.delete('category');
        for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value); else next.delete(key);
        }
        return `/${category}${next.size ? `?${next}` : ''}`;
    };

    return <TrackingProvider category={category}>
        <section className={`bg-gradient-to-r ${theme.gradient} text-white`}>
            <div className="container mx-auto px-4 py-5 md:py-7">
                <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-2 text-sm">
                    <Link href="/" className="inline-flex min-h-11 items-center hover:underline">Home</Link>
                    <ChevronRight aria-hidden="true" className="h-4 w-4" />
                    <span>{name}</span>
                </nav>
                <h1 className="font-display text-3xl font-bold md:text-4xl">{name}</h1>
                <CategorySearch key={`${category}:${search.toString()}`} query={query} name={name}
                    onSearch={value => router.push(href({ q: value, page: null }), { scroll: false })} />
                <nav aria-label={`${name} topics`} className="mt-4 flex flex-wrap gap-2">
                    {subCategories.map(sub => <Link key={sub.id} scroll={false}
                        href={href({ subcategory: sub.id === 'all' ? null : sub.id, page: null })}
                        aria-current={selected === sub.id ? 'true' : undefined}
                        className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-medium ${selected === sub.id ? 'border-white bg-white text-gray-900' : 'border-white/40 hover:bg-white/10'}`}>
                        {sub.label}
                    </Link>)}
                </nav>
                {(query || selected !== 'all') && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <p className="min-w-0 break-words">{query ? `Searching for “${query}”` : 'All reports'}{selected !== 'all' ? ` · ${subCategories.find(sub => sub.id === selected)?.label || selected}` : ''}</p>
                    <Link href={`/${category}`} scroll={false} className="inline-flex min-h-11 items-center underline underline-offset-4">Clear filters</Link>
                </div>}
            </div>
        </section>
        <div className="container mx-auto px-4 py-6">
            {!filtered && trendingArticles.length > 0 && <div className="mb-6"><TrendingCarousel articles={trendingArticles} accentColor={theme.accentColor} /></div>}
            <div className="grid min-w-0 gap-8 lg:grid-cols-4">
                <section aria-label={`${name} search results`} className="min-w-0 lg:col-span-3">
                    <ArchiveResults {...result} columns={2} pageHref={page => href({ page: page === 1 ? null : String(page) })} />
                    {result.loading && !filtered && initialArticles.length > 0 && <ArticleGrid articles={initialArticles} columns={2} />}
                </section>
                <aside className="min-w-0"><Sidebar showCategories={false} showRss={false} showAds={true} /></aside>
            </div>
        </div>
    </TrackingProvider>;
}
