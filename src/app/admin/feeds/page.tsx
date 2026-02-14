'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Rss, Plus, Trash2, Power, PowerOff, RefreshCw, Loader2, Clock, ExternalLink
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
    const [selectedFeeds, setSelectedFeeds] = useState<number[]>([]);

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
            body: JSON.stringify({ id, is_active: !current }),
        });
        showToast(`Feed ${current ? 'disabled' : 'enabled'}`, 'success');
        fetchFeeds();
    };

    const runCron = async () => {
        setCronRunning(true);
        try {
            const feedIds = selectedFeeds.length > 0 ? selectedFeeds : undefined;
            const res = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ feed_ids: feedIds }),
            });
            const data = await res.json();
            if (data.success) {
                showToast(`Cron complete: ${data.newArticles || 0} new articles`, 'success');
                fetchFeeds();
            } else {
                showToast(data.error || 'Cron failed', 'error');
            }
        } catch {
            showToast('Cron failed', 'error');
        } finally {
            setCronRunning(false);
        }
    };

    const toggleSelect = (id: number) => {
        setSelectedFeeds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
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
                        Manage news sources and trigger RSS fetching
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={runCron}
                        disabled={cronRunning}
                    >
                        {cronRunning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                        {selectedFeeds.length > 0 ? `Run Selected (${selectedFeeds.length})` : 'Run All Feeds'}
                    </Button>
                </div>
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
                                        checked={selectedFeeds.length === feeds.filter(f => f.is_active).length && feeds.length > 0}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedFeeds(feeds.filter(f => f.is_active).map(f => f.id));
                                            } else {
                                                setSelectedFeeds([]);
                                            }
                                        }}
                                        className="rounded border-gray-300"
                                    />
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Feed</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Fetched</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {feeds.map(feed => (
                                <tr key={feed.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            aria-label={`Select ${feed.name}`}
                                            checked={selectedFeeds.includes(feed.id)}
                                            onChange={() => toggleSelect(feed.id)}
                                            disabled={!feed.is_active}
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
                                                onClick={() => toggleFeed(feed.id, feed.is_active)}
                                                className={`p-1.5 rounded transition ${feed.is_active ? 'text-green-500 hover:text-red-500' : 'text-red-500 hover:text-green-500'}`}
                                                aria-label={feed.is_active ? 'Disable feed' : 'Enable feed'}
                                            >
                                                {feed.is_active ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
