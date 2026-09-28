import { NextRequest, NextResponse } from 'next/server';
import { query, execute } from '@/lib/db';
import { digestConfigured, digestTopics, escapeHtml, sendDigestEmail, unsubscribeToken } from '@/lib/digest';
import { assertSourcePolicyConfigured, publisherUrl } from '@/lib/source-policy';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Subscriber = { id: number; email: string; topics_json: string | string[] | null };
type DigestStory = { id: number; title: string; source_name: string; source_url: string; category: string };
type DigestEvent = { id: number; title: string; category: string; report_count: number; latest_change: string | null };

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
                `SELECT id, title, source_name, source_url, category FROM public_articles
                 WHERE status = 'published' AND published_at >= NOW() - INTERVAL 24 HOUR
                   AND source_url NOT LIKE 'https://news.google.com/%'
                   AND category IN (${topics.map(() => '?').join(',')})
                 ORDER BY (category = 'belgaum') DESC, published_at DESC LIMIT 8`, topics
            );
            const eligible = stories.filter(story => publisherUrl(story.source_url));
            const events = await query<DigestEvent[]>(
                `SELECT e.id, e.title, e.category, COUNT(a.id) AS report_count,
                  (SELECT u.change_text FROM story_event_updates u JOIN public_articles pa ON pa.id = u.article_id
                   WHERE u.story_event_id = e.id AND u.change_text IS NOT NULL ORDER BY u.created_at DESC, u.id DESC LIMIT 1) AS latest_change
                 FROM ai_suggested_stories pick
                 JOIN story_events e ON e.id = pick.story_event_id
                 JOIN story_event_summaries summary ON summary.story_event_id = e.id
                 JOIN public_articles a ON a.story_event_id = e.id
                 WHERE e.last_updated_at >= NOW() - INTERVAL 24 HOUR AND e.category IN (${topics.map(() => '?').join(',')})
                   AND summary.source_updated_at >= e.last_updated_at
                 GROUP BY e.id, e.title, e.category ORDER BY MAX(a.published_at) DESC LIMIT 4`, topics
            );
            if (eligible.length === 0 && events.length === 0) continue;
            const unsubscribe = `${site}/api/digest/unsubscribe?id=${subscriber.id}&token=${unsubscribeToken(subscriber.id, subscriber.email)}`;
            const list = eligible.map(story =>
                `<li style="margin:0 0 14px"><a href="${escapeHtml(story.source_url)}">${escapeHtml(story.title)}</a><br><small>${escapeHtml(story.source_name)} · ${escapeHtml(story.category)}</small></li>`
            ).join('');
            const eventList = events.map(event => `<li style="margin:0 0 14px"><a href="${escapeHtml(`${site}/story/${event.id}`)}">${escapeHtml(event.title)}</a><br><small>${event.report_count} publisher reports · ${escapeHtml(event.category)}</small>${event.latest_change ? `<br>${escapeHtml(event.latest_change)}` : ''}</li>`).join('');
            const html = `<h1>Today's news from Belgaum Today</h1>${eventList ? `<h2>Story Tracker</h2><ul>${eventList}</ul>` : ''}${list ? `<h2>Latest reports</h2><ul>${list}</ul>` : ''}<p><a href="${escapeHtml(unsubscribe)}">Unsubscribe</a></p>`;
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
