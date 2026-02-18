'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Rss, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight,
    Clock, Database, FileText, Play
} from 'lucide-react';
import { Button, Card, Badge, useToast } from '@/components/ui';

// Types
interface RssRun {
    id: number;
    run_id: string;
    trigger_type: 'manual' | 'scheduled';
    triggered_by: string | null;
    total_feeds_processed: number;
    total_items_fetched: number;
    total_new_articles: number;
    total_skipped: number;
    total_errors: number;
    overall_status: 'success' | 'partial' | 'error';
    duration_ms: number;
    started_at: string;
    completed_at: string | null;
}

interface FeedLog {
    id: number;
    run_id: string;
    feed_id: number;
    feed_name: string;
    category: string;
    status: 'success' | 'partial' | 'error';
    items_fetched: number;
    new_articles: number;
    skipped_articles: number;
    errors_count: number;
    duration_ms: number;
    started_at: string;
    completed_at: string | null;
}

interface ItemDetail {
    id: number;
    run_id: string;
    feed_id: number;
    feed_name: string;
    item_title: string;
    item_url: string;
    item_pub_date: string | null;
    action: 'new' | 'skipped' | 'error';
    skip_reason: string | null;
    error_message: string | null;
    article_id: number | null;
    created_at: string;
}

interface Stats {
    total_runs: number;
    total_feeds_processed: number;
    total_new_articles: number;
    total_skipped: number;
    total_errors: number;
    avg_duration: number;
    success_rate: number;
}

