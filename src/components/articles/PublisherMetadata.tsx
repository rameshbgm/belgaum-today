import { ArrowUpRight } from 'lucide-react';
import { formatRelativeTime } from '@/lib/utils';

export function PublisherMetadata({ article, className = '' }: {
    article: { source_name: string; published_at?: string | Date | null; created_at?: string | Date | null };
    className?: string;
}) {
    const date = article.published_at || article.created_at;
    const timestamp = date ? new Date(date) : null;
    return <span className={`publisher-metadata flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-sm normal-case tracking-normal ${className}`}>
        <span className="min-w-0 break-words">Read at {article.source_name} <ArrowUpRight aria-hidden="true" className="inline h-4 w-4 shrink-0 align-text-bottom" /></span>
        {timestamp && Number.isFinite(timestamp.getTime()) && <time dateTime={timestamp.toISOString()} title={timestamp.toLocaleString('en-IN')} className="shrink-0">{formatRelativeTime(timestamp)}</time>}
    </span>;
}
