-- Belgaum Today Database Schema
-- MySQL 8.0 compatible

-- Categories table (for future extensibility)
CREATE TABLE IF NOT EXISTS categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default categories
INSERT INTO categories (name, slug, description, color) VALUES
('India', 'india', 'Latest news from across India', '#FF9933'),
('Business', 'business', 'Business and economy updates', '#4CAF50'),
('Technology', 'technology', 'Tech news and innovations', '#2196F3'),
('Entertainment', 'entertainment', 'Movies, music, and pop culture', '#E91E63'),
('Sports', 'sports', 'Sports news and updates', '#FF5722'),
('Belgaum', 'belgaum', 'Local news from Belgaum region', '#9C27B0')
ON DUPLICATE KEY UPDATE name=name;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Articles table
CREATE TABLE IF NOT EXISTS articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(300) NOT NULL UNIQUE,
    excerpt TEXT,
    content LONGTEXT NOT NULL,
    featured_image VARCHAR(500),
    category ENUM('india', 'business', 'technology', 'entertainment', 'sports', 'belgaum') NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_url VARCHAR(1000) NOT NULL,
    status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
    featured BOOLEAN DEFAULT FALSE,
    ai_generated BOOLEAN DEFAULT FALSE,
    ai_confidence DECIMAL(3,2),
    requires_review BOOLEAN DEFAULT FALSE,
    view_count INT DEFAULT 0,
    reading_time INT DEFAULT 1,
    published_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_featured (featured),
    INDEX idx_published_at (published_at),
    INDEX idx_slug (slug),
    FULLTEXT INDEX idx_fulltext (title, excerpt, content)
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Article-Tags junction table
CREATE TABLE IF NOT EXISTS article_tags (
    article_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (article_id, tag_id),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Article views tracking
CREATE TABLE IF NOT EXISTS article_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    user_agent TEXT,
    referrer VARCHAR(500),
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_article_id (article_id),
    INDEX idx_created_at (created_at)
);

-- Source clicks tracking
CREATE TABLE IF NOT EXISTS source_clicks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(100) NOT NULL,
    article_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE SET NULL,
    INDEX idx_source_name (source_name),
    INDEX idx_created_at (created_at)
);

-- Newsletter subscriptions (future feature)
CREATE TABLE IF NOT EXISTS newsletter_subscriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP NULL,
    INDEX idx_email (email)
);

-- Insert default admin user (password: admin123)
-- IMPORTANT: Change this password in production!
INSERT INTO users (email, password_hash, name, role) VALUES
('admin@belgaum.today', '$2b$12$7J7q9Ub9WeNO7vCSxqWAkuEZlG4i6KbwgGbaKKTp.SsoBuo6veZX2', 'Admin', 'admin')
ON DUPLICATE KEY UPDATE email=email;

-- RSS Feed Configuration table
CREATE TABLE IF NOT EXISTS rss_feed_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    feed_url VARCHAR(500) NOT NULL UNIQUE,
    category ENUM('india', 'business', 'technology', 'entertainment', 'sports', 'belgaum') NOT NULL,
    fetch_interval_minutes INT DEFAULT 120,
    is_active BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default RSS feed sources
