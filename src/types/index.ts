// Article Types
export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  category: Category;
  source_name: string;
  source_url: string;
  status: ArticleStatus;
  featured: boolean;
  ai_generated: boolean;
  ai_confidence: number | null;
  requires_review: boolean;
  view_count: number;
  reading_time: number;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
  tags?: Tag[];
}

export type Category =
  | 'india'
  | 'business'
  | 'technology'
  | 'entertainment'
  | 'sports'
  | 'belgaum'
  | 'travel'
  | 'science'
  | 'health'
  | 'lifestyle'
  | 'food'
  | 'education'
  | 'environment'
  | 'culture'
  | 'finance';

export type ArticleStatus = 'draft' | 'published' | 'archived';

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

// User Types
export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AuthPayload {
  userId: number;
  email: string;
  role: UserRole;
}

// Analytics Types
export interface ArticleView {
  id: number;
  article_id: number;
  user_agent: string | null;
  referrer: string | null;
  created_at: Date;
}

export interface SourceClick {
  id: number;
  source_name: string;
  article_id: number | null;
  created_at: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard Stats
export interface DashboardStats {
  totalArticles: number;
  draftCount: number;
  publishedToday: number;
  totalViews: number;
  topArticles: Array<{
    id: number;
    title: string;
    view_count: number;
  }>;
  articlesPerDay: Array<{
    date: string;
    count: number;
  }>;
  categoryStats: Array<{
    category: string;
    count: number;
  }>;
  sourceStats: Array<{
    source: string;
    count: number;
  }>;
  // Live view tracking (from the article_views event table — the real source of truth)
  viewsToday: number;
  viewEventsTotal: number;
  lastViewAt: string | null;
  viewTrackingStale: boolean; // true when no view events recorded recently
  // Scheduler liveness (from scheduler_heartbeat)
  scheduler: SchedulerHealth;
}

export interface SchedulerHealth {
  lastStartedAt: string | null;
  lastSuccessAt: string | null;
  lastStatus: 'running' | 'success' | 'error' | 'never';
  lastError: string | null;
  tickCount: number;
  ageMinutes: number | null; // minutes since last tick started
  isStale: boolean;          // true => scheduler looks dead (render RED)
}

// Search Types
export interface SearchFilters {
  query?: string;
  category?: Category;
  startDate?: string;
  endDate?: string;
  sortBy?: 'newest' | 'views' | 'relevant';
}

// Category Metadata
export const CATEGORY_META: Record<Category, { name: string; description: string; color: string }> = {
  india: {
    name: 'India',
    description: 'Latest news from across India',
    color: '#E8590C'
  },
  business: {
    name: 'Business',
    description: 'Business and economy updates',
    color: '#0F766E'
  },
  technology: {
    name: 'Technology',
    description: 'Tech news and innovations',
    color: '#1D4ED8'
  },
  entertainment: {
    name: 'Entertainment',
    description: 'Movies, music, and pop culture',
    color: '#BE123C'
  },
  sports: {
    name: 'Sports',
    description: 'Sports news and updates',
    color: '#15803D'
  },
  belgaum: {
    name: 'Belgaum',
    description: 'Local news from Belgaum region',
    color: '#B45309'
  },
  travel: {
    name: 'Travel',
    description: 'Travel guides, destinations and tips',
    color: '#0369A1'
  },
  science: {
    name: 'Science',
    description: 'Scientific discoveries and research',
    color: '#7C3AED'
  },
  health: {
    name: 'Health',
    description: 'Health, wellness and medical news',
    color: '#059669'
  },
  lifestyle: {
    name: 'Lifestyle',
    description: 'Lifestyle, fashion and personal development',
    color: '#DB2777'
  },
  food: {
    name: 'Food',
    description: 'Recipes, cuisine and food culture',
    color: '#D97706'
  },
  education: {
    name: 'Education',
    description: 'Education news, tips and learning resources',
    color: '#2563EB'
  },
  environment: {
    name: 'Environment',
    description: 'Climate, sustainability and environmental news',
    color: '#16A34A'
  },
  culture: {
    name: 'Culture',
    description: 'Art, culture, heritage and society',
    color: '#9333EA'
  },
  finance: {
    name: 'Finance',
    description: 'Personal finance, investing and markets',
    color: '#CA8A04'
  },
};
