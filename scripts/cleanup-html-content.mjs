#!/usr/bin/env node

/**
 * Cleanup Script: Strip HTML from article excerpts and content
 * 
 * This script runs through all articles in the database and strips any
 * raw HTML tags/entities from the excerpt and content fields.
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const dbConfig = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '3307', 10),
    user: process.env.DATABASE_USER || 'belgaum_user',
    password: process.env.DATABASE_PASSWORD || 'belgaum_pass',
    database: process.env.DATABASE_NAME || 'belgaum_today',
    waitForConnections: true,
};

/**
 * Strip HTML tags, decode entities, and collapse whitespace
 */
function stripHtml(html) {
    if (!html) return html;
    
    // Remove CDATA wrappers
    let text = html.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
    // Remove HTML tags
    text = text.replace(/<[^>]*>/g, '');
    // Decode common HTML entities
    text = text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/');
    // Collapse whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

/**
 * Check if text contains HTML tags
 */
function containsHtml(text) {
    return /<[a-z][\s\S]*>/i.test(text);
}

async function main() {
    console.log('🔧 Starting HTML cleanup for articles...\n');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to database\n');

        // Fetch all articles
        const [articles] = await connection.execute(
            'SELECT id, title, excerpt, content FROM articles'
        );

        console.log(`Found ${articles.length} articles to check\n`);

        let updatedCount = 0;
        let skippedCount = 0;

        for (const article of articles) {
            const needsUpdate = 
                (article.excerpt && containsHtml(article.excerpt)) ||
                (article.content && containsHtml(article.content));

            if (!needsUpdate) {
                skippedCount++;
                continue;
            }

            const cleanExcerpt = article.excerpt ? stripHtml(article.excerpt) : article.excerpt;
            const cleanContent = article.content ? stripHtml(article.content) : article.content;

            await connection.execute(
                'UPDATE articles SET excerpt = ?, content = ? WHERE id = ?',
                [cleanExcerpt, cleanContent, article.id]
            );

            updatedCount++;
            console.log(`✓ Cleaned article #${article.id}: "${article.title.substring(0, 60)}..."`);
        }

        console.log(`\n✅ Cleanup complete!`);
        console.log(`   - Updated: ${updatedCount} articles`);
        console.log(`   - Skipped: ${skippedCount} articles (already clean)\n`);

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

main();
