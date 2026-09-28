/** Restore saved RSS articles to the admin-configured publisher feeds.
 * Usage: node scripts/restore-legacy-news.mjs [--apply --limit=1000]
 *        node scripts/restore-legacy-news.mjs --link-only [--apply]
 *        node scripts/restore-legacy-news.mjs --rollback=<run-id>
 * Dry run is the default. The script never calls AI or checks story geography.
 */
import nextEnv from '@next/env';
import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';

nextEnv.loadEnvConfig(process.cwd());

const apply = process.argv.includes('--apply');
const linkOnly = process.argv.includes('--link-only');
const rollbackRunId = process.argv.find(arg => arg.startsWith('--rollback='))?.split('=')[1];
const requestedLimit = Number(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1]);
const limit = Number.isSafeInteger(requestedLimit) && requestedLimit > 0 ? requestedLimit : Number.POSITIVE_INFINITY;
if (apply && !linkOnly && (!Number.isFinite(limit) || limit > 5000)) {
    throw new Error('Apply requires an explicit --limit from 1 to 5000 for a staged, auditable restore');
}
if (rollbackRunId && !/^[\da-f]{8}(?:-[\da-f]{4}){3}-[\da-f]{12}$/i.test(rollbackRunId)) {
    throw new Error('Rollback requires a valid restore run UUID');
}
const blocked = (process.env.BLOCKED_SOURCE_DOMAINS || '').split(',')
    .map(value => value.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean);

