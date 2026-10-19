'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function SiteChrome({ children, footer, advertisements }: {
    children: React.ReactNode;
    footer: React.ReactNode;
    advertisements: React.ReactNode;
}) {
    const pathname = usePathname();
    // Shared server layouts persist across client navigation. Decide which
    // shell to show from the current route, rather than request headers.
    if (pathname.startsWith('/admin')) return children;
    return <>
        {advertisements}
        <div className="min-h-screen flex flex-col bg-background">
            <Header />
            <main id="main-content" className="flex-1">{children}</main>
            {footer}
        </div>
    </>;
}
