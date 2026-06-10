import { ReactNode } from 'react';

/**
 * Editorial section heading: small-caps serif label with a flanking rule.
 * Used to break the broadsheet into named sections.
 */
export function SectionHeading({ children, accent = false }: { children: ReactNode; accent?: boolean }) {
    return (
        <div className="flex items-center gap-4 mb-6">
            <h2 className={`font-display text-xl md:text-2xl font-bold uppercase tracking-[0.08em] ${accent ? 'text-primary' : 'text-ink'} whitespace-nowrap`}>
                {children}
            </h2>
            <span className="flex-1 h-px bg-ink/15" />
        </div>
    );
}
