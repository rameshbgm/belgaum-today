'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, RefreshCw, Loader2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Button, Card, CardContent, Badge, useToast } from '@/components/ui';

interface LogEntry {
    id: number;
    level: 'info' | 'warn' | 'error';
    category: string;
    message: string;
    metadata: string | null;
    created_at: string;
}

export default function SystemLogsPage() {
    const { showToast } = useToast();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [levelFilter, setLevelFilter] = useState('');

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(page));
            params.set('limit', '30');
            if (categoryFilter) params.set('category', categoryFilter);
            if (levelFilter) params.set('level', levelFilter);

            const res = await fetch(`/api/admin/logs?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setLogs(data.data.items);
                setTotalPages(data.data.totalPages);
            }
        } catch {
            showToast('Failed to fetch logs', 'error');
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter, levelFilter]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    const levelIcons: Record<string, React.ReactNode> = {
        info: <Info className="w-4 h-4 text-blue-500" />,
        warn: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
        error: <AlertCircle className="w-4 h-4 text-red-500" />,
    };

    const levelColors: Record<string, string> = {
        info: 'info',
        warn: 'warning',
        error: 'danger',
    };

    const categoryColors: Record<string, string> = {
        cron: '#3b82f6',
        ai: '#8b5cf6',
        admin: '#10b981',
        system: '#6b7280',
    };

    const formatDate = (d: string) => {
        return new Date(d).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit',
        });
    };

    const parseMetadata = (meta: string | null) => {
        if (!meta) return null;
        try {
            return JSON.parse(meta);
        } catch {
            return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Logs</h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Cron jobs, AI analysis, and admin operations
                    </p>
                </div>
                <Button variant="outline" onClick={() => fetchLogs()}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
                <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    aria-label="Filter by category"
                >
                    <option value="">All Categories</option>
                    <option value="cron">Cron</option>
                    <option value="ai">AI</option>
                    <option value="admin">Admin</option>
                    <option value="system">System</option>
                </select>
                <select
                    value={levelFilter}
                    onChange={(e) => { setLevelFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm"
                    aria-label="Filter by level"
                >
                    <option value="">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                </select>
            </div>

            {/* Logs */}
            <Card>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {loading ? (
                        <div className="py-12 text-center">
                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                            <Activity className="w-10 h-10 mx-auto mb-2 opacity-40" />
                            <p>No logs found</p>
                        </div>
                    ) : (
                        logs.map(log => {
                            const meta = parseMetadata(log.metadata);
                            return (
                                <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                    <div className="flex items-start gap-3">
                                        {levelIcons[log.level] || levelIcons.info}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge variant="custom" color={categoryColors[log.category] || '#6b7280'} size="sm">
                                                    {log.category}
                                                </Badge>
                                                <span className="text-sm text-gray-800 dark:text-gray-200">{log.message}</span>
                                            </div>
                                            {meta && (
                                                <div className="mt-1.5 flex flex-wrap gap-2">
                                                    {Object.entries(meta).map(([k, v]) => (
                                                        <span
                                                            key={k}
                                                            className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                                                        >
                                                            {k}: {String(v)}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <span className="text-xs text-gray-400 whitespace-nowrap">
                                            {formatDate(log.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
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
