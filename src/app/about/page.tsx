import type { Metadata } from 'next';
import Link from 'next/link';
import { Newspaper, Zap, MapPin, Globe, Cpu, Users } from 'lucide-react';

export const metadata: Metadata = {
    title: 'About Us',
    description:
        'Learn about Belgaum Today — your trusted curated news platform delivering the latest local and national news from Belgaum (Belagavi) and beyond.',
    openGraph: {
        title: 'About Us | Belgaum Today',
        description:
            'Learn about Belgaum Today — your trusted curated news platform delivering the latest local and national news.',
    },
};

const features = [
    {
        icon: Cpu,
        title: 'Curated News',
        description:
            'Our intelligent algorithms sift through hundreds of sources to bring you the most relevant and trending stories, ranked by significance and timeliness.',
    },
    {
        icon: MapPin,
        title: 'Local Focus',
        description:
            'Belgaum (Belagavi) is at the heart of everything we do. We prioritise local stories that matter to our community while covering national and global news.',
    },
    {
        icon: Globe,
        title: 'Multi-Category Coverage',
        description:
            'From India, Business, and Technology to Entertainment, Sports, and hyper-local Belgaum news — we cover the stories that shape your world.',
    },
    {
        icon: Zap,
        title: 'Real-Time Updates',
        description:
            'Our RSS aggregation engine monitors dozens of trusted news sources round the clock, delivering breaking news as it happens.',
    },
    {
        icon: Newspaper,
        title: 'Clean & Ad-Friendly',
        description:
            'A clutter-free reading experience with fast page loads, dark mode support, and a design that puts the news first.',
    },
    {
        icon: Users,
        title: 'Community-First',
        description:
            'Built for the people of Belgaum and Karnataka. We believe in transparency, accuracy, and serving our readers above all else.',
    },
];

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-10 max-w-5xl">
            {/* Hero */}
            <div className="text-center mb-16">
                <div className="inline-flex items-center gap-3 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                        B
                    </div>
                    <div className="text-left">
                        <h1 className="font-display text-4xl font-bold text-ink">
                            Belgaum{' '}
                            <span className="text-primary">
                                Today
                            </span>
                        </h1>
                        <p className="text-muted text-sm">Local News, Global Standards</p>
                    </div>
                </div>

                <p className="text-xl text-muted max-w-2xl mx-auto leading-relaxed">
                    We are a modern, curated news platform dedicated to delivering accurate, timely, and
                    relevant news from Belgaum (Belagavi) and across India — every single day.
                </p>
            </div>

            {/* Mission */}
            <section className="mb-16">
                <div className="bg-[#F4FBFA] dark:bg-teal-900/15 border border-teal-200/50 dark:border-teal-800/40 rounded-2xl p-8 md:p-12">
                    <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-4">Our Mission</h2>
                    <p className="text-ink/80 text-lg leading-relaxed">
                        In a world overflowing with information, finding trustworthy, relevant news shouldn&rsquo;t
                        be hard. Belgaum Today was created with a simple mission: to bring the people of Belgaum
                        and Karnataka a single, reliable destination for news that matters. We aggregate content
                        from dozens of trusted sources, use AI to curate and analyse trending stories, and present
                        them in a clean, easy-to-read format — free of clutter and misinformation.
                    </p>
                </div>
            </section>

            {/* Features Grid */}
            <section className="mb-16">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink text-center mb-8">
                    What Sets Us Apart
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature) => {
                        const IconComponent = feature.icon;
                        return (
                            <div
                                key={feature.title}
                                className="bg-surface rounded-xl p-6 shadow-sm border border-hairline hover:shadow-md transition-shadow"
                            >
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                                    <IconComponent className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="font-display text-lg font-semibold text-ink mb-2">
                                    {feature.title}
                                </h3>
                                <p className="text-muted text-sm leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* How It Works */}
            <section className="mb-16">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink text-center mb-8">
                    How It Works
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            1
                        </div>
                        <h3 className="font-display font-semibold text-ink mb-2">Aggregate</h3>
                        <p className="text-muted text-sm">
                            Our engine monitors dozens of trusted RSS feeds and news sources across six categories,
                            fetching new articles every 15 minutes.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            2
                        </div>
                        <h3 className="font-display font-semibold text-ink mb-2">Curate</h3>
                        <p className="text-muted text-sm">
                            AI analyses each article for relevance, uniqueness, and newsworthiness, filtering out
                            duplicates and low-quality content automatically.
                        </p>
                    </div>
                    <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary-hover text-white flex items-center justify-center font-bold text-lg mx-auto mb-4">
                            3
                        </div>
                        <h3 className="font-display font-semibold text-ink mb-2">Deliver</h3>
                        <p className="text-muted text-sm">
                            Curated stories are published to our fast, responsive website — complete with trending
                            analysis, category views, and a powerful search.
                        </p>
                    </div>
                </div>
            </section>

            {/* Contact CTA */}
            <section className="text-center bg-[#F3EEE4] dark:bg-[#211D17] rounded-2xl p-8 md:p-12">
                <h2 className="font-display text-2xl md:text-3xl font-bold text-ink mb-4">Get in Touch</h2>
                <p className="text-muted mb-6 max-w-xl mx-auto">
                    Have feedback, a news tip, or want to partner with us? We&rsquo;d love to hear from you.
                </p>
                <a
                    href="mailto:ask@belgaum.today"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary-hover transition-all shadow-lg"
                >
                    <span>ask@belgaum.today</span>
                </a>
            </section>

            {/* Back to Home */}
            <div className="mt-10 text-center">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-accent hover:underline font-medium"
                >
                    ← Back to Home
                </Link>
            </div>
        </div>
    );
}
