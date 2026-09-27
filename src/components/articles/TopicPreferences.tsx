'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { Article, Category } from '@/types';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { PublisherLink } from './PublisherLink';

const STORAGE_KEY = 'belgaum-today-followed-topics';
const DEFAULT_TOPICS: Category[] = ['belgaum', 'india'];

export function TopicPreferences({ articles }: { articles: Article[] }) {
    const [followed, setFollowed] = useState<Category[]>(DEFAULT_TOPICS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
            if (Array.isArray(stored)) {
                setFollowed(stored.filter((value): value is Category => TOP_LEVEL_CATEGORIES.includes(value)));
            }
        } catch { /* Keep defaults when local storage is unavailable. */ }
        setLoaded(true);
    }, []);

    const toggle = (category: Category) => {
        const next = followed.includes(category)
            ? followed.filter(value => value !== category)
            : [...followed, category];
        setFollowed(next);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Browsing still works. */ }
    };

    const stories = useMemo(() => articles.filter(article => followed.includes(article.category)).slice(0, 4), [articles, followed]);

    return <section className="mt-9 border-t border-hairline pt-6" aria-label="Followed topics">
        <h2 className="font-display text-xl font-bold text-ink">Your topics</h2>
        <p className="mt-1 text-sm text-muted">Choose the news you want to find quickly on this device.</p>
        <div className="mt-4 flex flex-wrap gap-2">
            {TOP_LEVEL_CATEGORIES.map(category => (
                <button key={category} type="button" onClick={() => toggle(category)}
                    aria-pressed={followed.includes(category)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${followed.includes(category) ? 'border-primary bg-primary text-white' : 'border-hairline text-ink hover:border-primary'}`}>
                    {CATEGORY_META[category].name}
                </button>
            ))}
        </div>
        {loaded && <div className="mt-5 space-y-4">
            {stories.length > 0 ? stories.map(article => (
                <div key={article.id} className="border-b border-hairline pb-3 last:border-0">
                    <PublisherLink article={article} className="font-display text-sm font-semibold leading-snug text-ink hover:text-primary">
                        {article.title}
                    </PublisherLink>
                    <p className="mt-1 text-xs text-muted">{CATEGORY_META[article.category]?.name} · {article.source_name}</p>
                </div>
            )) : <p className="text-sm text-muted">Choose a topic above to see its latest stories.</p>}
        </div>}
        <Link href="/search" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-primary hover:underline">Search all news</Link>
    </section>;
}
