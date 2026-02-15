# Components & Responsibilities — Belgaum Today

## 1. Frontend Components

### Layout Components (`src/components/layout/`)

| Component | File | Responsibility |
|---|---|---|
| **Header** | `Header.tsx` | Top navigation bar with logo, category links (India, Business, Technology, Sports, Entertainment, Belgaum), search icon, mobile hamburger menu. Responsive with slide-out mobile nav. |
| **Footer** | `Footer.tsx` | Site footer with category links, about section, social media links, newsletter CTA, copyright. Grid layout for desktop, stacked on mobile. |
| **Sidebar** | `Sidebar.tsx` | Right-side panel with **dynamic trending topics** (fetched from `/api/trending-topics`), category quick links with article counts, and RSS feed link. Includes loading spinner and empty states. |

### Article Components (`src/components/articles/`)

| Component | File | Responsibility |
|---|---|---|
| **ArticleCard** | `ArticleCard.tsx` | Individual news article card — displays title, excerpt, source name, category badge, published date, reading time, featured image (with fallback). Links to `/article/[slug]`. Handles image loading errors gracefully. |
| **ArticleGrid** | `ArticleGrid.tsx` | Responsive CSS grid layout for rendering multiple `ArticleCard` components. Accepts an array of articles and renders them in a 1/2/3-column grid (mobile/tablet/desktop). |
| **FeaturedArticle** | `FeaturedArticle.tsx` | Large hero-style article card for the top story — full-width image, prominent headline, excerpt, source info. Used on category pages and the homepage. |
| **NewsFallbackImage** | `NewsFallbackImage.tsx` | SVG-based fallback when article images fail to load or are missing. Category-aware — renders different placeholder graphics per news category. |
| **ShareButtons** | `ShareButtons.tsx` | Social sharing buttons for articles — Twitter/X, Facebook, WhatsApp, LinkedIn, copy link. Uses native Web Share API on mobile. |

### UI Components (`src/components/ui/`)

| Component | File | Responsibility |
|---|---|---|
| **Badge** | `Badge.tsx` | Colored label/pill — used for category tags, article status (draft/published), feature flags. Supports multiple color variants. |
| **Button** | `Button.tsx` | Reusable button with variants (primary, secondary, outline, ghost, danger), sizes (sm, md, lg), and loading state with spinner. |
| **Card** | `Card.tsx` | Generic card container with header, body, and footer slots. Used across dashboard stats, article lists, and settings panels. |
| **Input** | `Input.tsx` | Form input field with label, error message, icons, and disabled state. Supports text, email, password, number, search types. |
| **Toast** | `Toast.tsx` | Notification popup — success, error, warning, info variants. Auto-dismisses after timeout. Animated slide-in from top-right. |
| **Tooltip** | `Tooltip.tsx` | Hover tooltip for icons and truncated text. Positions automatically (top/bottom/left/right). |

### Special Components

| Component | File | Responsibility |
|---|---|---|
| **TrendingCarousel** | `TrendingCarousel.tsx` | Horizontal scrolling carousel of trending articles on the homepage. Shows AI-ranked articles across all categories with auto-scroll and manual navigation. |
| **TrackingProvider** | `TrackingProvider.tsx` | Client-side analytics wrapper — tracks page views and source clicks by sending data to `/api/track/view` and `/api/track/source`. Wraps the entire app in `layout.tsx`. |

---

## 2. Page Components

### Public Pages

| Page | Route | Responsibility |
|---|---|---|
| **Home** | `/` (page.tsx) | Landing page — fetches featured articles + recent articles by category from DB, renders TrendingCarousel + ArticleGrid + Sidebar. |
| **Category Page** | `/[category]` | Dynamic category page — fetches articles filtered by category (india/business/technology/sports/entertainment), renders FeaturedArticle + ArticleGrid. Category meta (name, color, description) from `CATEGORY_META`. |
| **Dedicated Category Pages** | `/india`, `/business`, `/technology`, `/sports`, `/entertainment` | Static category pages with SSR — each fetches and displays articles for its specific category with FeaturedArticle hero + grid layout. |
| **Article Detail** | `/article/[slug]` | Single article view — fetches article by slug, renders full content with featured image, source link, share buttons, related articles sidebar. |
| **Search** | `/search` | Full-text search page — search input + filters (category, date range, sort) + results grid. Uses MySQL FULLTEXT index via `/api/search`. |
| **Error** | `error.tsx` | Global error boundary — displays friendly error message with retry button. |
| **Not Found** | `not-found.tsx` | Custom 404 page with search suggestion and category links. |

### Admin Pages

