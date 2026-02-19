/**
 * Sync Hostinger Database
 * 1. Drops all existing tables
 * 2. Re-creates schema from database/schema.sql
 * 3. Imports all data from latest backup
 */

import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const config = {
    host:     process.env.DATABASE_HOST     || 'srv873.hstgr.io',
    port:     parseInt(process.env.DATABASE_PORT || '3306'),
    user:     process.env.DATABASE_USER     || 'u915919430_belgaum_user',
    password: process.env.DATABASE_PASSWORD || '&PN/^Q4:mD',
    database: process.env.DATABASE_NAME     || 'u915919430_belgaum_today',
    connectTimeout: 30000,
    multipleStatements: true,
};

const C = {
    reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m',
    yellow: '\x1b[33m', blue: '\x1b[34m', bold: '\x1b[1m',
};
const log  = (m, c='reset') => console.log(`${C[c]}${m}${C.reset}`);
const step = (m) => console.log(`\n${C.bold}${C.blue}${m}${C.reset}`);

/**
 * Split SQL file into individual statements, ignoring comments and empty lines
 */
function splitStatements(sql) {
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    let i = 0;

    while (i < sql.length) {
        const ch  = sql[i];
        const ch2 = sql.slice(i, i + 2);

        // Skip line comments outside strings
        if (!inString && ch2 === '--') {
            const end = sql.indexOf('\n', i);
            i = end === -1 ? sql.length : end + 1;
            continue;
        }
        // Skip block comments outside strings
        if (!inString && ch2 === '/*') {
            const end = sql.indexOf('*/', i + 2);
            i = end === -1 ? sql.length : end + 2;
            continue;
        }

        if (!inString && (ch === "'" || ch === '"' || ch === '`')) {
            inString  = true;
            stringChar = ch;
        } else if (inString && ch === stringChar && sql[i - 1] !== '\\') {
            inString = false;
        }

        if (!inString && ch === ';') {
            const stmt = current.trim();
            if (stmt.length > 0) statements.push(stmt + ';');
            current = '';
        } else {
            current += ch;
        }
        i++;
    }

    const last = current.trim();
    if (last.length > 0) statements.push(last);
    return statements;
}

