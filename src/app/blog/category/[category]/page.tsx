import { Metadata } from 'next';
import Link from 'next/link';
import { BlogCard } from '@/components/articles/BlogCard';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';

export const dynamic = 'force-dynamic';

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
        alternates: { canonical: `/blog/category/${category}` },
        openGraph: { title: `${meta.name} Blog | Belgaum Today`, description: meta.description, url: `/blog/category/${category}` },
    };
}

export default async function BlogCategoryPage({ params }: Props) {
    const { category } = await params;
    if (!VALID_CATEGORIES.includes(category as Category)) notFound();

    const cat = category as Category;
    const meta = CATEGORY_META[cat];
    const blogs = await getBlogs(cat);

    return <div className="container mx-auto px-4 pb-14 sm:px-6"><header className="archive-header"><Link href="/blog" className="mb-4 inline-flex min-h-11 items-center gap-2 text-sm text-muted"><ChevronLeft size={16} />All blog posts</Link><h1>{meta.name}</h1><p>{meta.description}</p></header><section className="archive-content">{blogs.length ? <div className="archive-grid">{blogs.map(blog => <BlogCard key={blog.id} blog={blog} />)}</div> : <div className="py-10"><h2 className="text-2xl font-semibold">No {meta.name} posts yet.</h2><p className="mt-3 text-muted">You can explore stories from other topics.</p><Link href="/blog" className="text-action mt-5">Browse all posts</Link></div>}</section></div>;
}
