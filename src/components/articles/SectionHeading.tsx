import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export function SectionHeading({ children, href, linkText = 'View all', accent: _accent }: { children: ReactNode; href?: string; linkText?: string; accent?: boolean }) {
    return <div className="section-heading"><h2>{children}</h2>{href && <Link href={href}>{linkText}<ArrowRight size={16} aria-hidden="true" /></Link>}</div>;
}
