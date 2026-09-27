import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { execute } from '@/lib/db';

export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get('token') || '';
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://belgaum.today';
    if (!/^[a-f0-9]{64}$/i.test(token)) {
        return NextResponse.redirect(`${site}/digest?status=invalid`);
    }
    const hash = createHash('sha256').update(token).digest('hex');
    try {
        const affected = await execute(
            `UPDATE newsletter_subscriptions SET verified_at = NOW(), verification_token_hash = NULL,
             unsubscribed_at = NULL WHERE verification_token_hash = ?`, [hash]
        );
        return NextResponse.redirect(`${site}/digest?status=${affected ? 'verified' : 'invalid'}`);
    } catch {
        return NextResponse.redirect(`${site}/digest?status=error`);
    }
}
