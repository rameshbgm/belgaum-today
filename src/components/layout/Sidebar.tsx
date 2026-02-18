'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Tag, Rss, Loader2, Clock, Eye } from 'lucide-react';
import { Badge } from '@/components/ui';
import { CATEGORY_META, Category } from '@/types';
import { formatRelativeTime, truncate, formatNumber } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

interface TrendingArticle {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    featured_image: string | null;
    source_name: string;
    published_at: string;
}

interface MostViewedArticle {
    id: number;
    title: string;
    slug: string;
    source_name: string;
    published_at: string;
    view_count: number;
}

interface SidebarProps {
    showCategories?: boolean;
    showRss?: boolean;
    trendingArticles?: TrendingArticle[];
    mostViewedArticles?: MostViewedArticle[];
    showAds?: boolean;
}

export function Sidebar({
    showCategories = false,
    showRss = true,
    trendingArticles = [],
    mostViewedArticles = [],
    showAds = false,
}: SidebarProps) {

    return (
        <aside className="space-y-6">
            {/* Most Viewed Articles */}
            {mostViewedArticles.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <Eye className="w-5 h-5 text-blue-500" />
                        Most Viewed
                    </h3>
                    <div className="space-y-4">
                        {mostViewedArticles.slice(0, 15).map((article, index) => (
                            <Link
                                key={article.id}
                                href={`/article/${article.slug}`}
                                className="group block"
                            >
                                <div className="flex gap-3">
                                    {/* Rank Badge */}
                                    <div className="flex-shrink-0">
                                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white text-xs flex items-center justify-center font-bold">
                                            {index + 1}
                                        </span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                            {article.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {formatNumber(article.view_count)}
                                            </span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(article.published_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Advertisement Space */}
            {showAds && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8">
                    <div className="text-center">
                        <div className="mb-3">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
                                <path d="M9 9h6v6H9z" strokeWidth="2" />
                            </svg>
                        </div>
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Advertisement
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                            Google/Meta Ads
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
                            300 × 600
                        </p>
                    </div>
                </div>
            )}

            {/* Trending Articles */}
            {trendingArticles.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                        Trending News
                    </h3>
                    <div className="space-y-4">
                        {trendingArticles.slice(0, 15).map((article, index) => (
                            <Link
                                key={article.id}
                                href={`/article/${article.slug}`}
                                className="group block"
                            >
                                <div className="flex gap-3">
                                    {/* Rank Badge */}
                                    <div className="flex-shrink-0">
                                        <span className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-xs flex items-center justify-center font-bold">
                                            {index + 1}
                                        </span>
                                    </div>
                                    
                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-1">
                                            {article.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                            <span className="truncate">{article.source_name}</span>
                                            <span>•</span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(article.published_at)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

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
