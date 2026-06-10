'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Menu, X, Sun, Moon, Search, Rss } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORY_META, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

export function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        // Check for dark mode preference
        if (typeof window !== 'undefined') {
            const isDark = localStorage.getItem('darkMode') === 'true' ||
                (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches);
            setIsDarkMode(isDark);
            document.documentElement.classList.toggle('dark', isDark);
        }

        // Handle scroll
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
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
        <header
            className={cn(
                'sticky top-0 z-50 transition-all duration-300 border-b border-hairline',
                isScrolled
                    ? 'bg-background/85 backdrop-blur-lg shadow-sm'
                    : 'bg-background'
            )}
        >
            {/* Top Bar removed per request */}

            {/* Main Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-lg">
                            <Image
                                src="/images/logo.jpeg"
                                alt="Belgaum Today Logo"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-bold text-ink leading-none">
                                Belgaum <span className="text-primary">Today</span>
                            </h1>
                            <p className="text-[11px] text-muted mt-0.5 tracking-wide">Local News, Global Standards</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-primary rounded-md hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors"
                            >
                                {CATEGORY_META[cat].name}
                            </Link>
                        ))}
                        <Link
                            href="/search"
                            className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-primary rounded-md hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors flex items-center gap-1"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <nav className="lg:hidden border-t border-hairline bg-background animate-slide-down">
                    <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-ink/80 hover:text-primary rounded-lg hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors flex items-center gap-2"
                            >
                                <span
                                    className="w-2 h-2 rounded-full"
                                    style={{ backgroundColor: CATEGORY_META[cat].color }}
                                />
                                {CATEGORY_META[cat].name}
                            </Link>
                        ))}
                        <Link
                            href="/search"
                            onClick={() => setIsMenuOpen(false)}
                            className="px-4 py-3 text-sm font-medium text-ink/80 hover:text-primary rounded-lg hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors flex items-center gap-2"
                        >
                            <Search className="w-4 h-4" />
                            Advanced Search
                        </Link>
                    </div>
                </nav>
            )}
        </header>
    );
}
