'use client';

import { useEffect, useRef, useState } from 'react';
import { useReadOnlyPreview } from '@/components/PreviewProvider';
import { ArticleViewCount } from './ArticleViewCount';

interface ArticleViewTrackerProps {
    articleId: number;
    category: string;
    initialCount?: number;
    showCount?: boolean;
    className?: string;
}

/**
 * Client component to track article views
 * Fires once when the article page is mounted
 */
export function ArticleViewTracker({
    articleId,
    category,
    initialCount = 0,
    showCount = false,
    className = '',
}: ArticleViewTrackerProps) {
    const preview = useReadOnlyPreview();
    const trackedArticles = useRef(new Set<number>());
    const [liveCounts, setLiveCounts] = useState<Record<number, number>>({});

    useEffect(() => {
        if (preview || trackedArticles.current.has(articleId)) return;
        trackedArticles.current.add(articleId);

        // Track article view
        fetch('/api/track/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId, category }),
            keepalive: true,
        })
            .then(async response => response.ok ? response.json() : null)
            .then(data => {
                if (typeof data?.viewCount === 'number') setLiveCounts(counts => ({ ...counts, [articleId]: data.viewCount }));
            })
            .catch(() => undefined);
    }, [articleId, category, preview]);

    const count = !preview ? liveCounts[articleId] ?? initialCount : initialCount;
    return showCount ? <ArticleViewCount count={count} className={className} /> : null;
}
