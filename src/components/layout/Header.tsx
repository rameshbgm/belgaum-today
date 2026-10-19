"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Menu, X, Search, Moon, Sun, Rss, LogIn, BookOpen, Info } from 'lucide-react';
import { CATEGORY_META, TOP_LEVEL_CATEGORIES } from '@/types';
import { AI_NEWS_ENABLED } from '@/lib/features';
import { BrandLogo } from './BrandLogo';

export function Header() {
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dark, setDark] = useState(false);
    const header = useRef<HTMLElement>(null);
    const menuButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const timer = window.setTimeout(() => setDark(document.documentElement.classList.contains('dark')), 0);
        const close = (event: PointerEvent) => { if (header.current && !header.current.contains(event.target as Node)) setMenuOpen(false); };
        const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setMenuOpen(false); menuButton.current?.focus(); } };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', escape);
        return () => { clearTimeout(timer); document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', escape); };
    }, []);
    const toggleTheme = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle('dark', next);
        try { localStorage.setItem('darkMode', String(next)); } catch { /* Theme still works for this visit. */ }
    };
    return <header ref={header} className="site-header">
        <div className="masthead"><div className="container header-inner">
            <Link href="/" className="wordmark" onClick={() => setMenuOpen(false)}><BrandLogo /></Link>
            <div className="header-tools">
                <form action="/search" role="search" className="header-search">
                    <Search size={17} aria-hidden="true" /><input type="search" name="q" aria-label="Search news" placeholder="Search news, topics or publishers" maxLength={200} />
                </form>
                <Link href="/search" className="icon-button mobile-search" aria-label="Search news"><Search size={23} /></Link>
                <button type="button" onClick={toggleTheme} className="icon-button theme-toggle" aria-label={dark ? 'Use light theme' : 'Use dark theme'}>{dark ? <Sun size={21} /> : <Moon size={21} />}</button>
                <button ref={menuButton} type="button" className="icon-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} aria-controls="site-menu">{menuOpen ? <X size={25} /> : <Menu size={25} />}</button>
            </div>
        </div></div>
        <nav className="category-nav" aria-label="News categories"><div className="container category-links">
            <Link href="/" aria-current={pathname === '/' ? 'page' : undefined} onClick={() => setMenuOpen(false)}>Home</Link>
            {TOP_LEVEL_CATEGORIES.map(category => <Link key={category} href={`/${category}`} aria-current={pathname === `/${category}` ? 'page' : undefined} onClick={() => setMenuOpen(false)}>{CATEGORY_META[category].name}</Link>)}
        </div></nav>
        {menuOpen && <div id="site-menu" className="site-menu">
            <nav aria-label="Explore news"><Link href="/" onClick={() => setMenuOpen(false)}>Home</Link>{TOP_LEVEL_CATEGORIES.map(category => <Link key={category} href={`/${category}`} onClick={() => setMenuOpen(false)}>{CATEGORY_META[category].name}</Link>)}</nav>
            <nav className="menu-secondary" aria-label="More from Belgaum Today">
                <Link href="/briefing" onClick={() => setMenuOpen(false)}><BookOpen size={17} /> Today&rsquo;s briefing</Link>
                <Link href="/blog" onClick={() => setMenuOpen(false)}><BookOpen size={17} /> Blog</Link>
                <Link href="/about" onClick={() => setMenuOpen(false)}><Info size={17} /> About</Link>
                <Link href="/feed.xml"><Rss size={17} /> RSS feed</Link>
                <Link href="/admin/login" onClick={() => setMenuOpen(false)}><LogIn size={17} /> Editorial desk</Link>
                {AI_NEWS_ENABLED && <Link href="/ai-news" onClick={() => setMenuOpen(false)}>AI News</Link>}
                <button onClick={toggleTheme} type="button">{dark ? <Sun size={17} /> : <Moon size={17} />}{dark ? 'Light theme' : 'Dark theme'}</button>
            </nav>
        </div>}
    </header>;
}
