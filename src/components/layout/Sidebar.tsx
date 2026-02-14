'use client';

import Link from 'next/link';
import { TrendingUp, Tag, Rss } from 'lucide-react';
import { Badge } from '@/components/ui';
import { CATEGORY_META, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

interface TrendingTopic {
    name: string;
    count: number;
}

interface SidebarProps {
    trendingTopics?: TrendingTopic[];
    showCategories?: boolean;
    showRss?: boolean;
}

export function Sidebar({
    trendingTopics = [
        { name: 'Karnataka Elections', count: 15 },
        { name: 'Tech Layoffs', count: 12 },
        { name: 'Cricket World Cup', count: 10 },
        { name: 'Budget 2026', count: 8 },
        { name: 'Belgaum Development', count: 5 },
    ],
    showCategories = true,
    showRss = true,
}: SidebarProps) {
    return (
        <aside className="space-y-6">
            {/* Trending Topics */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    Trending Topics
                </h3>
                <ul className="space-y-3">
                    {trendingTopics.map((topic, index) => (
                        <li key={topic.name}>
                            <Link
                                href={`/search?q=${encodeURIComponent(topic.name)}`}
                                className="flex items-center justify-between group"
                            >
                                <span className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs flex items-center justify-center font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {topic.name}
                                    </span>
                                </span>
                                <Badge variant="default" size="sm">
                                    {topic.count}
                                </Badge>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Categories */}
            {showCategories && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <Tag className="w-5 h-5 text-purple-500" />
                        Categories
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {categories.map((cat) => (
                            <Link key={cat} href={`/${cat}`}>
                                <Badge
                                    variant="custom"
                                    color={CATEGORY_META[cat].color}
                                    size="md"
                                    className="cursor-pointer hover:opacity-80 transition-opacity"
                                >
                                    {CATEGORY_META[cat].name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* RSS Subscribe */}
            {showRss && (
                <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-5 text-white">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <Rss className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Subscribe via RSS</h3>
                            <p className="text-sm text-white/80">Stay updated with our feed</p>
                        </div>
                    </div>
                    <Link
                        href="/feed.xml"
                        className="block w-full py-2 px-4 bg-white text-blue-600 text-center font-medium rounded-lg hover:bg-white/90 transition-colors"
                    >
                        Get RSS Feed
                    </Link>
                </div>
            )}
        </aside>
    );
}
