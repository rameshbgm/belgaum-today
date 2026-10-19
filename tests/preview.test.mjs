import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import * as previewPolicy from '../src/lib/preview.ts';
import { previewRequestAction, assertPreviewQueryAllowed, assertPreviewWritable, ReadOnlyPreviewError, isReadOnlyPreview } from '../src/lib/preview.ts';

const require = createRequire(import.meta.url);
// Exercise the actual server entry points in memory. The supplied dependencies
// replace the database entirely; these tests cannot make network connections.
function loadServerModule(path, dependencies) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
    const loadedModule = { exports: {} };
    const isolatedRequire = name => {
        if (Object.hasOwn(dependencies, name)) return dependencies[name];
        throw new Error(`Unexpected dependency in isolated test: ${name}`);
    };
    new Function('require', 'module', 'exports', 'console', compiled.outputText)(isolatedRequire, loadedModule, loadedModule.exports, { ...console, log() {}, error() {} });
    return loadedModule.exports;
}

test('read-only preview must be explicitly enabled', () => {
    const previous = process.env.READ_ONLY_PREVIEW;
    try {
        delete process.env.READ_ONLY_PREVIEW;
        assert.equal(isReadOnlyPreview(), false);
        process.env.READ_ONLY_PREVIEW = 'true';
        assert.equal(isReadOnlyPreview(), false);
        process.env.READ_ONLY_PREVIEW = '1';
        assert.equal(isReadOnlyPreview(), true);
    } finally {
        if (previous === undefined) delete process.env.READ_ONLY_PREVIEW;
        else process.env.READ_ONLY_PREVIEW = previous;
    }
});

test('preview permits browsing and local auth cookies', () => {
    for (const path of ['/api/search', '/api/admin/articles', '/api/admin/feeds', '/api/admin/stats', '/api/admin/rss-logs']) {
        assert.equal(previewRequestAction(path, 'GET', true), 'allow');
    }
    for (const path of ['/api/auth/login', '/api/auth/logout']) assert.equal(previewRequestAction(path, 'POST', true), 'allow');
});

test('preview intercepts analytics without changing counters', () => {
    for (const type of ['view', 'source', 'visit']) assert.equal(previewRequestAction(`/api/track/${type}`, 'POST', true), 'tracking');
});

test('preview blocks writes and GET endpoints with side effects', () => {
    for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
        for (const path of ['/api/admin/articles', '/api/admin/feeds', '/api/articles/42', '/api/story/4/summary', '/api/admin/trending']) {
            assert.equal(previewRequestAction(path, method, true), 'block');
        }
    }
    for (const path of ['/api/cron/fetch-rss', '/api/cron/trending-analysis', '/api/cron/daily-digest', '/api/digest/verify', '/api/digest/unsubscribe']) {
        assert.equal(previewRequestAction(path, 'GET', true), 'block');
    }
});

test('database helpers fail closed before a write or transaction', () => {
    assert.throws(() => assertPreviewWritable(true), ReadOnlyPreviewError);
    for (const sql of ['INSERT INTO articles VALUES (?)', 'UPDATE articles SET view_count = 0', 'DELETE FROM articles', 'CREATE TABLE x (id INT)', 'WITH a AS (SELECT 1) DELETE FROM articles', 'SELECT 1; DELETE FROM articles', 'SELECT * FROM articles FOR UPDATE', "SELECT 'x' INTO OUTFILE '/tmp/x'", '/* read */ UPDATE articles SET status = ?']) {
        assert.throws(() => assertPreviewQueryAllowed(sql, true), ReadOnlyPreviewError);
    }
    for (const sql of ['SELECT 1', ' SELECT * FROM public_articles WHERE category = ? ', '/* read */ SELECT COUNT(*) FROM articles;', 'SELECT id FROM articles WHERE title LIKE ?']) assert.doesNotThrow(() => assertPreviewQueryAllowed(sql, true));
});

test('normal application operations remain available when preview is off', () => {
    assert.doesNotThrow(() => assertPreviewWritable(false));
    assert.doesNotThrow(() => assertPreviewQueryAllowed('UPDATE articles SET view_count = 1', false));
    assert.equal(previewRequestAction('/api/cron/fetch-rss', 'GET', false), 'allow');
    assert.equal(previewRequestAction('/api/admin/articles', 'DELETE', false), 'allow');
});

test('actual request proxy returns no-op analytics and rejects mutation routes without invoking handlers', async () => {
    const server = require('next/server');
    const { proxy } = loadServerModule('../src/proxy.ts', { 'next/server': server, './lib/preview': previewPolicy });
    const previous = process.env.READ_ONLY_PREVIEW;
    process.env.READ_ONLY_PREVIEW = '1';
    try {
        for (const [path, method] of [
            ['/api/admin/articles/123', 'DELETE'], ['/api/articles/123', 'PUT'], ['/api/admin/feeds', 'POST'],
            ['/api/cron/fetch-rss', 'GET'], ['/api/cron/trending-analysis', 'GET'], ['/api/cron/daily-digest', 'GET'],
            ['/api/digest/verify', 'GET'], ['/api/digest/unsubscribe', 'GET'], ['/api/story/123/summary', 'POST'],
        ]) {
            const response = proxy(new server.NextRequest(`http://localhost:3001${path}`, { method }));
            assert.equal(response.status, 403, `${method} ${path}`);
            assert.equal((await response.json()).success, false);
        }
        for (const kind of ['view', 'visit', 'source']) {
            const response = proxy(new server.NextRequest(`http://localhost:3001/api/track/${kind}`, { method: 'POST' }));
            assert.equal(response.status, 200);
            assert.deepEqual(await response.json(), { success: true, counted: false });
        }
        for (const path of ['/api/auth/login', '/api/auth/logout']) {
            const response = proxy(new server.NextRequest(`http://localhost:3001${path}`, { method: 'POST' }));
            assert.equal(response.headers.get('x-middleware-next'), '1');
        }
        const read = proxy(new server.NextRequest('http://localhost:3001/api/search?q=India'));
        assert.equal(read.headers.get('x-middleware-next'), '1');
    } finally {
        if (previous === undefined) delete process.env.READ_ONLY_PREVIEW;
        else process.env.READ_ONLY_PREVIEW = previous;
    }
});

