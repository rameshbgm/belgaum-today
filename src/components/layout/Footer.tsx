import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Mail, MapPin, Phone, Rss } from 'lucide-react';
import { CATEGORY_META, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

export function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-gray-900 text-gray-300">
            {/* Main Footer */}
            <div className="container mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand */}
                    <div>
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                                B
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    Belgaum <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Today</span>
                                </h2>
                            </div>
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            Your trusted source for the latest news from Belgaum and beyond. We bring you accurate, timely, and relevant news from across India.
                        </p>
                        <div className="flex gap-3">
                            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-blue-600 transition-colors" aria-label="Facebook">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-sky-500 transition-colors" aria-label="Twitter">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-pink-600 transition-colors" aria-label="Instagram">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="p-2 rounded-lg bg-gray-800 hover:bg-red-600 transition-colors" aria-label="Youtube">
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
                                <Link href="/search" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Advanced Search
                                </Link>
                            </li>
                            <li>
                                <Link href="/feed.xml" className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                                    <Rss className="w-4 h-4" /> RSS Feed
                                </Link>
                            </li>
                            <li>
                                <Link href="/admin/login" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Admin Login
                                </Link>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                                    Terms of Service
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-3 text-sm text-gray-400">
                                <MapPin className="w-5 h-5 flex-shrink-0 text-blue-400" />
                                <span>Belgaum, Karnataka, India - 590001</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-400">
                                <Phone className="w-5 h-5 flex-shrink-0 text-blue-400" />
                                <span>+91 123 456 7890</span>
                            </li>
                            <li className="flex items-center gap-3 text-sm text-gray-400">
                                <Mail className="w-5 h-5 flex-shrink-0 text-blue-400" />
                                <span>contact@belgaum.today</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-gray-800">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <p>© {currentYear} Belgaum Today. All rights reserved.</p>
                        <p>Made with ❤️ in Belgaum</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
