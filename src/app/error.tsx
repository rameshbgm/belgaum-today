"use client";
import { useEffect } from 'react';
import Link from 'next/link';
import { RefreshCw, ArrowLeft } from 'lucide-react';
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => { console.error('Page could not load:', error); }, [error]);
    return <div className="info-page min-h-[60vh]"><h1>The page couldn&rsquo;t load.</h1><p className="info-intro">Try loading it again, or return to the briefing to explore the latest stories.</p><div className="flex flex-wrap gap-3"><button type="button" onClick={reset} className="primary-action"><RefreshCw size={17} />Try again</button><Link href="/briefing" className="text-action"><ArrowLeft size={17} />Today&rsquo;s briefing</Link></div>{error.digest && <p className="mt-7 text-sm text-muted">Reference: {error.digest}</p>}</div>;
}
