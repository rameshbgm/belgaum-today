# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (localhost:3000)
npm run build        # Production build (TypeScript type-check included)
npm run lint         # ESLint via eslint.config.mjs
npm run prisma:generate   # Regenerate Prisma client after schema changes
npm run prisma:migrate    # Run dev migrations
npm run prisma:deploy     # Deploy migrations in production
```

Docker (local DB):
```bash
docker-compose up -d   # Start local MySQL on port 3307
```

Scripts (run directly with Node):
```bash
node scripts/insert-feeds.mjs        # Seed RSS feed config into DB
node scripts/test-belgaum-feeds.mjs  # Test Belgaum RSS feed accessibility
node scripts/sync-hostinger-db.mjs   # Sync prod DB to local
```

## Environment Variables

Copy `.env.example` to `.env.local`. Key variables:

| Variable | Purpose |
|---|---|
| `DATABASE_HOST/PORT/USER/PASSWORD/NAME` | MySQL connection (Hostinger prod / Docker local) |
| `JWT_SECRET` | Auth token signing (min 32 chars) |
| `CRON_SECRET` | Secures `GET /api/cron/fetch-rss?secret=` |
| `TRENDING_CRON_SECRET` | Secures trending analysis cron |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | AI trending analysis |
| `NEXT_PUBLIC_APP_ENV` | Set to `production` to hide demo login button |
| `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_ADSENSE_ID` | Analytics/ads (optional) |

Generate secrets: `openssl rand -base64 32`

## Architecture

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + MySQL (raw `mysql2/promise`, not Prisma ORM at runtime — Prisma is schema-only) + Tailwind CSS 4.

### Data Layer

- **`src/lib/db.ts`** — Raw MySQL connection pool with helpers: `query<T>`, `queryOne<T>`, `insert`, `execute`, `transaction`. All DB access goes through these; no Prisma client at runtime.
- **`prisma/schema.prisma`** — Schema source of truth (only `User` model uses Prisma). The rest of the DB (articles, RSS feeds, trending topics, analytics) is managed via raw SQL migrations in `database/migrations/`.
- **`database/schema.sql`** — Full database schema DDL.

### Authentication

- **`src/lib/auth.ts`** — JWT (jsonwebtoken) + bcrypt. 24h tokens stored in `httpOnly` cookies.
- **`src/middleware.ts`** — Edge middleware handles route protection and sets `x-user-id`/`x-user-role` headers for `/api/admin/*` routes. Does lightweight JWT decode (no crypto verification) for speed; full verification happens in API routes.
- Protected routes: `/admin/dashboard`, `/admin/articles`, `/admin/feeds`, `/admin/logs`, `/admin/settings`.

### Content Pipeline

1. **RSS fetching** — `GET /api/cron/fetch-rss?secret=<CRON_SECRET>` reads active feeds from `rss_feed_config` table (respects `fetch_interval_minutes`), parses XML via `src/lib/rss.ts`, deduplicates by `source_url`, stores to `articles` table.
2. **Trending analysis** — Separate AI cron (`/api/cron/trending-analysis` or `/api/ai/trending-analysis`) uses LangChain with OpenAI/Google Gemini to analyze article titles and generate trending topics.
3. **Categories:** `india`, `business`, `technology`, `entertainment`, `sports`, `belgaum`. Defined in `src/types/index.ts` → `CATEGORY_META`.

### API Route Layout

```
/api/admin/articles   — CRUD for articles (editor/admin role)
/api/admin/feeds      — RSS feed config management
/api/admin/cron       — Manual cron triggers
/api/admin/stats      — Dashboard analytics
/api/admin/trending   — Trending topic management
/api/admin/agent-logs — AI agent logs
/api/cron/fetch-rss   — Main RSS ingestion job
/api/ai/trending-analysis — AI-powered trend detection
/api/articles         — Public article listing/search
/api/search           — Full-text article search
/api/track            — View & click tracking
```

### Frontend Structure

- **`src/app/`** — App Router pages. `[category]` dynamic segment handles category listing pages.
- **`src/components/`** — Shared components including `BreakingNewsTicker`, `TrendingCarousel`, `TrackingProvider`, `AdScripts`.
- **`src/lib/`** — `logger.ts` (structured console), `fileLogger.ts` (writes to `logs/`), `withLogging.ts` (API route wrapper), `utils.ts` (slug generation, reading time), `category-filters.ts`.

### Logging

All API routes are wrapped with `withLogging` from `src/lib/withLogging.ts`. File logs land in `logs/` directory (gitignored). Cron logs: `logs/cron-YYYY-MM-DD.log`. AI logs: `logs/ai-YYYY-MM-DD.log`.

### Deployment

Hosted on Hostinger shared hosting. Production uses `NEXT_PUBLIC_APP_ENV=production`. The `next-env.d.ts` file has a tracked modification — do not revert it without checking `src/types/`.
