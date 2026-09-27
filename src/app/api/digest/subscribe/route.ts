import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { isValidEmail } from '@/lib/utils';
import { digestConfigured, digestTopics, escapeHtml, sendDigestEmail } from '@/lib/digest';

export async function POST(request: NextRequest) {
    if (!digestConfigured()) {
        return NextResponse.json({ success: false, error: 'Daily digest subscriptions are not available yet' }, { status: 503 });
    }
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim().toLowerCase();
    const topics = digestTopics(body.topics);
    if (!isValidEmail(email) || topics.length === 0) {
        return NextResponse.json({ success: false, error: 'Enter a valid email and choose at least one topic' }, { status: 400 });
    }

    try {
        const existing = await query<Array<{ subscribed_at: Date; verified_at: Date | null; unsubscribed_at: Date | null }>>(
            'SELECT subscribed_at, verified_at, unsubscribed_at FROM newsletter_subscriptions WHERE email = ? LIMIT 1', [email]
        );
        if (existing[0]?.verified_at && !existing[0]?.unsubscribed_at) {
            // Knowing an address is not proof of ownership. Keep existing preferences intact.
            return NextResponse.json({ success: true, message: 'If this address is already subscribed, its current preferences remain active.' });
        }
        if (existing[0] && Date.now() - new Date(existing[0].subscribed_at).getTime() < 10 * 60_000) {
            return NextResponse.json({ success: true, message: 'Check your email for a confirmation link.' });
        }

        const token = randomBytes(32).toString('hex');
        const hash = createHash('sha256').update(token).digest('hex');
        await execute(
            `INSERT INTO newsletter_subscriptions (email, topics_json, verification_token_hash, subscribed_at, verified_at, unsubscribed_at)
             VALUES (?, ?, ?, NOW(), NULL, NULL)
             ON DUPLICATE KEY UPDATE topics_json = VALUES(topics_json), verification_token_hash = VALUES(verification_token_hash),
                                     subscribed_at = NOW(), verified_at = NULL, unsubscribed_at = NULL`,
            [email, JSON.stringify(topics), hash]
        );
        const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://belgaum.today';
        const verify = `${site}/api/digest/verify?token=${token}`;
        await sendDigestEmail(email, 'Confirm your Belgaum Today digest',
            `<p>Confirm your daily news digest subscription:</p><p><a href="${escapeHtml(verify)}">Confirm subscription</a></p><p>If you did not request this, ignore this email.</p>`);
        return NextResponse.json({ success: true, message: 'Check your email for a confirmation link.' });
    } catch (error) {
        console.error('Digest subscription error:', error);
        return NextResponse.json({ success: false, error: 'Could not save your subscription. Try again later.' }, { status: 500 });
    }
}
