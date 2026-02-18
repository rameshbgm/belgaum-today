#!/usr/bin/env node

/**
 * Delete Script: Remove all Belgaum category articles
 * 
 * This script deletes all articles in the 'belgaum' category from the database.
 * Use this to clear out problematic articles and re-fetch fresh ones.
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

async function main() {
    console.log('🗑️  Starting cleanup of Belgaum category articles...\n');

    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✓ Connected to database\n');

        // Count articles before deletion
        const [countResult] = await connection.execute(
            'SELECT COUNT(*) as count FROM articles WHERE category = ?',
            ['belgaum']
        );
        const count = countResult[0].count;

        if (count === 0) {
            console.log('ℹ️  No Belgaum articles found in database.\n');
            return;
        }

        console.log(`Found ${count} Belgaum articles to delete\n`);

        // Delete all Belgaum articles
        const [result] = await connection.execute(
            'DELETE FROM articles WHERE category = ?',
            ['belgaum']
        );

        console.log(`✅ Successfully deleted ${result.affectedRows} Belgaum articles from database\n`);
        console.log('💡 Next steps:');
        console.log('   1. Go to Admin Dashboard → RSS Fetch Logs');
        console.log('   2. Trigger manual RSS fetch for Belgaum feeds');
        console.log('   3. Fresh, clean articles will be imported\n');

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
