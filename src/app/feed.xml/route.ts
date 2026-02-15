import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Belgaum Today';

    // Mock articles for development
    const mockArticles: Article[] = [
        {
            id: 1,
            title: 'Belgaum Celebrates Annual Cultural Festival',
            slug: 'belgaum-celebrates-annual-cultural-festival',
            excerpt: 'The historic city of Belgaum came alive this weekend with vibrant cultural performances.',
            content: '',
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
        },
    ];

    let articles: Article[] = [];

    try {
        articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC LIMIT 50`
        );
    } catch {
        articles = mockArticles;
    }

    const rssItems = articles.map((article) => {
        const pubDate = article.published_at
            ? new Date(article.published_at).toUTCString()
            : new Date().toUTCString();

        return `
    <item>
      <title><![CDATA[${article.title}]]></title>
      <link>${siteUrl}/article/${article.slug}</link>
      <description><![CDATA[${article.excerpt || ''}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${article.category}</category>
      <source url="${article.source_url}">${article.source_name}</source>
      <guid isPermaLink="true">${siteUrl}/article/${article.slug}</guid>
    </item>`;
    }).join('');

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteName}</title>
    <link>${siteUrl}</link>
    <description>Your trusted source for the latest news from Belgaum and beyond</description>
    <language>en-in</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${siteUrl}/logo.png</url>
      <title>${siteName}</title>
      <link>${siteUrl}</link>
    </image>
    ${rssItems}
  </channel>
</rss>`;

    return new NextResponse(rss, {
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        },
    });
}
