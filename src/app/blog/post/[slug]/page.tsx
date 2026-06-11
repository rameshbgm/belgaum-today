import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Calendar, Clock, Eye, ChevronRight, ChevronLeft } from 'lucide-react';
import { query, execute } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { ShareButtons, NewsFallbackImage } from '@/components/articles';

type Props = { params: Promise<{ slug: string }> };

async function getBlog(slug: string): Promise<Article | null> {
    try {
        const rows = await query<Article[]>(
            `SELECT * FROM articles
             WHERE slug = ? AND status = 'published' AND source_name = 'Belgaum Today'
             LIMIT 1`,
            [slug]
        );
        return rows[0] ?? null;
    } catch {
        return null;
    }
}

async function getRelatedBlogs(category: string, currentId: number): Promise<Article[]> {
    try {
        return await query<Article[]>(
            `SELECT id, title, slug, excerpt, featured_image, category, reading_time, published_at
             FROM articles
             WHERE status = 'published' AND source_name = 'Belgaum Today'
               AND category = ? AND id != ?
             ORDER BY published_at DESC LIMIT 3`,
            [category, currentId]
        );
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const blog = await getBlog(slug);
    if (!blog) return { title: 'Not Found' };
    return {
        title: `${blog.title} — Belgaum Today Blog`,
        description: blog.excerpt ?? undefined,
        openGraph: {
            title: blog.title,
            description: blog.excerpt ?? '',
            type: 'article',
            publishedTime: blog.published_at?.toString(),
            authors: ['Belgaum Today'],
            images: blog.featured_image ? [blog.featured_image] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: blog.title,
            description: blog.excerpt ?? '',
            images: blog.featured_image ? [blog.featured_image] : [],
        },
    };
}

export default async function BlogPostPage({ params }: Props) {
    const { slug } = await params;
    const blog = await getBlog(slug);
    if (!blog) notFound();

    const [related] = await Promise.all([
        getRelatedBlogs(blog.category, blog.id),
        execute('UPDATE articles SET view_count = view_count + 1 WHERE id = ?', [blog.id]).catch(() => {}),
    ]);

    const catMeta = CATEGORY_META[blog.category as Category];

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Breadcrumb */}
            <div className="border-b border-gray-100 dark:border-gray-800">
                <div className="container mx-auto px-4 py-3">
                    <nav className="flex items-center gap-1 text-sm text-gray-500">
                        <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link href="/blog" className="hover:text-gray-900 dark:hover:text-white transition-colors">Blog</Link>
                        <ChevronRight className="w-4 h-4" />
                        <Link
                            href={`/blog/category/${blog.category}`}
                            className="hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            {catMeta?.name ?? blog.category}
                        </Link>
                    </nav>
                </div>
            </div>

            <article className="container mx-auto px-4 py-10 max-w-4xl">
                {/* Category pill */}
                <Link
                    href={`/blog/category/${blog.category}`}
                    className="inline-block px-3 py-1 rounded-full text-sm font-semibold text-white mb-4"
                    style={{ backgroundColor: catMeta?.color ?? '#6B7280' }}
                >
                    {catMeta?.name ?? blog.category}
                </Link>

                {/* Title */}
                <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4 leading-tight">
                    {blog.title}
                </h1>

                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Belgaum Today</span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {blog.published_at ? formatDate(blog.published_at) : ''}
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {blog.reading_time} min read
                    </span>
                    <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {formatNumber(blog.view_count)} views
                    </span>
                </div>

                {/* Featured image */}
                {blog.featured_image ? (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                        <Image
                            src={blog.featured_image}
                            alt={blog.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>
                ) : (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-8">
                        <NewsFallbackImage seed={blog.id} />
                    </div>
                )}

                {/* Excerpt */}
                {blog.excerpt && (
                    <p className="text-xl text-gray-600 dark:text-gray-300 font-light leading-relaxed mb-8 italic border-l-4 pl-4"
                        style={{ borderColor: catMeta?.color ?? '#6B7280' }}>
                        {blog.excerpt}
                    </p>
                )}

                {/* Content */}
                <div className="prose prose-gray dark:prose-invert prose-lg max-w-none
                    prose-headings:font-display prose-headings:font-bold
                    prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                    prose-img:rounded-xl prose-blockquote:border-l-primary
                    prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {blog.content}
                    </ReactMarkdown>
                </div>

                {/* Share */}
                <div className="mt-10 pt-6 border-t border-gray-100 dark:border-gray-800">
                    <ShareButtons url={`https://belgaum.today/blog/post/${blog.slug}`} title={blog.title} />
                </div>
            </article>

            {/* Related posts */}
            {related.length > 0 && (
                <section className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                    <div className="container mx-auto px-4 py-10 max-w-4xl">
                        <h2 className="font-display text-xl font-bold text-gray-900 dark:text-white mb-6">
                            More from {catMeta?.name}
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {related.map((post) => (
                                <Link key={post.id} href={`/blog/post/${post.slug}`} className="group flex flex-col">
                                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3">
                                        {post.featured_image ? (
                                            <Image src={post.featured_image} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-300" />
                                        ) : (
                                            <NewsFallbackImage seed={post.id} />
                                        )}
                                    </div>
                                    <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-primary transition-colors line-clamp-2">
                                        {post.title}
                                    </h3>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {post.reading_time} min read
                                    </p>
                                </Link>
                            ))}
                        </div>
                        <div className="mt-6">
                            <Link href={`/blog/category/${blog.category}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium">
                                <ChevronLeft className="w-4 h-4" /> All {catMeta?.name} posts
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
}
