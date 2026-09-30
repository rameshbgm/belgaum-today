'use client';

import Link from 'next/link';
import type { ArchivePage } from '@/lib/archive-search';
import { ArticleGrid } from './ArticleGrid';

export function ArchiveResults({ data, loading, error, retry, pageHref, columns = 3 }: {
    data?: ArchivePage;
    loading: boolean;
    error?: string;
    retry: () => void;
    pageHref: (page: number) => string;
    columns?: 2 | 3;
}) {
    if (loading) return <p role="status" className="py-10 text-muted">Searching the news archive…</p>;
    if (error) return <div className="py-10" role="alert">
        <h2 className="font-display text-xl font-semibold text-ink">Couldn’t load results</h2>
        <p className="mt-2 text-muted">{error} Your search and filters are saved.</p>
        <button type="button" onClick={retry} className="mt-4 min-h-11 rounded-md border border-hairline px-5 font-semibold text-ink hover:border-primary">Retry search</button>
    </div>;
    if (!data) return null;
    return <div>
        <p role="status" className="mb-4 text-sm text-muted">Page {data.page} · {data.items.length} publisher report{data.items.length === 1 ? '' : 's'} on this page</p>
        {data.items.length ? <ArticleGrid articles={data.items} columns={columns} /> : <div className="py-10">
            <h2 className="font-display text-xl font-semibold text-ink">No matching stories</h2>
            <p className="mt-2 text-muted">Try another search or clear a filter.{data.page > 1 && ' You can also return to the previous page.'}</p>
        </div>}
        {(data.page > 1 || data.hasMore) && <nav aria-label="Search results pages" className="mt-6 flex flex-wrap items-center justify-between gap-3">
            {data.page > 1 && <Link href={pageHref(data.page - 1)} scroll={false} className="inline-flex min-h-11 items-center rounded-md border border-hairline px-5 font-semibold text-ink hover:border-primary">Previous page</Link>}
            {data.hasMore && <Link href={pageHref(data.page + 1)} scroll={false} className="ml-auto inline-flex min-h-11 items-center rounded-md border border-hairline px-5 font-semibold text-ink hover:border-primary">Next page</Link>}
        </nav>}
    </div>;
}
