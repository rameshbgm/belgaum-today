'use client';

import type { ReactNode } from 'react';

type PublisherStory = { id: number; source_name: string; source_url: string };

function usablePublisherUrl(value: string): string | null {
    try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol) || url.hostname === 'news.google.com') return null;
        return url.href;
    } catch {
        return null;
    }
}

export function PublisherLink({ article, children, className, ariaLabel }: {
    article: PublisherStory;
    children: ReactNode;
    className?: string;
    ariaLabel?: string;
}) {
    const href = usablePublisherUrl(article.source_url);
    if (!href) return <span className={className} title="Publisher link unavailable">{children}</span>;

    const sendTrackingEvent = (path: string, payload: Record<string, string | number>) => {
        const body = JSON.stringify(payload);
        if (navigator.sendBeacon) {
            navigator.sendBeacon(path, new Blob([body], { type: 'application/json' }));
        } else {
            void fetch(path, { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
        }
    };

    const trackClick = () => {
        sendTrackingEvent('/api/track/source', { sourceName: article.source_name, articleId: article.id });
        sendTrackingEvent('/api/track/view', { articleId: article.id, category: 'publisher-click' });
    };

    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={className} aria-label={ariaLabel ? `${ariaLabel} (opens publisher in a new tab)` : undefined}>
        {children}
        {!ariaLabel && <span className="sr-only"> (opens publisher in a new tab)</span>}
    </a>;
}
