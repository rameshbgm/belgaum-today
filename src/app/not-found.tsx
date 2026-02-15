import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui';

export default function NotFound() {
    return (
        <div className="min-h-[60vh] flex items-center justify-center px-4">
            <div className="text-center">
                {/* 404 Graphic */}
                <div className="relative mb-8">
                    <div className="text-[150px] md:text-[200px] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 opacity-20 select-none">
                        404
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-6xl">📰</div>
                    </div>
                </div>

                {/* Message */}
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                    Page Not Found
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                    Oops! The page you&apos;re looking for doesn&apos;t exist. It might have been moved, deleted, or perhaps never existed in the first place.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link href="/">
                        <Button>
                            <Home className="w-4 h-4 mr-2" />
                            Back to Homepage
                        </Button>
                    </Link>
                    <Link href="/search">
                        <Button variant="outline">
                            <Search className="w-4 h-4 mr-2" />
                            Search Articles
                        </Button>
                    </Link>
                </div>

                {/* Quick Links */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Popular categories you might be interested in:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {['India', 'Business', 'Technology', 'Sports', 'Belgaum'].map((cat) => (
                            <Link
                                key={cat}
                                href={`/${cat.toLowerCase()}`}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
