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
    travel: [
        { id: 'all', label: 'All Travel' },
        { id: 'destinations', label: 'Destinations' },
        { id: 'tips', label: 'Travel Tips' },
        { id: 'india-travel', label: 'India Travel' },
    ],
    science: [
        { id: 'all', label: 'All Science' },
        { id: 'space', label: 'Space' },
        { id: 'biology', label: 'Biology' },
        { id: 'physics', label: 'Physics' },
    ],
    health: [
        { id: 'all', label: 'All Health' },
        { id: 'wellness', label: 'Wellness' },
        { id: 'medicine', label: 'Medicine' },
        { id: 'fitness', label: 'Fitness' },
    ],
    lifestyle: [
        { id: 'all', label: 'All Lifestyle' },
        { id: 'fashion', label: 'Fashion' },
        { id: 'home', label: 'Home & Living' },
        { id: 'relationships', label: 'Relationships' },
    ],
    food: [
        { id: 'all', label: 'All Food' },
        { id: 'recipes', label: 'Recipes' },
        { id: 'restaurants', label: 'Restaurants' },
        { id: 'cuisines', label: 'Cuisines' },
    ],
    education: [
        { id: 'all', label: 'All Education' },
        { id: 'schools', label: 'Schools' },
        { id: 'careers', label: 'Careers' },
        { id: 'skills', label: 'Skills' },
    ],
    environment: [
        { id: 'all', label: 'All Environment' },
        { id: 'climate', label: 'Climate' },
        { id: 'sustainability', label: 'Sustainability' },
        { id: 'wildlife', label: 'Wildlife' },
    ],
    culture: [
        { id: 'all', label: 'All Culture' },
        { id: 'art', label: 'Art' },
        { id: 'heritage', label: 'Heritage' },
        { id: 'society', label: 'Society' },
    ],
    finance: [
        { id: 'all', label: 'All Finance' },
        { id: 'investing', label: 'Investing' },
        { id: 'personal-finance', label: 'Personal Finance' },
        { id: 'crypto', label: 'Crypto' },
    ],
};

/**
 * Get subcategories for a given category
 */
export function getSubCategories(category: Category): SubCategory[] {
    return CATEGORY_FILTERS[category] || [{ id: 'all', label: 'All' }];
}
