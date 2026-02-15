# One-Shot Requirement Prompt — Belgaum Today

> **Purpose:** This is a single comprehensive prompt that can be used to recreate the entire Belgaum Today application from scratch. It contains all functional requirements, technical specifications, and design decisions.

---

## Prompt

Build a production-ready, AI-powered news aggregation platform called **Belgaum Today** (`belgaum.today`). The application is a regional news portal for Belgaum (Belagavi), India, that aggregates news from multiple RSS sources, uses AI to rank trending stories, and provides a full admin panel for content management.

### Tech Stack

- **Framework:** Next.js 16 with App Router, TypeScript, React 19
- **Styling:** Tailwind CSS 4
- **Database:** MySQL 8.0 (via `mysql2/promise`, raw SQL with parameterized queries)
- **Auth:** JWT (jsonwebtoken) + bcryptjs + httpOnly secure cookies
- **AI:** OpenAI SDK for multi-provider LLM access
- **Container:** Docker Compose for local MySQL
- **Icons:** Lucide React
- **Charts:** Recharts

### Database Schema (15 tables)

1. **categories** — 6 categories: India, Business, Technology, Entertainment, Sports, Belgaum (each with name, slug, description, color)
2. **users** — id, email, password_hash, name, role (admin/editor/viewer)
3. **articles** — id, title, slug (unique), excerpt, content (LONGTEXT), featured_image, category (ENUM), source_name, source_url, status (draft/published/archived), featured, ai_generated, ai_confidence, requires_review, view_count, reading_time, published_at. Indexes: status, category, featured, published_at, slug, FULLTEXT(title, excerpt, content), source_url
4. **tags** — id, name, slug
5. **article_tags** — junction table (article_id, tag_id) with cascade deletes
6. **article_views** — id, article_id (FK), user_agent, referrer, ip_address, created_at
7. **source_clicks** — id, source_name, article_id (FK, SET NULL on delete), created_at
8. **newsletter_subscriptions** — id, email (unique), subscribed_at, unsubscribed_at
9. **rss_feed_config** — id, name, feed_url (unique), category (ENUM), fetch_interval_minutes (default 120), is_active, last_fetched_at
10. **trending_articles** — id, article_id (FK), category, rank_position, ai_score, ai_reasoning, batch_id, expires_at. Unique key: (category, rank_position)
11. **ai_providers** — id, name (unique), display_name, base_url, api_format (openai/anthropic/gemini/custom), is_active, is_default. Seed: OpenAI, Anthropic, DeepSeek, Google Gemini, SarvamAI
12. **ai_models** — id, provider_id (FK), model_id, display_name, is_active, is_default, max_tokens, temperature. Seed: gpt-4o-mini, claude-3.5-sonnet, deepseek-chat, gemini-2.0-flash, sarvam-m, plus alternates
13. **ai_api_keys** — id, provider_id (FK), key_name, api_key_encrypted (AES-256-GCM), is_active, last_used_at
14. **system_logs** — id, level (info/warn/error), category, message, metadata (JSON), created_at
15. **ai_agent_logs** — id, provider, model, category, status (success/error/fallback), input_articles, output_trending, prompt_tokens, duration_ms, error_message, request_summary, response_summary, created_at

### RSS Feeds (34 pre-configured)

- **India (2):** Hindustan Times India, The Hindu National
- **Business (6):** HT Business, The Hindu (Agri, Industry, Economy, Markets, Budget)
- **Technology (5):** HT Tech, The Hindu (Science, Technology, Internet, Gadgets)
- **Sports (10):** HT (Cricket, Football, Tennis, Other), The Hindu (Sport, Cricket, Football, Tennis, Hockey, Other)
- **Entertainment (11):** HT (Entertainment, Bollywood, Hollywood, Music, TV), The Hindu (Entertainment, Movies, Music, Theatre, Art, Dance)

### Public Pages

1. **Homepage** (`/`) — featured articles, trending carousel (horizontal scroll with auto-play), recent articles grid, sidebar with trending topics and category links
2. **Category pages** (`/india`, `/business`, `/technology`, `/sports`, `/entertainment`) — hero featured article + article grid for that category
3. **Dynamic category** (`/[category]`) — fallback for any category slug
4. **Article page** (`/article/[slug]`) — full article content, featured image, source link, share buttons (Twitter, Facebook, WhatsApp, LinkedIn, copy link), related articles
5. **Search page** (`/search`) — full-text search input, filters (category, date range, sort by newest/views/relevant), results grid
6. **SEO:** `sitemap.ts` (dynamic from published articles), `robots.ts`, `feed.xml` (RSS output)
7. **Error pages:** custom `error.tsx` (global error boundary), `not-found.tsx` (custom 404)

### Layout Components

- **Header** — logo, category navigation links, search icon, mobile hamburger menu with slide-out nav
- **Footer** — category links, about section, social links, newsletter CTA, copyright
- **Sidebar** — dynamic trending topics (fetched from API), category quick links with counts, RSS feed link

### Article Components

- **ArticleCard** — image (with fallback SVG), title, excerpt, source, category badge, date, reading time
- **ArticleGrid** — responsive 1/2/3-column grid
- **FeaturedArticle** — large hero card with full-width image
- **ShareButtons** — social sharing + native Web Share API on mobile
- **NewsFallbackImage** — category-aware SVG placeholder

### UI Components

Badge, Button (variants: primary/secondary/outline/ghost/danger + sizes + loading), Card (header/body/footer slots), Input (with label/error/icons), Toast (success/error/warning/info with auto-dismiss), Tooltip

