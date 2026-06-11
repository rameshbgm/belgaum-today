import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Calendar, Clock, ChevronLeft } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';

type Props = { params: Promise<{ category: string }> };

const VALID_CATEGORIES = Object.keys(CATEGORY_META) as Category[];

async function getBlogs(category: Category): Promise<Article[]> {
    try {
        return await query<Article[]>(
            `SELECT id, title, slug, excerpt, featured_image, category, reading_time, view_count, featured, published_at
             FROM articles
             WHERE status = 'published' AND source_name = 'Belgaum Today' AND category = ?
             ORDER BY featured DESC, published_at DESC LIMIT 50`,
            [category]
        );
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;
    if (!VALID_CATEGORIES.includes(category as Category)) return { title: 'Not Found' };
    const meta = CATEGORY_META[category as Category];
    return {
        title: `${meta.name} Blog — Belgaum Today`,
        description: meta.description,
    };
}

export default async function BlogCategoryPage({ params }: Props) {
    const { category } = await params;
    if (!VALID_CATEGORIES.includes(category as Category)) notFound();

    const cat = category as Category;
    const meta = CATEGORY_META[cat];
    const blogs = await getBlogs(cat);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            <section
                className="border-b border-gray-200 dark:border-gray-800"
                style={{ backgroundColor: `${meta.color}12` }}
            >
                <div className="container mx-auto px-4 py-10">
                    <Link href="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors">
                        <ChevronLeft className="w-4 h-4" /> All Blog Posts
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <span
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: meta.color }}
                        />
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                            {meta.name}
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">{meta.description}</p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-10">
                {blogs.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <p className="text-lg">No posts in {meta.name} yet.</p>
                        <Link href="/blog" className="text-primary hover:underline text-sm mt-2 inline-block">
                            Browse all posts
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogs.map((blog) => (
                            <Link key={blog.id} href={`/blog/post/${blog.slug}`} className="group flex flex-col">
                                <div className="relative aspect-[16/9] rounded-xl overflow-hidden mb-3">
                                    {blog.featured_image ? (
                                        <Image
                                            src={blog.featured_image}
                                            alt={blog.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <NewsFallbackImage seed={blog.id} />
                                    )}
                                </div>
                                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-1">
                                    {blog.title}
                                </h2>
                                {blog.excerpt && (
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                        {truncate(blog.excerpt, 110)}
                                    </p>
                                )}
                                <div className="flex items-center gap-3 text-xs text-gray-400 mt-auto">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {blog.published_at ? formatDate(blog.published_at) : ''}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {blog.reading_time} min
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
