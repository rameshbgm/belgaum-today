import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { DashboardStats } from '@/types';
import { getCurrentUser } from '@/lib/auth';
import { withLogging } from '@/lib/withLogging';

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

        // Top articles with date-wise views (last 7 days)
        const topArticlesWithDateViews = await query<Array<{
            article_id: number;
            title: string;
            view_date: string;
            daily_views: number;
        }>>(
            `SELECT 
                a.id as article_id,
                a.title,
                DATE(av.created_at) as view_date,
                COUNT(*) as daily_views
             FROM articles a
             INNER JOIN article_views av ON a.id = av.article_id
             WHERE av.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
             GROUP BY a.id, a.title, DATE(av.created_at)
             ORDER BY a.id, view_date DESC`
        );

        // Group by article for easier frontend consumption
        const topArticlesByDateMap = new Map<number, {
            id: number;
            title: string;
            totalViews: number;
            viewsByDate: Array<{ date: string; count: number }>;
        }>();

        topArticlesWithDateViews.forEach(row => {
            if (!topArticlesByDateMap.has(row.article_id)) {
                topArticlesByDateMap.set(row.article_id, {
                    id: row.article_id,
                    title: row.title,
                    totalViews: 0,
                    viewsByDate: []
                });
            }
            const article = topArticlesByDateMap.get(row.article_id)!;
            article.totalViews += row.daily_views;
            article.viewsByDate.push({
                date: row.view_date,
                count: row.daily_views
            });
        });

        // Convert to array and sort by total views, limit to top 5
        const topArticlesByDate = Array.from(topArticlesByDateMap.values())
            .sort((a, b) => b.totalViews - a.totalViews)
            .slice(0, 5);

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