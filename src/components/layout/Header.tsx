'use client';

import Link from 'next/link';
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
                'sticky top-0 z-50 transition-all duration-300',
                isScrolled
                    ? 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-lg'
                    : 'bg-white dark:bg-gray-900'
            )}
        >
            {/* Top Bar */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-1.5">
                <div className="container mx-auto px-4 flex justify-between items-center text-sm">
                    <span className="font-medium">Your trusted source for Belgaum news</span>
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/feed.xml" className="flex items-center gap-1 hover:opacity-80 transition">
                            <Rss className="w-4 h-4" />
                            RSS
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                            B
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                                Belgaum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Today</span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Local News, Global Standards</p>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            >
                                {CATEGORY_META[cat].name}
                            </Link>
                        ))}
                        <Link
                            href="/search"
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-1"
                        >
                            <Search className="w-4 h-4" />
                            Search
                        </Link>
                    </nav>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={toggleDarkMode}
                            className="p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            aria-label="Toggle dark mode"
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="lg:hidden p-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMenuOpen && (
                <nav className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 animate-slide-down">
                    <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
                        {categories.map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat}`}
                                onClick={() => setIsMenuOpen(false)}
                                className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
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
                            className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center gap-2"
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
