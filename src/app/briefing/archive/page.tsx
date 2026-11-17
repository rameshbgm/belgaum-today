import Link from 'next/link';
import type { Metadata } from 'next';
import { dateFromBriefing, listDailyBriefings } from '@/lib/daily-briefings';
import { briefingLabel } from '@/lib/briefing-content';
import '../daily-briefing.css';

export const dynamic = 'force-dynamic';
type Props = { searchParams: Promise<{ page?: string }> };
const pageNumber = (value?: string) => /^\d{1,5}$/.test(value || '') ? Math.max(1, Number(value)) : 1;

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
    const page = pageNumber((await searchParams).page);
    return { title: page === 1 ? 'India daily briefing archive' : `India daily briefing archive — page ${page}`, description: 'Read dated India news briefings from Belgaum Today, with AI-assisted summaries and links to the original publisher reports.', alternates: { canonical: page === 1 ? '/briefing/archive' : `/briefing/archive?page=${page}` } };
}

export default async function BriefingArchive({ searchParams }: Props) {
    const page = pageNumber((await searchParams).page);
    const rows = await listDailyBriefings(31, (page - 1) * 30);
    return <div className="container daily-briefing-page">
        <h1>India daily briefings</h1><p className="daily-briefing-intro">Five AI-selected reports, summarized with sources. Each dated edition remains available to read and share.</p>
        {rows.length ? <ol className="daily-briefing-stories">{rows.slice(0, 30).map(row => <li key={row.slug}><h2><Link href={`/briefing/${dateFromBriefing(row)}`}>{row.title}</Link></h2><p>{row.excerpt}</p><time dateTime={dateFromBriefing(row)}>{briefingLabel(dateFromBriefing(row))}</time></li>)}</ol> : <p className="home-empty">The first edition will appear after a successful India AI analysis has selected five recent reports.</p>}
        <nav className="daily-briefing-footer" aria-label="Briefing archive pages">{page > 1 && <Link href={page === 2 ? '/briefing/archive' : `/briefing/archive?page=${page - 1}`}>Newer editions</Link>}{rows.length > 30 && <Link href={`/briefing/archive?page=${page + 1}`}>Older editions</Link>}<Link href="/briefing">Latest headlines</Link></nav>
    </div>;
}
