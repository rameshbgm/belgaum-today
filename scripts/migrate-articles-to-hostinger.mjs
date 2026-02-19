/**
 * Migrate articles from local Docker DB → Hostinger DB
 * - Reads all articles from local MySQL (127.0.0.1:3307)
 * - Upserts into Hostinger MySQL (srv873.hstgr.io:3306)
 * - Skips duplicates based on slug (safe to re-run)
 */

import mysql from 'mysql2/promise';

const LOCAL = {
    host: '127.0.0.1',
    port: 3307,
    user: 'belgaum_user',
    password: 'belgaum_pass',
    database: 'belgaum_today',
    connectTimeout: 10000,
};

const HOSTINGER = {
    host: 'srv873.hstgr.io',
    port: 3306,
    user: 'u915919430_belgaum_user',
    password: '&PN/^Q4:mD',
    database: 'u915919430_belgaum_today',
    connectTimeout: 30000,
};

const C = { reset:'\x1b[0m', red:'\x1b[31m', green:'\x1b[32m', yellow:'\x1b[33m', blue:'\x1b[34m', bold:'\x1b[1m' };
const log  = (m, c='reset') => console.log(`${C[c]}${m}${C.reset}`);
const step = (m)            => console.log(`\n${C.bold}${C.blue}${m}${C.reset}`);

async function run() {
    log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
    log('║  Migrate Articles: Local Docker → Hostinger               ║', 'blue');
    log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

    // ── Connect to both databases ────────────────────────────────────
    step('Connecting to databases...');
    const local      = await mysql.createConnection(LOCAL);
    const hostinger  = await mysql.createConnection(HOSTINGER);
    log('  ✅ Local Docker DB connected    (127.0.0.1:3307)', 'green');
    log('  ✅ Hostinger DB connected       (srv873.hstgr.io:3306)', 'green');

    try {
        // ── Fetch all articles from local ────────────────────────────
        step('Step 1/3 — Fetching articles from local Docker DB');
        const [articles] = await local.query('SELECT * FROM articles ORDER BY id ASC');
        log(`  Found ${articles.length} articles locally`, 'yellow');

        // ── Get existing slugs on Hostinger (to skip duplicates) ─────
        step('Step 2/3 — Checking existing articles on Hostinger');
        const [existing] = await hostinger.query('SELECT slug FROM articles');
        const existingSlugs = new Set(existing.map(r => r.slug));
        log(`  Hostinger already has ${existingSlugs.size} articles`, 'yellow');

        const toInsert = articles.filter(a => !existingSlugs.has(a.slug));
        const toSkip   = articles.length - toInsert.length;
        log(`  Will insert: ${toInsert.length} new articles`, 'green');
        log(`  Will skip:   ${toSkip} duplicates (already exist by slug)`, 'yellow');

        if (toInsert.length === 0) {
            log('\n  ✅ Nothing to insert — Hostinger is already up to date!', 'green');
            return;
        }

        // ── Insert in batches ────────────────────────────────────────
        step('Step 3/3 — Inserting articles into Hostinger');

        // Get column names from first article (excluding auto-increment id)
        const columns = Object.keys(toInsert[0]).filter(c => c !== 'id');
        const colList = columns.map(c => `\`${c}\``).join(', ');
        const placeholders = columns.map(() => '?').join(', ');

        const BATCH_SIZE = 50;
        let inserted = 0;
        let errors   = 0;

        await hostinger.query('SET FOREIGN_KEY_CHECKS = 0');

        for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
            const batch = toInsert.slice(i, i + BATCH_SIZE);
            const pct   = Math.min(100, Math.round(((i + batch.length) / toInsert.length) * 100));
            process.stdout.write(`\r  Progress: ${pct}% (${Math.min(i + BATCH_SIZE, toInsert.length)}/${toInsert.length})`);

            for (const article of batch) {
                try {
                    const values = columns.map(c => {
                        const v = article[c];
                        // Convert Date objects to MySQL datetime strings
                        if (v instanceof Date) return v.toISOString().slice(0, 19).replace('T', ' ');
                        return v;
                    });
                    await hostinger.query(
                        `INSERT INTO articles (${colList}) VALUES (${placeholders})`,
                        values
                    );
                    inserted++;
                } catch (e) {
                    errors++;
                    if (errors <= 5) log(`\n  ⚠ Row error (slug=${article.slug}): ${e.message.substring(0, 100)}`, 'yellow');
                }
            }
        }

        await hostinger.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log(''); // newline after progress

        // ── Summary ──────────────────────────────────────────────────
        const [[{ total }]] = await hostinger.query('SELECT COUNT(*) total FROM articles');
        const [[{ newest }]] = await hostinger.query("SELECT MAX(COALESCE(published_at, created_at)) newest FROM articles");

        log('\n📊 Migration Results:', 'bold');
        log(`  Inserted:  ${inserted} new articles`, 'green');
        log(`  Skipped:   ${toSkip} duplicates`, 'yellow');
        if (errors > 0) log(`  Errors:    ${errors}`, 'red');
        log(`  Total on Hostinger now: ${total}`, 'green');
        log(`  Most recent article:    ${newest}`, 'green');

        log('\n╔════════════════════════════════════════════════════════════╗', 'green');
        log('║              ✅  Migration Complete!                      ║', 'green');
        log('╚════════════════════════════════════════════════════════════╝\n', 'green');

    } finally {
        await local.end();
        await hostinger.end();
    }
}

run().catch(e => {
    console.error('\n❌ Migration failed:', e.message);
    process.exit(1);
});