export default function RssLogsPage() {
    const { showToast } = useToast();
    const [runs, setRuns] = useState<RssRun[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
    const [feedLogs, setFeedLogs] = useState<Record<string, FeedLog[]>>({});
    const [expandedFeedId, setExpandedFeedId] = useState<string | null>(null);
    const [itemDetails, setItemDetails] = useState<Record<string, ItemDetail[]>>({});
    const [loadingFeeds, setLoadingFeeds] = useState(false);
    const [loadingItems, setLoadingItems] = useState(false);

    const fetchRuns = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '20');

            const res = await fetch(`/api/admin/rss-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setRuns(data.data.runs);
                setTotalPages(data.data.totalPages);
                setStats(data.data.stats);
            }
        } catch {
            showToast('Failed to fetch RSS runs', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, showToast]);

    useEffect(() => {
        fetchRuns();
    }, [fetchRuns]);

    const toggleRunExpansion = async (runId: string) => {
        if (expandedRunId === runId) {
            setExpandedRunId(null);
            return;
        }

        setExpandedRunId(runId);

        // Fetch feed logs if not already cached
        if (!feedLogs[runId]) {
            setLoadingFeeds(true);
            try {
                const res = await fetch(`/api/admin/rss-logs?runId=${runId}`);
                const data = await res.json();
                if (data.success) {
                    setFeedLogs(prev => ({ ...prev, [runId]: data.data.feeds }));
                }
            } catch {
                showToast('Failed to fetch feed logs', 'error');
            } finally {
                setLoadingFeeds(false);
            }
        }
    };

    const fetchItemDetails = async (runId: string, feedId: number, action: string) => {
        const key = `${runId}-${feedId}-${action}`;
        
        if (expandedFeedId === key) {
            setExpandedFeedId(null);
            return;
        }

        setExpandedFeedId(key);

        // Fetch item details if not already cached
        if (!itemDetails[key]) {
            setLoadingItems(true);
            try {
                const res = await fetch(`/api/admin/rss-logs?runId=${runId}&feedId=${feedId}&action=${action}`);
                const data = await res.json();
                if (data.success) {
                    setItemDetails(prev => ({ ...prev, [key]: data.data.items }));
                }
            } catch {
                showToast('Failed to fetch item details', 'error');
            } finally {
                setLoadingItems(false);
            }
        }
    };

    const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgClass: string }> = {
        success: {
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: '#10b981',
            bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        partial: {
            icon: <AlertTriangle className="w-4 h-4" />,
            color: '#f59e0b',
            bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        },
        error: {
            icon: <XCircle className="w-4 h-4" />,
            color: '#ef4444',
            bgClass: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        },
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <Rss className="w-8 h-8 text-orange-500" />
                        RSS Feed Logs
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Monitor RSS feed runs from Admin → RSS Feeds
                    </p>
                </div>
                <Button onClick={fetchRuns} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <Play className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Runs</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_runs}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Feeds Processed</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_feeds_processed}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">New Articles</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_new_articles}
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Success Rate</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.success_rate}%
                                </p>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-8 h-8 text-orange-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatDuration(stats.avg_duration || 0)}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Runs Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Run
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Trigger
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Feeds
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Results
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                    Started
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                                    </td>
                                </tr>
                            ) : runs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No RSS runs found. Trigger feeds from Admin → RSS Feeds page.
                                    </td>
                                </tr>
                            ) : (
                                runs.map((run) => (
                                    <React.Fragment key={run.id}>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <button
                                                    onClick={() => toggleRunExpansion(run.run_id)}
                                                    className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                                                >
                                                    {expandedRunId === run.run_id ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                    <span className="font-mono text-xs">
                                                        {run.run_id.substring(0, 20)}...
                                                    </span>
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge variant={run.trigger_type === 'manual' ? 'info' : 'default'}>
                                                    {run.trigger_type}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {run.triggered_by || 'System'}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {run.total_feeds_processed}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <Badge className={statusConfig[run.overall_status].bgClass}>
                                                    <span className="flex items-center gap-1">
                                                        {statusConfig[run.overall_status].icon}
                                                        {run.overall_status}
                                                    </span>
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                <div className="flex gap-4">
                                                    <span className="text-green-600 dark:text-green-400">
                                                        +{run.total_new_articles}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        ~{run.total_skipped}
                                                    </span>
                                                    {run.total_errors > 0 && (
                                                        <span className="text-red-600 dark:text-red-400">
                                                            !{run.total_errors}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatDuration(run.duration_ms)}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(run.started_at)}
                                            </td>
                                        </tr>

                                        {/* Expanded Feed Logs */}
                                        {expandedRunId === run.run_id && (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-4 bg-gray-50 dark:bg-gray-800">
                                                    {loadingFeeds ? (
                                                        <div className="flex items-center justify-center py-8">
                                                            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                                                        </div>
                                                    ) : feedLogs[run.run_id] ? (
                                                        <FeedLogsTable
                                                            feeds={feedLogs[run.run_id]}
                                                            runId={run.run_id}
                                                            expandedFeedId={expandedFeedId}
                                                            itemDetails={itemDetails}
                                                            loadingItems={loadingItems}
                                                            onFetchItems={fetchItemDetails}
                                                            statusConfig={statusConfig}
                                                            formatDuration={formatDuration}
                                                            formatDate={formatDate}
                                                        />
                                                    ) : (
                                                        <p className="text-center text-gray-500 dark:text-gray-400">
                                                            No feed logs found
                                                        </p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            variant="outline"
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </span>
                        <Button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            variant="outline"
                        >
                            Next
                        </Button>
                    </div>
                )}
            </Card>
        </div>
    );
}

// Feed Logs Component
function FeedLogsTable({
    feeds,
    runId,
    expandedFeedId,
    itemDetails,
    loadingItems,
    onFetchItems,
    statusConfig,
    formatDuration,
    formatDate,
}: {
    feeds: FeedLog[];
    runId: string;
    expandedFeedId: string | null;
    itemDetails: Record<string, ItemDetail[]>;
    loadingItems: boolean;
    onFetchItems: (runId: string, feedId: number, action: string) => void;
    statusConfig: Record<string, { icon: React.ReactNode; color: string; bgClass: string }>;
    formatDuration: (ms: number) => string;
    formatDate: (dateStr: string) => string;
}) {
    return (
        <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Feed Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {feeds.map((feed) => (
                    <Card key={feed.id} className="p-4">
                        <div className="space-y-3">
                            {/* Feed Header */}
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 dark:text-white">{feed.feed_name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{feed.category}</p>
                                </div>
                                <Badge className={statusConfig[feed.status].bgClass}>
                                    <span className="flex items-center gap-1">
                                        {statusConfig[feed.status].icon}
                                        {feed.status}
                                    </span>
                                </Badge>
                            </div>

                            {/* Feed Stats */}
                            <div className="grid grid-cols-4 gap-2">
                                <button
                                    onClick={() => onFetchItems(runId, feed.feed_id, 'new')}
                                    disabled={feed.items_fetched === 0}
                                    className={`p-2 rounded-lg text-center transition-colors ${
                                        feed.items_fetched > 0
                                            ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer'
                                            : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Items</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        {feed.items_fetched}
                                    </p>
                                </button>

                                <button
                                    onClick={() => onFetchItems(runId, feed.feed_id, 'new')}
                                    disabled={feed.new_articles === 0}
                                    className={`p-2 rounded-lg text-center transition-colors ${
                                        feed.new_articles > 0
                                            ? 'bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 cursor-pointer'
                                            : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <p className="text-xs text-gray-600 dark:text-gray-400">New</p>
                                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                        {feed.new_articles}
                                    </p>
                                </button>

                                <button
                                    onClick={() => onFetchItems(runId, feed.feed_id, 'skipped')}
                                    disabled={feed.skipped_articles === 0}
                                    className={`p-2 rounded-lg text-center transition-colors ${
                                        feed.skipped_articles > 0
                                            ? 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer'
                                            : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Skipped</p>
                                    <p className="text-lg font-bold text-gray-600 dark:text-gray-400">
                                        {feed.skipped_articles}
                                    </p>
                                </button>

                                <button
                                    onClick={() => onFetchItems(runId, feed.feed_id, 'error')}
                                    disabled={feed.errors_count === 0}
                                    className={`p-2 rounded-lg text-center transition-colors ${
                                        feed.errors_count > 0
                                            ? 'bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 cursor-pointer'
                                            : 'bg-gray-50 dark:bg-gray-800 cursor-not-allowed opacity-50'
                                    }`}
                                >
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Errors</p>
                                    <p className="text-lg font-bold text-red-600 dark:text-red-400">
                                        {feed.errors_count}
                                    </p>
                                </button>
                            </div>

                            {/* Duration */}
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {formatDuration(feed.duration_ms)} • {formatDate(feed.started_at)}
                            </div>

                            {/* Expanded Item Details */}
                            {expandedFeedId === `${runId}-${feed.feed_id}-new` && itemDetails[`${runId}-${feed.feed_id}-new`] && (
                                <ItemDetailsTable
                                    items={itemDetails[`${runId}-${feed.feed_id}-new`]}
                                    action="new"
                                    loading={loadingItems}
                                />
                            )}
                            {expandedFeedId === `${runId}-${feed.feed_id}-skipped` && itemDetails[`${runId}-${feed.feed_id}-skipped`] && (
                                <ItemDetailsTable
                                    items={itemDetails[`${runId}-${feed.feed_id}-skipped`]}
                                    action="skipped"
                                    loading={loadingItems}
                                />
                            )}
                            {expandedFeedId === `${runId}-${feed.feed_id}-error` && itemDetails[`${runId}-${feed.feed_id}-error`] && (
                                <ItemDetailsTable
                                    items={itemDetails[`${runId}-${feed.feed_id}-error`]}
                                    action="error"
                                    loading={loadingItems}
                                />
                            )}
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// Item Details Component
function ItemDetailsTable({
    items,
    action,
    loading,
}: {
    items: ItemDetail[];
    action: string;
    loading: boolean;
}) {
    if (loading) {
        return (
            <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 capitalize">
                {action} Items ({items.length})
            </h4>
            <div className="max-h-60 overflow-y-auto">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Title</th>
                            {action === 'new' && (
                                <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Article ID</th>
                            )}
                            {action === 'skipped' && (
                                <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Reason</th>
                            )}
                            {action === 'error' && (
                                <th className="px-2 py-1 text-left text-gray-600 dark:text-gray-400">Error</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-2 py-1">
                                    <a
                                        href={item.item_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 dark:text-blue-400 hover:underline"
                                    >
                                        {item.item_title}
                                    </a>
                                </td>
                                {action === 'new' && (
                                    <td className="px-2 py-1 text-gray-600 dark:text-gray-400">
                                        #{item.article_id}
                                    </td>
                                )}
                                {action === 'skipped' && (
                                    <td className="px-2 py-1 text-gray-600 dark:text-gray-400">
                                        {item.skip_reason}
                                    </td>
                                )}
                                {action === 'error' && (
                                    <td className="px-2 py-1 text-red-600 dark:text-red-400">
                                        {item.error_message}
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
