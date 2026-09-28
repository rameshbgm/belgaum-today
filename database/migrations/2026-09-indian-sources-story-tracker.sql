-- Apply after 2026-09-source-attribution-and-digest.sql, then apply
-- 2026-09-admin-added-feeds.sql before deploying application code.
ALTER TABLE rss_feed_config
  ADD COLUMN publisher_name VARCHAR(100) NULL,
  ADD COLUMN publisher_domain VARCHAR(255) NULL,
  ADD COLUMN approved_at TIMESTAMP NULL,
  ADD INDEX idx_approved_feeds (approved_at, is_active);

ALTER TABLE articles
  ADD COLUMN publisher_domain VARCHAR(255) NULL,
  ADD COLUMN geo_status ENUM('pending','india','excluded') NOT NULL DEFAULT 'pending',
  ADD COLUMN story_event_id BIGINT NULL,
  ADD INDEX idx_geo_feed (geo_status, feed_id),
  ADD INDEX idx_story_event (story_event_id);

CREATE TABLE story_events (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  first_seen_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_event_updated (last_updated_at)
);

ALTER TABLE articles ADD CONSTRAINT fk_article_story_event
  FOREIGN KEY (story_event_id) REFERENCES story_events(id) ON DELETE SET NULL;

CREATE TABLE story_event_updates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  story_event_id BIGINT NOT NULL,
  article_id INT NOT NULL UNIQUE,
  change_text VARCHAR(320) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (story_event_id) REFERENCES story_events(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
  INDEX idx_event_date (story_event_id, created_at)
);

-- All public news reads use this view. Pausing a feed does not revoke its past articles.
CREATE VIEW public_articles AS
SELECT a.* FROM articles a
JOIN rss_feed_config f ON f.id = a.feed_id
WHERE a.status = 'published' AND a.geo_status = 'india'
  AND f.approved_at IS NOT NULL AND f.publisher_domain = a.publisher_domain
  AND a.category <> 'world';
