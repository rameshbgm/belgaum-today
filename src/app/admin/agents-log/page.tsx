'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    Brain, RefreshCw, Loader2, Activity, CheckCircle2, XCircle, AlertTriangle,
    Clock, Zap, Hash, ChevronDown, ChevronRight, Filter
} from 'lucide-react';
import { Button, Card, Badge, useToast } from '@/components/ui';

interface AgentLog {
    id: number;
    provider: string;
    model: string;
    category: string;
    status: 'success' | 'error' | 'fallback';
    input_articles: number;
    output_trending: number;
    prompt_tokens: number;
    duration_ms: number;
    error_message: string | null;
    request_summary: string | null;
    response_summary: string | null;
    created_at: string;
}

interface Stats {
    total_calls: number;
    success_count: number;
    error_count: number;
    fallback_count: number;
    avg_duration: number;
    total_tokens: number;
}

export default function AgentLogsPage() {
    const { showToast } = useToast();
    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [providerFilter, setProviderFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '25');
            if (providerFilter) params.set('provider', providerFilter);
            if (statusFilter) params.set('status', statusFilter);
            if (categoryFilter) params.set('category', categoryFilter);

            const res = await fetch(`/api/admin/agent-logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.items);
                setTotalPages(data.data.totalPages);
                setStats(data.data.stats);
            }
        } catch {
            showToast('Failed to fetch agent logs', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, providerFilter, statusFilter, categoryFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const statusConfig: Record<string, { icon: React.ReactNode; color: string; bgClass: string }> = {
        success: {
            icon: <CheckCircle2 className="w-4 h-4" />,
            color: '#10b981',
            bgClass: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        },
        error: {
            icon: <XCircle className="w-4 h-4" />,
            color: '#ef4444',
            bgClass: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        },
        fallback: {
            icon: <AlertTriangle className="w-4 h-4" />,
            color: '#f59e0b',
            bgClass: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        },
    };

    const providerColors: Record<string, string> = {
        openai: '#10a37f',
        anthropic: '#d97706',
        deepseek: '#3b82f6',
        gemini: '#8b5cf6',
        sarvam: '#ec4899',
        none: '#6b7280',
    };

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    };

    const formatDuration = (ms: number) => {
        if (ms < 1000) return `${ms}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const successRate = stats && stats.total_calls > 0
        ? Math.round((stats.success_count / stats.total_calls) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Brain className="w-6 h-6 text-purple-500" />
                        AI Agent Logs
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Detailed log of every AI agent call with provider, model, and performance data
                    </p>
                </div>
                <Button variant="outline" onClick={() => fetchLogs()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <Activity className="w-4 h-4" /> Total Calls
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_calls}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Success Rate
                            </div>
                            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {successRate}%
                            </div>
                            <div className="text-xs text-gray-400 mt-0.5">
                                {stats.success_count} ok / {stats.error_count} err / {stats.fallback_count} fb
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <Clock className="w-4 h-4 text-blue-500" /> Avg Duration
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.avg_duration ? formatDuration(stats.avg_duration) : '—'}
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="p-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
                                <Zap className="w-4 h-4 text-amber-500" /> Est. Tokens
                            </div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {stats.total_tokens ? stats.total_tokens.toLocaleString() : '0'}
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                    value={providerFilter}
                    onChange={(e) => { setProviderFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    aria-label="Filter by provider"
                >
                    <option value="">All Providers</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="gemini">Gemini</option>
                    <option value="sarvam">SarvamAI</option>
                    <option value="none">None (Fallback)</option>
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    aria-label="Filter by status"
                >
                    <option value="">All Status</option>
                    <option value="success">Success</option>
                    <option value="error">Error</option>
                    <option value="fallback">Fallback</option>
                </select>
                <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    aria-label="Filter by category"
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

            {/* Logs Table */}
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 w-8"></th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Provider / Model</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Category</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Articles</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Trending</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Tokens</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 text-right">Duration</th>
                                <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-purple-500" />
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="py-16 text-center">
                                        <Brain className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                        <p className="text-gray-500 dark:text-gray-400 font-medium">No agent logs yet</p>
                                        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                            AI agent calls will appear here when the cron job runs
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                logs.map(log => {
                                    const isExpanded = expandedId === log.id;
                                    const sc = statusConfig[log.status] || statusConfig.success;
                                    return (
                                        <>
                                            <tr
                                                key={log.id}
                                                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                                                onClick={() => setExpandedId(isExpanded ? null : log.id)}
                                            >
                                                <td className="px-4 py-3">
                                                    {isExpanded
                                                        ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                        : <ChevronRight className="w-4 h-4 text-gray-400" />
                                                    }
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bgClass}`}>
                                                        {sc.icon}
                                                        {log.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="custom" color={providerColors[log.provider] || '#6b7280'} size="sm">
                                                            {log.provider}
                                                        </Badge>
                                                        <span className="text-gray-600 dark:text-gray-300 text-xs">
                                                            {log.model}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="capitalize text-gray-700 dark:text-gray-300">{log.category}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-gray-600 dark:text-gray-400 flex items-center justify-end gap-1">
                                                        <Hash className="w-3 h-3" />{log.input_articles}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-gray-600 dark:text-gray-400">{log.output_trending}</span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        {log.prompt_tokens > 0 ? log.prompt_tokens.toLocaleString() : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <span className={`font-mono text-xs ${log.duration_ms > 5000 ? 'text-amber-600' : 'text-gray-600 dark:text-gray-400'}`}>
                                                        {log.duration_ms > 0 ? formatDuration(log.duration_ms) : '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {formatDate(log.created_at)}
                                                    </span>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr key={`${log.id}-detail`} className="bg-gray-50 dark:bg-gray-800/70">
                                                    <td colSpan={9} className="px-6 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                            {log.request_summary && (
                                                                <div>
                                                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Request Summary</p>
                                                                    <p className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                                        {log.request_summary}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {log.response_summary && (
                                                                <div>
                                                                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Response Summary</p>
                                                                    <p className="text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700 font-mono text-xs">
                                                                        {log.response_summary}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {log.error_message && (
                                                                <div className="md:col-span-2">
                                                                    <p className="font-medium text-red-600 dark:text-red-400 mb-1">Error</p>
                                                                    <p className="text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 font-mono text-xs break-all">
                                                                        {log.error_message}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
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
                                Previous
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
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
