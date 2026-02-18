import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronRight, Clock, Eye, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { query, execute } from '@/lib/db';
import { Article, CATEGORY_META } from '@/types';
import { Badge } from '@/components/ui';
import { ShareButtons, ArticleCard, ArticleViewTracker } from '@/components/articles';
import { formatDate, formatRelativeTime, formatNumber, sanitizeArticleContent } from '@/lib/utils';

type Props = {
    params: Promise<{ slug: string }>;
};

// Mock article for development
const mockArticle: Article = {
    id: 1,
    title: 'Belgaum Celebrates Annual Cultural Festival',
    slug: 'belgaum-celebrates-annual-cultural-festival',
    excerpt: 'The historic city of Belgaum came alive this weekend with vibrant cultural performances and traditional festivities.',
    content: `# Belgaum Cultural Festival 2026

The historic city of Belgaum came alive this weekend with vibrant cultural performances and traditional festivities that attracted thousands of visitors from across the region.

## Event Highlights

The three-day festival featured:
- Traditional folk dances
- Local cuisine stalls
- Art exhibitions
- Music performances

The festival celebrates the rich cultural heritage of the Belgaum region, bringing together communities from different backgrounds.

## Community Response

> "This festival truly represents the spirit of Belgaum. It brings together people from all walks of life to celebrate our shared heritage." - Local Resident

| Day | Event | Attendance |
|-----|-------|------------|
| Day 1 | Opening Ceremony | 5,000 |
| Day 2 | Cultural Shows | 8,000 |
| Day 3 | Grand Finale | 12,000 |

The festival concluded with a spectacular fireworks display that lit up the night sky over Belgaum.`,
    featured_image: null,
    category: 'belgaum',
    source_name: 'Belgaum Times',
    source_url: 'https://example.com/belgaum-festival',
    status: 'published',
    featured: true,
    ai_generated: false,
    ai_confidence: null,
    requires_review: false,
    view_count: 1250,
    reading_time: 3,
    published_at: new Date(),
    created_at: new Date(),
    updated_at: new Date(),
};

async function getArticle(slug: string): Promise<Article | null> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE slug = ? AND status = 'published' LIMIT 1`,
            [slug]
        );
        return articles.length > 0 ? articles[0] : null;
    } catch {
        console.log('Database not available, using mock data');
        if (slug === mockArticle.slug) {
            return mockArticle;
        }
        return mockArticle; // Return mock for any slug in dev mode
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

async function incrementViewCount(articleId: number): Promise<void> {
    try {
        await execute(
            `UPDATE articles SET view_count = view_count + 1 WHERE id = ?`,
            [articleId]
        );
    } catch {
        // Silently fail for view count
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

    // Increment view count
    await incrementViewCount(article.id);

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
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                    <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Home
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link
                        href={`/${article.category}`}
                        className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                        {article.title}
                    </h1>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6">
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
                {article.featured_image && (
                    <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
                        <Image
                            src={article.featured_image}
                            alt={article.title}
                            fill
                            className="object-cover"
                            priority
                            sizes="(max-width: 768px) 100vw, 800px"
                        />
                    </div>
                )}

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
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-xl p-6 mb-8 border border-blue-200 dark:border-blue-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Original Source
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        This article was originally published by <strong>{article.source_name}</strong>.
                    </p>
                    <a
                        href={article.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Read Original Article
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                {/* Related Articles */}
                {relatedArticles.length > 0 && (
                    <section className="mt-12">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
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
