import { Newspaper } from 'lucide-react';
export function NewsFallbackImage({ seed: _seed = 0, className = '' }: { seed?: number; className?: string }) {
    return <div className={`photo-unavailable ${className}`}><Newspaper size={30} strokeWidth={1.3} aria-hidden="true" /><span>Belgaum Today</span></div>;
}
