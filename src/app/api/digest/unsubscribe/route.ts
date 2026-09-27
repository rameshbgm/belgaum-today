import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { validUnsubscribeToken } from '@/lib/digest';

export async function GET(request: NextRequest) {
    const id = Number(request.nextUrl.searchParams.get('id'));
    const token = request.nextUrl.searchParams.get('token') || '';
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://belgaum.today';
    if (!Number.isInteger(id) || id < 1) return NextResponse.redirect(`${site}/digest?status=invalid`);
    try {
        const rows = await query<Array<{ email: string }>>('SELECT email FROM newsletter_subscriptions WHERE id = ? LIMIT 1', [id]);
        if (!rows[0] || !validUnsubscribeToken(id, rows[0].email, token)) {
            return NextResponse.redirect(`${site}/digest?status=invalid`);
        }
        await execute('UPDATE newsletter_subscriptions SET unsubscribed_at = NOW() WHERE id = ?', [id]);
        return NextResponse.redirect(`${site}/digest?status=unsubscribed`);
    } catch {
        return NextResponse.redirect(`${site}/digest?status=error`);
    }
}
