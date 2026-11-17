import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
import { createElement } from 'react';
import * as jsxRuntime from 'react/jsx-runtime';
import { renderToStaticMarkup } from 'react-dom/server';

function load(path, dependencies = {}) {
    const source = readFileSync(new URL(path, import.meta.url), 'utf8');
    const code = ts.transpileModule(source, { fileName: path, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const loadedModule = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => {
        if (!(name in dependencies)) throw new Error(`Unmocked dependency: ${name}`);
        return dependencies[name];
    }, loadedModule, loadedModule.exports);
    return loadedModule.exports;
}
const helpers = load('../src/lib/briefing-content.ts');
const sources = Array.from({ length: 5 }, (_, index) => ({ id: index + 1, title: `India report ${index + 1}`, excerpt: 'A publisher excerpt with reporting to summarize.', source_name: 'Example Publisher', source_url: `https://example.com/report-${index + 1}`, featured_image: null, published_at: '2026-11-18T00:00:00Z' }));
const draft = { introduction: 'Five developments across India, drawn from the linked publisher reports.', stories: sources.map(source => ({ articleId: source.id, summary: 'The publisher reports a development in India. This summary retains the information available at the time of publication.' })) };

test('publication day follows India midnight and rejects impossible URL dates', () => {
    assert.equal(helpers.indiaDate(new Date('2026-11-17T18:29:59Z')), '2026-11-17');
    assert.equal(helpers.indiaDate(new Date('2026-11-17T18:30:00Z')), '2026-11-18');
    for (const date of ['2026-02-30', '2026-13-01', '../admin', '2026-2-01']) assert.equal(helpers.validBriefingDate(date), false);
    assert.equal(helpers.validBriefingDate('2028-02-29'), true);
});

test('source links are preserved from trusted inputs and AI cannot reorder rankings', () => {
    const result = helpers.assembleBriefing('2026-11-18', { ...draft, stories: [...draft.stories].reverse() }, sources);
    assert.deepEqual(result.stories.map(story => story.source.id), [1, 2, 3, 4, 5]);
    assert.equal(result.stories[0].source.source_url, 'https://example.com/report-1');
});

test('rejects invented citations, duplicates, incomplete editions and unsafe publisher links', () => {
    for (const stories of [draft.stories.slice(0, 4), [...draft.stories.slice(0, 4), { ...draft.stories[4], articleId: 999 }], [...draft.stories.slice(0, 4), draft.stories[0]]]) {
        assert.throws(() => helpers.assembleBriefing('2026-11-18', { ...draft, stories }, sources));
    }
    assert.throws(() => helpers.assembleBriefing('2026-11-18', draft, [{ ...sources[0], source_url: 'javascript:alert(1)' }, ...sources.slice(1)]));
});

function publisher({ existing = false, reports = sources, fail = false, duplicate = false } = {}) {
    const calls = { ai: 0, writes: [] };
    const service = load('../src/lib/scheduler/daily-briefing.ts', {
        '@/lib/db': { query: async sql => sql.includes('WHERE slug') ? (existing ? [{ id: 50 }] : []) : reports, insert: async (...args) => { calls.writes.push(args); if (duplicate) throw Object.assign(new Error('Concurrent insert'), { code: 'ER_DUP_ENTRY' }); return 1; } },
        '@/lib/ai/luna': { callLunaJson: async () => { calls.ai++; if (fail) throw new Error('AI unavailable'); return draft; } },
        '@/lib/briefing-content': helpers,
        '@/lib/daily-briefings': { briefingSlug: date => `india-daily-briefing-${date}` },
        '@/lib/story-clusters': { distinctStories: rows => rows },
        '@/lib/utils': { stripHtml: text => text, calculateReadingTime: () => 2 },
        '@/lib/site-url': { SITE_URL: 'https://belgaum.today' },
        '@/lib/fileLogger': { fileLogger: { info() {} } },
    });
    return { ...service, calls };
}

test('existing or insufficient editions cause no AI call and no database write', async () => {
    for (const options of [{ existing: true }, { reports: sources.slice(0, 4) }]) {
        const service = publisher(options);
        assert.equal(await service.publishDailyBriefing(), false);
        assert.equal(service.calls.ai, 0);
        assert.equal(service.calls.writes.length, 0);
    }
});

test('successful generation persists a dated source snapshot and an AI failure persists nothing', async () => {
    const now = new Date('2026-11-18T01:00:00Z');
    const service = publisher();
    assert.equal(await service.publishDailyBriefing(now), true);
    const [, params] = service.calls.writes[0];
    assert.equal(params[1], 'india-daily-briefing-2026-11-18');
    assert.equal(JSON.parse(params[3]).stories.length, 5);
    assert.equal(params[6], 'https://belgaum.today/briefing/2026-11-18');
    const failed = publisher({ fail: true });
    await assert.rejects(failed.publishDailyBriefing(now), /AI unavailable/);
    assert.equal(failed.calls.writes.length, 0);
    assert.equal(await publisher({ duplicate: true }).publishDailyBriefing(now), false);
});

test('published briefing has an indexable canonical page with visible sources and matching structured data', async () => {
    const content = helpers.assembleBriefing('2026-11-18', draft, sources);
    const row = { title: 'India daily briefing: 18 November 2026', slug: 'india-daily-briefing-2026-11-18', excerpt: content.introduction, content: JSON.stringify(content), featured_image: null, published_at: new Date('2026-11-18T01:00:00Z'), updated_at: new Date('2026-11-18T01:00:00Z') };
    const storage = load('../src/lib/daily-briefings.ts', { '@/lib/db': { query: async () => [row] }, './briefing-content': helpers });
    const page = load('../src/app/briefing/[date]/page.tsx', {
        'react/jsx-runtime': jsxRuntime,
        'next/link': { default: ({ children, ...props }) => createElement('a', props, children) },
        'next/navigation': { notFound() { throw new Error('404'); } },
        '@/lib/daily-briefings': storage,
        '@/lib/briefing-content': helpers,
        '@/components/articles/NewsPhoto': { NewsPhoto: () => null },
        '@/components/articles/PublisherLink': { PublisherLink: ({ article, children }) => createElement('a', { href: article.source_url }, children) },
        '@/lib/seo': { safeJsonLd: JSON.stringify },
        '@/lib/site-url': { SITE_URL: 'https://belgaum.today' },
        '../daily-briefing.css': {},
    });
    const props = { params: Promise.resolve({ date: '2026-11-18' }) };
    const meta = await page.generateMetadata(props);
    assert.equal(meta.robots.index, true);
    assert.equal(meta.alternates.canonical, '/briefing/2026-11-18');
    const html = renderToStaticMarkup(await page.default(props));
    const structured = JSON.parse(html.match(/<script[^>]*>(.*?)<\/script>/)[1]);
    assert.equal(structured.datePublished, row.published_at.toISOString());
    assert.equal(structured.citation.length, 5);
    assert.match(html, /not been independently verified/);
    for (const source of sources) assert.ok(html.includes(`href="${source.source_url}"`));
    const sitemap = load('../src/app/sitemap.ts', {
        '@/lib/db': { query: async () => [] }, '@/types': { TOP_LEVEL_CATEGORIES: ['india'] },
        '@/lib/site-url': { SITE_URL: 'https://belgaum.today' }, '@/lib/features': { AI_NEWS_ENABLED: false },
        '@/lib/daily-briefings': storage,
    });
    const urls = await sitemap.default();
    assert.ok(urls.some(entry => entry.url === 'https://belgaum.today/briefing/2026-11-18'));
    assert.ok(urls.some(entry => entry.url === 'https://belgaum.today/briefing/archive'));
});
