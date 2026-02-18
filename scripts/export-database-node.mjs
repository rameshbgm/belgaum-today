#!/usr/bin/env node

/**
 * Belgaum Today - Database Export Script (Node.js version)
 * Exports complete database with schema and data
 * Works without mysqldump command
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
    host: process.env.DATABASE_HOST || '127.0.0.1',
    port: parseInt(process.env.DATABASE_PORT || '3307'),
    user: process.env.DATABASE_USER || 'belgaum_user',
    password: process.env.DATABASE_PASSWORD || 'belgaum_pass',
    database: process.env.DATABASE_NAME || 'belgaum_today',
};

const BACKUP_DIR = path.join(__dirname, '../database/backups');
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                  new Date().toTimeString().split(' ')[0].replace(/:/g, '');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Escape SQL values
function escapeSQLValue(value) {
    if (value === null || value === undefined) {
        return 'NULL';
    }
    if (typeof value === 'number') {
        return value;
    }
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    if (value instanceof Date) {
        return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
    }
    if (Buffer.isBuffer(value)) {
        return `0x${value.toString('hex')}`;
    }
    
    // String escaping
    const str = String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\x00/g, '\\0')
        .replace(/\x1a/g, '\\Z');
    
    return `'${str}'`;
}

async function exportDatabase() {
    let connection;
    
    try {
        log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
        log('║     Belgaum Today - Database Export (Node.js)             ║', 'blue');
        log('╚════════════════════════════════════════════════════════════╝\n', 'blue');
        
        log('📊 Database Configuration:', 'yellow');
        log(`   Host: ${config.host}`);
        log(`   Port: ${config.port}`);
        log(`   User: ${config.user}`);
        log(`   Database: ${config.database}\n`);
        
        // Create backup directory
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        
        // Connect to database
        log('🔄 Connecting to database...', 'blue');
        connection = await mysql.createConnection(config);
        log('✅ Connected successfully\n', 'green');
        
        // Start export
        const filename = `full_backup_${TIMESTAMP}.sql`;
        const filepath = path.join(BACKUP_DIR, filename);
        
        let sqlOutput = [];
        
        // Header
        sqlOutput.push('-- Belgaum Today Database Export');
        sqlOutput.push(`-- Generated: ${new Date().toISOString()}`);
        sqlOutput.push(`-- Host: ${config.host}:${config.port}`);
        sqlOutput.push(`-- Database: ${config.database}`);
        sqlOutput.push('-- --------------------------------------------------------\n');
        sqlOutput.push('SET FOREIGN_KEY_CHECKS=0;');
        sqlOutput.push('SET SQL_MODE="NO_AUTO_VALUE_ON_ZERO";');
        sqlOutput.push('SET time_zone = "+00:00";\n');
        
        // Get all tables
        log('📋 Fetching table list...', 'blue');
        const [tables] = await connection.query('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        
        log(`✅ Found ${tableNames.length} tables\n`, 'green');
        
        // Export each table
        for (const tableName of tableNames) {
            log(`🔄 Exporting table: ${tableName}`, 'blue');
            
            sqlOutput.push(`\n-- --------------------------------------------------------`);
            sqlOutput.push(`-- Table structure for table \`${tableName}\``);
            sqlOutput.push(`-- --------------------------------------------------------\n`);
            
            // Drop table statement
            sqlOutput.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
            
            // Create table statement
            const [createResult] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
            sqlOutput.push(createResult[0]['Create Table'] + ';\n');
            
            // Get row count
            const [countResult] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
            const rowCount = countResult[0].count;
            
            if (rowCount > 0) {
                sqlOutput.push(`-- Dumping data for table \`${tableName}\``);
                sqlOutput.push(`-- ${rowCount} rows\n`);
                
                // Get all data
                const [rows] = await connection.query(`SELECT * FROM \`${tableName}\``);
                
                if (rows.length > 0) {
                    // Get column names
                    const columns = Object.keys(rows[0]);
                    const columnList = columns.map(col => `\`${col}\``).join(', ');
                    
                    // Insert statements in batches of 100
                    const batchSize = 100;
                    for (let i = 0; i < rows.length; i += batchSize) {
                        const batch = rows.slice(i, i + batchSize);
                        
                        sqlOutput.push(`INSERT INTO \`${tableName}\` (${columnList}) VALUES`);
                        
                        const values = batch.map(row => {
                            const rowValues = columns.map(col => escapeSQLValue(row[col]));
                            return `  (${rowValues.join(', ')})`;
                        });
                        
                        sqlOutput.push(values.join(',\n') + ';\n');
                    }
                }
                
                log(`   ✅ Exported ${rowCount} rows`, 'green');
            } else {
                log(`   ⏭️  Table is empty`, 'yellow');
            }
        }
        
        // Footer
        sqlOutput.push('\nSET FOREIGN_KEY_CHECKS=1;');
        sqlOutput.push('-- Export completed\n');
        
        // Write to file
        log('\n💾 Writing to file...', 'blue');
        await fs.writeFile(filepath, sqlOutput.join('\n'), 'utf8');
        
        // Get file size
        const stats = await fs.stat(filepath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        log('✅ Export successful!\n', 'green');
        
        // Display statistics
        log('📦 Export Details:', 'yellow');
        log(`   File: ${filename}`);
        log(`   Size: ${fileSizeMB} MB`);
        log(`   Location: ${filepath}\n`);
        
        // Table statistics
        log('📊 Database Statistics:', 'yellow');
        
        const statsQueries = [
            { label: 'Articles', query: 'SELECT COUNT(*) as count FROM articles' },
            { label: 'Users', query: 'SELECT COUNT(*) as count FROM users' },
            { label: 'Categories', query: 'SELECT COUNT(*) as count FROM categories' },
            { label: 'RSS Feeds', query: 'SELECT COUNT(*) as count FROM rss_feed_config' },
            { label: 'RSS Logs', query: 'SELECT COUNT(*) as count FROM rss_fetch_logs' },
            { label: 'RSS Runs', query: 'SELECT COUNT(*) as count FROM rss_fetch_runs' },
            { label: 'RSS Items', query: 'SELECT COUNT(*) as count FROM rss_fetch_items' },
            { label: 'Article Views', query: 'SELECT COUNT(*) as count FROM article_views' },
        ];
        
        for (const { label, query } of statsQueries) {
            try {
                const [result] = await connection.query(query);
                log(`   ${label}: ${result[0].count}`);
            } catch (err) {
                // Table might not exist
            }
        }
        
        log('\n✅ Ready for production deployment!\n', 'green');
        
        log('📋 Next Steps:', 'yellow');
        log('   1. Review the exported file');
        log('   2. Transfer file to production server via SFTP/SCP');
        log('   3. Import on Hostinger via phpMyAdmin or SSH');
        log('   4. Verify data integrity after import\n');
        
        log('🔧 Import command for production:', 'blue');
        log(`   mysql -h localhost -u your_user -p your_database < ${filename}\n`);
        
        log('╔════════════════════════════════════════════════════════════╗', 'green');
        log('║              Export Complete!                              ║', 'green');
        log('╚════════════════════════════════════════════════════════════╝\n', 'green');
        
    } catch (error) {
        log('\n❌ Export failed!', 'red');
        log(`   Error: ${error.message}`, 'red');
        
        if (error.code === 'ECONNREFUSED') {
            log('\n💡 Troubleshooting:', 'yellow');
            log('   • Ensure database is running (docker-compose up -d)');
            log('   • Check DATABASE_HOST and DATABASE_PORT in .env.local');
            log('   • Verify database credentials');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Run export
exportDatabase().catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
});
