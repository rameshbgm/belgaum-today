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

    const trackClick = () => {
        const body = JSON.stringify({ sourceName: article.source_name, articleId: article.id });
        if (navigator.sendBeacon) {
            navigator.sendBeacon('/api/track/source', new Blob([body], { type: 'application/json' }));
        } else {
            void fetch('/api/track/source', { method: 'POST', body, headers: { 'Content-Type': 'application/json' }, keepalive: true });
        }
    };

    return <a href={href} target="_blank" rel="noopener noreferrer" onClick={trackClick}
        className={className} aria-label={ariaLabel}>
        {children}
    </a>;
}
