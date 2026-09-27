'use client';

import { useState } from 'react';
import type { Category } from '@/types';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';

export function DailyDigestSignup() {
    const [email, setEmail] = useState('');
    const [topics, setTopics] = useState<Category[]>(['belgaum', 'india']);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setBusy(true);
        setMessage('');
        try {
            const response = await fetch('/api/digest/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, topics }),
            });
            const result = await response.json();
            setMessage(result.message || result.error || 'Could not save your subscription.');
            if (result.success) setEmail('');
        } catch {
            setMessage('Could not reach the subscription service. Try again later.');
        } finally {
            setBusy(false);
        }
    };

    return <section className="mt-9 border-t border-hairline pt-6" aria-label="Daily email digest">
        <h2 className="font-display text-xl font-bold text-ink">News in your inbox</h2>
        <p className="mt-1 text-sm text-muted">A daily selection of publisher stories from the topics you choose.</p>
        <form onSubmit={submit} className="mt-4 space-y-3">
            <label htmlFor="digest-email" className="block text-xs font-semibold uppercase tracking-widest text-ink">Email address</label>
            <input id="digest-email" type="email" autoComplete="email" required value={email}
                onChange={event => setEmail(event.target.value)} placeholder="you@example.com"
                className="w-full rounded-md border border-hairline bg-surface px-3 py-2.5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" />
            <fieldset>
                <legend className="mb-2 text-xs font-semibold uppercase tracking-widest text-ink">Topics</legend>
                <div className="flex flex-wrap gap-2">
                    {TOP_LEVEL_CATEGORIES.map(category => <label key={category}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-hairline px-2.5 py-1.5 text-xs text-ink">
                        <input type="checkbox" checked={topics.includes(category)}
                            onChange={() => setTopics(current => current.includes(category)
                                ? current.filter(value => value !== category) : [...current, category])} />
                        {CATEGORY_META[category].name}
                    </label>)}
                </div>
            </fieldset>
            <button type="submit" disabled={busy || topics.length === 0}
                className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                {busy ? 'Sending confirmation…' : 'Get the daily digest'}
            </button>
            {message && <p role="status" className="text-sm text-muted">{message}</p>}
        </form>
    </section>;
}
