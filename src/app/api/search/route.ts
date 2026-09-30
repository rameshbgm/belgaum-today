import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Article } from '@/types';
import { withLogging } from '@/lib/withLogging';
import { InvalidSearch, searchArchive } from '@/lib/archive-search';

// GET /api/search - Full-text search
export const GET = withLogging(async (request: NextRequest) => {
    try {
        const result = await searchArchive(request.nextUrl.searchParams, (sql, params) => query<Article[]>(sql, params));
        return NextResponse.json({ success: true, data: result.items, pagination: { page: result.page, hasMore: result.hasMore } });
    } catch (error) {
        if (error instanceof InvalidSearch) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
        console.error('Search error:', error instanceof Error ? error.message : error);
        return NextResponse.json({ success: false, error: 'Couldn’t load results. Please retry.' }, { status: 503 });
    }
});
