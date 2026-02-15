import { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { Article, Category } from '@/types';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const now = new Date();

    // Static pages
    const staticPages: MetadataRoute.Sitemap = [
        {
            url: siteUrl,
            lastModified: now,
            changeFrequency: 'hourly',
            priority: 1,
        },
        {
            url: `${siteUrl}/search`,
            lastModified: now,
            changeFrequency: 'daily',
            priority: 0.8,
        },
    ];

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${siteUrl}/${category}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.9,
    }));

    // Article pages
    let articlePages: MetadataRoute.Sitemap = [];

    try {
        const articles = await query<Article[]>(
            `SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 1000`
        );

        articlePages = articles.map((article) => ({
            url: `${siteUrl}/article/${article.slug}`,
            lastModified: new Date(article.updated_at),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch {
        // If database is not available, return static pages only
        console.log('Database not available for sitemap generation');
    }

    return [...staticPages, ...categoryPages, ...articlePages];
}
