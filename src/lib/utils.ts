import { type ClassValue, clsx } from 'clsx';
import slugify from 'slugify';

// Class name utility (like cn from shadcn)
export function cn(...inputs: ClassValue[]): string {
    return clsx(inputs);
}

// Generate URL-friendly slug
export function generateSlug(text: string): string {
    return slugify(text, {
        lower: true,
        strict: true,
        trim: true,
    });
}

// Truncate text with ellipsis
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text;
    return text.slice(0, length).trim() + '...';
}

// Format date for display
export function formatDate(date: Date | string): string {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

// Format relative time ("2 hours ago")
export function formatRelativeTime(date: Date | string): string {
    const now = new Date();
    const d = new Date(date);
    const diffMs = now.getTime() - d.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    if (diffMonths < 12) return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
    return formatDate(date);
}

// Calculate reading time in minutes
export function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
}

// Validate URL format
export function isValidUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Sanitize HTML (basic - remove script tags)
export function sanitizeContent(html: string): string {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
}

// Generate excerpt from content
export function generateExcerpt(content: string, maxLength: number = 150): string {
    // Strip HTML tags
    const text = content.replace(/<[^>]*>/g, '');
    return truncate(text, maxLength);
}

// Debounce function for search
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null;
    return (...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Format number with commas
export function formatNumber(num: number): string {
    return num.toLocaleString('en-IN');
}

// Get category color
export function getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
        india: '#FF9933',
        business: '#4CAF50',
        technology: '#2196F3',
        entertainment: '#E91E63',
        sports: '#FF5722',
        belgaum: '#9C27B0',
    };
    return colors[category.toLowerCase()] || '#6B7280';
}
