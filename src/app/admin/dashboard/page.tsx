"use client";
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, RefreshCw, Rss, Activity, AlertCircle } from 'lucide-react';
import { Button, useToast } from '@/components/ui';
import { DashboardStats, CATEGORY_META, TOP_LEVEL_CATEGORIES, type SchedulerHealth } from '@/types';
import { formatNumber } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

type Stats = DashboardStats & { totalClicks?: number; topArticlesByDate?: Array<{ date: string; articles: Array<{ id: number; title: string; views: number; rank: number }> }> };
function ScheduleRow({ name, interval, health }: { name: string; interval: string; health: SchedulerHealth }) {
    return <tr><td className="px-5 py-4 font-semibold">{name}<span className="mt-1 block text-sm font-normal text-muted">{interval}</span></td><td className="px-5 py-4"><span className={`inline-flex items-center gap-2 text-sm ${health.isStale ? 'text-red-700 dark:text-red-300' : 'text-green-700 dark:text-green-300'}`}><Activity size={14} />{health.lastStatus === 'never' ? 'No runs yet' : health.isStale ? 'Needs attention' : health.lastStatus === 'running' ? 'Running' : 'On schedule'}</span></td><td className="px-5 py-4 text-right text-sm text-muted">{health.lastStartedAt ? new Date(health.lastStartedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}{health.lastError && <span className="mt-1 block max-w-sm text-xs text-red-700 dark:text-red-300">{health.lastError}</span>}</td></tr>;
}
export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [running, setRunning] = useState(false);
    const [runMessage, setRunMessage] = useState('');
    const { showToast } = useToast();
    const refresh = useCallback(async () => {
        setError('');
        try {
            const response = await fetch('/api/admin/stats'); const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Could not load the overview.');
            setStats(result.data);
        } catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not load the overview.'); }
        finally { setLoading(false); }
    }, []);
    useEffect(() => { void refresh(); }, [refresh]);
    const runFeeds = async () => {
        setRunning(true); setRunMessage('');
        try {
            const response = await fetch('/api/admin/cron', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.error || 'Could not fetch feeds.');
            setRunMessage(`${result.feedsProcessed ?? 0} feeds processed · ${result.newArticles ?? 0} new articles · ${result.skipped ?? 0} skipped.`);
            showToast('Feed fetch completed', 'success'); void refresh();
        } catch (failure) { setRunMessage(failure instanceof Error ? failure.message : 'Could not fetch feeds.'); }
        finally { setRunning(false); }
    };
    const metric = (value?: number) => loading ? '—' : formatNumber(value || 0);
    return <div className="space-y-7">
        <div className="flex flex-wrap items-start justify-between gap-5"><div><h1>The editorial overview</h1><p className="mt-2 text-muted">Your stories, readership, and publisher activity in one place.</p></div><div className="flex gap-2"><Button variant="outline" onClick={refresh} aria-label="Refresh overview"><RefreshCw size={16} /></Button><Button mutation loading={running} onClick={runFeeds}><Rss size={16} />Fetch feeds</Button></div></div>
        {error && <div role="alert" className="flex items-center gap-3 rounded-lg border border-hairline bg-surface p-4"><AlertCircle size={18} className="text-primary" /><p className="flex-1">{error}</p><button className="text-action" onClick={refresh}>Try again</button></div>}
        {runMessage && <p role="status" className="rounded-lg bg-soft p-4 text-sm">{runMessage}</p>}
        <section aria-label="Newsroom statistics" className="dashboard-stat-strip">
            {[['Total articles', metric(stats?.totalArticles), `${metric(stats?.draftCount)} drafts`], ['Published today', metric(stats?.publishedToday), 'Across all topics'], ['Article views', metric(stats?.totalViews), `${metric(stats?.viewsToday)} today`], ['Publisher opens', metric(stats?.totalClicks), 'Readers opening original reports']].map(([label, value, detail]) => <div key={label} className="dashboard-stat"><span>{label}</span><strong>{value}</strong><span>{detail}</span></div>)}
        </section>
        {stats && <>
            <section className="overflow-hidden rounded-xl border border-hairline bg-surface"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-5 py-4"><h2 className="font-semibold">Publishing activity</h2><span className="text-sm text-muted">Last 30 days</span></div><div className="h-64 px-2 pb-3 pt-6 sm:px-5"><ResponsiveContainer width="100%" height="100%"><BarChart data={stats.articlesPerDay}><CartesianGrid vertical={false} stroke="var(--hairline)" /><XAxis dataKey="date" tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false} minTickGap={35} tickFormatter={date => new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} /><YAxis width={40} tick={{ fill: 'var(--muted)', fontSize: 11 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--hairline)', borderRadius: 8 }} /><Bar dataKey="count" name="Published" fill="#2F4BEB" radius={[3,3,0,0]} /></BarChart></ResponsiveContainer></div></section>
            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <section className="overflow-hidden rounded-xl border border-hairline bg-surface"><div className="section-heading border-b border-hairline px-5 py-4 !mb-0"><h2 className="!text-xl">Feed health</h2><Link href="/admin/feeds">Manage feeds<ArrowRight size={15} /></Link></div><div className="overflow-x-auto"><table className="w-full"><thead className="bg-background text-left text-muted"><tr><th className="px-5 py-3">Schedule</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Last run</th></tr></thead><tbody className="divide-y divide-hairline"><ScheduleRow name="Publisher feeds" interval={`Every ${stats.schedulerIntervals.rssMinutes} minutes`} health={stats.scheduler} /><ScheduleRow name="AI story ranking" interval={`Every ${stats.schedulerIntervals.aiHours} hours`} health={stats.aiScheduler} /></tbody></table></div></section>
                <section className="rounded-xl border border-hairline bg-surface p-5"><h2 className="font-semibold">Reader signals</h2><dl className="mt-5 space-y-4 text-sm"><div className="flex justify-between gap-3"><dt className="text-muted">Returning local readers · 7 days</dt><dd className="font-semibold">{formatNumber(stats.weeklyReturningLocalReaders)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Local publisher opens · 7 days</dt><dd className="font-semibold">{formatNumber(stats.localPublisherClicks7d)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Recorded view events</dt><dd className="font-semibold">{formatNumber(stats.viewEventsTotal)}</dd></div><div className="flex justify-between gap-3"><dt className="text-muted">Latest view event</dt><dd>{stats.lastViewAt ? new Date(stats.lastViewAt).toLocaleDateString('en-IN') : 'None yet'}</dd></div></dl></section>
            </div>
            <div className="grid gap-6 lg:grid-cols-2"><section className="rounded-xl border border-hairline bg-surface p-5"><h2 className="mb-5 font-semibold">Coverage by topic</h2><dl className="divide-y divide-hairline">{TOP_LEVEL_CATEGORIES.map(category => <div key={category} className="flex justify-between py-3 text-sm"><dt>{CATEGORY_META[category].name}</dt><dd className="font-semibold tabular-nums">{formatNumber(stats.categoryStats.find(item => item.category === category)?.count || 0)}</dd></div>)}</dl></section><section className="rounded-xl border border-hairline bg-surface p-5"><h2 className="mb-5 font-semibold">Leading publishers</h2><dl className="divide-y divide-hairline">{stats.sourceStats.map(source => <div key={source.source} className="flex justify-between gap-4 py-3 text-sm"><dt>{source.source}</dt><dd className="font-semibold tabular-nums">{formatNumber(source.count)}</dd></div>)}</dl></section></div>
            <section className="rounded-xl border border-hairline bg-surface p-5"><div className="section-heading"><h2 className="!text-xl">Most read each day</h2><Link href="/admin/articles">All articles<ArrowRight size={15} /></Link></div>{stats.topArticlesByDate?.length ? stats.topArticlesByDate.map((day, index) => <details key={day.date} open={index === 0} className="border-t border-hairline py-3"><summary className="min-h-11 cursor-pointer py-2 text-sm font-semibold">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}</summary><ol className="divide-y divide-hairline">{day.articles.map(article => <li key={article.id}><Link href={`/admin/articles/${article.id}/preview`} className="flex items-start justify-between gap-6 py-3 text-sm hover:text-primary"><span>{article.rank}. {article.title}</span><span className="shrink-0 text-muted">{formatNumber(article.views)} views</span></Link></li>)}</ol></details>) : <p className="py-5 text-sm text-muted">No views were recorded in the last seven days.</p>}</section>
        </>}
    </div>;
}