INSERT INTO rss_feed_config (name, feed_url, category, fetch_interval_minutes, is_active) VALUES
-- India
('Hindustan Times - India News', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'india', 120, true),
('The Hindu - National', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 120, true),
-- Business
('Hindustan Times - Business', 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml', 'business', 120, true),
('The Hindu - Agri Business', 'https://www.thehindu.com/business/agri-business/feeder/default.rss', 'business', 120, true),
('The Hindu - Industry', 'https://www.thehindu.com/business/Industry/feeder/default.rss', 'business', 120, true),
('The Hindu - Economy', 'https://www.thehindu.com/business/Economy/feeder/default.rss', 'business', 120, true),
('The Hindu - Markets', 'https://www.thehindu.com/business/markets/feeder/default.rss', 'business', 120, true),
('The Hindu - Budget', 'https://www.thehindu.com/business/budget/feeder/default.rss', 'business', 120, true),
-- Technology
('Hindustan Times - Technology', 'https://www.hindustantimes.com/feeds/rss/technology/rssfeed.xml', 'technology', 120, true),
('The Hindu - Science', 'https://www.thehindu.com/sci-tech/science/feeder/default.rss', 'technology', 120, true),
('The Hindu - Technology', 'https://www.thehindu.com/sci-tech/technology/feeder/default.rss', 'technology', 120, true),
('The Hindu - Internet', 'https://www.thehindu.com/sci-tech/technology/internet/feeder/default.rss', 'technology', 120, true),
('The Hindu - Gadgets', 'https://www.thehindu.com/sci-tech/technology/gadgets/feeder/default.rss', 'technology', 120, true),
-- Sports
('Hindustan Times - Cricket', 'https://www.hindustantimes.com/feeds/rss/cricket/rssfeed.xml', 'sports', 120, true),
('Hindustan Times - Football', 'https://www.hindustantimes.com/feeds/rss/football/rssfeed.xml', 'sports', 120, true),
('Hindustan Times - Tennis', 'https://www.hindustantimes.com/feeds/rss/tennis/rssfeed.xml', 'sports', 120, true),
('Hindustan Times - Other Sports', 'https://www.hindustantimes.com/feeds/rss/other-sports/rssfeed.xml', 'sports', 120, true),
('The Hindu - Sport', 'https://www.thehindu.com/sport/feeder/default.rss', 'sports', 120, true),
('The Hindu - Cricket', 'https://www.thehindu.com/sport/cricket/feeder/default.rss', 'sports', 120, true),
('The Hindu - Football', 'https://www.thehindu.com/sport/football/feeder/default.rss', 'sports', 120, true),
('The Hindu - Tennis', 'https://www.thehindu.com/sport/tennis/feeder/default.rss', 'sports', 120, true),
('The Hindu - Hockey', 'https://www.thehindu.com/sport/hockey/feeder/default.rss', 'sports', 120, true),
('The Hindu - Other Sports', 'https://www.thehindu.com/sport/other-sports/feeder/default.rss', 'sports', 120, true),
-- Entertainment
('Hindustan Times - Entertainment', 'https://www.hindustantimes.com/feeds/rss/entertainment/rssfeed.xml', 'entertainment', 120, true),
('Hindustan Times - Bollywood', 'https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml', 'entertainment', 120, true),
('Hindustan Times - Hollywood', 'https://www.hindustantimes.com/feeds/rss/entertainment/hollywood/rssfeed.xml', 'entertainment', 120, true),
('Hindustan Times - Music', 'https://www.hindustantimes.com/feeds/rss/entertainment/music/rssfeed.xml', 'entertainment', 120, true),
('Hindustan Times - TV', 'https://www.hindustantimes.com/feeds/rss/entertainment/tv/rssfeed.xml', 'entertainment', 120, true),
('The Hindu - Entertainment', 'https://www.thehindu.com/entertainment/feeder/default.rss', 'entertainment', 120, true),
('The Hindu - Movies', 'https://www.thehindu.com/entertainment/movies/feeder/default.rss', 'entertainment', 120, true),
('The Hindu - Music', 'https://www.thehindu.com/entertainment/music/feeder/default.rss', 'entertainment', 120, true),
('The Hindu - Theatre', 'https://www.thehindu.com/entertainment/theatre/feeder/default.rss', 'entertainment', 120, true),
('The Hindu - Art', 'https://www.thehindu.com/entertainment/art/feeder/default.rss', 'entertainment', 120, true),
('The Hindu - Dance', 'https://www.thehindu.com/entertainment/dance/feeder/default.rss', 'entertainment', 120, true)
ON DUPLICATE KEY UPDATE name=name;

-- Add index on source_url for deduplication
ALTER TABLE articles ADD INDEX idx_source_url (source_url(500));

-- Trending articles table (cross-category, AI-powered)
CREATE TABLE IF NOT EXISTS trending_articles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    article_id INT NOT NULL,
    category ENUM('india','business','technology','entertainment','sports','belgaum') NOT NULL,
    rank_position TINYINT NOT NULL,
    ai_score DECIMAL(5,2),
    ai_reasoning TEXT,
    batch_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
    INDEX idx_category (category),
    INDEX idx_batch (batch_id),
    INDEX idx_expires (expires_at),
    UNIQUE KEY uk_cat_rank (category, rank_position)
);

-- Unified AI Providers (single source of truth per provider)
-- One provider row contains model + API key + runtime tuning.
-- Rule: At most one provider may be active at a time (or all disabled).
CREATE TABLE IF NOT EXISTS ai_providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(500),
    api_format ENUM('openai', 'anthropic', 'gemini', 'custom') DEFAULT 'openai',

    -- One model per provider
    model_id VARCHAR(120) NOT NULL,

    -- Unified runtime configuration
    max_tokens INT DEFAULT 1000,
    temperature DECIMAL(4,2) DEFAULT 0.30,
    request_timeout_ms INT DEFAULT 45000,
    retry_count TINYINT DEFAULT 1,

    -- Key is encrypted before insert (same AES-256-GCM approach)
    api_key_encrypted TEXT NULL,
    key_name VARCHAR(120) NULL,

    -- Prompt/guardrail provider-level override (optional)
    provider_prompt_override LONGTEXT NULL,
    provider_guardrails_json JSON NULL,

    -- Extensible provider options
    extra_config_json JSON NULL,

    -- Activation rule
    is_active BOOLEAN DEFAULT FALSE,
    active_singleton TINYINT GENERATED ALWAYS AS (CASE WHEN is_active THEN 1 ELSE NULL END) STORED,

    -- Health/ops metadata
    last_used_at TIMESTAMP NULL,
    last_success_at TIMESTAMP NULL,
    last_error_at TIMESTAMP NULL,
    last_error_message TEXT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_active_singleton (active_singleton)
);

