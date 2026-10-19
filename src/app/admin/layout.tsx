"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FileText, Rss, Database, Brain, ExternalLink, LogOut } from 'lucide-react';
import { BrandLogo } from '@/components/layout/BrandLogo';
const navigation = [
    { href: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
    { href: '/admin/articles', label: 'Articles', icon: FileText },
    { href: '/admin/feeds', label: 'Publisher feeds', icon: Rss },
    { href: '/admin/rss-logs', label: 'Feed activity', icon: Database },
    { href: '/admin/agents-log', label: 'AI activity', icon: Brain },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname === '/admin/login') return children;
    const logout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); window.location.href = '/admin/login'; };
    return <div className="editor-shell">
        <header className="editor-header"><div className="editor-header-inner"><Link href="/admin/dashboard" className="wordmark"><BrandLogo /></Link><span className="editor-label">Editorial desk</span><div className="editor-header-actions"><Link href="/" className="icon-button" aria-label="View reader website"><ExternalLink size={19} /></Link><button type="button" onClick={logout} className="icon-button" aria-label="Sign out"><LogOut size={19} /></button></div></div></header>
        <div className="editor-navigation"><nav aria-label="Editorial workspace">{navigation.map(item => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? 'page' : undefined}><item.icon size={16} aria-hidden="true" />{item.label}</Link>)}</nav></div>
        <main id="main-content" className="editor-content">{children}</main>
    </div>;
}
