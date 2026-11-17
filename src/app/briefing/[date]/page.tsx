import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getDailyBriefing, parseBriefing } from '@/lib/daily-briefings';
import { briefingLabel } from '@/lib/briefing-content';
import { NewsPhoto } from '@/components/articles/NewsPhoto';
import { PublisherLink } from '@/components/articles/PublisherLink';
import { publisher, safeJsonLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/site-url';
import '../daily-briefing.css';

export const dynamic = 'force-dynamic';
type Props = { params: Promise<{ date: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { date } = await params;
    const row = await getDailyBriefing(date);
    if (!row) return { title: 'Briefing not found', robots: { index: false } };
    return {
        title: row.title, description: row.excerpt,
        alternates: { canonical: `/briefing/${date}` },
        robots: { index: true, follow: true, googleBot: { 'max-image-preview': 'large' } },
        openGraph: { title: row.title, description: row.excerpt, type: 'article', url: `/briefing/${date}`, publishedTime: new Date(row.published_at).toISOString(), modifiedTime: new Date(row.updated_at).toISOString(), images: row.featured_image ? [row.featured_image] : [] },
        twitter: { card: 'summary_large_image', title: row.title, description: row.excerpt, images: row.featured_image ? [row.featured_image] : [] },
    };
}

export default async function DailyBriefingPage({ params }: Props) {
    const { date } = await params;
    const row = await getDailyBriefing(date);
    if (!row) notFound();
    const content = parseBriefing(row);
    if (!content) notFound();
    const url = `${SITE_URL}/briefing/${date}`;
    return <div className="container daily-briefing-page">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd({
            '@context': 'https://schema.org', '@type': 'Article', headline: row.title, description: row.excerpt,
            mainEntityOfPage: url, url, datePublished: new Date(row.published_at).toISOString(), dateModified: new Date(row.updated_at).toISOString(),
            inLanguage: 'en-IN', articleSection: 'India',
            author: { '@id': publisher['@id'] }, publisher,
            image: row.featured_image ? [row.featured_image] : undefined,
            citation: content.stories.map(story => story.source.source_url),
            isBasedOn: content.stories.map(story => ({ '@type': 'CreativeWork', name: story.source.title, url: story.source.source_url, publisher: { '@type': 'Organization', name: story.source.source_name } })),
        }) }} />
        <nav aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true"> / </span><Link href="/briefing/archive">Daily briefings</Link></nav>
        <article>
            <header><p className="story-category">India · Daily briefing</p><h1>{row.title}</h1>
                <p className="daily-briefing-byline">By <Link href="/about">Belgaum Today</Link> · Published <time dateTime={new Date(row.published_at).toISOString()}>{briefingLabel(date)}</time></p>
                <p className="daily-briefing-intro">{content.introduction}</p>
                <p className="daily-briefing-disclosure">An AI-assisted compilation of five publisher reports. Summaries use the linked headlines and excerpts and have not been independently verified by our editors. This edition preserves the reports selected at publication; follow the sources for later developments.</p>
            </header>
            {row.featured_image && <div className="daily-briefing-image"><NewsPhoto src={row.featured_image} priority /></div>}
            <ol className="daily-briefing-stories">{content.stories.map((story, index) => <li key={story.source.id}>
                <section aria-labelledby={`briefing-story-${index}`}><h2 id={`briefing-story-${index}`}>{story.source.title}</h2><p>{story.summary}</p>
                    <PublisherLink article={story.source}>Source: {story.source.source_name} — read the original report</PublisherLink>
                </section>
            </li>)}</ol>
        </article>
        <nav className="daily-briefing-footer" aria-label="More news"><Link href="/briefing">Read the latest headlines</Link><Link href="/briefing/archive">Browse previous briefings</Link></nav>
    </div>;
}