function hostFor(rawUrl) {
    try {
        const url = new URL(rawUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return null;
        if (url.port && !['80', '443'].includes(url.port)) return null;
        const host = url.hostname.toLowerCase().replace(/^www\./, '');
        if (['news.google.com', 'reuters.com', ...blocked].some(domain => host === domain || host.endsWith(`.${domain}`))) return null;
        return host;
    } catch { return null; }
}

function onDomain(host, domain) {
    return host === domain || host.endsWith(`.${domain}`);
}

function selectedFeed(article, feeds) {
    const host = hostFor(article.source_url);
    if (!host || !article.category) return null;
    const sameDomain = feeds.filter(feed => onDomain(host, feed.publisher_domain));
    if (!sameDomain.length) return null;
    // An exact category match is preferable when a publisher has many feeds.
    return sameDomain.sort((left, right) =>
        Number(right.category === article.category) - Number(left.category === article.category) ||
        right.publisher_domain.length - left.publisher_domain.length || left.id - right.id
    )[0];
}

async function linkRecentRuns(db) {
    const runClause = `i.run_id IN (SELECT run_id FROM (
        SELECT run_id FROM rss_fetch_runs WHERE completed_at IS NOT NULL
        ORDER BY completed_at DESC LIMIT 4
    ) recent_runs)`;
    if (!apply) {
        const [[row]] = await db.query(`SELECT COUNT(*) AS linkableItems FROM rss_fetch_items i
            JOIN public_articles a ON a.source_url = i.item_url
            JOIN rss_feed_config f ON f.id = i.feed_id AND f.publisher_domain = a.publisher_domain
            WHERE i.article_id IS NULL AND i.action = 'skipped' AND ${runClause}`);
        console.log(JSON.stringify(row));
        return;
    }
    const [result] = await db.query(`UPDATE rss_fetch_items i
        JOIN public_articles a ON a.source_url = i.item_url
        JOIN rss_feed_config f ON f.id = i.feed_id AND f.publisher_domain = a.publisher_domain
        SET i.article_id = a.id
        WHERE i.article_id IS NULL AND i.action = 'skipped' AND ${runClause}`);
    console.log(JSON.stringify({ linkedFetchItems: result.affectedRows }));
}

async function rollback(db, runId) {
    const [[before]] = await db.execute('SELECT COUNT(*) AS total FROM rss_restore_audit WHERE run_id = ? AND rolled_back_at IS NULL', [runId]);
    if (!before.total) throw new Error('No unrolled restore audit rows exist for this run');
    await db.beginTransaction();
    try {
        const [result] = await db.execute(`UPDATE articles a
            JOIN rss_restore_audit b ON b.article_id = a.id AND b.run_id = ?
            SET a.feed_id = b.old_feed_id, a.publisher_domain = b.old_publisher_domain,
                a.status = b.old_status
            WHERE b.rolled_back_at IS NULL AND a.feed_id = b.new_feed_id
              AND a.publisher_domain = b.new_publisher_domain AND a.status = b.new_status`, [runId]);
        if (result.affectedRows !== before.total) throw new Error('Some article fields changed after restoration; rollback was cancelled');
        const [marked] = await db.execute('UPDATE rss_restore_audit SET rolled_back_at = NOW() WHERE run_id = ? AND rolled_back_at IS NULL', [runId]);
        if (marked.affectedRows !== before.total) throw new Error('Rollback audit count differs from restored article count');
        await db.commit();
        console.log(JSON.stringify({ rolledBack: result.affectedRows, runId }));
    } catch (error) { await db.rollback(); throw error; }
}

async function main() {
    const db = await mysql.createConnection({
        host: process.env.DATABASE_HOST, port: Number(process.env.DATABASE_PORT || 3306),
        user: process.env.DATABASE_USER, password: process.env.DATABASE_PASSWORD,
        database: process.env.DATABASE_NAME, connectTimeout: 10_000,
    });
    try {
        if (rollbackRunId) { await rollback(db, rollbackRunId); return; }
        if (linkOnly) { await linkRecentRuns(db); return; }

        const runId = apply ? randomUUID() : null;
        if (runId) console.log(JSON.stringify({ restoreRunId: runId, stageLimit: limit }));

        const [configured] = await db.query(`SELECT id, category, feed_url, publisher_domain
            FROM rss_feed_config WHERE publisher_domain IS NOT NULL`);
        const feeds = configured.filter(feed => {
            const feedHost = hostFor(feed.feed_url);
            return feedHost && onDomain(feedHost, feed.publisher_domain);
        });
        const totals = { inspected: 0, matched: 0, restored: 0, skipped: 0 };
        let cursor = 0;
        while (totals.inspected < limit) {
            const remaining = Number.isFinite(limit) ? Math.min(1000, limit - totals.inspected) : 1000;
            const [articles] = await db.execute(
                `SELECT id, source_url, category, status, geo_status, feed_id, publisher_domain
                 FROM articles WHERE id > ? AND (feed_id IS NULL OR publisher_domain IS NULL
                   OR (status = 'archived' AND geo_status = 'excluded')
                   OR (status = 'draft' AND geo_status = 'pending' AND feed_id IS NOT NULL))
                 ORDER BY id LIMIT ?`, [cursor, remaining]
            );
            if (!articles.length) break;
            cursor = articles.at(-1).id;
            totals.inspected += articles.length;

            const byFeed = new Map();
            for (const article of articles) {
                const feed = selectedFeed(article, feeds);
                if (!feed) { totals.skipped++; continue; }
                totals.matched++;
                const group = byFeed.get(feed.id) || { feed, ids: [] };
                group.ids.push(article.id);
                byFeed.set(feed.id, group);
            }
            if (!apply) continue;

            for (const { feed, ids } of byFeed.values()) {
                for (let offset = 0; offset < ids.length; offset += 500) {
                    const chunk = ids.slice(offset, offset + 500);
                    await db.beginTransaction();
                    try {
                    const [audit] = await db.execute(
                        `INSERT INTO rss_restore_audit
                         (run_id, article_id, old_feed_id, old_publisher_domain, old_status,
                          new_feed_id, new_publisher_domain, new_status)
                         SELECT ?, id, feed_id, publisher_domain, status, ?, ?,
                           CASE WHEN (status = 'draft' AND geo_status = 'pending')
                                  OR (status = 'archived' AND geo_status = 'excluded')
                                THEN 'published' ELSE status END
                         FROM articles WHERE id IN (${chunk.map(() => '?').join(',')})`,
                        [runId, feed.id, feed.publisher_domain, ...chunk]
                    );
                    const [result] = await db.execute(
                        `UPDATE articles SET feed_id = ?, publisher_domain = ?,
                         status = CASE WHEN (status = 'draft' AND geo_status = 'pending')
                                       OR (status = 'archived' AND geo_status = 'excluded')
                                       THEN 'published' ELSE status END
                         WHERE id IN (${chunk.map(() => '?').join(',')})`,
                        [feed.id, feed.publisher_domain, ...chunk]
                    );
                    if (result.affectedRows !== audit.affectedRows) throw new Error('Restore count differs from audit count');
                    await db.commit();
                    totals.restored += result.affectedRows;
                    } catch (error) { await db.rollback(); throw error; }
                }
            }
            if (totals.inspected % 10000 < articles.length) console.log(JSON.stringify(totals));
        }
        const [[publicCount]] = await db.query('SELECT COUNT(*) AS total FROM public_articles');
        console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', runId, ...totals, publicArticles: publicCount.total }));
    } finally { await db.end(); }
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
