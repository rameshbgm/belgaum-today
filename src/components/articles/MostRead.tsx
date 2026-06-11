import Link from 'next/link';

interface MostReadArticle {
    id: number;
    title: string;
    slug: string;
    source_name: string;
}

/**
 * "Most Read" — big oversized rank numerals in saffron beside the headline.
 * A classic newspaper "most popular" list, restyled editorially.
 */
export function MostRead({ articles }: { articles: MostReadArticle[] }) {
    return (
        <ol className="space-y-5 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-ink/15 hover:scrollbar-thumb-ink/30">
            {articles.map((a, i) => (
                <li key={a.id}>
                    <Link href={`/article/${a.slug}`} className="group flex gap-4 items-start">
                        <span className="font-display text-3xl font-black leading-none text-primary/90 w-9 shrink-0 tabular-nums">
                            {i + 1}
                        </span>
                        <div className="flex-1 min-w-0 border-b border-hairline pb-4 group-last:border-0">
                            <h3 className="font-display text-[15px] font-semibold leading-snug text-ink group-hover:text-primary transition-colors">
                                {a.title}
                            </h3>
                            <span className="mt-1 block text-[11px] uppercase tracking-wider text-muted">
                                {a.source_name}
                            </span>
                        </div>
                    </Link>
                </li>
            ))}
        </ol>
    );
}
