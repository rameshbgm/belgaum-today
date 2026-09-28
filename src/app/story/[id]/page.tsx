import Link from 'next/link';
import { notFound } from 'next/navigation';
import { query } from '@/lib/db';
import { StorySinceVisit } from '@/components/story/StorySinceVisit';

export const dynamic = 'force-dynamic';

type Event = { id: number; title: string; category: string; first_seen_at: Date; last_updated_at: Date };
type Update = { id: number; change_text: string | null; created_at: Date; title: string; source_name: string; source_url: string; published_at: Date | null };

export default async function StoryPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id < 1) notFound();
  const [event] = await query<Event[]>('SELECT * FROM story_events WHERE id = ? LIMIT 1', [id]);
  if (!event) notFound();
  const updates = await query<Update[]>(
    `SELECT u.id, u.change_text, u.created_at, a.title, a.source_name, a.source_url, a.published_at
     FROM story_event_updates u JOIN public_articles a ON a.id = u.article_id
     WHERE u.story_event_id = ? ORDER BY COALESCE(a.published_at, u.created_at) ASC, u.id ASC`, [id]
  );
  if (!updates.length) notFound();
  const visitUpdates = updates.map(update => ({ id: update.id, created_at: new Date(update.created_at).toISOString() }));
  return <main className="container mx-auto max-w-3xl px-4 py-10">
    <Link href="/" className="text-sm text-accent hover:underline">← Back to news</Link>
    <p className="mt-8 text-xs font-bold uppercase tracking-widest text-accent">Story Tracker · {event.category}</p>
    <h1 className="mt-3 font-display text-4xl text-ink">{event.title}</h1>
    <StorySinceVisit eventId={id} updates={visitUpdates} />
    <p className="mt-5 text-sm text-muted">{updates.length} publisher report{updates.length === 1 ? '' : 's'} · Updated {new Date(event.last_updated_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</p>
    <ol className="mt-10 border-l-2 border-hairline pl-6">
      {updates.map((update, index) => <li key={update.id} className="relative mb-9">
        <span className="absolute -left-[31px] top-2 h-2.5 w-2.5 rounded-full bg-accent" />
        <time className="text-xs font-semibold uppercase tracking-wider text-muted">{new Date(update.published_at || update.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</time>
        <h2 className="mt-2 font-display text-xl text-ink">{index === 0 ? 'First report' : update.change_text || 'Another report on this story'}</h2>
        <a href={update.source_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm text-accent hover:underline">{update.title} · {update.source_name} ↗</a>
      </li>)}
    </ol>
    <p className="border-t border-hairline pt-4 text-xs text-muted">Changes appear only when supported by publisher reports. Open a source to read the full article.</p>
  </main>;
}