-- Global system prompt and guardrail management
CREATE TABLE IF NOT EXISTS ai_system_prompts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    prompt_name VARCHAR(120) NOT NULL,
    system_prompt LONGTEXT NOT NULL,
    guardrails_json JSON NULL,
    is_active BOOLEAN DEFAULT TRUE,
    singleton_key TINYINT GENERATED ALWAYS AS (CASE WHEN is_active THEN 1 ELSE NULL END) STORED,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_active_prompt_singleton (singleton_key),
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Optional operational events for AI config changes
CREATE TABLE IF NOT EXISTS ai_provider_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    event_type ENUM('created','updated','enabled','disabled','key_rotated','test_run') NOT NULL,
    event_message VARCHAR(500) NOT NULL,
    event_metadata JSON NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_provider_id (provider_id),
    INDEX idx_event_type (event_type),
    INDEX idx_created_at (created_at)
);

-- System logs (operational logging for cron, AI, admin actions)
CREATE TABLE IF NOT EXISTS system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    level ENUM('info','warn','error') NOT NULL,
    category VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_level (level),
    INDEX idx_created_at (created_at)
);

-- Seed unified providers (one model per provider; key can be set from admin panel)
INSERT INTO ai_providers
    (name, display_name, base_url, api_format, model_id, max_tokens, temperature, request_timeout_ms, retry_count, is_active, key_name, api_key_encrypted, extra_config_json)
VALUES
    ('openai', 'OpenAI', 'https://api.openai.com/v1', 'openai', 'gpt-4o-mini', 1000, 0.30, 45000, 1, true, NULL, NULL, JSON_OBJECT('supports_tools', true)),
    ('anthropic', 'Anthropic', 'https://api.anthropic.com', 'anthropic', 'claude-3-5-sonnet-20241022', 1200, 0.30, 45000, 1, false, NULL, NULL, JSON_OBJECT('supports_tools', true)),
    ('deepseek', 'DeepSeek', 'https://api.deepseek.com/v1', 'openai', 'deepseek-chat', 1000, 0.30, 45000, 1, false, NULL, NULL, JSON_OBJECT('supports_tools', false)),
    ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com', 'gemini', 'gemini-2.0-flash', 1200, 0.30, 45000, 1, false, NULL, NULL, JSON_OBJECT('supports_tools', true)),
    ('sarvam', 'SarvamAI', 'https://api.sarvam.ai/v1', 'openai', 'sarvam-m', 1000, 0.30, 45000, 1, false, NULL, NULL, JSON_OBJECT('supports_tools', false))
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    base_url = VALUES(base_url),
    api_format = VALUES(api_format),
    model_id = VALUES(model_id),
    max_tokens = VALUES(max_tokens),
    temperature = VALUES(temperature),
    request_timeout_ms = VALUES(request_timeout_ms),
    retry_count = VALUES(retry_count),
    extra_config_json = VALUES(extra_config_json);

-- Seed a default global system prompt + baseline guardrails
INSERT INTO ai_system_prompts
    (prompt_name, system_prompt, guardrails_json, is_active, created_by)
VALUES
    (
        'Default Editorial Prompt',
        'You are a senior Indian news editor. Rank stories by impact, novelty, credibility, and relevance to readers. Respond only with valid JSON.',
        JSON_OBJECT(
            'strict_json_only', true,
            'max_reasoning_length', 240,
            'block_unverified_claims', true,
            'avoid_duplicate_story_selection', true
        ),
        true,
        (SELECT id FROM users WHERE email = 'admin@belgaum.today' LIMIT 1)
    )
ON DUPLICATE KEY UPDATE
    system_prompt = VALUES(system_prompt),
    guardrails_json = VALUES(guardrails_json),
    is_active = VALUES(is_active);

-- AI Agent Call Logs (detailed logging for every AI call)
CREATE TABLE IF NOT EXISTS ai_agent_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider VARCHAR(50) NOT NULL,
    model VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    status ENUM('success','error','fallback') NOT NULL DEFAULT 'success',
    input_articles INT DEFAULT 0,
    output_trending INT DEFAULT 0,
    prompt_tokens INT DEFAULT 0,
    duration_ms INT DEFAULT 0,
    error_message TEXT,
    request_summary TEXT,
    response_summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_provider (provider),
    INDEX idx_status (status),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
);
