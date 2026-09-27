import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { digestConfigured, digestTopics, escapeHtml, sendDigestEmail, unsubscribeToken } from '@/lib/digest';
import { assertSourcePolicyConfigured, publisherUrl } from '@/lib/source-policy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Subscriber = { id: number; email: string; topics_json: string | string[] | null };
type DigestStory = { id: number; title: string; source_name: string; source_url: string; category: string };

export async function GET(request: NextRequest) {
    if (!process.env.CRON_SECRET || request.nextUrl.searchParams.get('secret') !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!digestConfigured()) return NextResponse.json({ error: 'Digest email is not configured' }, { status: 503 });
    assertSourcePolicyConfigured();

    const subscribers = await query<Subscriber[]>(
        `SELECT id, email, topics_json FROM newsletter_subscriptions
         WHERE verified_at IS NOT NULL AND unsubscribed_at IS NULL
           AND (last_sent_on IS NULL OR last_sent_on < CURDATE())
         ORDER BY id LIMIT 100`
    );
    const today = new Date().toISOString().slice(0, 10);
    const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://belgaum.today';
    let sent = 0;
    let failed = 0;

    for (const subscriber of subscribers) {
        try {
            const stored = typeof subscriber.topics_json === 'string'
                ? JSON.parse(subscriber.topics_json) : subscriber.topics_json;
            const topics = digestTopics(stored);
            if (topics.length === 0) continue;
            const stories = await query<DigestStory[]>(
                `SELECT id, title, source_name, source_url, category FROM articles
                 WHERE status = 'published' AND published_at >= NOW() - INTERVAL 24 HOUR
                   AND source_url NOT LIKE 'https://news.google.com/%'
                   AND category IN (${topics.map(() => '?').join(',')})
                 ORDER BY (category = 'belgaum') DESC, published_at DESC LIMIT 8`, topics
            );
            const eligible = stories.filter(story => publisherUrl(story.source_url));
            if (eligible.length === 0) continue;
            const unsubscribe = `${site}/api/digest/unsubscribe?id=${subscriber.id}&token=${unsubscribeToken(subscriber.id, subscriber.email)}`;
            const list = eligible.map(story =>
                `<li style="margin:0 0 14px"><a href="${escapeHtml(story.source_url)}">${escapeHtml(story.title)}</a><br><small>${escapeHtml(story.source_name)} · ${escapeHtml(story.category)}</small></li>`
            ).join('');
            const html = `<h1>Today's news from Belgaum Today</h1><ul>${list}</ul><p><a href="${escapeHtml(unsubscribe)}">Unsubscribe</a></p>`;
            await sendDigestEmail(subscriber.email, 'Your daily Belgaum Today news', html, `digest-${today}-${subscriber.id}`);
            await execute('UPDATE newsletter_subscriptions SET last_sent_on = CURDATE() WHERE id = ?', [subscriber.id]);
            sent++;
        } catch (error) {
            failed++;
            console.error('Digest send failed:', subscriber.id, error);
        }
    }
    return NextResponse.json({ success: true, considered: subscribers.length, sent, failed });
}
