import Link from 'next/link';
import Image from 'next/image';
import { notFound, redirect } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';
import { sanitizeArticleContent } from '@/lib/utils';
import type { Article } from '@/types';
import { NewsFallbackImage } from '@/components/articles';

export const dynamic = 'force-dynamic';

export default async function AdminArticlePreview({ params }: { params: Promise<{ id: string }> }) {
    const user = await getCurrentUser();
    if (!user) redirect('/admin/login');

    const id = Number((await params).id);
    if (!Number.isSafeInteger(id) || id < 1) notFound();
    const [article] = await query<Article[]>('SELECT * FROM articles WHERE id = ? LIMIT 1', [id]);
    if (!article) notFound();

    const content = sanitizeArticleContent(article.content, article.title);
    return <article className="mx-auto max-w-4xl space-y-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/admin/articles" className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:underline"><ArrowLeft className="h-4 w-4" /> Back to articles</Link>
            <Link href={`/admin/articles/${id}/edit`} className="rounded border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-primary hover:text-primary dark:border-gray-700 dark:text-gray-200">Edit article</Link>
        </div>
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
            Admin preview · {article.status} · Opening this page does not count as a reader view.
        </div>
        <header>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{article.category} · {article.source_name}</p>
            <h1 className="mt-3 font-display text-3xl font-bold leading-tight text-ink md:text-5xl">{article.title}</h1>
            {article.excerpt && <p className="mt-5 max-w-3xl text-lg leading-7 text-muted">{article.excerpt}</p>}
        </header>
        <div className="relative aspect-video overflow-hidden rounded-lg bg-hairline">
            {article.featured_image ? <Image src={article.featured_image} alt="" fill unoptimized className="object-cover" sizes="(max-width: 768px) 100vw, 800px" /> : <NewsFallbackImage seed={article.id} />}
        </div>
        {content && <div className="prose max-w-none text-ink dark:prose-invert"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></div>}
        <a href={article.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 border-t border-hairline pt-5 text-sm font-semibold text-accent hover:underline">
            Open original at {article.source_name} <ExternalLink className="h-4 w-4" />
        </a>
    </article>;
}
