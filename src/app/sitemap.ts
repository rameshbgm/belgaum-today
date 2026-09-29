import { MetadataRoute } from 'next';
import { query } from '@/lib/db';
import { TOP_LEVEL_CATEGORIES } from '@/types';
import { SITE_URL } from '@/lib/site-url';

export const dynamic = 'force-dynamic';

type StoryRow = { id: number; last_updated_at: Date };
type BlogRow = { slug: string; updated_at: Date; published_at: Date | null };
type BlogCategoryRow = { category: string };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Only list pages that offer our own reading experience. RSS excerpts link
    // to their original publishers and their local mirrors stay noindex.
    let stories: StoryRow[] = [];
    let blogs: BlogRow[] = [];
    let blogCategories: BlogCategoryRow[] = [];
    try {
        [stories, blogs, blogCategories] = await Promise.all([
            query<StoryRow[]>(`SELECT e.id, e.last_updated_at FROM ai_suggested_stories pick
                JOIN story_events e ON e.id = pick.story_event_id
                JOIN story_event_summaries s ON s.story_event_id = e.id
                JOIN public_articles chosen ON chosen.id = pick.article_id
                WHERE s.source_updated_at >= e.last_updated_at`),
            query<BlogRow[]>(`SELECT slug, updated_at, published_at FROM articles
                WHERE status = 'published' AND source_name = 'Belgaum Today'
                ORDER BY COALESCE(published_at, created_at) DESC LIMIT 1000`),
            query<BlogCategoryRow[]>(`SELECT DISTINCT category FROM articles
                WHERE status = 'published' AND source_name = 'Belgaum Today'`),
        ]);
    } catch { /* Keep the static sitemap available during a database outage. */ }

    return [
        { url: SITE_URL },
        { url: `${SITE_URL}/ai-news` },
        { url: `${SITE_URL}/blog` },
        { url: `${SITE_URL}/about` },
        ...TOP_LEVEL_CATEGORIES.map(category => ({ url: `${SITE_URL}/${category}` })),
        ...blogCategories.map(row => ({ url: `${SITE_URL}/blog/category/${row.category}` })),
        ...stories.map(story => ({ url: `${SITE_URL}/story/${story.id}`, lastModified: story.last_updated_at })),
        ...blogs.map(blog => ({ url: `${SITE_URL}/blog/post/${encodeURIComponent(blog.slug)}`, lastModified: blog.updated_at || blog.published_at || undefined })),
    ];
}
