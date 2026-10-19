import { Metadata } from 'next';
import Link from 'next/link';
import { BlogCard } from '@/components/articles/BlogCard';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Blog — Belgaum Today',
    description: 'In-depth articles, guides and stories written by the Belgaum Today editorial team.',
    alternates: { canonical: '/blog' },
    openGraph: { title: 'Belgaum Today Blog', url: '/blog', type: 'website' },
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

    return <div className="container mx-auto px-4 pb-14 sm:px-6"><header className="archive-header"><h1>The Blog</h1><p>Stories, guides, and perspectives from the Belgaum Today editorial team.</p></header><nav className="topic-links" aria-label="Blog topics">{BLOG_CATEGORIES.filter(category => counts[category] > 0).map(category => <Link key={category} href={`/blog/category/${category}`}>{CATEGORY_META[category].name}</Link>)}</nav><section className="archive-content">{blogs.length ? <div className="archive-grid">{blogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}</div> : <div className="py-12"><h2 className="text-2xl font-semibold">Stories are on their way.</h2><p className="mt-3 text-muted">Explore the latest publisher reports while new blog posts are being prepared.</p><Link href="/" className="primary-action mt-6">Read today&rsquo;s briefing</Link></div>}</section></div>;
}