### Admin Panel

1. **Login** (`/admin/login`) — email/password form, JWT auth
2. **Dashboard** (`/admin/dashboard`) — stats cards (total articles, views, drafts, published today), charts (articles/day line chart, category pie, source bar), top articles table
3. **Articles** (`/admin/articles`) — paginated table, status filters, article create/edit/publish/archive/delete
4. **Article editor** (`/admin/articles/[id]/edit`) — form with all article fields
5. **Feeds** (`/admin/feeds`) — RSS feed list, toggle active/inactive, last fetch time
6. **AI Agents** (`/admin/agents`) — provider/model configuration, set defaults
7. **Agent Logs** (`/admin/agents-log`) — AI call history table with filters
8. **API Keys** (`/admin/api-keys`) — encrypted key management, masked display
9. **System Logs** (`/admin/logs`) — operational logs with level/category/date filters
10. **Admin layout** — sidebar navigation + header shell, auth guard

### API Routes (20 total)

| Route | Methods | Purpose |
|---|---|---|
| `/api/articles` | GET, POST | List/create articles |
| `/api/articles/[id]` | GET, PUT, DELETE | Single article CRUD |
| `/api/articles/slug/[slug]` | GET | Get by slug |
| `/api/articles/featured` | GET | Featured articles |
| `/api/search` | GET | Full-text search |
| `/api/trending-topics` | GET | AI-ranked trending |
| `/api/auth/login` | POST | JWT login |
| `/api/auth/logout` | POST | Clear auth cookie |
| `/api/track/view` | POST | Track article view |
| `/api/track/source` | POST | Track source click |
| `/api/cron/fetch-rss` | GET | Cron: fetch RSS + AI trending |
| `/api/admin/stats` | GET | Dashboard stats |
| `/api/admin/articles` | GET, PATCH, DELETE | Admin article management |
| `/api/admin/feeds` | GET, PATCH | RSS feed config |
| `/api/admin/logs` | GET | System logs |
| `/api/admin/agent-logs` | GET | AI call logs |
| `/api/admin/cron` | POST | Manual cron trigger |
| `/api/admin/providers` | GET, POST, PATCH, DELETE | AI provider CRUD |
| `/api/admin/models` | GET, POST, PATCH, DELETE | AI model CRUD |
| `/api/admin/api-keys` | GET, POST, PATCH, DELETE | API key CRUD (encrypted) |

### Authentication & Security

- JWT with 24h expiry, stored in httpOnly/secure/sameSite=lax cookies
- bcryptjs (12 rounds) for password hashing
- AES-256-GCM for API key encryption (JWT_SECRET as passphrase via scrypt)
- Middleware auth guard on all `/admin/*` and `/api/admin/*` routes
- Role hierarchy: admin > editor > viewer
- Cron endpoint secured by `CRON_SECRET` query parameter
- Parameterized SQL queries (no string concatenation)

### AI Agent System

- Multi-provider: OpenAI, Anthropic, DeepSeek, Gemini, SarvamAI
- All configured from admin panel (providers, models, API keys stored encrypted)
- Trending analysis: per-category, sends recent articles to LLM, receives ranked JSON
- Prompt: system prompt defines ranking criteria (breaking significance, impact, reader interest, uniqueness, source credibility), user prompt lists articles with ID/title/excerpt/source/date
- Response format: JSON array of `{articleId, rank, score, reasoning}`
- Fallback: if primary provider fails, try next available
- All calls logged to `ai_agent_logs` DB table + `ai-*.log` file

### RSS Parser

- Custom XML parser (zero external dependencies)
- Handles CDATA wrappers, HTML entity decoding
- Image extraction: media:content → media:thumbnail → enclosure → img in description
- Source detection from feed URL (Hindustan Times, The Hindu)
- Validation: minimum title length (10 chars), required fields (title + link)
- Description truncation at 500 chars

### Logging System

- **File Logger** (`fileLogger.ts`): daily rotating JSON-lines files in `logs/` directory with 5 channels: `app`, `api`, `cron`, `ai`, `error`. Colored console output. Log level: `debug` (dev) / `info` (production)
- **DB Logger** (`logger.ts`): writes to `system_logs` table + file logger (dual write). Structured methods for each event type
- **API Wrapper** (`withLogging.ts`): HOC that wraps all API route handlers, auto-logs request (method, path, query, IP, user-agent) and response (status, duration)
- **Middleware**: logs every non-static request to console with `[REQ]` prefix (Edge runtime — no file access)

### Tracking

- `TrackingProvider` client component wraps entire app in `layout.tsx`
- Sends POST to `/api/track/view` on article page visits
- Sends POST to `/api/track/source` when user clicks external source link

### Environment Variables

```
DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME
JWT_SECRET
SITE_URL, NEXT_PUBLIC_SITE_URL, NEXT_PUBLIC_SITE_NAME
RSS_FETCH_INTERVAL_MINUTES, CRON_SECRET
OPENAI_API_KEY
```

### Design Requirements

- Modern, clean news portal aesthetic
- Dark/light category colors per category (India=#FF9933, Business=#4CAF50, Technology=#2196F3, Entertainment=#E91E63, Sports=#FF5722, Belgaum=#9C27B0)
- Responsive: mobile-first, 3-column desktop grid, sidebar hides on mobile
- Font: system font stack or Inter via Google Fonts
- Smooth transitions and hover effects
- Loading states and error boundaries throughout
