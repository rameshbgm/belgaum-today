-- Apply before deploying code that reads articles.feed_id or publishes World stories.
-- Convert to text first: existing empty enum values must be repaired before restoring strict enums.
ALTER TABLE articles MODIFY category VARCHAR(50) NOT NULL;
ALTER TABLE rss_feed_config MODIFY category VARCHAR(50) NOT NULL;
ALTER TABLE rss_fetch_logs MODIFY category VARCHAR(50) NOT NULL;
ALTER TABLE trending_articles MODIFY category VARCHAR(50) NOT NULL;

INSERT INTO categories (name, slug) SELECT 'World', 'world'
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'world');

UPDATE rss_feed_config SET category = 'world'
WHERE name = 'firstpost-world' AND category = '';
UPDATE articles SET category = 'world'
WHERE category = '' AND source_name = 'Firstpost.com';
UPDATE rss_fetch_logs SET category = 'world'
WHERE category = '' AND feed_name = 'firstpost-world';
UPDATE trending_articles ta JOIN articles a ON a.id = ta.article_id
SET ta.category = 'world'
WHERE ta.category = '' AND a.category = 'world';

ALTER TABLE articles MODIFY category ENUM('india','world','business','technology','entertainment','sports','belgaum','travel','science','health','lifestyle','food','education','environment','culture','finance') NOT NULL;
ALTER TABLE rss_feed_config MODIFY category ENUM('india','world','business','technology','entertainment','sports','belgaum','travel','science','health','lifestyle','food','education','environment','culture','finance') NOT NULL;
ALTER TABLE rss_fetch_logs MODIFY category ENUM('india','world','business','technology','entertainment','sports','belgaum','travel','science','health','lifestyle','food','education','environment','culture','finance') NOT NULL;
ALTER TABLE trending_articles MODIFY category ENUM('india','world','business','technology','entertainment','sports','belgaum','travel','science','health','lifestyle','food','education','environment','culture','finance') NOT NULL;

INSERT INTO rss_feed_config (name, feed_url, category, fetch_interval_minutes, is_active)
SELECT 'The Hindu - Karnataka', 'https://www.thehindu.com/news/national/karnataka/feeder/default.rss', 'india', 120, 1
WHERE NOT EXISTS (
    SELECT 1 FROM rss_feed_config
    WHERE feed_url = 'https://www.thehindu.com/news/national/karnataka/feeder/default.rss'
);

-- Recover existing English Belagavi stories from national publisher feeds.
UPDATE articles SET category = 'belgaum'
WHERE category = 'india' AND status = 'published'
  AND source_url NOT LIKE 'https://news.google.com/%'
  AND (title LIKE '%Belagavi%' OR title LIKE '%Belgaum%' OR title LIKE '%Belgaon%'
       OR excerpt LIKE '%Belagavi%' OR excerpt LIKE '%Belgaum%' OR excerpt LIKE '%Belgaon%');

ALTER TABLE articles ADD COLUMN feed_id INT NULL AFTER source_url;
ALTER TABLE articles ADD INDEX idx_articles_feed_id (feed_id);
ALTER TABLE articles ADD CONSTRAINT fk_articles_feed_id FOREIGN KEY (feed_id)
    REFERENCES rss_feed_config(id) ON DELETE SET NULL;

-- Existing articles remain unattributed where their exact feed cannot be established.
-- The two Google News searches and overlapping publisher feeds make name-only backfills unreliable.

-- The English-only local source is retained in admin for audit, but no longer ingested.
UPDATE rss_feed_config SET is_active = 0
WHERE name = 'OneIndia Kannada - Belagavi';
UPDATE articles SET status = 'archived'
WHERE category = 'belgaum' AND source_name = 'OneIndia';

-- These four endpoints returned valid RSS documents with no items throughout the feed audit.
UPDATE rss_feed_config SET is_active = 0
WHERE id IN (15, 16, 17, 69)
  AND feed_url LIKE 'https://www.hindustantimes.com/%';

-- Existing subscription rows remain unverified and receive no digest until they opt in again.
ALTER TABLE newsletter_subscriptions ADD COLUMN topics_json JSON NULL;
ALTER TABLE newsletter_subscriptions ADD COLUMN verification_token_hash CHAR(64) NULL;
ALTER TABLE newsletter_subscriptions ADD COLUMN verified_at TIMESTAMP NULL;
ALTER TABLE newsletter_subscriptions ADD COLUMN last_sent_on DATE NULL;
ALTER TABLE newsletter_subscriptions ADD INDEX idx_digest_ready (verified_at, unsubscribed_at, last_sent_on);

CREATE TABLE IF NOT EXISTS reader_visits (
    reader_id CHAR(36) NOT NULL,
    section VARCHAR(30) NOT NULL,
    visit_day DATE NOT NULL,
    PRIMARY KEY (reader_id, section, visit_day),
    INDEX idx_reader_visits_section_day (section, visit_day)
);
