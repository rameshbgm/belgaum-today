import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { query } from '@/lib/db';
import { Article, CATEGORY_META, Category } from '@/types';
import { ArticleGrid } from '@/components/articles';
import { Sidebar } from '@/components/layout';

const validCategories: Category[] = ['india', 'business', 'technology', 'entertainment', 'sports', 'belgaum'];

// Mock data for development
const mockArticles: Article[] = [
    {
        id: 1,
        title: 'Sample Article for Category',
        slug: 'sample-article',
        excerpt: 'This is a sample article excerpt for the category page.',
        content: 'Full content...',
        featured_image: null,
        category: 'india',
        source_name: 'Sample Source',
        source_url: 'https://example.com',
        status: 'published',
        featured: false,
        ai_generated: false,
        ai_confidence: null,
        requires_review: false,
        view_count: 100,
        reading_time: 3,
        published_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
    },
];

type Props = {
    params: Promise<{ category: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { category } = await params;

    if (!validCategories.includes(category as Category)) {
        return { title: 'Not Found' };
    }

    const meta = CATEGORY_META[category as Category];
    return {
        title: `${meta.name} News`,
        description: meta.description,
        openGraph: {
            title: `${meta.name} News | Belgaum Today`,
            description: meta.description,
        },
    };
}

export async function generateStaticParams() {
    return validCategories.map((category) => ({ category }));
}

async function getCategoryArticles(category: Category): Promise<Article[]> {
    try {
        const articles = await query<Article[]>(
            `SELECT * FROM articles WHERE status = 'published' AND category = ? ORDER BY published_at DESC LIMIT 20`,
            [category]
        );
        return articles;
    } catch (error) {
        console.log('Database not available, using mock data');
        return mockArticles.map(a => ({ ...a, category }));
    }
}

export default async function CategoryPage({ params }: Props) {
    const { category } = await params;

    if (!validCategories.includes(category as Category)) {
        notFound();
    }

    const typedCategory = category as Category;
    const meta = CATEGORY_META[typedCategory];
    const articles = await getCategoryArticles(typedCategory);

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                    Home
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="font-medium text-gray-900 dark:text-white">{meta.name}</span>
            </nav>

            {/* Category Header */}
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: meta.color }}
                    />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        {meta.name} News
                    </h1>
                </div>
                <p className="text-gray-600 dark:text-gray-400 max-w-2xl">
                    {meta.description}
                </p>
            </header>

            <div className="lg:grid lg:grid-cols-4 lg:gap-8">
                {/* Main Content */}
                <div className="lg:col-span-3">
                    <ArticleGrid articles={articles} />
                </div>

                {/* Sidebar */}
                <aside className="lg:col-span-1 mt-8 lg:mt-0">
                    <Sidebar showCategories />
                </aside>
            </div>
        </div>
    );
}
