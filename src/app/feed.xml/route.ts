import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { publisherUrl } from '@/lib/source-policy';

function escapeXml(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function GET() {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Belgaum Today';

    let articles: Article[] = [];

    try {
        articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published'
             AND source_url NOT LIKE 'https://news.google.com/%'
             ORDER BY published_at DESC LIMIT 250`
        );
    } catch {
        articles = [];
    }

    const rssItems = articles.filter(article => publisherUrl(article.source_url)).map((article) => {
        const pubDate = article.published_at
            ? new Date(article.published_at).toUTCString()
            : new Date().toUTCString();

        return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(article.source_url)}</link>
      <description>${escapeXml(article.excerpt || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <category>${escapeXml(article.category)}</category>
      <source url="${escapeXml(article.source_url)}">${escapeXml(article.source_name)}</source>
      <guid isPermaLink="false">${siteUrl}/article/${encodeURIComponent(article.slug)}</guid>
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
