'use client';

import { useEffect, useRef, useState } from 'react';

export function StorySinceVisit({ eventId, updates }: { eventId: number; updates: Array<{ id: number; created_at: string }> }) {
  const [newCount, setNewCount] = useState<number | null>(null);
  const previousVisit = useRef<number | undefined>(undefined);
  useEffect(() => {
    const key = `story-last-visit-${eventId}`;
    if (previousVisit.current === undefined) previousVisit.current = Number(localStorage.getItem(key) || 0);
    const previous = previousVisit.current;
    const count = previous ? updates.filter(update => new Date(update.created_at).getTime() > previous).length : null;
    const timer = window.setTimeout(() => setNewCount(count), 0);
    localStorage.setItem(key, String(Date.now()));
    return () => window.clearTimeout(timer);
  }, [eventId, updates]);
  if (newCount === null) return null;
  return <p className="mt-3 text-sm font-semibold text-accent" aria-live="polite">{newCount ? `${newCount} report${newCount === 1 ? '' : 's'} since your last visit` : 'No new reports since your last visit'}</p>;
}
