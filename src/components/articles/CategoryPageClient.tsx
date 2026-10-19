"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Article, Category, CATEGORY_META } from '@/types';
import { TrackingProvider } from '@/components/TrackingProvider';
import { ArchiveResults } from './ArchiveResults';
import { useArchiveSearch } from './useArchiveSearch';
import { ArticleGrid } from './ArticleGrid';
import { NewsRow } from './NewsRow';
interface CategoryPageClientProps { category: Category; initialArticles: Article[]; trendingArticles: Article[]; }
export function CategoryPageClient({ category, initialArticles, trendingArticles }: CategoryPageClientProps) {
    const search = useSearchParams();
    // Categories browse reports only. Retired q/subcategory filters never affect
    // category results or survive into pagination links; global search is separate.
    const page = search.get('page') || '1';
    const params = new URLSearchParams({ category, page });
    const result = useArchiveSearch(params.toString());
    const name = CATEGORY_META[category].name;
    const firstPage = page === '1';
    return <TrackingProvider category={category}><div className="container mx-auto px-4 sm:px-6">
        <div className="archive-header"><Link href="/briefing" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted"><ArrowLeft size={16} />The briefing</Link><h1>{name}</h1><p>{CATEGORY_META[category].description}. Read the latest reports at their source.</p></div>
        {firstPage && trendingArticles.length > 0 && <section className="mt-6" aria-labelledby="category-highlights"><h2 id="category-highlights" className="text-xl font-semibold">In the headlines</h2><div className="grid gap-x-7 md:grid-cols-3">{trendingArticles.slice(0, 3).map(article => <NewsRow key={article.id} article={article} excerpt={false} />)}</div></section>}
        <section className="archive-content" aria-label={`${name} reports`}>{result.loading && firstPage && initialArticles.length ? <><p role="status" className="mb-5 text-sm text-muted">Latest publisher reports</p><ArticleGrid articles={initialArticles} /></> : <ArchiveResults {...result} browsing pageHref={next => `/${category}${next === 1 ? '' : `?page=${next}`}`} />}</section>
    </div></TrackingProvider>;
}
