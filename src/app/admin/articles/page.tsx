'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Plus, Search, Filter, Edit2, Trash2, Eye, EyeOff,
    MoreVertical, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';
import { Button, Input, Badge, Card, CardContent, useToast } from '@/components/ui';
import { Article, CATEGORY_META, Category } from '@/types';
import { formatDate, formatNumber } from '@/lib/utils';

type ArticleStatus = 'all' | 'draft' | 'published' | 'archived';

export default function AdminArticlesPage() {
    const router = useRouter();
    const { showToast } = useToast();

    const [articles, setArticles] = useState<Article[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<ArticleStatus>('all');
    const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchArticles();
    }, [page, statusFilter, categoryFilter]);

    const fetchArticles = async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '10');
            if (categoryFilter) params.set('category', categoryFilter);

            const response = await fetch(`/api/admin/articles?${params.toString()}`);
            const data = await response.json();

            if (data.success) {
                let items = data.data.items;

                // Client-side status filter (since our mock doesn't support it server-side)
                if (statusFilter !== 'all') {
                    items = items.filter((a: Article) => a.status === statusFilter);
                }

                setArticles(items);
                setTotalPages(data.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            const response = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
            const data = await response.json();

            if (data.success) {
                showToast('Article deleted successfully', 'success');
                fetchArticles();
            } else {
                showToast(data.error || 'Failed to delete', 'error');
            }
        } catch (error) {
            showToast('Failed to delete article', 'error');
        }
    };

    const handleBulkAction = async (action: 'publish' | 'archive' | 'delete') => {
        if (selectedIds.length === 0) {
            showToast('No articles selected', 'warning');
            return;
        }

        if (action === 'delete' && !confirm(`Delete ${selectedIds.length} articles?`)) {
            return;
        }

        try {
            for (const id of selectedIds) {
                if (action === 'delete') {
                    await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
                } else {
                    await fetch(`/api/admin/articles/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: action === 'publish' ? 'published' : 'archived' }),
                    });
                }
            }

            showToast(`Successfully ${action}ed ${selectedIds.length} articles`, 'success');
            setSelectedIds([]);
            fetchArticles();
        } catch (error) {
            showToast('Bulk action failed', 'error');
        }
    };



    const toggleSelect = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === articles.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(articles.map(a => a.id));
        }
    };

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(search.toLowerCase())
    );

    const statusColors = {
        draft: 'warning',
        published: 'success',
        archived: 'default',
    } as const;

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Articles</h1>
                    <p className="text-gray-600 dark:text-gray-400">Manage all your articles</p>
                </div>
                <Link href="/admin/articles/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Article
                    </Button>
                </Link>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <Input
                                placeholder="Search articles..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                icon={<Search className="w-4 h-4" />}
                            />
                        </div>
                        <div className="flex gap-3">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as ArticleStatus)}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value as Category | '')}
                                className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                            >
                                <option value="">All Categories</option>
                                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                                    <option key={key} value={key}>{meta.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedIds.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {selectedIds.length} selected
                            </span>
                            <Button size="sm" variant="outline" onClick={() => handleBulkAction('publish')}>
                                Publish
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleBulkAction('archive')}>
                                Archive
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleBulkAction('delete')}>
                                Delete
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Articles Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === articles.length && articles.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Title
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Views
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center">
                                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-r-transparent mx-auto" />
                                    </td>
                                </tr>
                            ) : filteredArticles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No articles found
                                    </td>
                                </tr>
                            ) : (
                                filteredArticles.map((article) => (
                                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                        <td className="px-4 py-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(article.id)}
                                                onChange={() => toggleSelect(article.id)}
                                                className="rounded border-gray-300"
                                            />
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900 dark:text-white line-clamp-1">
                                                    {article.title}
                                                </span>
                                                {article.ai_generated && (
                                                    <Sparkles className="w-4 h-4 text-blue-500" />
                                                )}
                                            </div>
                                            <span className="text-xs text-gray-500">{article.source_name}</span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant="custom" color={CATEGORY_META[article.category].color} size="sm">
                                                {CATEGORY_META[article.category].name}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4">
                                            <Badge variant={statusColors[article.status]} size="sm">
                                                {article.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {formatNumber(article.view_count)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-400">
                                            {formatDate(article.created_at)}
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link href={`/article/${article.slug}`}>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 rounded">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <Link href={`/admin/articles/${article.id}/edit`}>
                                                    <button className="p-1.5 text-gray-500 hover:text-blue-600 rounded">
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(article.id)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 rounded"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(p => p - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
