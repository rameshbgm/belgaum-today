import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Rss } from 'lucide-react';
import { CATEGORY_META, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-[#1A1712] text-[#C9C1B4]">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                B
                            </div>
                            <div>
                                <h2 className="font-display text-xl font-bold text-white">
                                    Belgaum <span className="text-primary">Today</span>
                                </h2>
                            </div>
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            Your trusted source for the latest news from Belgaum and beyond. We bring you accurate, timely, and relevant news from across India.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors" aria-label="Facebook">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors" aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-white/10 hover:bg-primary transition-colors" aria-label="Youtube">
                                <Youtube className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Categories */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>
                        <ul className="space-y-2">
                            {categories.map((cat) => (
                                <li key={cat}>
                                    <Link
                                        href={`/${cat}`}
                                        className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
                                    >
                                        <span
                                            className="w-2 h-2 rounded-full"
                                            style={{ backgroundColor: CATEGORY_META[cat].color }}
                                        />
                                        {CATEGORY_META[cat].name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/about" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    About Us
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Search News
                                </Link>
                            </li>
                            <li>
                                <Link href="/feed.xml" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                                    <Rss className="w-4 h-4" /> RSS Feed
                                </Link>
                            </li>
                        </ul>

                        <h3 className="text-lg font-semibold text-white mt-6 mb-4">Legal</h3>
                        <ul className="space-y-2">
                            <li>
                                <Link href="/privacy-policy" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-service" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                            <li>
                                <Link href="/terms-of-service#disclaimer" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Disclaimer
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-gray-400">
                                <MapPin className="w-5 h-5 flex-shrink-0 text-accent" />
                                <span>Belgaum (Belagavi), Karnataka, India — 590001</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-400">
                                <Phone className="w-5 h-5 flex-shrink-0 text-accent" />
                                <a href="tel:+91123456789" className="hover:text-white transition-colors">+91 12345 6789</a>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-400">
                                <Mail className="w-5 h-5 flex-shrink-0 text-accent" />
                                <a href="mailto:ask@belgaum.today" className="hover:text-white transition-colors">ask@belgaum.today</a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/10">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© {currentYear} Belgaum Today. All rights reserved.</p>
                        <div className="flex items-center gap-4">
                            <Link href="/privacy-policy" className="hover:text-gray-300 transition-colors">Privacy</Link>
                            <span className="text-gray-700">·</span>
                            <Link href="/terms-of-service" className="hover:text-gray-300 transition-colors">Terms</Link>
                            <span className="text-gray-700">·</span>
                            <Link href="/about" className="hover:text-gray-300 transition-colors">About</Link>
                        </div>
                        <p>Made with ❤️ in Belgaum</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
