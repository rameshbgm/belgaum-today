import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { NewsPhoto } from '@/components/articles/NewsPhoto';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronRight, ExternalLink } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META } from '@/types';
import { ShareButtons, ArticleCard, ArticleViewTracker } from '@/components/articles';
import { formatDate, sanitizeArticleContent, stripHtml } from '@/lib/utils';
import { SITE_URL } from '@/lib/site-url';

type Props = {
    params: Promise<{ slug: string }>;
};

async function getArticle(slug: string): Promise<Article | null> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM public_articles WHERE slug = ? AND status = 'published' LIMIT 1`,
            [slug]
        );
        return articles.length > 0 ? articles[0] : null;
    } catch {
        return null;
    }
}

async function getRelatedArticles(category: string, currentId: number): Promise<Article[]> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM public_articles WHERE status = 'published' AND category = ? AND id != ? ORDER BY published_at DESC LIMIT 4`,
            [category, currentId]
        );
        return articles;
    } catch {
        return [];
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        return { title: 'Article Not Found' };
    }

    return {
        title: article.title,
        description: stripHtml(article.excerpt || ''),
        robots: { index: false, follow: true },
        openGraph: {
            title: article.title,
            description: stripHtml(article.excerpt || ''),
            url: `/article/${encodeURIComponent(slug)}`,
            type: 'article',
            publishedTime: article.published_at?.toISOString(),
            authors: [article.source_name],
            images: article.featured_image ? [article.featured_image] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title: article.title,
            description: stripHtml(article.excerpt || ''),
            images: article.featured_image ? [article.featured_image] : [],
        },
    };
}

export default async function ArticlePage({ params }: Props) {
    const { slug } = await params;
    const article = await getArticle(slug);

    if (!article) {
        notFound();
    }

    const relatedArticles = await getRelatedArticles(article.category, article.id);
    const categoryMeta = CATEGORY_META[article.category];
    const articleUrl = `${SITE_URL}/article/${article.slug}`;

    const content = sanitizeArticleContent(article.content, article.title);
    return <div className="container reading-page mx-auto max-w-4xl px-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-muted"><Link href="/briefing" className="inline-flex min-h-11 items-center hover:text-primary">The briefing</Link><ChevronRight size={14} aria-hidden="true" /><Link className="inline-flex min-h-11 items-center hover:text-primary" href={`/${article.category}`}>{categoryMeta?.name || 'News'}</Link></nav>
        <article><header className="mb-7"><h1 className="font-semibold">{article.title}</h1><div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted"><span>{article.source_name}</span><span>{formatDate(article.published_at || article.created_at)}</span>{article.reading_time > 0 && <span>{article.reading_time} min read</span>}<ArticleViewTracker articleId={article.id} category={article.category} initialCount={article.view_count} showCount /></div><div className="mt-5"><ShareButtons url={articleUrl} title={article.title} /></div></header>
            <div className="mb-9 aspect-video overflow-hidden rounded-lg"><NewsPhoto src={article.featured_image} priority /></div>
            <div className="prose mb-9">{content ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown> : article.excerpt ? <p>{stripHtml(article.excerpt)}</p> : null}</div>
            <aside className="rounded-xl bg-soft p-5 sm:p-7"><h2 className="text-xl font-semibold">Read the original report</h2><p className="mt-3 text-muted">Published by {article.source_name}. Visit the publisher for the full story and context.</p><a className="primary-action mt-5" href={article.source_url} target="_blank" rel="noopener noreferrer">Read at {article.source_name}<ExternalLink size={16} /></a></aside>
            {relatedArticles.length > 0 && <section className="channel-section"><h2 className="mb-5 text-2xl font-semibold">More on {categoryMeta?.name || 'this topic'}</h2><div className="archive-grid two-columns">{relatedArticles.map(related => <ArticleCard key={related.id} article={related} />)}</div></section>}
        </article>
    </div>;
}
