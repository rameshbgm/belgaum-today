-- Prerequisite for Indian source approval. Leaves existing article content and categories untouched.
ALTER TABLE articles ADD COLUMN feed_id INT NULL AFTER source_url;
ALTER TABLE articles ADD INDEX idx_articles_feed_id (feed_id);
ALTER TABLE articles ADD CONSTRAINT fk_articles_feed_id FOREIGN KEY (feed_id)
  REFERENCES rss_feed_config(id) ON DELETE SET NULL;

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
