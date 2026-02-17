'use client';

import { useEffect, useRef } from 'react';

interface ArticleViewTrackerProps {
    articleId: number;
    category: string;
}

/**
 * Client component to track article views
 * Fires once when the article page is mounted
 */
export function ArticleViewTracker({ articleId, category }: ArticleViewTrackerProps) {
    const hasTracked = useRef(false);

    useEffect(() => {
        if (hasTracked.current) return;
        hasTracked.current = true;

        // Track article view
        fetch('/api/track/view', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articleId, category }),
        }).catch(() => {
            // Silently fail for tracking
        });
    }, [articleId, category]);

    return null;
}
