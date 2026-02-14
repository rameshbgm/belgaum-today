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
    source_url VARCHAR(500) NOT NULL,
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
('Hindustan Times - India News', 'https://www.hindustantimes.com/feeds/rss/india-news/rssfeed.xml', 'india', 120, true),
('The Hindu - National', 'https://www.thehindu.com/news/national/feeder/default.rss', 'india', 120, true),
('Hindustan Times - Business', 'https://www.hindustantimes.com/feeds/rss/business/rssfeed.xml', 'business', 120, true),
('The Hindu - Agri Business', 'https://www.thehindu.com/business/agri-business/feeder/default.rss', 'business', 120, true),
('The Hindu - Industry', 'https://www.thehindu.com/business/Industry/feeder/default.rss', 'business', 120, true),
('The Hindu - Economy', 'https://www.thehindu.com/business/Economy/feeder/default.rss', 'business', 120, true),
('The Hindu - Markets', 'https://www.thehindu.com/business/markets/feeder/default.rss', 'business', 120, true),
('The Hindu - Budget', 'https://www.thehindu.com/business/budget/feeder/default.rss', 'business', 120, true)
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

-- AI Providers (OpenAI, Anthropic, DeepSeek, Gemini, SarvamAI)
CREATE TABLE IF NOT EXISTS ai_providers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    base_url VARCHAR(500),
    api_format ENUM('openai', 'anthropic', 'gemini', 'custom') DEFAULT 'openai',
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- AI Models (specific models per provider)
CREATE TABLE IF NOT EXISTS ai_models (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    model_id VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    max_tokens INT DEFAULT 1000,
    temperature DECIMAL(3,2) DEFAULT 0.30,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE,
    UNIQUE KEY uk_provider_model (provider_id, model_id)
);

-- API Keys (encrypted, managed from admin panel)
CREATE TABLE IF NOT EXISTS ai_api_keys (
    id INT PRIMARY KEY AUTO_INCREMENT,
    provider_id INT NOT NULL,
    key_name VARCHAR(100) NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (provider_id) REFERENCES ai_providers(id) ON DELETE CASCADE
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

-- Seed AI providers
INSERT INTO ai_providers (name, display_name, base_url, api_format, is_active, is_default) VALUES
('openai',    'OpenAI',    'https://api.openai.com/v1',           'openai',    true, true),
('anthropic', 'Anthropic', 'https://api.anthropic.com',           'anthropic', true, false),
('deepseek',  'DeepSeek',  'https://api.deepseek.com/v1',         'openai',    true, false),
('gemini',    'Google Gemini', 'https://generativelanguage.googleapis.com', 'gemini', true, false),
('sarvam',    'SarvamAI',  'https://api.sarvam.ai/v1',            'openai',    true, false)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

-- Seed default models
INSERT INTO ai_models (provider_id, model_id, display_name, is_active, is_default, max_tokens, temperature) VALUES
((SELECT id FROM ai_providers WHERE name='openai'),    'gpt-4o-mini',            'GPT-4o Mini',        true, true,  1000, 0.30),
((SELECT id FROM ai_providers WHERE name='openai'),    'chatgpt-4o-latest',      'ChatGPT-4o Latest',  true, false, 1000, 0.30),
((SELECT id FROM ai_providers WHERE name='anthropic'), 'claude-3-5-sonnet-20241022', 'Claude 3.5 Sonnet', true, true, 1000, 0.30),
((SELECT id FROM ai_providers WHERE name='anthropic'), 'claude-3-5-haiku-20241022',  'Claude 3.5 Haiku',  true, false, 1000, 0.30),
((SELECT id FROM ai_providers WHERE name='deepseek'),  'deepseek-chat',          'DeepSeek Chat',      true, true,  1000, 0.30),
((SELECT id FROM ai_providers WHERE name='deepseek'),  'deepseek-reasoner',      'DeepSeek Reasoner',  true, false, 1000, 0.30),
((SELECT id FROM ai_providers WHERE name='gemini'),    'gemini-2.0-flash',       'Gemini 2.0 Flash',   true, true,  1000, 0.30),
((SELECT id FROM ai_providers WHERE name='gemini'),    'gemini-1.5-pro',         'Gemini 1.5 Pro',     true, false, 1000, 0.30),
((SELECT id FROM ai_providers WHERE name='sarvam'),    'sarvam-m',               'Sarvam-M',           true, true,  1000, 0.30)
ON DUPLICATE KEY UPDATE display_name=VALUES(display_name);

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
