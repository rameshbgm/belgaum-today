export async function register() {
    const { runRssFetch } = await import('@/lib/scheduler/rss-service');
    const { runTrendingAnalysis } = await import('@/lib/scheduler/trending-service');

    const RSS_INTERVAL_MS = 6 * 60 * 1000;   // 6 minutes

    async function fetchAndAnalyze() {
        try {
            await runRssFetch();
        } catch (err) {
            console.error('[Scheduler] RSS fetch error:', err);
        }
        try {
            await runTrendingAnalysis();
        } catch (err) {
            console.error('[Scheduler] Trending analysis error:', err);
        }
    }

    setTimeout(() => {
        fetchAndAnalyze();
        setInterval(fetchAndAnalyze, RSS_INTERVAL_MS);
    }, 10_000);

    console.log('[Scheduler] RSS + AI trending scheduled every 6 minutes');
}
