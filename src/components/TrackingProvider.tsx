'use client';

import { useEffect, useCallback, useRef } from 'react';

/**
 * TrackingProvider — client component that handles:
 * 1. Page view tracking on mount
 * 2. Click tracking for outbound article links
 *
 * Usage: Wrap your page content with <TrackingProvider category="india">...</TrackingProvider>
 * Articles should have data-article-id and data-source-name attributes on their <a> tags.
 */
export function TrackingProvider({
    children,
    category,
}: {
    children: React.ReactNode;
    category: string;
}) {
    const trackedViews = useRef(new Set<string>());

    // Track page-level view
    useEffect(() => {
        const pageKey = `${category}-${window.location.pathname}`;
        if (trackedViews.current.has(pageKey)) return;
        trackedViews.current.add(pageKey);

        // Track as a category page view
        fetch('/api/track/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, pageView: true }),
        }).catch(() => { });
    }, [category]);

    // Click handler for outbound article links
    const handleClick = useCallback((e: MouseEvent) => {
        const link = (e.target as HTMLElement).closest('a[data-article-id]') as HTMLAnchorElement | null;
        if (!link) return;

        const articleId = link.dataset.articleId;
        const sourceName = link.dataset.sourceName;

        if (articleId) {
            // Track view
            fetch('/api/track/view', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ articleId: Number(articleId) }),
            }).catch(() => { });
        }

        if (sourceName) {
            // Track source click
            fetch('/api/track/source', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceName,
                    articleId: articleId ? Number(articleId) : null,
                }),
            }).catch(() => { });
        }
    }, []);

    useEffect(() => {
        document.addEventListener('click', handleClick, true);
        return () => document.removeEventListener('click', handleClick, true);
    }, [handleClick]);

    return <>{children}</>;
}
