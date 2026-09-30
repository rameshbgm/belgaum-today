'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES, type Category } from '@/types';
import { PublisherLink } from './PublisherLink';
import { PublisherMetadata } from './PublisherMetadata';
import { useArchiveSearch } from './useArchiveSearch';

const STORAGE_KEY = 'belgaum-today-followed-topics';
const DEFAULT_TOPICS: Category[] = ['belgaum', 'india'];

function TopicStories({ category }: { category: Category }) {
    const { data, loading, error, retry } = useArchiveSearch(`category=${category}&limit=3`);
    const name = CATEGORY_META[category].name;
    return <section aria-label={`${name} followed stories`} className="min-w-0">
        <h3 className="font-display text-xl font-bold text-ink"><Link href={`/${category}`} className="inline-flex min-h-11 items-center hover:underline">{name}</Link></h3>
        {loading ? <p role="status" className="py-3 text-sm text-muted">Loading {name} stories…</p>
            : error ? <div role="alert" className="text-sm text-muted">
                <p>Couldn’t load {name} stories.</p>
                <button type="button" onClick={retry} className="min-h-11 font-semibold text-accent underline underline-offset-4">Retry {name}</button>
            </div> : data?.items.length ? <ul className="divide-y divide-hairline">
                {data.items.map(article => <li key={article.id}>
                    <PublisherLink article={article} className="block py-4 text-ink hover:text-primary">
                        <h4 className="break-words font-display text-lg font-semibold leading-snug">{article.title}</h4>
                        <PublisherMetadata article={article} className="mt-2 text-muted" />
                    </PublisherLink>
                </li>)}
            </ul> : <p className="py-3 text-sm text-muted">No stories available for {name} yet. Your topic is still followed.</p>}
        <Link href={`/${category}`} className="inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4">Browse all {name} news</Link>
    </section>;
}

export function TopicPreferences() {
    const [followed, setFollowed] = useState<Category[]>(DEFAULT_TOPICS);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => {
        const read = () => {
            let next = DEFAULT_TOPICS;
            try {
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                if (Array.isArray(stored)) next = TOP_LEVEL_CATEGORIES.filter(category => stored.includes(category));
            } catch { /* Use defaults when storage is unavailable. */ }
            setFollowed(next);
            setLoaded(true);
        };
        const timer = window.setTimeout(read, 0);
        const sync = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) read(); };
        window.addEventListener('storage', sync);
        return () => { window.clearTimeout(timer); window.removeEventListener('storage', sync); };
    }, []);

    const toggle = (category: Category) => {
        const next = followed.includes(category) ? followed.filter(value => value !== category) : [...followed, category];
        setFollowed(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Browsing still works. */ }
    };

    return <section className="border-b-2 border-ink/85 py-8" aria-labelledby="your-topics-heading">
        <h2 id="your-topics-heading" className="font-display text-2xl font-bold text-ink sm:text-3xl">Your topics</h2>
        <p className="mt-2 text-base text-muted">Latest stories from the topics you follow. Your choices stay on this device.</p>
        <div className="mt-4 flex flex-wrap gap-2">
            {TOP_LEVEL_CATEGORIES.map(category => <button key={category} type="button" disabled={!loaded} onClick={() => toggle(category)}
                aria-pressed={followed.includes(category)}
                className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${followed.includes(category) ? 'border-primary-hover bg-primary-hover text-white' : 'border-hairline text-ink hover:border-primary'}`}>
                {CATEGORY_META[category].name}
            </button>)}
        </div>
        {!loaded ? <p role="status" className="mt-5 text-muted">Loading your topics…</p>
            : followed.length === 0 ? <p role="status" className="mt-5 text-muted">You aren’t following any topics. Choose one above to see its latest stories.</p>
                : <div className="mt-5 grid min-w-0 gap-6 md:grid-cols-2 xl:grid-cols-3">{followed.map(category => <TopicStories key={category} category={category} />)}</div>}
    </section>;
}
