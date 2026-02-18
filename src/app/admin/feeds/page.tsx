'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Rss, Plus, Trash2, Power, PowerOff, RefreshCw, Loader2, Clock, ExternalLink, Edit, X, Search, ArrowUpDown, Sparkles
} from 'lucide-react';
import { Button, Card, CardContent, Badge, Input, useToast } from '@/components/ui';

interface Feed {
    id: number;
    name: string;
    feed_url: string;
    category: string;
    fetch_interval_minutes: number;
    is_active: boolean;
    last_fetched_at: string | null;
    article_count: number;
}

export default function RSSFeedsPage() {
    const { showToast } = useToast();
    const [feeds, setFeeds] = useState<Feed[]>([]);
    const [loading, setLoading] = useState(true);
    const [cronRunning, setCronRunning] = useState(false);
    const [aiRunning, setAiRunning] = useState(false);
    const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);

    // Run scope state
    const [feedScope, setFeedScope] = useState<'all' | 'selected' | 'category'>('all');
    const [feedCategory, setFeedCategory] = useState('');
    const [aiScope, setAiScope] = useState<'all' | 'selected' | 'category'>('all');
    const [aiCategory, setAiCategory] = useState('');
    
    // Search and sort state
    const [searchQuery, setSearchQuery] = useState('');
    const [sortField, setSortField] = useState<'name' | 'category' | 'last_fetched_at'>('name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    
    // Feed form state
    const [showFeedModal, setShowFeedModal] = useState(false);
    const [editingFeed, setEditingFeed] = useState<Feed | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        feed_url: '',
        category: 'india',
        fetch_interval_minutes: 60,
        is_active: true
    });
    const [formSubmitting, setFormSubmitting] = useState(false);
    
    // Delete confirmation state
    const [deletingFeed, setDeletingFeed] = useState<Feed | null>(null);
    const [deleteSubmitting, setDeleteSubmitting] = useState(false);

    const fetchFeeds = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/feeds');
            const data = await res.json();
            if (data.success) setFeeds(data.data);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        fetchFeeds().finally(() => setLoading(false));
    }, [fetchFeeds]);

    const toggleFeed = async (id: number, current: boolean) => {
        await fetch('/api/admin/feeds', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ feedId: id, is_active: !current }),
        });
        showToast(`Feed ${current ? 'disabled' : 'enabled'}`, 'success');
        fetchFeeds();
    };

    const runCron = async () => {
        setCronRunning(true);
        try {
            let body: Record<string, unknown> = {};
            if (feedScope === 'selected') {
                if (selectedFeeds.length === 0) {
                    showToast('No feeds selected', 'warning');
                    setCronRunning(false);
                    return;
                }
                body = { feedIds: selectedFeeds };
            } else if (feedScope === 'category' && feedCategory) {
                body = { categories: [feedCategory] };
            }
            // else all: empty body = all active feeds

            const res = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Feeds done: ${data.newArticles ?? 0} new articles from ${data.feedsProcessed ?? 0} feeds`, 'success');
                fetchFeeds();
            } else {
                showToast(data.error || 'Feed run failed', 'error');
            }
        } catch {
            showToast('Feed run failed', 'error');
        } finally {
            setCronRunning(false);
        }
    };

    const runAiAnalysis = async () => {
        setAiRunning(true);
        try {
            let body: Record<string, unknown> = {};
            if (aiScope === 'selected') {
                if (selectedFeeds.length === 0) {
                    showToast('No feeds selected', 'warning');
                    setAiRunning(false);
                    return;
                }
                // Derive unique categories from the selected feeds
                const selectedCategories = [...new Set(
                    feeds.filter(f => selectedFeeds.includes(f.id)).map(f => f.category)
                )];
                body = { categories: selectedCategories };
            } else if (aiScope === 'category' && aiCategory) {
                body = { categories: [aiCategory] };
            }
            // else all: empty body = all categories

            const res = await fetch('/api/admin/trending', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (data.success) {
                showToast(
                    `AI done: trending updated for ${data.categoriesProcessed ?? 0} categor${data.categoriesProcessed === 1 ? 'y' : 'ies'} (${data.totalTrendingArticles ?? 0} articles)`,
                    'success'
                );
            } else {
                showToast(data.error || 'AI analysis failed', 'error');
            }
        } catch {
            showToast('AI analysis failed', 'error');
        } finally {
            setAiRunning(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedFeeds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const openAddModal = () => {
        setEditingFeed(null);
        setFormData({
            name: '',
            feed_url: '',
            category: 'india',
            fetch_interval_minutes: 60,
            is_active: true
        });
        setShowFeedModal(true);
    };

    const openEditModal = (feed: Feed) => {
        setEditingFeed(feed);
        setFormData({
            name: feed.name,
            feed_url: feed.feed_url,
            category: feed.category,
            fetch_interval_minutes: feed.fetch_interval_minutes,
            is_active: feed.is_active
        });
        setShowFeedModal(true);
    };

    const handleSubmitFeed = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormSubmitting(true);
        
        try {
            const url = '/api/admin/feeds';
            const method = editingFeed ? 'PUT' : 'POST';
            const body = editingFeed 
                ? { id: editingFeed.id, ...formData }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            
            if (data.success) {
                showToast(editingFeed ? 'Feed updated successfully' : 'Feed created successfully', 'success');
                setShowFeedModal(false);
                fetchFeeds();
            } else {
                showToast(data.error || 'Operation failed', 'error');
            }
        } catch (error) {
            showToast('Operation failed', 'error');
        } finally {
            setFormSubmitting(false);
        }
    };

    const confirmDelete = (feed: Feed) => {
        setDeletingFeed(feed);
    };

    const handleDelete = async () => {
        if (!deletingFeed) return;
        
        setDeleteSubmitting(true);
        try {
            const res = await fetch(`/api/admin/feeds?id=${deletingFeed.id}`, {
                method: 'DELETE'
            });
            
            const data = await res.json();
            
            if (data.success) {
                showToast('Feed deleted successfully', 'success');
                setDeletingFeed(null);
                fetchFeeds();
            } else {
                showToast(data.error || 'Delete failed', 'error');
            }
        } catch (error) {
            showToast('Delete failed', 'error');
        } finally {
            setDeleteSubmitting(false);
        }
    };

    // Bulk operations
    const handleEnableAll = async () => {
        try {
            for (const feed of feeds) {
                if (!feed.is_active) {
                    await fetch('/api/admin/feeds', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ feedId: feed.id, is_active: true }),
                    });
                }
            }
            showToast('All feeds enabled', 'success');
            fetchFeeds();
        } catch {
            showToast('Failed to enable all feeds', 'error');
        }
    };

    const handleDisableAll = async () => {
        try {
            for (const feed of feeds) {
                if (feed.is_active) {
                    await fetch('/api/admin/feeds', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ feedId: feed.id, is_active: false }),
                    });
                }
            }
            showToast('All feeds disabled', 'success');
            setSelectedFeeds([]);
            fetchFeeds();
        } catch {
            showToast('Failed to disable all feeds', 'error');
        }
    };

    const handleEnableSelected = async () => {
        if (selectedFeeds.length === 0) {
            showToast('No feeds selected', 'warning');
            return;
        }
        try {
            for (const id of selectedFeeds) {
                await fetch('/api/admin/feeds', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedId: id, is_active: true }),
                });
            }
            showToast(`${selectedFeeds.length} feeds enabled`, 'success');
            setSelectedFeeds([]);
            fetchFeeds();
        } catch {
            showToast('Failed to enable selected feeds', 'error');
        }
    };

    const handleDisableSelected = async () => {
        if (selectedFeeds.length === 0) {
            showToast('No feeds selected', 'warning');
            return;
        }
        try {
            for (const id of selectedFeeds) {
                await fetch('/api/admin/feeds', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ feedId: id, is_active: false }),
                });
            }
            showToast(`${selectedFeeds.length} feeds disabled`, 'success');
            setSelectedFeeds([]);
            fetchFeeds();
        } catch {
            showToast('Failed to disable selected feeds', 'error');
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedFeeds.length === 0) {
            showToast('No feeds selected', 'warning');
            return;
        }
        if (!confirm(`Are you sure you want to delete ${selectedFeeds.length} selected feeds?`)) {
            return;
        }
        try {
            for (const id of selectedFeeds) {
                await fetch(`/api/admin/feeds?id=${id}`, {
                    method: 'DELETE'
                });
            }
            showToast(`${selectedFeeds.length} feeds deleted`, 'success');
            setSelectedFeeds([]);
            fetchFeeds();
        } catch {
            showToast('Failed to delete selected feeds', 'error');
        }
    };

    const formatDate = (d: string | null) => {
        if (!d) return 'Never';
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    };

    const categoryColors: Record<string, string> = {
        india: '#FF9933',
        business: '#4CAF50',
        technology: '#2196F3',
        entertainment: '#E91E63',
        sports: '#FF5722',
        belgaum: '#9C27B0',
    };

    // Filter and sort feeds
    const filteredAndSortedFeeds = useMemo(() => {
        let result = [...feeds];

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            result = result.filter(feed =>
                feed.name.toLowerCase().includes(query) ||
                feed.feed_url.toLowerCase().includes(query) ||
                feed.category.toLowerCase().includes(query)
            );
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[sortField];
            let bVal: any = b[sortField];

            if (sortField === 'last_fetched_at') {
                aVal = aVal ? new Date(aVal).getTime() : 0;
                bVal = bVal ? new Date(bVal).getTime() : 0;
            } else if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });

        return result;
    }, [feeds, searchQuery, sortField, sortDirection]);

    const toggleSort = (field: 'name' | 'category' | 'last_fetched_at') => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Unique categories from feeds list
    const feedCategories = useMemo(() => [...new Set(feeds.map(f => f.category))].sort(), [feeds]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">RSS Feeds</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Manage news sources, trigger RSS fetching, and run AI trending analysis
                    </p>
                </div>
                <Button onClick={openAddModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Feed
                </Button>
            </div>

            {/* Action Panels */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Run RSS Feeds */}
                <Card className="border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Rss className="w-4 h-4 text-blue-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Run RSS Feeds</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fetch new articles from sources. No AI analysis.</p>
                        <div className="flex items-center gap-2">
                            <select
                                value={feedScope}
                                onChange={(e) => setFeedScope(e.target.value as 'all' | 'selected' | 'category')}
                                className="flex-1 text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">All Active Feeds</option>
                                <option value="selected">Selected Feeds ({selectedFeeds.length})</option>
                                <option value="category">By Category</option>
                            </select>
                            {feedScope === 'category' && (
                                <select
                                    value={feedCategory}
                                    onChange={(e) => setFeedCategory(e.target.value)}
                                    className="flex-1 text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Pick category…</option>
                                    {feedCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <Button
                            className="w-full"
                            onClick={runCron}
                            disabled={cronRunning || (feedScope === 'selected' && selectedFeeds.length === 0) || (feedScope === 'category' && !feedCategory)}
                        >
                            {cronRunning
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Running Feeds…</>
                                : <><RefreshCw className="w-4 h-4 mr-2" />Run Feeds</>
                            }
                        </Button>
                    </CardContent>
                </Card>

                {/* Run AI Analysis */}
                <Card className="border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Run AI Analysis</h3>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Update trending articles using AI. Runs independently of feed fetch.</p>
                        <div className="flex items-center gap-2">
                            <select
                                value={aiScope}
                                onChange={(e) => setAiScope(e.target.value as 'all' | 'selected' | 'category')}
                                className="flex-1 text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="selected">Selected Feeds ({selectedFeeds.length})</option>
                                <option value="category">By Category</option>
                            </select>
                            {aiScope === 'category' && (
                                <select
                                    value={aiCategory}
                                    onChange={(e) => setAiCategory(e.target.value)}
                                    className="flex-1 text-sm px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Pick category…</option>
                                    {feedCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <Button
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={runAiAnalysis}
                            disabled={aiRunning || (aiScope === 'selected' && selectedFeeds.length === 0) || (aiScope === 'category' && !aiCategory)}
                        >
                            {aiRunning
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysing…</>
                                : <><Sparkles className="w-4 h-4 mr-2" />Run AI Analysis</>
                            }
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">{feeds.length}</p>
                        <p className="text-xs text-gray-500">Total Feeds</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-green-600">{feeds.filter(f => f.is_active).length}</p>
                        <p className="text-xs text-gray-500">Active</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-red-500">{feeds.filter(f => !f.is_active).length}</p>
                        <p className="text-xs text-gray-500">Disabled</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <p className="text-2xl font-bold text-indigo-600">
                            {[...new Set(feeds.map(f => f.category))].length}
                        </p>
                        <p className="text-xs text-gray-500">Categories</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <Card>
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                        <Input
                            type="text"
                            placeholder="Search feeds by name, URL, or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {searchQuery && (
                        <p className="text-xs text-gray-500 mt-2">
                            Showing {filteredAndSortedFeeds.length} of {feeds.length} feeds
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedFeeds.length > 0 && (
                <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {selectedFeeds.length} feed{selectedFeeds.length !== 1 ? 's' : ''} selected
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={handleEnableSelected}>
                                    <Power className="w-4 h-4 mr-1" />
                                    Enable
                                </Button>
                                <Button variant="outline" size="sm" onClick={handleDisableSelected}>
                                    <PowerOff className="w-4 h-4 mr-1" />
                                    Disable
                                </Button>
                                <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
                                    <Trash2 className="w-4 h-4 mr-1" />
                                    Delete
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => setSelectedFeeds([])}>
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Bulk All Actions */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleEnableAll}>
                        <Power className="w-4 h-4 mr-1" />
                        Enable All
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleDisableAll}>
                        <PowerOff className="w-4 h-4 mr-1" />
                        Disable All
                    </Button>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedFeeds.length > 0 
                        ? `${selectedFeeds.length} of ${feeds.length} feeds selected`
                        : `${feeds.length} total feeds`
                    }
                </div>
            </div>

            {/* Feed Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <th className="px-4 py-3 text-left w-10">
                                    <input
                                        type="checkbox"
                                        aria-label="Select all feeds"
                                        checked={selectedFeeds.length === filteredAndSortedFeeds.length && filteredAndSortedFeeds.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFeeds(filteredAndSortedFeeds.map(f => f.id));
                                            } else {
                                                setSelectedFeeds([]);
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => toggleSort('name')}
                                >
                                    <div className="flex items-center gap-1">
                                        Feed
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => toggleSort('category')}
                                >
                                    <div className="flex items-center gap-1">
                                        Category
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th 
                                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:text-gray-700 dark:hover:text-gray-200"
                                    onClick={() => toggleSort('last_fetched_at')}
                                >
                                    <div className="flex items-center gap-1">
                                        Last Fetched
                                        <ArrowUpDown className="w-3 h-3" />
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredAndSortedFeeds.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        {searchQuery ? 'No feeds match your search' : 'No feeds yet. Add your first feed to get started.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredAndSortedFeeds.map(feed => (
                                <tr key={feed.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select ${feed.name}`}
                                            checked={selectedFeeds.includes(feed.id)}
                                            onChange={() => toggleSelect(feed.id)}
                                            className="rounded border-gray-300"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div>
                                            <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{feed.name}</span>
                                            <p className="text-xs text-gray-400 truncate max-w-xs">{feed.feed_url}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant="custom" color={categoryColors[feed.category] || '#6B7280'} size="sm">
                                            {feed.category}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={feed.is_active ? 'success' : 'warning'} size="sm">
                                            {feed.is_active ? 'Active' : 'Disabled'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatDate(feed.last_fetched_at)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <a
                                                href={feed.feed_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-1.5 rounded text-gray-400 hover:text-blue-500 transition"
                                                aria-label="Open feed URL"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => openEditModal(feed)}
                                                className="p-1.5 rounded text-gray-400 hover:text-blue-500 transition"
                                                aria-label="Edit feed"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => toggleFeed(feed.id, feed.is_active)}
                                                className={`p-1.5 rounded transition ${feed.is_active ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                                                aria-label={feed.is_active ? 'Disable feed' : 'Enable feed'}
                                            >
                                                {feed.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => confirmDelete(feed)}
                                                className="p-1.5 rounded text-gray-400 hover:text-red-500 transition"
                                                aria-label="Delete feed"
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
            </Card>

            {/* Add/Edit Feed Modal */}
            {showFeedModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingFeed ? 'Edit Feed' : 'Add New Feed'}
                            </h2>
                            <button
                                onClick={() => setShowFeedModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmitFeed} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Feed Name *
                                </label>
                                <Input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., The Hindu - India News"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Feed URL *
                                </label>
                                <Input
                                    type="url"
                                    value={formData.feed_url}
                                    onChange={(e) => setFormData({ ...formData, feed_url: e.target.value })}
                                    placeholder="https://example.com/rss"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                >
                                    <option value="india">India</option>
                                    <option value="business">Business</option>
                                    <option value="technology">Technology</option>
                                    <option value="sports">Sports</option>
                                    <option value="entertainment">Entertainment</option>
                                    <option value="world">World</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fetch Interval (minutes)
                                </label>
                                <Input
                                    type="number"
                                    value={formData.fetch_interval_minutes}
                                    onChange={(e) => setFormData({ ...formData, fetch_interval_minutes: parseInt(e.target.value) || 1 })}
                                    min="1"
                                    max="1440"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Active (fetch this feed automatically)
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowFeedModal(false)}
                                    disabled={formSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={formSubmitting}>
                                    {formSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            {editingFeed ? 'Updating...' : 'Creating...'}
                                        </>
                                    ) : (
                                        editingFeed ? 'Update Feed' : 'Create Feed'
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingFeed && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                Delete Feed
                            </h2>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Are you sure you want to delete <strong>{deletingFeed.name}</strong>? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setDeletingFeed(null)}
                                    disabled={deleteSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    onClick={handleDelete}
                                    disabled={deleteSubmitting}
                                >
                                    {deleteSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Delete Feed
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
