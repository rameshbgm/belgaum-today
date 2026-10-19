"use client";
import { useState } from 'react';
import { Newspaper } from 'lucide-react';

export function NewsPhoto({ src, alt = '', priority = false }: { src?: string | null; alt?: string; priority?: boolean }) {
    const [failedSource, setFailedSource] = useState<string | null>(null);
    return <div className="news-photo">{src && failedSource !== src ? (
        // Publisher images come from multiple feed hosts; no proxy or generated substitutes.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async" onError={() => setFailedSource(src)} />
    ) : <div className="photo-unavailable"><Newspaper size={30} strokeWidth={1.3} aria-hidden="true" /><span>Belgaum Today</span></div>}</div>;
}
