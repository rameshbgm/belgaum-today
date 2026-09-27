import mysql from 'mysql2/promise';

const apply = process.argv.includes('--apply');
const blockedDomains = (process.env.BLOCKED_SOURCE_DOMAINS || '')
    .split(',').map(value => value.trim().toLowerCase().replace(/^www\./, '')).filter(Boolean);

if (blockedDomains.length === 0) {
    throw new Error('BLOCKED_SOURCE_DOMAINS is required for the public source sweep');
}

const connection = await mysql.createConnection({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT || 3306),
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE_NAME,
});

const reasons = { blocked: 0, wrapped: 0, language: 0 };
let lastId = 0;
try {
    while (true) {
        const [rows] = await connection.query(
            `SELECT id, source_url, source_name, title FROM articles
             WHERE status = 'published' AND id > ? ORDER BY id LIMIT 1000`, [lastId]
        );
        if (rows.length === 0) break;
        lastId = rows.at(-1).id;

        const archive = [];
        for (const row of rows) {
            let host = '';
            try { host = new URL(row.source_url).hostname.toLowerCase().replace(/^www\./, ''); } catch { /* invalid URL */ }
            const name = `${row.source_name} ${row.title}`.toLowerCase().replace(/[^a-z0-9]/g, '');
            const blocked = blockedDomains.some(domain => {
                const brand = domain.split('.')[0].replace(/[^a-z0-9]/g, '');
                return host === domain || host.endsWith(`.${domain}`) || name.includes(brand);
            });
            const wrapped = host === 'news.google.com';
            const language = /[\u0c80-\u0cff\u0900-\u097f\u0b80-\u0bff\u0c00-\u0c7f]/u.test(row.title);
            if (blocked || wrapped || language) {
                reasons[blocked ? 'blocked' : wrapped ? 'wrapped' : 'language']++;
                archive.push(row.id);
            }
        }

        if (apply && archive.length > 0) {
            await connection.query(
                `UPDATE articles SET status = 'archived' WHERE id IN (${archive.map(() => '?').join(',')})`,
                archive
            );
        }
    }
    console.log(JSON.stringify({ mode: apply ? 'applied' : 'dry-run', reasons, total: Object.values(reasons).reduce((a, b) => a + b, 0) }));
} finally {
    await connection.end();
}
