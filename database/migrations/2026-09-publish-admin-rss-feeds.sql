-- Publication follows the admin-configured publisher feed and article status.
-- The legacy geo_status field is no longer a publication gate.
CREATE OR REPLACE VIEW public_articles AS
SELECT a.* FROM articles a
JOIN rss_feed_config f ON f.id = a.feed_id
WHERE a.status = 'published'
  AND f.publisher_domain IS NOT NULL
  AND f.publisher_domain = a.publisher_domain;
