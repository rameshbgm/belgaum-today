'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, FileText, Rss, Activity, Brain,
    Settings, ChevronLeft, ChevronRight, LogOut, ExternalLink,
    Menu, X
} from 'lucide-react';

const NAV_ITEMS = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/articles', icon: FileText, label: 'Articles' },
    { href: '/admin/feeds', icon: Rss, label: 'RSS Feeds' },
    { href: '/admin/agents-log', icon: Brain, label: 'Agent Logs' },
    { href: '/admin/logs', icon: Activity, label: 'System Logs' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    // If on login page, render without sidebar
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/admin/login';
    };

    return (
        <div className="admin-layout">
            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="admin-sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`admin-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
                {/* Logo */}
                <div className="admin-sidebar-header">
                    <Link href="/admin/dashboard" className="admin-sidebar-logo">
                        <div className="admin-logo-icon">B</div>
                        {!collapsed && <span className="admin-logo-text">Admin Panel</span>}
                    </Link>
                    <button
                        className="admin-sidebar-toggle desktop-only"
                        onClick={() => setCollapsed(!collapsed)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                    </button>
                    <button
                        className="admin-sidebar-toggle mobile-only"
                        onClick={() => setMobileOpen(false)}
                        aria-label="Close sidebar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Nav links */}
                <nav className="admin-sidebar-nav">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`admin-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => setMobileOpen(false)}
                                title={collapsed ? item.label : undefined}
                            >
                                <item.icon className="admin-nav-icon" />
                                {!collapsed && <span>{item.label}</span>}
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="admin-sidebar-footer">
                    <Link
                        href="/"
                        target="_blank"
                        className="admin-nav-item"
                        title={collapsed ? 'View Site' : undefined}
                    >
                        <ExternalLink className="admin-nav-icon" />
                        {!collapsed && <span>View Site</span>}
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="admin-nav-item admin-nav-logout"
                        title={collapsed ? 'Logout' : undefined}
                    >
                        <LogOut className="admin-nav-icon" />
                        {!collapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className={`admin-main ${collapsed ? 'sidebar-collapsed' : ''}`}>
                {/* Top bar (mobile) */}
                <header className="admin-topbar">
                    <button
                        className="admin-mobile-menu"
                        onClick={() => setMobileOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="admin-topbar-title">
                        {NAV_ITEMS.find(i => pathname.startsWith(i.href))?.label || 'Admin'}
                    </span>
                </header>

                {/* Page content */}
                <div className="admin-content">
                    {children}
                </div>
            </div>
        </div>
    );
}
