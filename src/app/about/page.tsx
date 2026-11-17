import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export const metadata: Metadata = { title: 'About Belgaum Today', description: 'Discover publisher-linked news from across India and Belgaum.', alternates: { canonical: '/about' } };
export default function AboutPage() {
    return <div className="info-page"><h1>A clearer way to follow the news.</h1><p className="info-intro">Belgaum Today brings together headlines from Indian publishers, making it easier to discover the stories you care about and read them at the source.</p>
        <section className="info-section"><h2>Across India. Close to home.</h2><p>Explore India, Business, Technology, Sports, and Entertainment, alongside community news from Belgaum (Belagavi), Karnataka. Choose your topics to build a briefing that fits your interests.</p></section>
        <section className="info-section"><h2>The publisher stays in the picture.</h2><p>Every publisher report includes its source and a link to the original story. We gather content from configured feeds, check for duplicates, and update coverage on each feed&rsquo;s schedule. Source-linked story timelines bring related reports together.</p></section>
        <section className="info-section"><h2>How our daily briefing is made.</h2><p>AI ranks recent publisher reports and prepares a daily India briefing from five selected headlines and excerpts. Each summary links to its original report. These compilations are AI-assisted, are not independently verified by our editors, and can contain mistakes. We preserve each dated edition so readers can see what was selected at publication. Visit the original publishers for full reporting and later developments.</p><Link className="text-primary underline" href="/briefing/archive">Read the daily briefing archive</Link></section>
        <section className="info-section"><h2>Questions about our coverage.</h2>
            <h3>Where do the headlines come from?</h3><p>Headlines and excerpts come from linked publisher feeds. The publisher link on each report takes you to its original article. Belgaum Today does not claim that reporting as its own.</p>
            <h3>What does AI do?</h3><p>AI selects stories for the home page and prepares the dated India briefing from five recent reports. Each edition shows its publication date, summaries, and the five source links. The summaries are not independently verified by our editors.</p>
            <h3>How can I report a mistake?</h3><p>Send the page URL and a description to <a className="text-primary underline" href="mailto:ask@belgaum.today">ask@belgaum.today</a>. For updates to a publisher&rsquo;s original article, contact that publisher directly.</p>
        </section>
        <section className="info-section"><h2>Made for everyday reading.</h2><p>Browse on your phone or desktop, search the archive, follow topics on your device, or subscribe through RSS. Light and dark themes make the reading experience comfortable throughout the day.</p></section>
        <section className="info-section"><h2>Get in touch.</h2><p>For feedback, news tips, or questions, write to <a className="text-primary underline" href="mailto:ask@belgaum.today">ask@belgaum.today</a>.</p></section>
        <Link href="/" className="primary-action mt-6">Explore today&rsquo;s briefing<ArrowRight size={18} /></Link>
    </div>;
}