async function run() {
    log('\n╔════════════════════════════════════════════════════════╗', 'blue');
    log('║    Belgaum Today — Hostinger DB Sync                  ║', 'blue');
    log('╚════════════════════════════════════════════════════════╝\n', 'blue');

    log(`Host: ${config.host}:${config.port}`, 'yellow');
    log(`User: ${config.user}`, 'yellow');
    log(`DB:   ${config.database}\n`, 'yellow');

    const conn = await mysql.createConnection(config);
    log('✅ Connected to Hostinger MySQL\n', 'green');

    try {
        // ── Step 1: Drop all tables ──────────────────────────────────
        step('Step 1/3 — Dropping all existing tables');

        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        const [tables] = await conn.query('SHOW TABLES');
        const tableNames = tables.map(r => Object.values(r)[0]);

        if (tableNames.length === 0) {
            log('  No tables to drop', 'yellow');
        } else {
            for (const t of tableNames) {
                await conn.query(`DROP TABLE IF EXISTS \`${t}\``);
                log(`  ✓ Dropped: ${t}`, 'yellow');
            }
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        log(`\n  Dropped ${tableNames.length} tables`, 'green');

        // ── Step 2: Re-create schema ─────────────────────────────────
        step('Step 2/3 — Creating schema from database/schema.sql');

        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql  = await fs.readFile(schemaPath, 'utf8');
        const schemaStmts = splitStatements(schemaSql).filter(s =>
            /^(CREATE|ALTER|INSERT|SET)/i.test(s.trim())
        );

        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        let created = 0;
        for (const stmt of schemaStmts) {
            try {
                await conn.query(stmt);
                const match = stmt.match(/CREATE TABLE.*?`(\w+)`/i);
                if (match) {
                    log(`  ✓ Created table: ${match[1]}`, 'green');
                    created++;
                }
            } catch (e) {
                log(`  ⚠ Warning: ${e.message.substring(0, 100)}`, 'yellow');
            }
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');
        log(`\n  Created ${created} tables`, 'green');

        // ── Step 2b: Run migrations ──────────────────────────────────
        step('Step 2b/3 — Applying migrations');

        const migrationDir = path.join(__dirname, '../database/migrations');
        let migFiles = [];
        try {
            migFiles = (await fs.readdir(migrationDir)).filter(f => f.endsWith('.sql')).sort();
        } catch { /* no migrations dir */ }

        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        for (const mf of migFiles) {
            const migSql   = await fs.readFile(path.join(migrationDir, mf), 'utf8');
            const migStmts = splitStatements(migSql).filter(s =>
                /^(CREATE|ALTER|INSERT|SET)/i.test(s.trim())
            );
            for (const stmt of migStmts) {
                try { await conn.query(stmt); } catch (e) {
                    if (!e.message.includes('already exists')) {
                        log(`  ⚠ ${mf}: ${e.message.substring(0, 100)}`, 'yellow');
                    }
                }
            }
            log(`  ✓ Applied: ${mf}`, 'green');
        }
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        // ── Step 3: Import data from latest backup ───────────────────
        step('Step 3/3 — Importing data from backup');

        const backupDir = path.join(__dirname, '../database/backups');
        const files     = (await fs.readdir(backupDir))
            .filter(f => f.endsWith('.sql') && f.startsWith('full_backup'))
            .sort()
            .reverse();

        if (files.length === 0) {
            log('  ⚠ No backup file found — skipping data import', 'yellow');
            log('  Schema is ready; run export-database-node.mjs first to create a backup', 'yellow');
        } else {
            const backupFile = files[0];
            log(`  Using: ${backupFile}`, 'yellow');

            const backupSql   = await fs.readFile(path.join(backupDir, backupFile), 'utf8');
            const backupStmts = splitStatements(backupSql).filter(s => {
                const t = s.trim().toUpperCase();
                return t.startsWith('INSERT') || t.startsWith('SET') || t.startsWith('ALTER');
            });

            await conn.query('SET FOREIGN_KEY_CHECKS = 0');

            let imported = 0;
            let errors   = 0;
            const BATCH  = 50;

            for (let i = 0; i < backupStmts.length; i += BATCH) {
                const chunk = backupStmts.slice(i, i + BATCH);
                const progress = Math.round(((i + BATCH) / backupStmts.length) * 100);
                process.stdout.write(`\r  Progress: ${Math.min(progress, 100)}% (${Math.min(i + BATCH, backupStmts.length)}/${backupStmts.length})`);

                for (const stmt of chunk) {
                    try {
                        await conn.query(stmt);
                        if (stmt.trim().toUpperCase().startsWith('INSERT')) imported++;
                    } catch (e) {
                        errors++;
                        if (errors <= 3) log(`\n  ⚠ ${e.message.substring(0, 120)}`, 'yellow');
                    }
                }
            }

            await conn.query('SET FOREIGN_KEY_CHECKS = 1');

            console.log('');
            log(`\n  Executed ${imported} INSERT statements (${errors} warnings)`, 'green');
        }

        // ── Verify ───────────────────────────────────────────────────
        step('Verification — Row counts');

        const checkTables = [
            'articles', 'categories', 'users', 'rss_feed_config',
            'rss_fetch_logs', 'rss_fetch_runs', 'rss_fetch_items',
            'trending_articles', 'article_views', 'ai_agent_logs',
        ];

        for (const t of checkTables) {
            try {
                const [r] = await conn.query(`SELECT COUNT(*) as n FROM \`${t}\``);
                log(`  ${t}: ${r[0].n} rows`, r[0].n > 0 ? 'green' : 'yellow');
            } catch {
                log(`  ${t}: table not found`, 'yellow');
            }
        }

        log('\n╔════════════════════════════════════════════════════════╗', 'green');
        log('║              ✅  Sync Complete!                       ║', 'green');
        log('╚════════════════════════════════════════════════════════╝\n', 'green');

    } finally {
        await conn.end();
    }
}

run().catch(e => {
    console.error('\n❌ Sync failed:', e.message);
    process.exit(1);
});
