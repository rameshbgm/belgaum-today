/**
 * AI Trending Analysis — Thin wrapper around the multi-agent system.
 * This module is kept for backward compatibility with existing imports.
 * 
 * The actual analysis is delegated to lib/ai/agents.ts which reads
 * the active provider/model from the database.
 */

export { analyzeTrendingArticles } from '@/lib/ai/agents';
export type { ArticleForAnalysis, TrendingResult } from '@/lib/ai/agents';
