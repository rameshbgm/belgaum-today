'use client';

import { useState, useEffect } from 'react';
import {
    FileText, Eye, Edit3, Clock, TrendingUp, MousePointer,
    BarChart3, PieChart, CheckCircle2, XCircle, AlertTriangle
} from 'lucide-react';
import { Card, CardContent, Badge, Button, useToast } from '@/components/ui';
import { DashboardStats } from '@/types';
import { formatNumber } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart as RePieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#14b8a6'];

interface CronResult {
    success: boolean;
    message: string;
    feedsProcessed: number;
    newArticles: number;
    skipped: number;
    trendingUpdated?: string[];
    feeds?: Array<{ name: string; fetched: number; new: number; skipped: number }>;
    errors?: string[];
}

export default function AdminDashboardPage() {
    const { showToast } = useToast();
    const [stats, setStats] = useState<(DashboardStats & { totalClicks?: number; feedStatus?: any[]; topArticlesByDate?: any[] }) | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [cronRunning, setCronRunning] = useState(false);
    const [cronResult, setCronResult] = useState<CronResult | null>(null);
    const [showCronResult, setShowCronResult] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/admin/stats');
            const data = await response.json();
            if (data.success) {
                setStats(data.data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setIsLoading(false);
        }
    };


    const handleRunCron = async () => {
        setCronRunning(true);
        setCronResult(null);
        setShowCronResult(true);
        try {
            const response = await fetch('/api/admin/cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            setCronResult(data);

            if (data.success) {
                showToast(`Cron completed: ${data.newArticles} new articles`, 'success');
                fetchStats();
            } else {
                showToast('Cron failed: ' + (data.error || 'Unknown error'), 'error');
            }
        } catch (error) {
            showToast('Failed to run cron', 'error');
            setCronResult({ success: false, message: String(error), feedsProcessed: 0, newArticles: 0, skipped: 0 });
        } finally {
            setCronRunning(false);
        }
    };



    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-r-transparent" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Page Title */}
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <p className="text-gray-600 dark:text-gray-400">Welcome back! Here&apos;s your overview.</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                <Card gradient>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Articles</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNumber(stats?.totalArticles || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card gradient>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Published Today</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNumber(stats?.publishedToday || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card gradient>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Views</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNumber(stats?.totalViews || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card gradient>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Clicks</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNumber(stats?.totalClicks || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                                <MousePointer className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card gradient>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Drafts</p>
                                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                                    {formatNumber(stats?.draftCount || 0)}
                                </p>
                            </div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                <Edit3 className="w-6 h-6 text-yellow-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Cron Result Panel */}
            {showCronResult && cronResult && (
                <Card className="mb-8 border-2 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                                {cronResult.success ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                                ) : (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                )}
                                Cron Job Result
                            </h3>
                            <button onClick={() => setShowCronResult(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-blue-600">{cronResult.feedsProcessed}</p>
                                <p className="text-xs text-gray-500">Feeds Processed</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-green-600">{cronResult.newArticles}</p>
                                <p className="text-xs text-gray-500">New Articles</p>
                            </div>
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-yellow-600">{cronResult.skipped}</p>
                                <p className="text-xs text-gray-500">Skipped</p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                                <p className="text-2xl font-bold text-purple-600">{cronResult.trendingUpdated?.length || 0}</p>
                                <p className="text-xs text-gray-500">Trending Updated</p>
                            </div>
                        </div>
                        {cronResult.feeds && cronResult.feeds.length > 0 && (
                            <div className="space-y-2">
                                {cronResult.feeds.map((feed, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{feed.name}</span>
                                        <div className="flex items-center gap-3 text-xs">
                                            <span className="text-green-600">{feed.new} new</span>
                                            <span className="text-gray-400">{feed.skipped} skipped</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {cronResult.errors && cronResult.errors.length > 0 && (
                            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                <p className="text-sm font-medium text-red-600 mb-1 flex items-center gap-1">
                                    <AlertTriangle className="w-4 h-4" /> Errors
                                </p>
                                {cronResult.errors.map((err, i) => (
                                    <p key={i} className="text-xs text-red-500 truncate">{err}</p>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}



            {/* Articles Per Day Chart - Full Width */}
            <Card className="mb-8">
                <CardContent className="p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                        <BarChart3 className="w-5 h-5 text-blue-500" />
                        Articles Published (Last 30 Days)
                    </h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.articlesPerDay || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fill: '#9ca3af', fontSize: 12 }}
                                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                />
                                <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1f2937',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                />
                                <Bar dataKey="count" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                                <defs>
                                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#8b5cf6" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* By Category and Top Articles Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Distribution */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <PieChart className="w-5 h-5 text-purple-500" />
                            By Category
                        </h3>
                        <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={stats?.categoryStats || []}
                                        dataKey="count"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={70}
                                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                                        labelLine={false}
                                    >
                                        {(stats?.categoryStats || []).map((entry, index) => (
                                            <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                        {/* Legend */}
                        <div className="mt-2 space-y-1">
                            {(stats?.categoryStats || []).map((entry, index) => (
                                <div key={entry.category} className="flex items-center justify-between text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                        <span className="text-gray-600 dark:text-gray-400 capitalize">{entry.category}</span>
                                    </div>
                                    <span className="font-medium text-gray-900 dark:text-white">{entry.count}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Top Articles with Date-wise Views */}
                <Card>
                    <CardContent className="p-6">
                        <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            Top Articles by Views (Last 7 Days)
                        </h3>
                        <div className="space-y-6">
                            {!stats?.topArticlesByDate || stats.topArticlesByDate.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    No article views recorded in the last 7 days.
                                </p>
                            ) : (
                                stats.topArticlesByDate.map((article, index) => (
                                    <div key={article.id} className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-xs flex items-center justify-center font-medium flex-shrink-0">
                                                {index + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                                    {article.title}
                                                </p>
                                            </div>
                                            <Badge variant="default" size="sm">
                                                {formatNumber(article.totalViews)} total
                                            </Badge>
                                        </div>
                                        {/* Date-wise breakdown */}
                                        <div className="ml-9 space-y-1">
                                            {article.viewsByDate.map((dateView: { date: string; count: number }) => (
                                                <div key={dateView.date} className="flex items-center justify-between text-xs">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        {new Date(dateView.date).toLocaleDateString('en-IN', { 
                                                            day: '2-digit', 
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span className="text-gray-600 dark:text-gray-300 font-medium">
                                                        {formatNumber(dateView.count)} views
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
