'use client';

import { useEffect, useState } from 'react';
import type { ArchivePage } from '@/lib/archive-search';

type Result = { key: string; data?: ArchivePage; error?: string };

export function useArchiveSearch(params: string, enabled = true) {
    const [attempt, setAttempt] = useState(0);
    const [result, setResult] = useState<Result | null>(null);
    const key = `${params}|${attempt}`;
    useEffect(() => {
        if (!enabled) return;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => controller.abort(), 15000);
        let active = true;
        void (async () => {
            try {
                const response = await fetch(`/api/search?${params}`, { signal: controller.signal });
                const body = await response.json();
                if (!response.ok || !body.success || !Array.isArray(body.data) || !body.pagination) {
                    throw new Error(response.status === 400 ? body.error : 'Couldn’t load results. Please retry.');
                }
                if (active) setResult({ key, data: { items: body.data, ...body.pagination } });
            } catch (error) {
                if (active) setResult({ key, error: error instanceof Error && error.name !== 'AbortError' ? error.message : 'The request took too long. Please retry.' });
            } finally {
                window.clearTimeout(timeout);
            }
        })();
        return () => { active = false; window.clearTimeout(timeout); controller.abort(); };
    }, [params, key, enabled]);
    const current = result?.key === key ? result : null;
    return {
        data: enabled ? current?.data : undefined,
        error: enabled ? current?.error : undefined,
        loading: enabled && !current,
        retry: () => setAttempt(value => value + 1),
    };
}
