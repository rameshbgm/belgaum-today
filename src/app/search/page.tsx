'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { ArchiveResults } from '@/components/articles/ArchiveResults';
import { useArchiveSearch } from '@/components/articles/useArchiveSearch';

const fieldClass = 'min-h-11 w-full min-w-0 rounded-md border border-hairline bg-surface px-3 py-2 text-base text-ink';

function SearchForm({ params }: { params: string }) {
    const router = useRouter();
    const initial = new URLSearchParams(params);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<string[]>([]);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            try {
                const saved = JSON.parse(localStorage.getItem('searchHistory') || '[]');
                if (Array.isArray(saved)) setHistory(saved.filter((value): value is string => typeof value === 'string').slice(0, 5));
            } catch { /* Searching works without device storage. */ }
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    return <>
        <form className="mb-6 rounded-lg border border-hairline bg-surface p-4 sm:p-5" onSubmit={event => {
            event.preventDefault();
            const fields = new FormData(event.currentTarget);
            const next = new URLSearchParams();
            for (const name of ['q', 'category', 'startDate', 'endDate', 'sortBy']) {
                const value = String(fields.get(name) || '').trim();
                if (value && !(name === 'sortBy' && value === 'newest')) next.set(name, value);
            }
            if (next.get('startDate') && next.get('endDate') && next.get('startDate')! > next.get('endDate')!) {
                setError('From date must be on or before To date.');
                return;
            }
            setError('');
            const term = next.get('q');
            if (term) {
                const recent = [term, ...history.filter(value => value !== term)].slice(0, 5);
                setHistory(recent);
                try { localStorage.setItem('searchHistory', JSON.stringify(recent)); } catch { /* Optional. */ }
            }
            // An empty search intentionally browses all reports.
            if (!next.size) next.set('page', '1');
            router.push(`/search?${next}`, { scroll: false });
        }}>
            <label htmlFor="news-query" className="mb-2 block font-medium text-ink">Search the news archive</label>
            <div className="flex flex-col gap-3 sm:flex-row">
                <input id="news-query" name="q" type="search" maxLength={200} defaultValue={initial.get('q') || ''}
                    placeholder="Headlines, reports or publishers" className={`${fieldClass} flex-1`} />
                <button type="submit" className="min-h-11 rounded-md bg-primary-hover px-6 py-2 font-semibold text-white hover:opacity-90">Search</button>
            </div>
            <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="min-w-0"><label htmlFor="search-category" className="mb-1.5 block text-sm font-medium">Category</label>
                    <select id="search-category" name="category" defaultValue={initial.get('category') || ''} className={fieldClass}>
                        <option value="">All categories</option>
                        {TOP_LEVEL_CATEGORIES.map(category => <option key={category} value={category}>{CATEGORY_META[category].name}</option>)}
                    </select>
                </div>
                <div className="min-w-0"><label htmlFor="search-start" className="mb-1.5 block text-sm font-medium">From date</label>
                    <input id="search-start" name="startDate" type="date" defaultValue={initial.get('startDate') || ''} className={fieldClass} />
                </div>
                <div className="min-w-0"><label htmlFor="search-end" className="mb-1.5 block text-sm font-medium">To date</label>
                    <input id="search-end" name="endDate" type="date" defaultValue={initial.get('endDate') || ''} className={fieldClass} />
                </div>
                <div className="min-w-0"><label htmlFor="search-sort" className="mb-1.5 block text-sm font-medium">Sort by</label>
                    <select id="search-sort" name="sortBy" defaultValue={initial.get('sortBy') || 'newest'} className={fieldClass}>
                        <option value="newest">Newest first</option><option value="views">Most viewed</option><option value="relevant">Headline matches first</option>
                    </select>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
                <p className="text-muted">All filters are optional. Select Search to apply changes.</p>
                <Link href="/search" scroll={false} className="inline-flex min-h-11 items-center font-semibold text-accent underline underline-offset-4">Clear search and filters</Link>
            </div>
            {error && <p role="alert" className="mt-2 text-red-700 dark:text-red-300">{error}</p>}
        </form>
        {!initial.get('q') && history.length > 0 && <section aria-label="Recent searches" className="mb-6">
            <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold text-ink">Recent searches</h2>
                <button type="button" className="min-h-11 px-3 text-sm text-accent" onClick={() => {
                    setHistory([]); try { localStorage.removeItem('searchHistory'); } catch { /* Optional. */ }
                }}>Clear history</button>
            </div>
            <div className="flex flex-wrap gap-2">{history.map(term => <Link key={term} href={`/search?q=${encodeURIComponent(term)}`} scroll={false}
                className="inline-flex min-h-11 max-w-full items-center break-words rounded-full border border-hairline px-4 text-sm text-ink">{term}</Link>)}</div>
        </section>}
    </>;
}

function SearchContent() {
    const search = useSearchParams();
    const params = search.toString();
    const enabled = ['q', 'category', 'startDate', 'endDate', 'sortBy', 'page'].some(key => search.has(key));
    const result = useArchiveSearch(params, enabled);
    return <div className="container mx-auto min-w-0 px-4 py-6 sm:py-8">
        <h1 className="mb-6 font-display text-3xl font-bold text-ink md:text-4xl">Search news</h1>
        <SearchForm key={params} params={params} />
        {enabled ? <section aria-label="Search results">
            {search.get('q') && <h2 className="mb-4 break-words font-display text-xl text-ink">Results for “{search.get('q')}”</h2>}
            <ArchiveResults {...result} pageHref={page => { const next = new URLSearchParams(params); next.set('page', String(page)); return `/search?${next}`; }} />
        </section> : <p className="py-8 text-muted">Search by a headline, topic or publisher. You can also browse by category or date.</p>}
    </div>;
}

export default function SearchPage() {
    return <Suspense fallback={<p role="status" className="container mx-auto px-4 py-8">Loading search…</p>}><SearchContent /></Suspense>;
}
