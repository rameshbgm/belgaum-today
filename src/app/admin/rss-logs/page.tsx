'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
    Rss, RefreshCw, Loader2, CheckCircle2, XCircle, AlertTriangle,
    Clock, Database, FileText, ChevronDown, ChevronRight, Filter, Calendar, Search
} from 'lucide-react';
import { Button, Card, Badge, useToast, Input } from '@/components/ui';

interface RssLog {
    id: number;
    feed_id: number;
    feed_name: string;
    category: string;
    status: 'success' | 'partial' | 'error';
    items_fetched: number;
    new_articles: number;
    skipped_articles: number;
    errors_count: number;
    error_details: string | null;
    duration_ms: number;
    started_at: string;
    completed_at: string | null;
}

interface Stats {
    total_fetches: number;
    success_count: number;
    partial_count: number;
    error_count: number;
    avg_duration: number;
    total_new_articles: number;
    total_items_fetched: number;
    total_skipped: number;
    total_errors: number;
    success_rate: number;
}

export default function RssLogsPage() {
    const { showToast } = useToast();
    const [logs, setLogs] = useState<RssLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);
    
    // Date filters - default to today
    const getTodayDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    
    const [startDate, setStartDate] = useState(getTodayDate());
    const [endDate, setEndDate] = useState(getTodayDate());

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '25');
            if (statusFilter) params.set('status', statusFilter);
            if (categoryFilter) params.set('category', categoryFilter);
            if (searchQuery) params.set('feedName', searchQuery);
            if (startDate) params.set('startDate', startDate);
            if (endDate) params.set('endDate', endDate);

            const res = await fetch(`/api/admin/rss-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.items);
                setTotalPages(data.data.totalPages);
                setStats(data.data.stats);
            }
        } catch {
            showToast('Failed to fetch RSS logs', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter, categoryFilter, searchQuery, startDate, endDate, showToast]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

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
                        Monitor RSS feed fetch operations and performance
                    </p>
                </div>
                <Button onClick={fetchLogs} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <Card className="p-4">
                        <div className="flex items-center gap-3">
                            <Database className="w-8 h-8 text-blue-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Fetches</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_fetches}
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
                            <Clock className="w-8 h-8 text-purple-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Duration</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {formatDuration(stats.avg_duration || 0)}
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
                            <XCircle className="w-8 h-8 text-red-500" />
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Errors</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {stats.total_errors}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Filters</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            End Date
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                    </div>

                    {/* Status Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Status
                        </label>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">All Statuses</option>
                            <option value="success">Success</option>
                            <option value="partial">Partial</option>
                            <option value="error">Error</option>
                        </select>
                    </div>

                    {/* Category Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Category
                        </label>
                        <select
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="">All Categories</option>
                            <option value="india">India</option>
                            <option value="business">Business</option>
                            <option value="technology">Technology</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="sports">Sports</option>
                            <option value="belgaum">Belgaum</option>
                        </select>
                    </div>

                    {/* Search */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                            <Search className="w-4 h-4" />
                            Feed Name
                        </label>
                        <Input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search feeds..."
                        />
                    </div>
                </div>
            </Card>

            {/* Logs Table */}
            <Card className="overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center p-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center p-12 text-gray-500 dark:text-gray-400">
                        No RSS fetch logs found for the selected filters
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Feed Name
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Items / New / Skipped
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Duration
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Started At
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Details
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                                {logs.map((log) => (
                                    <React.Fragment key={log.id}>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900 dark:text-white">
                                                    {log.feed_name}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="custom" color="blue" size="sm">
                                                    {log.category}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className={`flex items-center gap-2 px-2 py-1 rounded-full w-fit ${statusConfig[log.status].bgClass}`}>
                                                    {statusConfig[log.status].icon}
                                                    <span className="text-sm font-medium capitalize">
                                                        {log.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="text-sm text-gray-900 dark:text-white font-mono">
                                                    {log.items_fetched} / <span className="text-green-600 dark:text-green-400">{log.new_articles}</span> / <span className="text-gray-500">{log.skipped_articles}</span>
                                                </div>
                                                {log.errors_count > 0 && (
                                                    <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                                        {log.errors_count} error{log.errors_count > 1 ? 's' : ''}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                                {formatDuration(log.duration_ms)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                                {formatDate(log.started_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                                                    className="hover:bg-gray-100 dark:hover:bg-gray-700"
                                                >
                                                    {expandedId === log.id ? (
                                                        <ChevronDown className="w-4 h-4" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            </td>
                                        </tr>
                                        {expandedId === log.id && (
                                            <tr>
                                                <td colSpan={7} className="px-4 py-4 bg-gray-50 dark:bg-gray-800/50">
                                                    <div className="space-y-4">
                                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                            Full Run Results
                                                        </h4>
                                                        
                                                        {/* Run Statistics */}
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Items Fetched</div>
                                                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">{log.items_fetched}</div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">New Articles</div>
                                                                <div className="text-xl font-bold text-green-600 dark:text-green-400">{log.new_articles}</div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Skipped</div>
                                                                <div className="text-xl font-bold text-gray-600 dark:text-gray-400">{log.skipped_articles}</div>
                                                            </div>
                                                            <div className="bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Errors</div>
                                                                <div className="text-xl font-bold text-red-600 dark:text-red-400">{log.errors_count}</div>
                                                            </div>
                                                        </div>

                                                        {/* Timing Information */}
                                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Timing Information</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-gray-400">Started:</span>
                                                                    <span className="ml-2 text-gray-900 dark:text-white font-mono">
                                                                        {new Date(log.started_at).toLocaleString()}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-gray-400">Completed:</span>
                                                                    <span className="ml-2 text-gray-900 dark:text-white font-mono">
                                                                        {log.completed_at ? new Date(log.completed_at).toLocaleString() : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-gray-400">Duration:</span>
                                                                    <span className="ml-2 text-gray-900 dark:text-white font-mono">
                                                                        {formatDuration(log.duration_ms)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Error Details */}
                                                        {log.error_details && (
                                                            <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-red-200 dark:border-red-900">
                                                                <h5 className="font-semibold text-red-600 dark:text-red-400 mb-2 flex items-center gap-2">
                                                                    <XCircle className="w-4 h-4" />
                                                                    Error Details
                                                                </h5>
                                                                <pre className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-3 rounded overflow-x-auto whitespace-pre-wrap">
                                                                    {log.error_details}
                                                                </pre>
                                                            </div>
                                                        )}

                                                        {/* Feed Information */}
                                                        <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                                                            <h5 className="font-semibold text-gray-900 dark:text-white mb-3">Feed Information</h5>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-gray-400">Feed ID:</span>
                                                                    <span className="ml-2 text-gray-900 dark:text-white font-mono">#{log.feed_id}</span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                                                                    <span className="ml-2">
                                                                        <Badge variant="custom" color="blue" size="sm">{log.category}</Badge>
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            Page {page} of {totalPages}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
}
