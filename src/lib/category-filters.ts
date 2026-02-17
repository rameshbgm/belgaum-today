import { Category } from '@/types';
import { SubCategory } from '@/components/articles/CategorySearchHeader';

/**
 * Subcategory filters for each main category
 * These are used for client-side filtering of articles
 */
export const CATEGORY_FILTERS: Record<Category, SubCategory[]> = {
    business: [
        { id: 'all', label: 'All Business' },
        { id: 'markets', label: 'Markets' },
        { id: 'economy', label: 'Economy' },
        { id: 'industry', label: 'Industry' },
        { id: 'agri-business', label: 'Agri-Business' },
    ],
    technology: [
        { id: 'all', label: 'All Tech' },
        { id: 'ai', label: 'AI & ML' },
        { id: 'gadgets', label: 'Gadgets' },
        { id: 'internet', label: 'Internet' },
        { id: 'science', label: 'Science' },
    ],
    entertainment: [
        { id: 'all', label: 'All Entertainment' },
        { id: 'bollywood', label: 'Bollywood' },
        { id: 'music', label: 'Music' },
        { id: 'tv', label: 'TV & Web' },
        { id: 'theatre', label: 'Theatre' },
    ],
    sports: [
        { id: 'all', label: 'All Sports' },
        { id: 'cricket', label: 'Cricket' },
        { id: 'football', label: 'Football' },
        { id: 'tennis', label: 'Tennis' },
        { id: 'motorsport', label: 'Motorsport' },
    ],
    india: [
        { id: 'all', label: 'All India' },
        { id: 'politics', label: 'Politics' },
        { id: 'regional', label: 'Regional' },
        { id: 'national', label: 'National' },
    ],
    belgaum: [
        { id: 'all', label: 'All Belgaum' },
        { id: 'local', label: 'Local News' },
        { id: 'events', label: 'Events' },
        { id: 'community', label: 'Community' },
    ],
};

/**
 * Get subcategories for a given category
 */
export function getSubCategories(category: Category): SubCategory[] {
    return CATEGORY_FILTERS[category] || [{ id: 'all', label: 'All' }];
}
