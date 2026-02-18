'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Clock, Info, ExternalLink } from 'lucide-react';
import { Badge, Tooltip } from '@/components/ui';
import { Article } from '@/types';
import { formatRelativeTime, truncate, formatNumber } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';

interface ArticleCardProps {
    article: Article;
    priority?: boolean;
}

export function ArticleCard({ article, priority = false }: ArticleCardProps) {
    return (
        <article className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-blue-500/50">
            {/* Image */}
            <Link href={`/article/${article.slug}`} className="block relative aspect-video overflow-hidden">
                {article.featured_image ? (
                    <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                        priority={priority}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                ) : (
                    <NewsFallbackImage seed={article.id} />
                )}
                {/* AI Badge */}
                {article.ai_generated && (
                    <div className="absolute top-3 right-3">
                        <Badge variant="info" size="sm">
                            AI ✨
                        </Badge>
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <Link href={`/article/${article.slug}`}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {article.title}
                    </h3>
                </Link>

                {/* Excerpt */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {truncate(article.excerpt || '', 150)}
                </p>

                {/* Meta */}
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                        {/* Source with Tooltip */}
                        <Tooltip
                            content={
                                <div className="p-2 min-w-[200px]">
                                    <p className="font-semibold mb-1">{article.source_name}</p>
                                    <a
                                        href={article.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-blue-400 hover:underline"
                                    >
                                        Read Original <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            }
                            position="bottom"
                        >
                            <span className="flex items-center gap-1 cursor-pointer hover:text-blue-500 transition-colors">
                                {article.source_name}
                                <Info className="w-3 h-3" />
                            </span>
                        </Tooltip>

                        {/* Time */}
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatRelativeTime(article.published_at || article.created_at)}
                        </span>
                    </div>

                    {/* Views */}
                    <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {formatNumber(article.view_count)}
                    </span>
                </div>
            </div>
        </article>
    );
}
