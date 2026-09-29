'use client';

import { useId, useState } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';

export type StorySummary = {
    version: 2;
    summary: string;
    summarySourceNumbers: number[];
    developments: Array<{ text: string; sourceNumbers: number[] }>;
    sources: Array<{ id: number; title: string; publisher: string; url: string; fullTextFetched: boolean }>;
};

export function StorySummaryButton({ storyId, initialSummary = null }: { storyId: number; initialSummary?: StorySummary | null }) {
    const panelId = useId();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState<StorySummary | null>(initialSummary);
    const [error, setError] = useState<string | null>(null);

    async function revealSummary() {
        if (summary) { setOpen(value => !value); return; }
        setOpen(true);
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/story/${storyId}/summary`, { method: 'POST' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'The summary is unavailable right now.');
            setSummary(data as StorySummary);
        } catch (requestError) {
            setError(requestError instanceof Error ? requestError.message : 'The summary is unavailable right now.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="mt-4">
            <button
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={revealSummary}
                className="inline-flex min-h-10 items-center gap-2 border border-accent/35 px-3 py-2 text-xs font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
                <Sparkles aria-hidden="true" className="h-4 w-4" />
                {summary ? (open ? 'Hide AI summary' : 'Show AI summary') : 'AI summary'}
                {open ? <ChevronUp aria-hidden="true" className="h-3.5 w-3.5" /> : <ChevronDown aria-hidden="true" className="h-3.5 w-3.5" />}
            </button>

            {open && <div id={panelId} className="mt-4 border-t border-hairline pt-4" aria-live="polite">
                {loading && <div className="space-y-3" aria-label="Reading publisher reports and preparing a summary">
                    <div className="h-3 w-5/6 animate-pulse bg-hairline" />
                    <div className="h-3 w-full animate-pulse bg-hairline" />
                    <div className="h-3 w-2/3 animate-pulse bg-hairline" />
                    <p className="text-xs text-muted">Reading the publisher reports…</p>
                </div>}

                {error && <div className="flex items-start gap-2 text-sm text-primary" role="alert">
                    <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>{error} <button type="button" onClick={revealSummary} className="ml-1 font-semibold underline underline-offset-2">Try again</button></div>
                </div>}

                {summary && <div className="max-w-3xl">
                    <p className="text-base leading-7 text-ink">{summary.summary}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span>Sources:</span>
                        {summary.summarySourceNumbers.map(sourceNumber => {
                            const source = summary.sources[sourceNumber];
                            return source ? <a key={sourceNumber} href={source.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-accent underline underline-offset-2">{source.publisher} ↗</a> : null;
                        })}
                    </div>
                    {summary.developments.length > 0 && <ul className="mt-4 space-y-3">
                        {summary.developments.map((development, index) => <li key={`${index}-${development.text}`} className="text-sm leading-5 text-ink">
                            <span>{development.text}</span>
                            {development.sourceNumbers.length > 0 && <span className="ml-2 inline-flex gap-1">
                                {development.sourceNumbers.map(sourceNumber => {
                                    const source = summary.sources[sourceNumber];
                                    return source ? <a key={sourceNumber} href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`Source ${sourceNumber + 1}: ${source.publisher}`} className="text-xs font-semibold text-accent underline underline-offset-2">[{sourceNumber + 1}]</a> : null;
                                })}
                            </span>}
                        </li>)}
                    </ul>}
                    <div className="mt-5 border-t border-hairline pt-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Publisher reports reviewed</p>
                        <ul className="mt-2 space-y-2">
                            {summary.sources.map((source, index) => <li key={source.id} className="flex flex-wrap items-baseline gap-x-2 text-xs">
                                <span className="font-semibold text-accent">[{index + 1}]</span>
                                <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-ink underline decoration-hairline underline-offset-2 hover:decoration-accent">{source.publisher}: {source.title}</a>
                                <span className="text-muted">{source.fullTextFetched ? 'full article read' : 'RSS excerpt used'}</span>
                            </li>)}
                        </ul>
                        <p className="mt-3 text-[11px] text-muted">AI generated text can make mistakes. Check the linked reports.</p>
                    </div>
                </div>}
            </div>}
        </div>
    );
}
