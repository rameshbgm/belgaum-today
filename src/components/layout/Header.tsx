'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [dateline, setDateline] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const isDark = localStorage.getItem('darkMode') === 'true' ||
                (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            setIsDarkMode(isDark);
            document.documentElement.classList.toggle('dark', isDark);
        }

        // Build the dateline client-side to avoid SSR locale mismatch
        const now = new Date();
        setDateline(`${WEEKDAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`);

        const handleScroll = () => setIsScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        localStorage.setItem('darkMode', String(newMode));
        document.documentElement.classList.toggle('dark', newMode);
    };

    return (
        <header className="relative z-50 bg-background">
            {/* ── Dateline strip ── */}
            <div className="border-b border-hairline">
                <div className="container mx-auto px-4 flex items-center justify-between h-9 text-[11px] uppercase tracking-[0.18em] text-muted">
                    <span className="hidden sm:inline tabular-nums">{dateline || ' '}</span>
                    <span className="font-medium text-accent">Belagavi · Karnataka</span>
                    <div className="flex items-center gap-3">
                        <Link href="/feed.xml" className="hidden sm:inline hover:text-primary transition-colors">RSS</Link>
                        <button
                            onClick={toggleDarkMode}
                            className="p-1 -mr-1 text-muted hover:text-primary transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Masthead nameplate ── */}
            <div className="container mx-auto px-4 pt-7 pb-5 text-center">
                <div className="flex items-center justify-center gap-4">
                    <span className="hidden md:block h-px w-16 bg-ink/25" />
                    <Link href="/" className="inline-block">
                        <h1 className="font-display text-4xl md:text-6xl font-black tracking-[-0.02em] text-ink leading-none">
                            Belgaum<span className="text-primary"> Today</span>
                        </h1>
                    </Link>
                    <span className="hidden md:block h-px w-16 bg-ink/25" />
                </div>
                <p className="mt-2 text-[11px] md:text-xs uppercase tracking-[0.3em] text-muted">
                    Local News · Global Standards
                </p>
            </div>

            {/* ── Nav bar (becomes sticky on scroll) ── */}
            <nav
                className={cn(
                    'border-y-2 border-ink/85 bg-background transition-shadow duration-300 sticky top-0',
                    isScrolled && 'shadow-[0_4px_20px_-8px_rgba(26,23,18,0.25)]'
                )}
            >
                <div className="container mx-auto px-4 flex items-center justify-between h-12">
                    {/* condensed wordmark appears when scrolled */}
                    <Link
                        href="/"
                        className={cn(
                            'font-display text-lg font-bold text-ink transition-all duration-300 lg:absolute lg:left-4',
                            isScrolled ? 'opacity-100' : 'opacity-0 pointer-events-none lg:opacity-0'
                        )}
                    >
                        B<span className="text-primary">T</span>
                    </Link>

                    {/* desktop nav, centered */}
                    <div className="hidden lg:flex items-center gap-7 mx-auto">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/75 hover:text-primary transition-colors relative py-1 group"
                            >
                                {CATEGORY_META[cat].name}
                                <span className="absolute -bottom-px left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
                            </Link>
                        ))}
                    </div>

                    <Link
                        href="/search"
                        className="hidden lg:flex lg:absolute lg:right-4 items-center gap-1.5 text-[13px] font-semibold uppercase tracking-[0.12em] text-ink/75 hover:text-primary transition-colors"
                    >
                        <Search className="w-4 h-4" /> Search
                    </Link>

                    {/* mobile controls */}
                    <span className="lg:hidden font-display text-base font-bold text-ink">
                        Belgaum<span className="text-primary"> Today</span>
                    </span>
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="lg:hidden p-2 -mr-2 text-ink"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </nav>

            {/* ── Mobile menu ── */}
            {isMenuOpen && (
                <div className="lg:hidden border-b border-hairline bg-background animate-slide-down">
                    <div className="container mx-auto px-4 py-3 flex flex-col">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="flex items-center gap-3 py-3 border-b border-hairline last:border-0 text-sm font-semibold uppercase tracking-wide text-ink/80 hover:text-primary transition-colors"
                            >
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: CATEGORY_META[cat].color }} />
                                {CATEGORY_META[cat].name}
                            </Link>
                        ))}
                        <Link
                            href="/search"
                            onClick={() => setIsMenuOpen(false)}
                            className="flex items-center gap-2 py-3 text-sm font-semibold uppercase tracking-wide text-primary"
                        >
                            <Search className="w-4 h-4" /> Search
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
