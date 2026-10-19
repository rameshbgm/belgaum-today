'use client';

import { useEffect, useRef } from 'react';
import { useReadOnlyPreview } from '@/components/PreviewProvider';

/**
 * TrackingProvider — client component that handles:
 * 1. Section visit tracking on mount
 * Outbound publisher clicks are tracked by PublisherLink.
 *
 * Usage: Wrap your page content with <TrackingProvider category="india">...</TrackingProvider>
 */
export function TrackingProvider({
    children,
    category,
}: {
    children: React.ReactNode;
    category: string;
}) {
    const preview = useReadOnlyPreview();
    const trackedViews = useRef(new Set<string>());

    // Track page-level view
    useEffect(() => {
        if (preview) return;
        const pageKey = `${category}-${window.location.pathname}`;
        if (trackedViews.current.has(pageKey)) return;
        trackedViews.current.add(pageKey);

        fetch('/api/track/visit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ section: category }),
        }).catch(() => { });
    }, [category, preview]);

    return <>{children}</>;
}
