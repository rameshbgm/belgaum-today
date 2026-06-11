import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ChevronRight } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { formatDate, truncate } from '@/lib/utils';
import { NewsFallbackImage } from '@/components/articles';

export const metadata: Metadata = {
    title: 'Blog — Belgaum Today',
    description: 'In-depth articles, guides and stories written by the Belgaum Today editorial team.',
};

const BLOG_CATEGORIES: Category[] = [
    'technology', 'travel', 'science', 'health', 'lifestyle',
    'food', 'education', 'environment', 'culture', 'finance',
    'india', 'business', 'entertainment', 'sports', 'belgaum',
];

async function getBlogs(category?: Category): Promise<Article[]> {
    try {
        const params: (string | number)[] = [];
        let where = "WHERE status = 'published' AND source_name = 'Belgaum Today'";
        if (category) {
            where += ' AND category = ?';
            params.push(category);
        }
        return await query<Article[]>(
            `SELECT id, title, slug, excerpt, featured_image, category, reading_time, view_count, featured, published_at
             FROM articles ${where}
             ORDER BY featured DESC, published_at DESC LIMIT 24`,
            params
        );
    } catch {
        return [];
    }
}

async function getCategoryCounts(): Promise<Record<string, number>> {
    try {
        const rows = await query<Array<{ category: string; count: number }>>(
            `SELECT category, COUNT(*) as count FROM articles
             WHERE status = 'published' AND source_name = 'Belgaum Today'
             GROUP BY category`
        );
        return Object.fromEntries(rows.map(r => [r.category, r.count]));
    } catch {
        return {};
    }
}

export default async function BlogIndexPage() {
    const [blogs, counts] = await Promise.all([getBlogs(), getCategoryCounts()]);
    const featured = blogs.filter(b => b.featured).slice(0, 1)[0] ?? blogs[0];
    const rest = blogs.filter(b => b.id !== featured?.id);

    return (
        <div className="min-h-screen bg-white dark:bg-gray-950">
            {/* Hero */}
            <section className="border-b border-gray-200 dark:border-gray-800 bg-[#FAF8F5] dark:bg-gray-900">
                <div className="container mx-auto px-4 py-12">
                    <h1 className="font-display text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
                        The Blog
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl">
                        Stories, guides and perspectives from the Belgaum Today editorial team.
                    </p>
                </div>
            </section>

            <div className="container mx-auto px-4 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    {/* Main content */}
                    <main className="lg:col-span-3">
                        {/* Featured post */}
                        {featured && (
                            <Link href={`/blog/post/${featured.slug}`} className="group block mb-10">
                                <div className="relative aspect-[16/7] rounded-2xl overflow-hidden mb-4">
                                    {featured.featured_image ? (
                                        <Image
                                            src={featured.featured_image}
                                            alt={featured.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <NewsFallbackImage seed={featured.id} />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <span
                                            className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-3"
                                            style={{ backgroundColor: CATEGORY_META[featured.category as Category]?.color ?? '#6B7280' }}
                                        >
                                            {CATEGORY_META[featured.category as Category]?.name ?? featured.category}
                                        </span>
                                        <h2 className="font-display text-2xl md:text-3xl font-bold text-white group-hover:underline">
                                            {featured.title}
                                        </h2>
                                        <div className="flex items-center gap-4 mt-2 text-sm text-white/70">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                {formatDate(featured.published_at!)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {featured.reading_time} min read
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        )}

                        {/* Grid of remaining posts */}
                        {rest.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {rest.map((blog) => (
                                    <BlogCard key={blog.id} blog={blog} />
                                ))}
                            </div>
                        )}

                        {blogs.length === 0 && (
                            <div className="text-center py-20 text-gray-500">
                                <p className="text-lg">No blog posts yet.</p>
                                <p className="text-sm mt-1">Check back soon!</p>
                            </div>
                        )}
                    </main>

                    {/* Sidebar — categories */}
                    <aside className="lg:col-span-1">
                        <div className="sticky top-24">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-4">
                                Browse by Topic
                            </h3>
                            <ul className="space-y-1">
                                {BLOG_CATEGORIES.filter(c => (counts[c] ?? 0) > 0).map((cat) => (
                                    <li key={cat}>
                                        <Link
                                            href={`/blog/category/${cat}`}
                                            className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                                        >
                                            <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: CATEGORY_META[cat]?.color }}
                                                />
                                                {CATEGORY_META[cat]?.name}
                                            </span>
                                            <span className="text-xs text-gray-400">{counts[cat]}</span>
                                        </Link>
                                    </li>
                                ))}
                                <li>
                                    <Link
                                        href="/blog"
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:underline"
                                    >
                                        All posts <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </li>
                            </ul>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}

function BlogCard({ blog }: { blog: Article }) {
    const meta = CATEGORY_META[blog.category as Category];
    return (
        <Link href={`/blog/post/${blog.slug}`} className="group flex flex-col">
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
            <span
                className="inline-block self-start px-2 py-0.5 rounded text-xs font-semibold text-white mb-2"
                style={{ backgroundColor: meta?.color ?? '#6B7280' }}
            >
                {meta?.name ?? blog.category}
            </span>
            <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-2 mb-1">
                {blog.title}
            </h3>
            {blog.excerpt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                    {truncate(blog.excerpt, 120)}
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
    );
}
