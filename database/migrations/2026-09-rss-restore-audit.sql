-- Preserve the previous publication fields for each staged RSS restoration.
CREATE TABLE IF NOT EXISTS rss_restore_audit (
  run_id CHAR(36) NOT NULL,
  article_id INT NOT NULL,
  old_feed_id INT NULL,
  old_publisher_domain VARCHAR(255) NULL,
  old_status VARCHAR(20) NOT NULL,
  new_feed_id INT NOT NULL,
  new_publisher_domain VARCHAR(255) NOT NULL,
  new_status VARCHAR(20) NOT NULL,
  restored_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  rolled_back_at TIMESTAMP NULL,
  PRIMARY KEY (run_id, article_id),
  INDEX idx_rss_restore_article (article_id)
);
