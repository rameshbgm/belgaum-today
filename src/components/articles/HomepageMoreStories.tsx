"use client";
import { useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { Article } from '@/types';
import { NewsRow } from './NewsRow';
import { SectionHeading } from './SectionHeading';

export function HomepageMoreStories({ initialArticles }: { initialArticles: Article[] }) {
    const [articles, setArticles] = useState(initialArticles);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(initialArticles.length > 0);
    const [error, setError] = useState('');
    const loadMore = async () => {
        if (loading || !hasMore) return;
        setLoading(true); setError('');
        try {
            const oldest = Math.min(...articles.map(article => new Date(article.published_at || article.created_at).getTime()));
            const response = await fetch(`/api/articles?before=${encodeURIComponent(new Date(oldest).toISOString())}&limit=24`);
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error('Could not load older stories. Please try again.');
            const items: Article[] = result.data?.items || [];
            const seen = new Set(articles.map(article => article.id));
            const extra = items.filter(article => !seen.has(article.id));
            setArticles(previous => [...previous, ...extra]);
            setHasMore(items.length === 24 && extra.length > 0);
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not load stories. Please try again.'); }
        finally { setLoading(false); }
    };
    return <div><SectionHeading href="/search?page=1" linkText="Browse the archive">More to explore</SectionHeading>
        <div className="latest-feed">{articles.map(article => <NewsRow key={article.id} article={article} />)}</div>
        {error && <p role="alert" className="mt-4 text-center text-muted">{error}</p>}
        {hasMore && <div className="feed-tools"><button type="button" className="text-action" onClick={loadMore} disabled={loading}>{loading ? 'Loading stories…' : error ? 'Try again' : 'Load older stories'}<ArrowDown size={16} aria-hidden="true" /></button></div>}
        {!hasMore && articles.length > 0 && <p className="mt-6 text-center text-sm text-muted">You&rsquo;re all caught up.</p>}
    </div>;
}
