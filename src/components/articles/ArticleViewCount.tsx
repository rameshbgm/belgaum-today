import { Eye } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export function ArticleViewCount({ count, className = '' }: { count: number; className?: string }) {
    const formatted = formatNumber(count ?? 0);
    const label = count === 1 ? 'view' : 'views';
    return (
        <span className={'inline-flex items-center gap-1 tabular-nums ' + className} aria-label={formatted + ' ' + label}>
            <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{formatted}</span>
            <span>{label}</span>
        </span>
    );
}