test('actual database helpers reject every mutation before touching the database driver', async () => {
    let driverCalls = 0;
    const mysql = { createPool: () => ({ execute: async () => { driverCalls++; return [[{ connected: 1 }]]; }, getConnection: async () => { throw new Error('Transactions must never open in preview'); } }) };
    const database = loadServerModule('../src/lib/db.ts', { 'mysql2/promise': mysql, './preview': previewPolicy });
    const previous = process.env.READ_ONLY_PREVIEW;
    process.env.READ_ONLY_PREVIEW = '1';
    try {
        await assert.rejects(database.insert('INSERT INTO articles VALUES (?)', [1]), ReadOnlyPreviewError);
        await assert.rejects(database.execute('UPDATE articles SET title = ?', ['Changed']), ReadOnlyPreviewError);
        await assert.rejects(database.query('DELETE FROM articles'), ReadOnlyPreviewError);
        await assert.rejects(database.transaction(async () => { throw new Error('Callback must never execute'); }), ReadOnlyPreviewError);
        assert.equal(driverCalls, 0);
        assert.deepEqual(await database.query('SELECT 1 AS connected'), [{ connected: 1 }]);
        assert.equal(driverCalls, 1);
    } finally {
        if (previous === undefined) delete process.env.READ_ONLY_PREVIEW;
        else process.env.READ_ONLY_PREVIEW = previous;
    }
});

test('normal view tracking increments the count and event together using an isolated transaction', async () => {
    const server = require('next/server');
    let count = 7;
    let events = 0;
    let transactions = 0;
    const connection = { execute: async (sql, params) => {
        if (sql.includes('UPDATE articles')) { if (params[0] !== 42) return [{ affectedRows: 0 }]; count++; return [{ affectedRows: 1 }]; }
        if (sql.includes('INSERT INTO article_views')) { events++; return [{ insertId: events }]; }
        if (sql.includes('SELECT view_count')) return [[{ view_count: count }]];
        throw new Error('Unexpected statement');
    } };
    const route = loadServerModule('../src/app/api/track/view/route.ts', {
        'next/server': server,
        '@/lib/db': { transaction: async callback => { transactions++; return callback(connection); } },
        '@/lib/withLogging': { withLogging: handler => handler },
    });
    const response = await route.POST(new server.NextRequest('http://localhost/api/track/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articleId: 42 }) }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { success: true, counted: true, viewCount: 8 });
    assert.equal(events, 1);
    assert.equal(transactions, 1);
    const invalid = await route.POST(new server.NextRequest('http://localhost/api/track/view', { method: 'POST', body: JSON.stringify({ articleId: -1 }) }));
    assert.equal(invalid.status, 400);
    assert.equal(transactions, 1);
    const missing = await route.POST(new server.NextRequest('http://localhost/api/track/view', { method: 'POST', body: JSON.stringify({ articleId: 99 }) }));
    assert.equal(missing.status, 404);
    assert.equal(events, 1);
    assert.equal(count, 8);
});

test('archive pagination and global search work after retiring category topic filters', () => {
    const types = loadServerModule('../src/types/index.ts', {});
    const archive = loadServerModule('../src/lib/archive-search.ts', { '@/types': types });
    const plain = archive.buildArchiveQuery(new URLSearchParams('category=india&page=2'));
    const retired = archive.buildArchiveQuery(new URLSearchParams('category=india&page=2&subcategory=politics'));
    assert.deepEqual(retired, plain);
    assert.deepEqual(plain.params, ['india']);
    assert.ok(plain.sql.includes('OFFSET 20'));
    const searched = archive.buildArchiveQuery(new URLSearchParams('q=50%25&category=business&sortBy=views'));
    assert.deepEqual(searched.params, ['50%', 'business']);
    assert.ok(searched.sql.includes('LOCATE'));
    assert.ok(searched.sql.includes('view_count DESC'));
});

test('stale connections retry a read once, without ever retrying a write', async () => {
    let attempts = 0;
    const mysql = { createPool: () => ({ execute: async () => {
        attempts++;
        if (attempts % 2) throw Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' });
        return [[{ connected: 1 }]];
    } }) };
    const database = loadServerModule('../src/lib/db.ts', { 'mysql2/promise': mysql, './preview': previewPolicy });
    const previous = process.env.READ_ONLY_PREVIEW;
    process.env.READ_ONLY_PREVIEW = '0';
    try {
        assert.deepEqual(await database.query('SELECT 1'), [{ connected: 1 }]);
        assert.equal(attempts, 2);
        await assert.rejects(database.query('INSERT INTO articles VALUES (?)', [1]), /ECONNRESET/);
        assert.equal(attempts, 3);
    } finally {
        if (previous === undefined) delete process.env.READ_ONLY_PREVIEW;
        else process.env.READ_ONLY_PREVIEW = previous;
    }
});
