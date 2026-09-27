import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';
import { TOP_LEVEL_CATEGORIES } from '@/types';

const COOKIE_NAME = 'bt_reader';

export async function POST(request: NextRequest) {
    const body = await request.json().catch(() => ({}));
    const section = String(body.section || '');
    if (!TOP_LEVEL_CATEGORIES.includes(section as typeof TOP_LEVEL_CATEGORIES[number])) {
        return NextResponse.json({ success: false, error: 'Invalid section' }, { status: 400 });
    }

    let readerId = request.cookies.get(COOKIE_NAME)?.value;
    if (!readerId || !/^[0-9a-f-]{36}$/i.test(readerId)) readerId = randomUUID();
    try {
        await execute(
            `INSERT IGNORE INTO reader_visits (reader_id, section, visit_day) VALUES (?, ?, CURDATE())`,
            [readerId, section]
        );
        const response = NextResponse.json({ success: true });
        response.cookies.set(COOKIE_NAME, readerId, {
            httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 365, path: '/',
        });
        return response;
    } catch {
        return NextResponse.json({ success: false, error: 'Tracking unavailable' }, { status: 503 });
    }
}
