-- Admin configuration is the source of trust; no separate approval flag.
-- Domain matching and India classification still gate every public article.
CREATE OR REPLACE VIEW public_articles AS
SELECT a.* FROM articles a
JOIN rss_feed_config f ON f.id = a.feed_id
WHERE a.status = 'published' AND a.geo_status = 'india'
  AND f.publisher_domain = a.publisher_domain
  AND a.category <> 'world';

ALTER TABLE rss_feed_config
  DROP INDEX idx_approved_feeds,
  DROP COLUMN approved_at,
  ADD INDEX idx_active_publisher (is_active, publisher_domain);
