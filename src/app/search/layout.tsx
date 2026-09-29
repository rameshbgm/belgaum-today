import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Search News',
    robots: { index: false, follow: true },
    description:
        'Search and discover news articles across all categories — India, Business, Technology, Entertainment, Sports, and Belgaum local news on Belgaum Today.',
    openGraph: {
        title: 'Search News | Belgaum Today',
        description:
            'Search and discover news articles across all categories on Belgaum Today.',
    },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
    return children;
}
