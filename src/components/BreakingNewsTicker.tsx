'use client';

import { TrendingUp } from 'lucide-react';
import { truncate } from '@/lib/utils';

export interface TickerArticle {
    id: number;
    title: string;
    source_url: string;
    source_name: string;
}

interface BreakingNewsTickerProps {
    articles: TickerArticle[];
    maxArticles?: number;
}

export function BreakingNewsTicker({ articles, maxArticles = 10 }: BreakingNewsTickerProps) {
    if (articles.length === 0) return null;

    // Limit articles for the ticker
    const tickerArticles = articles.slice(0, maxArticles);

    return (
        <section className="bg-gray-900 dark:bg-black border-y border-gray-800 overflow-hidden">
            <div className="flex items-center">
                {/* Breaking Label */}
                <span className="flex-shrink-0 bg-red-600 text-white text-xs font-bold px-4 py-2.5 flex items-center gap-1.5 uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 animate-pulse" />
                    Breaking
                </span>

                {/* Scrolling Ticker Content */}
                <div className="overflow-hidden flex-1">
                    <div className="flex animate-ticker whitespace-nowrap py-2.5 px-4">
                        {/* Duplicate articles to create seamless loop */}
                        {[...tickerArticles, ...tickerArticles].map((article, idx) => (
                            <a
                                key={`ticker-${article.id}-${idx}`}
                                href={article.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-article-id={article.id}
                                data-source-name={article.source_name}
                                className="inline-flex items-center text-sm text-gray-300 hover:text-white transition-colors mx-8 flex-shrink-0 group"
                            >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 flex-shrink-0 group-hover:scale-125 transition-transform" />
                                {truncate(article.title, 100)}
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
