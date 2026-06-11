'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Save, Eye, ArrowLeft, Clock, Check
} from 'lucide-react';
import { Button, Input, Card, CardContent, useToast } from '@/components/ui';
import { CATEGORY_META, Category } from '@/types';
import { generateSlug, calculateReadingTime, isValidUrl } from '@/lib/utils';

const BLOG_CATEGORIES: { value: Category; label: string }[] = [
    { value: 'technology', label: 'Technology' },
    { value: 'travel', label: 'Travel' },
    { value: 'science', label: 'Science' },
    { value: 'health', label: 'Health' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'food', label: 'Food' },
    { value: 'education', label: 'Education' },
    { value: 'environment', label: 'Environment' },
    { value: 'culture', label: 'Culture' },
    { value: 'finance', label: 'Finance' },
    { value: 'india', label: 'India' },
    { value: 'business', label: 'Business' },
    { value: 'entertainment', label: 'Entertainment' },
    { value: 'sports', label: 'Sports' },
    { value: 'belgaum', label: 'Belgaum' },
];

export default function NewArticlePage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [savedId, setSavedId] = useState<number | null>(null);

    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [content, setContent] = useState('');
    const [category, setCategory] = useState<Category>('technology');
    const [featuredImage, setFeaturedImage] = useState('');
    const [featured, setFeatured] = useState(false);
    const [tags, setTags] = useState('');

    useEffect(() => {
        if (title) setSlug(generateSlug(title));
    }, [title]);

    const readingTime = calculateReadingTime(content);

    const buildPayload = (status: 'draft' | 'published') => ({
        title,
        slug,
        excerpt: excerpt || title.substring(0, 150),
        content,
        category,
        featured_image: featuredImage || null,
        source_name: 'Belgaum Today',
        source_url: `https://belgaum.today/blog/${slug || generateSlug(title)}`,
        status,
        featured,
        is_blog: true,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });

    const save = async (status: 'draft' | 'published') => {
        if (!title.trim()) { showToast('Title is required', 'error'); return; }
        if (!content.trim()) { showToast('Content is required', 'error'); return; }

        setIsSaving(true);
        try {
            const url = savedId ? `/api/admin/articles/${savedId}` : '/api/admin/articles';
            const method = savedId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildPayload(status)),
            });
            const data = await res.json();

            if (data.success) {
                setLastSaved(new Date());
                if (!savedId && data.data?.id) setSavedId(data.data.id);
                showToast(
                    status === 'published' ? 'Article published!' : 'Draft saved!',
                    'success'
                );
                if (status === 'published') {
                    router.push('/admin/articles');
                }
            } else {
                showToast(data.error || 'Failed to save', 'error');
            }
        } catch {
            showToast('Failed to save article', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/articles" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="font-semibold text-gray-900 dark:text-white">New Blog Post</h1>
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
                        <Button variant="outline" size="sm" onClick={() => save('draft')} loading={isSaving}>
                            <Save className="w-4 h-4 mr-2" />
                            Save Draft
                        </Button>
                        {savedId && (
                            <Link href={`/blog/${slug}`} target="_blank">
                                <Button variant="outline" size="sm">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </Button>
                            </Link>
                        )}
                        <Button onClick={() => save('published')} loading={isSaving}>
                            Publish
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter blog post title..."
                                    className="w-full px-4 py-3 text-xl font-semibold rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    maxLength={255}
                                />
                                <div className="mt-2 flex items-center justify-between">
                                    <span className="text-xs text-gray-500">
                                        Slug: {slug || 'auto-generated from title'}
                                    </span>
                                    <span className="text-xs text-gray-500">{title.length}/255</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Excerpt
                                </label>
                                <textarea
                                    value={excerpt}
                                    onChange={(e) => setExcerpt(e.target.value)}
                                    placeholder="Brief summary shown in listings..."
                                    rows={3}
                                    maxLength={500}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                />
                                <span className="text-xs text-gray-500">{excerpt.length}/500</span>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Content * (Markdown supported)
                                </label>
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Write your blog post here... Markdown is supported.&#10;&#10;## Heading&#10;&#10;**Bold**, *italic*, [links](url), ![images](url)&#10;&#10;- Lists&#10;- Work&#10;- Great"
                                    rows={24}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y font-mono text-sm"
                                />
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Post Settings</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Category *
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value as Category)}
                                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                                    >
                                        {BLOG_CATEGORIES.map(({ value, label }) => (
                                            <option key={value} value={value}>{label}</option>
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
                                        Featured Post
                                    </label>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Featured Image</h3>
                                <div>
                                    <Input
                                        value={featuredImage}
                                        onChange={(e) => setFeaturedImage(e.target.value)}
                                        placeholder="https://example.com/image.jpg"
                                        error={featuredImage && !isValidUrl(featuredImage) ? 'Invalid URL' : undefined}
                                    />
                                    {featuredImage && isValidUrl(featuredImage) && (
                                        <img
                                            src={featuredImage}
                                            alt="Preview"
                                            className="mt-2 w-full h-32 object-cover rounded-lg"
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Tags</h3>
                                <Input
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    placeholder="travel, adventure, india (comma-separated)"
                                />
                                <p className="text-xs text-gray-500">Separate tags with commas</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>Source: <span className="font-medium text-gray-700 dark:text-gray-300">Belgaum Today</span></p>
                                    <p>Type: <span className="font-medium text-gray-700 dark:text-gray-300">Blog Post</span></p>
                                    <p>Reading time: <span className="font-medium text-gray-700 dark:text-gray-300">{readingTime} min</span></p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
