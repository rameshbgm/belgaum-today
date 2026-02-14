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
  | 'belgaum';

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
    color: '#FF9933'
  },
  business: {
    name: 'Business',
    description: 'Business and economy updates',
    color: '#4CAF50'
  },
  technology: {
    name: 'Technology',
    description: 'Tech news and innovations',
    color: '#2196F3'
  },
  entertainment: {
    name: 'Entertainment',
    description: 'Movies, music, and pop culture',
    color: '#E91E63'
  },
  sports: {
    name: 'Sports',
    description: 'Sports news and updates',
    color: '#FF5722'
  },
  belgaum: {
    name: 'Belgaum',
    description: 'Local news from Belgaum region',
    color: '#9C27B0'
  }
};
