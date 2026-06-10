'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Eye, Clock, Info, ExternalLink } from 'lucide-react';
import { Badge, Tooltip } from '@/components/ui';
import { Article, CATEGORY_META } from '@/types';
import { formatRelativeTime, truncate, formatNumber } from '@/lib/utils';
import { NewsFallbackImage } from './NewsFallbackImage';

interface ArticleCardProps {
    article: Article;
    priority?: boolean;
    compact?: boolean;
}

export function ArticleCard({ article, priority = false, compact = false }: ArticleCardProps) {
    return (
        <article className={`group bg-surface rounded-lg overflow-hidden border border-hairline transition-all duration-300 hover:shadow-md hover:border-primary/40 ${compact ? 'text-sm' : ''}`}>
            {/* Image */}
            <Link href={`/article/${article.slug}`} className={`block relative overflow-hidden ${compact ? 'aspect-square sm:aspect-[4/3] md:aspect-video' : 'aspect-video'}`}>
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
            <div className={compact ? "p-1.5 sm:p-2 md:p-3" : "p-4"}>
                {/* Category eyebrow */}
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
                    {CATEGORY_META[article.category]?.name}
                </span>

                {/* Title */}
                <Link href={`/article/${article.slug}`}>
                    <h3 className={`font-display font-semibold text-ink mb-1 line-clamp-3 sm:line-clamp-2 group-hover:text-primary transition-colors ${compact ? 'text-[11px] leading-tight sm:text-xs md:text-sm' : 'text-lg'}`}>
                        {article.title}
                    </h3>
                </Link>

                {/* Excerpt - Hidden in compact mode */}
                {!compact && (
                    <p className="text-sm text-muted mb-3 line-clamp-2">
                        {truncate(article.excerpt || '', 150)}
                    </p>
                )}

                {/* Meta */}
                <div className={`flex items-center justify-between text-muted ${compact ? 'text-xs' : 'text-xs'}`}>
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
                                        className="flex items-center gap-1 text-accent hover:underline"
                                    >
                                        Read Original <ExternalLink className="w-3 h-3" />
                                    </a>
                                </div>
                            }
                            position="bottom"
                        >
                            <span className="flex items-center gap-1 cursor-pointer hover:text-accent transition-colors">
                                {article.source_name}
                                <Info className="w-3 h-3" />
                            </span>
                        </Tooltip>

                        {/* Time */}
                        <span className="flex items-center gap-0.5">
                            <Clock className={compact ? "w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" : "w-3 h-3"} />
                            <span className="hidden md:inline">{formatRelativeTime(article.published_at || article.created_at)}</span>
                            <span className="md:hidden">{formatRelativeTime(article.published_at || article.created_at).split(' ')[0]}</span>
                        </span>
                    </div>

                    {/* Views */}
                    <span className="flex items-center gap-0.5">
                        <Eye className={compact ? "w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3" : "w-3 h-3"} />
                        <span className="hidden md:inline">{formatNumber(article.view_count)}</span>
                        <span className="md:hidden">{article.view_count > 999 ? `${Math.floor(article.view_count / 1000)}k` : article.view_count}</span>
                    </span>
                </div>
            </div>
        </article>
    );
}
