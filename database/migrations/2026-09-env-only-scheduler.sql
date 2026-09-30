-- Scheduling is global and controlled only by RSS_FETCH_INTERVAL_MINUTES and
-- TRENDING_ANALYSIS_INTERVAL_HOURS. Feed rows keep health timestamps, not a
-- second scheduling source.
ALTER TABLE rss_feed_config DROP COLUMN IF EXISTS fetch_interval_minutes;
