import { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { TOP_LEVEL_CATEGORIES } from '@/types';

const categories = TOP_LEVEL_CATEGORIES;

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
        {
            url: `${siteUrl}/about`,
            lastModified: now,
            changeFrequency: 'monthly',
            priority: 0.5,
        },
        {
            url: `${siteUrl}/privacy-policy`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${siteUrl}/terms-of-service`,
            lastModified: now,
            changeFrequency: 'yearly',
            priority: 0.3,
        },
    ];

    // Category pages
    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${siteUrl}/${category}`,
        lastModified: now,
        changeFrequency: 'hourly',
        priority: 0.9,
    }));

    return [...staticPages, ...categoryPages];
}
