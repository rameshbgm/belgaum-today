'use client';

import { useEffect, useRef, useState } from 'react';
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
    const hasTracked = useRef(false);
    const [count, setCount] = useState(initialCount);

    useEffect(() => {
        if (hasTracked.current) return;
        hasTracked.current = true;

        // Track article view
        fetch('/api/track/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId, category }),
            keepalive: true,
        })
            .then(async response => response.ok ? response.json() : null)
            .then(data => {
                if (typeof data?.viewCount === 'number') setCount(data.viewCount);
            })
            .catch(() => undefined);
    }, [articleId, category]);

    return showCount ? <ArticleViewCount count={count} className={className} /> : null;
}
