'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
    Save, Eye, Trash2, ArrowLeft, Image as ImageIcon,
    Sparkles, Clock, Check, LogOut
} from 'lucide-react';
import { Button, Input, Badge, Card, CardContent, useToast } from '@/components/ui';
import { Article, CATEGORY_META, Category } from '@/types';
import { generateSlug, calculateReadingTime, isValidUrl } from '@/lib/utils';

const categories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

export default function ArticleEditPage() {
    const router = useRouter();
    const params = useParams();
    const { showToast } = useToast();
    const articleId = params.id as string;
    const isNew = articleId === 'new';

    const [isLoading, setIsLoading] = useState(!isNew);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    // Form state
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<Category>('belgaum');
    const [sourceName, setSourceName] = useState('');
    const [sourceUrl, setSourceUrl] = useState('');
    const [status, setStatus] = useState<'draft' | 'published' | 'archived'>('draft');
    const [featured, setFeatured] = useState(false);
    const [aiGenerated, setAiGenerated] = useState(false);
    const [aiConfidence, setAiConfidence] = useState<number | null>(null);
    const [requiresReview, setRequiresReview] = useState(false);

    // Fetch article data if editing
    useEffect(() => {
        if (!isNew) {
            fetchArticle();
        }
    }, [articleId]);

    // Auto-save every 30 seconds
    useEffect(() => {
        if (isNew || !title) return;

        const interval = setInterval(() => {
            handleSave(true);
        }, 30000);

        return () => clearInterval(interval);
    }, [title, content, isNew]);

    // Auto-generate slug from title
    useEffect(() => {
        if (isNew && title) {
            setSlug(generateSlug(title));
        }
    }, [title, isNew]);

    const fetchArticle = async () => {
        try {
            const response = await fetch(`/api/articles/${articleId}`);
            const data = await response.json();

            if (data.success) {
                const article = data.data;
                setTitle(article.title);
                setSlug(article.slug);
                setExcerpt(article.excerpt || '');
                setContent(article.content);
                setCategory(article.category);
                setSourceName(article.source_name);
                setSourceUrl(article.source_url);
                setStatus(article.status);
                setFeatured(article.featured);
                setAiGenerated(article.ai_generated);
                setAiConfidence(article.ai_confidence);
                setRequiresReview(article.requires_review);
            } else {
                showToast('Article not found', 'error');
                router.push('/admin/articles');
            }
        } catch (error) {
            showToast('Failed to load article', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (isAutoSave = false) => {
        // Validation
        if (!title.trim()) {
            if (!isAutoSave) showToast('Title is required', 'error');
            return;
        }
        if (!content.trim()) {
            if (!isAutoSave) showToast('Content is required', 'error');
            return;
        }
        if (!sourceName.trim()) {
            if (!isAutoSave) showToast('Source name is required', 'error');
            return;
        }
        if (!sourceUrl.trim() || !isValidUrl(sourceUrl)) {
            if (!isAutoSave) showToast('Valid source URL is required', 'error');
            return;
        }

        setIsSaving(true);

        try {
            const body = {
                title,
                excerpt: excerpt || title.substring(0, 150),
                content,
                category,
                source_name: sourceName,
                source_url: sourceUrl,
                status: isAutoSave ? status : status, // Keep current status on auto-save
                featured,
                ai_generated: aiGenerated,
                ai_confidence: aiConfidence,
                requires_review: requiresReview,
            };

            const url = isNew ? '/api/articles' : `/api/articles/${articleId}`;
            const method = isNew ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            const data = await response.json();

            if (data.success) {
                setLastSaved(new Date());
                if (!isAutoSave) {
                    showToast(isNew ? 'Article created!' : 'Article saved!', 'success');
                    if (isNew) {
                        router.push(`/admin/articles/${data.data.id}/edit`);
                    }
                }
            } else {
                if (!isAutoSave) showToast(data.error || 'Failed to save', 'error');
            }
        } catch (error) {
            if (!isAutoSave) showToast('Failed to save article', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePublish = async () => {
        if (requiresReview && !confirm('This article requires review. Publish anyway?')) {
            return;
        }

        setStatus('published');
        await handleSave();
        showToast('Article published!', 'success');
    };

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            const response = await fetch(`/api/articles/${articleId}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                showToast('Article deleted', 'success');
                router.push('/admin/articles');
            } else {
                showToast(data.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            showToast('Failed to delete article', 'error');
        }
    };

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
    };

    const readingTime = calculateReadingTime(content);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/articles" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900 dark:text-white">
                                {isNew ? 'New Article' : 'Edit Article'}
                            </h1>
                            {lastSaved && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                    <Check className="w-3 h-3 text-green-500" />
                                    Saved {lastSaved.toLocaleTimeString()}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-sm text-gray-500">
                            <Clock className="w-4 h-4" />
                            {readingTime} min read
                        </span>

                        <Button variant="outline" size="sm" onClick={() => handleSave()}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>

                        {!isNew && (
                            <Link href={`/article/${slug}`} target="_blank">
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </Button>
                            </Link>
                        )}

                        <Button onClick={handlePublish} loading={isSaving}>
                            Publish
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Editor */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Title */}
                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter article title..."
                                    className="w-full px-4 py-3 text-xl font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={255}
                                />
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Slug: {slug || 'auto-generated'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {title.length}/255
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Excerpt */}
                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Excerpt
                                </label>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Brief summary of the article..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <span className="text-xs text-gray-500">{excerpt.length}/500</span>
                            </CardContent>
                        </Card>

                        {/* Content */}
                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Content * (Markdown supported)
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your article content here... Markdown is supported."
                                    rows={20}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status & Category */}
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'archived')}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                    >
                                        <option value="draft">Draft</option>
                                        <option value="published">Published</option>
                                        <option value="archived">Archived</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as Category)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                    >
                                        {categories.map((cat) => (
                                            <option key={cat} value={cat}>{CATEGORY_META[cat].name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        checked={featured}
                                        onChange={(e) => setFeatured(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <label htmlFor="featured" className="text-sm text-gray-700 dark:text-gray-300">
                                        Featured Article
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Source */}
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Source Attribution</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Source Name *
                                    </label>
                                    <Input
                                        value={sourceName}
                                        onChange={(e) => setSourceName(e.target.value)}
                                        placeholder="e.g., Belgaum Times"
                                        maxLength={100}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Source URL *
                                    </label>
                                    <Input
                                        value={sourceUrl}
                                        onChange={(e) => setSourceUrl(e.target.value)}
                                        placeholder="https://example.com/article"
                                        error={sourceUrl && !isValidUrl(sourceUrl) ? 'Invalid URL format' : undefined}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* AI Metadata */}
                        {aiGenerated && (
                            <Card>
                                <CardContent className="p-6 space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
                                        <Sparkles className="w-5 h-5 text-blue-500" />
                                        AI Metadata
                                    </h3>

                                    {aiConfidence !== null && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600 dark:text-gray-400">Confidence</span>
                                            <Badge variant="info">{Math.round(aiConfidence * 100)}%</Badge>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="requiresReview"
                                            checked={requiresReview}
                                            onChange={(e) => setRequiresReview(e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        <label htmlFor="requiresReview" className="text-sm text-gray-700 dark:text-gray-300">
                                            Requires Review
                                        </label>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Actions */}
                        {!isNew && (
                            <Card>
                                <CardContent className="p-6">
                                    <Button variant="danger" className="w-full" onClick={handleDelete}>
                                        <Trash2 className="w-4 h-4 mr-2" />
                                        Delete Article
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
