'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui';
import { Article, CATEGORY_META } from '@/types';
import { formatRelativeTime, truncate, formatNumber } from '@/lib/utils';

interface FeaturedArticleProps {
    article: Article;
}

export function FeaturedArticle({ article }: FeaturedArticleProps) {
    const categoryMeta = CATEGORY_META[article.category];

    return (
        <article className="group relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden">
            {/* Background Image */}
            <div className="absolute inset-0">
                {article.featured_image ? (
                    <Image
                        src={article.featured_image}
                        alt={article.title}
                        fill
                        className="object-cover opacity-50 transition-transform duration-700 group-hover:scale-105"
                        priority
                        sizes="100vw"
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/70 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 md:p-10 min-h-[400px] md:min-h-[500px] flex flex-col justify-end">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-4">
                    <Badge variant="danger" size="md" className="animate-pulse">
                        🔥 Featured
                    </Badge>
                    <Badge variant="custom" color={categoryMeta.color} size="md">
                        {categoryMeta.name}
                    </Badge>
                    {article.ai_generated && (
                        <Badge variant="info" size="md">
                            AI Enhanced ✨
                        </Badge>
                    )}
                </div>

                {/* Title */}
                <Link href={`/article/${article.slug}`}>
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-blue-300 transition-colors">
                        {article.title}
                    </h2>
                </Link>

                {/* Excerpt */}
                <p className="text-gray-300 text-lg mb-6 max-w-2xl line-clamp-3">
                    {truncate(article.excerpt || '', 300)}
                </p>

                {/* Meta & CTA */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="font-medium text-white">{article.source_name}</span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatRelativeTime(article.published_at || article.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {formatNumber(article.view_count)} views
                        </span>
                    </div>

                    <Link
                        href={`/article/${article.slug}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-blue-500 hover:text-white transition-all group/btn"
                    >
                        Read Full Story
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                </div>
            </div>
        </article>
    );
}
