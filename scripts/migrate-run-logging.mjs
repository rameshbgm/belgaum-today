#!/usr/bin/env node
/**
 * Run-Based RSS Logging Migration
 * Adds tables and columns for detailed audit trail
 */

import mysql from 'mysql2/promise';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env.local') });

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '3306'),
    user: process.env.DATABASE_USER || 'root',
    password: process.env.DATABASE_PASSWORD || '',
    database: process.env.DATABASE_NAME || 'belgaum_today',
});

async function migrate() {
    const connection = await pool.getConnection();
    
    try {
        console.log('🔄 Starting migration: Run-based RSS logging...');
        
        // Create rss_fetch_runs table
        console.log('  📦 Creating rss_fetch_runs table...');
        await connection.execute(`
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
            )
        `);
        console.log('  ✅ rss_fetch_runs table created');
        
        // Add run_id to rss_fetch_logs
        console.log('  📦 Adding run_id column to rss_fetch_logs...');
        try {
            await connection.execute(`
                ALTER TABLE rss_fetch_logs 
                ADD COLUMN run_id VARCHAR(50) NULL AFTER id,
                ADD INDEX idx_run_id (run_id)
            `);
            console.log('  ✅ run_id column added to rss_fetch_logs');
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('  ⏭️  run_id column already exists in rss_fetch_logs');
            } else {
                throw err;
            }
        }
        
        // Create rss_fetch_items table
        console.log('  📦 Creating rss_fetch_items table...');
        await connection.execute(`
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
            )
        `);
        console.log('  ✅ rss_fetch_items table created');
        
        console.log('✅ Migration completed successfully!');
        
    } catch (error) {
        console.error('❌ Migration failed:', error);
        throw error;
    } finally {
        connection.release();
        await pool.end();
    }
}

migrate().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
