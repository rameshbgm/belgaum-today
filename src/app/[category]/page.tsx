import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, type Category } from '@/types';
import { CategoryPageClient } from '@/components/articles/CategoryPageClient';
import { distinctStories } from '@/lib/story-clusters';
export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ category: string }> };
const validCategories = Object.keys(CATEGORY_META);
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;
    if (!validCategories.includes(category)) return { title: 'Not Found' };
    const meta = CATEGORY_META[category as Category];
    return { title: `${meta.name} News`, description: meta.description, alternates: { canonical: `/${category}` }, openGraph: { title: `${meta.name} News | Belgaum Today`, description: meta.description, url: `/${category}` } };
}
async function getArticles(category: Category, trending = false): Promise<Article[]> {
    try {
        const rows = await query<Article[]>(trending
            ? `SELECT a.* FROM trending_articles t JOIN public_articles a ON t.article_id = a.id
               WHERE t.category = ? AND a.status = 'published' AND a.source_url NOT LIKE 'https://news.google.com/%'
               ORDER BY t.rank_position LIMIT 3`
            : `SELECT * FROM public_articles WHERE category = ? AND status = 'published'
               AND source_url NOT LIKE 'https://news.google.com/%'
               ORDER BY COALESCE(published_at, created_at) DESC, id DESC LIMIT 20`, [category]);
        return distinctStories(rows);
    } catch (error) { console.error(`[${category}] content unavailable:`, error instanceof Error ? error.message : error); return []; }
}
export default async function CategoryPage({ params }: Props) {
    const { category } = await params;
    if (!validCategories.includes(category)) notFound();
    const typed = category as Category;
    const [articles, trending] = await Promise.all([getArticles(typed), getArticles(typed, true)]);
    return <CategoryPageClient category={typed} initialArticles={articles} trendingArticles={trending} />;
}
