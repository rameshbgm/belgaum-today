import { NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { DashboardStats, SchedulerHealth } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';
import { SCHEDULER_STALE_AFTER_MS, VIEW_TRACKING_STALE_AFTER_MS } from '@/lib/scheduler/constants';

// GET /api/admin/stats - Get dashboard statistics (real data only)
export const GET = withLogging(async () => {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized', code: 401 },
                { status: 401 }
            );
        }

        // Total articles
        const totalResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM articles`
        );
        const totalArticles = totalResult[0]?.total || 0;

        // Draft count
        const draftResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM articles WHERE status = 'draft'`
        );
        const draftCount = draftResult[0]?.total || 0;

        // Published today
        const todayResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM articles WHERE status = 'published' AND DATE(published_at) = CURDATE()`
        );
        const publishedToday = todayResult[0]?.total || 0;

        // Total views (from article_views table for accuracy)
        const viewsResult = await query<[{ total: number }]>(
            `SELECT COALESCE(SUM(view_count), 0) as total FROM articles`
        );
        const totalViews = viewsResult[0]?.total || 0;

        // Total clicks
        const clicksResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM source_clicks`
        );
        const totalClicks = clicksResult[0]?.total || 0;

        // Top articles by view_count
        const topArticles = await query<Array<{ id: number; title: string; view_count: number }>>(
            `SELECT id, title, view_count FROM articles WHERE view_count > 0 ORDER BY view_count DESC LIMIT 5`
        );

        // Top 10 articles by views for each day (last 7 days)
        const topArticlesByDay = await query<Array<{
            view_date: string;
            article_id: number;
            title: string;
            slug: string;
            daily_views: number;
            rank_position: number;
        }>>(
            `SELECT 
                view_date,
                article_id,
                title,
                slug,
                daily_views,
                rank_position
             FROM (
                 SELECT 
                     DATE(av.created_at) as view_date,
                     a.id as article_id,
                     a.title,
                     a.slug,
                     COUNT(*) as daily_views,
                     ROW_NUMBER() OVER (PARTITION BY DATE(av.created_at) ORDER BY COUNT(*) DESC) as rank_position
                 FROM article_views av
                 INNER JOIN articles a ON av.article_id = a.id
                 WHERE av.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
                 GROUP BY DATE(av.created_at), a.id, a.title, a.slug
             ) ranked
             WHERE rank_position <= 10
             ORDER BY view_date DESC, rank_position ASC`
        );

        // Group by date for easier frontend consumption
        const topArticlesByDateMap = new Map<string, Array<{
            id: number;
            title: string;
            slug: string;
            views: number;
            rank: number;
        }>>();

        topArticlesByDay.forEach(row => {
            if (!topArticlesByDateMap.has(row.view_date)) {
                topArticlesByDateMap.set(row.view_date, []);
            }
            topArticlesByDateMap.get(row.view_date)!.push({
                id: row.article_id,
                title: row.title,
                slug: row.slug,
                views: row.daily_views,
                rank: row.rank_position
            });
        });

        // Convert to array sorted by date (most recent first)
        const topArticlesByDate = Array.from(topArticlesByDateMap.entries())
            .map(([date, articles]) => ({
                date,
                articles: articles.sort((a, b) => a.rank - b.rank)
            }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Articles per day (last 30 days)
        const articlesPerDay = await query<Array<{ date: string; count: number }>>(
            `SELECT DATE(published_at) as date, COUNT(*) as count 
             FROM articles 
             WHERE status = 'published' AND published_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
             GROUP BY DATE(published_at)
             ORDER BY date`
        );

        // Category stats
        const categoryStats = await query<Array<{ category: string; count: number }>>(
            `SELECT category, COUNT(*) as count FROM articles GROUP BY category ORDER BY count DESC LIMIT 6`
        );

        // Source stats
        const sourceStats = await query<Array<{ source: string; count: number }>>(
            `SELECT source_name as source, COUNT(*) as count FROM articles GROUP BY source_name ORDER BY count DESC LIMIT 5`
        );

        // Live view tracking — the article_views event table is the source of truth.
        // articles.view_count is a denormalized counter that can drift / look frozen.
        const viewsTodayResult = await query<[{ total: number }]>(
            `SELECT COUNT(*) as total FROM article_views WHERE DATE(created_at) = CURDATE()`
        );
        const viewsToday = viewsTodayResult[0]?.total || 0;

        const viewEventsResult = await query<[{ total: number; last_view: string | null }]>(
            `SELECT COUNT(*) as total, MAX(created_at) as last_view FROM article_views`
        );
        const viewEventsTotal = viewEventsResult[0]?.total || 0;
        const lastViewAt = viewEventsResult[0]?.last_view || null;
        const viewTrackingStale = !lastViewAt
            || (Date.now() - new Date(lastViewAt).getTime()) > VIEW_TRACKING_STALE_AFTER_MS;

        // Scheduler liveness from the heartbeat table.
        const beat = await queryOne<{
            last_started_at: string | null;
            last_success_at: string | null;
            last_status: 'running' | 'success' | 'error';
            last_error: string | null;
            tick_count: number;
        }>(
            `SELECT last_started_at, last_success_at, last_status, last_error, tick_count
             FROM scheduler_heartbeat WHERE job_name = 'rss-scheduler'`
        );

        const ageMs = beat?.last_started_at
            ? Date.now() - new Date(beat.last_started_at).getTime()
            : null;
        const scheduler: SchedulerHealth = {
            lastStartedAt: beat?.last_started_at ?? null,
            lastSuccessAt: beat?.last_success_at ?? null,
            lastStatus: beat?.last_status ?? 'never',
            lastError: beat?.last_error ?? null,
            tickCount: beat?.tick_count ?? 0,
            ageMinutes: ageMs === null ? null : Math.floor(ageMs / 60000),
            isStale: ageMs === null || ageMs > SCHEDULER_STALE_AFTER_MS,
        };

        // RSS feed status
        const feedStatus = await query<Array<{
            id: number;
            name: string;
            category: string;
            is_active: boolean;
            last_fetched_at: string | null;
        }>>(
            `SELECT id, name, category, is_active, last_fetched_at FROM rss_feed_config ORDER BY category, name`
        );

        const stats: DashboardStats & { 
            totalClicks: number; 
            feedStatus: typeof feedStatus;
            topArticlesByDate: typeof topArticlesByDate;
        } = {
            totalArticles,
            draftCount,
            publishedToday,
            totalViews,
            totalClicks,
            topArticles,
            topArticlesByDate,
            articlesPerDay,
            categoryStats,
            sourceStats,
            feedStatus,
            viewsToday,
            viewEventsTotal,
            lastViewAt,
            viewTrackingStale,
            scheduler,
        };

        return NextResponse.json({
            success: true,
            data: stats,
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch stats', details: String(error) },
            { status: 500 }
        );
    }
});