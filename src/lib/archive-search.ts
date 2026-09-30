import { CATEGORY_META, type Article, type Category } from '@/types';
import { getSubCategories } from '@/lib/category-filters';

export interface ArchivePage {
    items: Article[];
    page: number;
    hasMore: boolean;
}

export class InvalidSearch extends Error {}

/** Search all published reports, with the same filters on every page. */
export function buildArchiveQuery(search: URLSearchParams) {
    const q = (search.get('q') || '').trim();
    const category = search.get('category') || '';
    const subcategory = search.get('subcategory') || 'all';
    const sort = search.get('sortBy') || 'newest';
    const page = Number(search.get('page') || 1);
    const limit = Number(search.get('limit') || 20);
    if (!Number.isSafeInteger(page) || page < 1 || page > 100000 ||
        !Number.isSafeInteger(limit) || limit < 1 || limit > 50) {
        throw new InvalidSearch('Choose a valid results page.');
    }
    if (q.length > 200) throw new InvalidSearch('Use 200 characters or fewer in your search.');
    if (category && !Object.hasOwn(CATEGORY_META, category)) throw new InvalidSearch('Choose a valid category.');
    if (!['newest', 'views', 'relevant'].includes(sort)) throw new InvalidSearch('Choose a valid sort order.');
    if (subcategory !== 'all' && (!category || !getSubCategories(category as Category).some(sub => sub.id === subcategory))) {
        throw new InvalidSearch('Choose a valid topic within this category.');
    }
    let sql = `SELECT * FROM public_articles WHERE status = 'published'
        AND source_url NOT LIKE 'https://news.google.com/%'`;
    const params: unknown[] = [];
    // LOCATE treats %, _, and short names literally, unlike LIKE/full-text stopwords.
    const match = `(LOCATE(LOWER(?), LOWER(CONCAT_WS(' ', title, excerpt, content, source_name))) > 0)`;
    if (q) { sql += ` AND ${match}`; params.push(q); }
    if (category) { sql += ' AND category = ?'; params.push(category); }
    if (subcategory !== 'all') { sql += ` AND ${match}`; params.push(subcategory); }
    const start = search.get('startDate');
    const end = search.get('endDate');
    for (const date of [start, end]) {
        if (date && (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) {
            throw new InvalidSearch('Enter a valid date.');
        }
    }
    if (start && end && start > end) throw new InvalidSearch('From date must be on or before To date.');
    if (start) { sql += ' AND DATE(COALESCE(published_at, created_at)) >= ?'; params.push(start); }
    if (end) { sql += ' AND DATE(COALESCE(published_at, created_at)) <= ?'; params.push(end); }
    if (sort === 'views') sql += ' ORDER BY view_count DESC,';
    else if (sort === 'relevant' && q) {
        sql += ' ORDER BY (LOCATE(LOWER(?), LOWER(title)) > 0) DESC,';
        params.push(q);
    } else sql += ' ORDER BY';
    sql += ` COALESCE(published_at, created_at) DESC, id DESC LIMIT ${limit + 1} OFFSET ${(page - 1) * limit}`;
    return { sql, params, page, limit };
}

export async function searchArchive(search: URLSearchParams, runQuery: (sql: string, params: unknown[]) => Promise<Article[]>): Promise<ArchivePage> {
    const { sql, params, page, limit } = buildArchiveQuery(search);
    const rows = await runQuery(sql, params);
    return { items: rows.slice(0, limit), page, hasMore: rows.length > limit };
}