| Page | Route | Responsibility |
|---|---|---|
| **Login** | `/admin/login` | Admin authentication — email/password form, JWT token on success. Redirects to dashboard. |
| **Dashboard** | `/admin/dashboard` | Overview stats — total articles, views today, drafts, charts (articles/day, category distribution, source breakdown). Data from `/api/admin/stats`. |
| **Articles** | `/admin/articles` | Content management — paginated table of all articles, status filters, bulk actions (publish/archive/delete), inline editing. |
| **Article Edit** | `/admin/articles/[id]/edit` | Edit single article — form with title, content, category, status, featured image, source info. |
| **Feeds** | `/admin/feeds` | RSS feed config — list all feeds, toggle active/inactive, view last fetch time, add/edit feed URLs. |
| **Agents** | `/admin/agents` | AI provider management — configure providers (OpenAI, Anthropic, etc.), models, set default agent. |
| **Agent Logs** | `/admin/agents-log` | AI call history — table of all AI agent calls with status, duration, token count, errors. Filterable by provider/status. |
| **API Keys** | `/admin/api-keys` | Encrypted API key management — add/edit/delete keys per provider. Keys are AES-256-GCM encrypted. Masked display. |
| **System Logs** | `/admin/logs` | Operational logs — filterable table of system events (cron, AI, admin actions) from `system_logs` table. |
| **Admin Layout** | `admin/layout.tsx` | Admin shell — sidebar navigation, header with user info, responsive layout. Auth guard via middleware. |

---

## 3. Library Modules (`src/lib/`)

| Module | File | Responsibility |
|---|---|---|
| **Database** | `db.ts` | MySQL connection pool (mysql2/promise), query helpers (`query`, `queryOne`, `insert`, `execute`, `transaction`, `checkConnection`), detailed error logging. |
| **Auth** | `auth.ts` | JWT token management (generate, verify), bcrypt password hashing, httpOnly cookie management, role-based access control (admin > editor > viewer). |
| **RSS Parser** | `rss.ts` | Custom XML parser — fetches RSS feeds, parses `<item>` elements, extracts images (media:content, enclosure, description), strips HTML/CDATA, validates entries. Zero external dependencies. |
| **File Logger** | `fileLogger.ts` | Daily rotating JSON log files (5 channels: app, api, cron, ai, error), colored console output, environment-based log levels (debug in dev, info in production). |
| **DB Logger** | `logger.ts` | Writes operational logs to `system_logs` DB table + file logger. Structured methods for cron, AI, admin, and system events. |
| **API Logging** | `withLogging.ts` | Higher-order function wrapping API route handlers — automatically logs request details, response status, duration, errors. |
| **Utilities** | `utils.ts` | Helper functions — `generateSlug`, `calculateReadingTime`, `formatDate`, `cn` (class name merge), `truncateText`. |
| **AI Agents** | `ai/agents.ts` | Multi-agent system — unified interface for 5 LLM providers. Handles trending article analysis, agent selection from DB, response parsing, comprehensive logging. |
| **AI Prompts** | `ai/prompts.ts` | System and user prompt builders for trending article analysis. Defines ranking criteria and JSON response format. |
| **AI Crypto** | `ai/crypto.ts` | AES-256-GCM encryption/decryption for API keys. Uses JWT_SECRET as the passphrase via scrypt key derivation. |
| **OpenAI Re-export** | `openai.ts` | Re-exports `analyzeTrendingArticles` and types from `ai/agents.ts` for backward compatibility. |

---

## 4. Middleware

| File | Responsibility |
|---|---|
| `middleware.ts` | **Auth guard** — protects `/admin/*` routes (redirect to login if no JWT). **Request logging** — logs method, path, IP, user-agent, duration to console for every non-static request. **Header injection** — adds `x-user-id`, `x-user-role`, `x-next-pathname` to request headers for downstream use. |

---

## 5. Type System (`src/types/index.ts`)

| Type | Fields | Used By |
|---|---|---|
| `Article` | id, title, slug, excerpt, content, featured_image, category, source_name, source_url, status, featured, ai_generated, view_count, reading_time, published_at, tags | All article components and APIs |
| `Category` | Union: india \| business \| technology \| entertainment \| sports \| belgaum | Category pages, filters, DB queries |
| `User` | id, email, name, role, password_hash | Auth, admin APIs |
| `AuthPayload` | userId, email, role | JWT tokens, middleware |
| `DashboardStats` | totalArticles, draftCount, publishedToday, totalViews, topArticles, articlesPerDay, categoryStats, sourceStats | Admin dashboard |
| `SearchFilters` | query, category, startDate, endDate, sortBy | Search page |
| `CATEGORY_META` | name, description, color per category | Category pages, sidebar, badges |
