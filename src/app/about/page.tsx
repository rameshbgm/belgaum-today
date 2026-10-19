import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
export const metadata: Metadata = { title: 'About Belgaum Today', description: 'Discover publisher-linked news from across India and Belgaum.', alternates: { canonical: '/about' } };
export default function AboutPage() {
    return <div className="info-page"><h1>A clearer way to follow the news.</h1><p className="info-intro">Belgaum Today brings together headlines from Indian publishers, making it easier to discover the stories you care about and read them at the source.</p>
        <section className="info-section"><h2>Across India. Close to home.</h2><p>Explore India, Business, Technology, Sports, and Entertainment, alongside community news from Belgaum (Belagavi), Karnataka. Choose your topics to build a briefing that fits your interests.</p></section>
        <section className="info-section"><h2>The publisher stays in the picture.</h2><p>Every publisher report includes its source and a link to the original story. We gather content from configured feeds, check for duplicates, and update coverage on each feed&rsquo;s schedule. Source-linked story timelines bring related reports together.</p></section>
        <section className="info-section"><h2>Made for everyday reading.</h2><p>Browse on your phone or desktop, search the archive, follow topics on your device, or subscribe through RSS. Light and dark themes make the reading experience comfortable throughout the day.</p></section>
        <section className="info-section"><h2>Get in touch.</h2><p>For feedback, news tips, or questions, write to <a className="text-primary underline" href="mailto:ask@belgaum.today">ask@belgaum.today</a>.</p></section>
        <Link href="/" className="primary-action mt-6">Explore today&rsquo;s briefing<ArrowRight size={18} /></Link>
    </div>;
}
