-- Migration: Add run-based RSS logging with detailed audit trail
-- Created: 2026-02-18

-- RSS Fetch Runs table (groups multiple feed fetches into a single run)
CREATE TABLE IF NOT EXISTS rss_fetch_runs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    run_id VARCHAR(50) NOT NULL UNIQUE,
    trigger_type ENUM('manual','cron','scheduled') NOT NULL DEFAULT 'manual',
    triggered_by VARCHAR(100),
    total_feeds INT DEFAULT 0,
    total_items_fetched INT DEFAULT 0,
    total_new_articles INT DEFAULT 0,
    total_skipped INT DEFAULT 0,
    total_errors INT DEFAULT 0,
    overall_status ENUM('success','partial','error') NOT NULL DEFAULT 'success',
    duration_ms INT DEFAULT 0,
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP NULL,
    INDEX idx_run_id (run_id),
    INDEX idx_trigger_type (trigger_type),
    INDEX idx_started_at (started_at),
    INDEX idx_overall_status (overall_status)
);

-- Add run_id to existing rss_fetch_logs table
ALTER TABLE rss_fetch_logs 
ADD COLUMN run_id VARCHAR(50) NULL AFTER id,
ADD INDEX idx_run_id (run_id);

-- RSS Fetch Items table (detailed item-level audit trail)
CREATE TABLE IF NOT EXISTS rss_fetch_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    run_id VARCHAR(50) NOT NULL,
    feed_id INT NOT NULL,
    feed_name VARCHAR(100) NOT NULL,
    item_title VARCHAR(500) NOT NULL,
    item_url VARCHAR(1000),
    item_pub_date TIMESTAMP NULL,
    action ENUM('new','skipped','error') NOT NULL,
    skip_reason VARCHAR(200),
    error_message TEXT,
    article_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (feed_id) REFERENCES rss_feed_config(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    INDEX idx_run_id (run_id),
    INDEX idx_feed_id (feed_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
