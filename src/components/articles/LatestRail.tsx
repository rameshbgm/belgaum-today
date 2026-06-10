import Link from 'next/link';
import { Article, CATEGORY_META } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

/**
 * "Latest" rail — a tight, text-first list of headlines with dotted leader
 * lines running to a relative timestamp. Newspaper agate-style column.
 */
export function LatestRail({ articles }: { articles: Article[] }) {
    return (
        <ul className="divide-y divide-hairline">
            {articles.map((a) => (
                <li key={a.id}>
                    <Link href={`/article/${a.slug}`} className="group block py-3.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                            {CATEGORY_META[a.category]?.name}
                        </span>
                        <div className="flex items-baseline gap-2 mt-1">
                            <h3 className="font-display text-[15px] font-semibold leading-snug text-ink group-hover:text-primary transition-colors">
                                {a.title}
                            </h3>
                        </div>
                        <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted">
                            {a.source_name} · {formatRelativeTime(a.published_at || a.created_at)}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    );
}
