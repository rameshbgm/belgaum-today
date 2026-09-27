import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronRight, Clock, Eye, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META } from '@/types';
import { Badge } from '@/components/ui';
import { ShareButtons, ArticleCard, ArticleViewTracker, NewsFallbackImage } from '@/components/articles';
import { formatDate, formatRelativeTime, formatNumber, sanitizeArticleContent } from '@/lib/utils';

type Props = {
    params: Promise<{ slug: string }>;
};

async function getArticle(slug: string): Promise<Article | null> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`,
            [slug]
        );
        return articles.length > 0 ? articles[0] : null;
    } catch {
        return null;
    }
}

async function getRelatedArticles(category: string, currentId: number): Promise<Article[]> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published' AND category = ? AND id != ? ORDER BY published_at DESC LIMIT 4`,
            [category, currentId]
        );
        return articles;
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return { title: 'Article Not Found' };
    }

    return {
        title: article.title,
        description: article.excerpt,
        robots: { index: false, follow: true },
        openGraph: {
            title: article.title,
            description: article.excerpt || '',
            type: 'article',
            publishedTime: article.published_at?.toISOString(),
            authors: [article.source_name],
            images: article.featured_image ? [article.featured_image] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: article.excerpt || '',
            images: article.featured_image ? [article.featured_image] : [],
        },
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        notFound();
    }

    const relatedArticles = await getRelatedArticles(article.category, article.id);
    const categoryMeta = CATEGORY_META[article.category];
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const articleUrl = `${siteUrl}/article/${article.slug}`;

    // JSON-LD structured data
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: article.title,
        description: article.excerpt,
        image: article.featured_image,
        datePublished: article.published_at?.toISOString(),
        dateModified: article.updated_at.toISOString(),
        author: {
            '@type': 'Organization',
            name: article.source_name,
        },
        publisher: {
            '@type': 'Organization',
            name: 'Belgaum Today',
            logo: {
                '@type': 'ImageObject',
                url: `${siteUrl}/logo.png`,
            },
        },
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': articleUrl,
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            
            {/* Client-side view tracking */}
            <ArticleViewTracker articleId={article.id} category={article.category} />

            <article className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-muted mb-6">
                    <Link href="/" className="hover:text-primary transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link
                        href={`/${article.category}`}
                        className="hover:text-primary transition-colors"
                    >
                        {categoryMeta.name}
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="line-clamp-1">{article.title}</span>
                </nav>

                {/* Article Header */}
                <header className="mb-8">
                    {/* Category & AI Badge */}
                    <div className="flex items-center gap-2 mb-4">
                        <Link href={`/${article.category}`}>
                            <Badge variant="custom" color={categoryMeta.color} size="md">
                                {categoryMeta.name}
                            </Badge>
                        </Link>

                    </div>

                    {/* Title */}
                    <h1 className="font-display text-3xl md:text-5xl font-bold text-ink mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-6">
                        <span className="flex items-center gap-1.5">
                            <Calendar className="w-4 h-4" />
                            {formatDate(article.published_at || article.created_at)}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            {article.reading_time} min read
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Eye className="w-4 h-4" />
                            {formatNumber(article.view_count)} views
                        </span>
                    </div>

                    {/* Share Buttons */}
                    <ShareButtons url={articleUrl} title={article.title} />
                </header>

                {/* Featured Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
                    {article.featured_image ? (
                        <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 800px"
                        />
                    ) : (
                        <NewsFallbackImage seed={article.id} />
                    )}
                </div>

                {/* Article Content */}
                {(() => {
                    const cleanContent = sanitizeArticleContent(article.content, article.title);
                    if (cleanContent) {
                        return (
                            <div className="prose dark:prose-invert max-w-none mb-8">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {cleanContent}
                                </ReactMarkdown>
                            </div>
                        );
                    }
                    // Fallback: show excerpt when content is empty/just a title repeat
                    return article.excerpt ? (
                        <div className="prose dark:prose-invert max-w-none mb-8">
                            <p>{article.excerpt}</p>
                        </div>
                    ) : null;
                })()}

                {/* Source Attribution Box */}
                <div className="bg-[#F4FBFA] dark:bg-teal-900/15 rounded-xl p-6 mb-8 border border-teal-200/60 dark:border-teal-800/60">
                    <h3 className="font-display text-lg font-semibold text-ink mb-2">
                        Original Source
                    </h3>
                    <p className="text-muted mb-4">
                        This article was originally published by <strong>{article.source_name}</strong>.
                    </p>
                    <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-white font-medium rounded-lg hover:bg-teal-800 transition-colors"
                    >
                        Read Original Article
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <section className="mt-12">
                        <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-6">
                            Related Articles
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {relatedArticles.map((related) => (
                                <ArticleCard key={related.id} article={related} />
                            ))}
                        </div>
                    </section>
                )}
            </article>
        </>
    );
}
