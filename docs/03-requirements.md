# Requirements Document — Belgaum Today

## 1. Project Overview

**Belgaum Today** is an AI-powered, automated news aggregation platform for the Belgaum (Belagavi) region and India. The system aggregates news from multiple RSS sources, uses AI to analyze and rank trending stories, and serves content through a modern web frontend with a full admin panel.

---

## 2. Functional Requirements

### FR-01: Automated News Aggregation

| ID | Requirement | Priority |
|---|---|---|
| FR-01.1 | System shall automatically fetch news articles from configured RSS feeds at regular intervals (default: every 2 hours) | **Must Have** |
| FR-01.2 | System shall support RSS feeds from multiple sources (Hindustan Times, The Hindu, and custom feeds) | **Must Have** |
| FR-01.3 | System shall parse RSS XML including CDATA, media:content, media:thumbnail, and enclosure tags for image extraction | **Must Have** |
| FR-01.4 | System shall deduplicate articles based on source URL and title | **Must Have** |
| FR-01.5 | System shall categorize articles into 6 categories: India, Business, Technology, Entertainment, Sports, Belgaum | **Must Have** |
| FR-01.6 | System shall support adding/removing/disabling RSS feeds without code changes (via admin panel) | **Must Have** |

### FR-02: AI-Powered Trending Analysis

| ID | Requirement | Priority |
|---|---|---|
| FR-02.1 | System shall use AI/LLM agents to analyze and rank trending articles per category | **Must Have** |
| FR-02.2 | System shall support multiple AI providers: OpenAI, Anthropic, DeepSeek, Google Gemini, SarvamAI | **Must Have** |
| FR-02.3 | AI agents shall be configurable from the admin panel — providers, models, API keys, temperatures | **Must Have** |
| FR-02.4 | System shall fallback to alternate AI providers if the primary fails | **Should Have** |
| FR-02.5 | System shall log every AI call with provider, model, duration, token count, status, and errors | **Must Have** |
| FR-02.6 | AI API keys shall be encrypted at rest using AES-256-GCM | **Must Have** |

### FR-03: Public Website

| ID | Requirement | Priority |
|---|---|---|
| FR-03.1 | Homepage shall display featured articles, trending carousel, and recent articles across categories | **Must Have** |
| FR-03.2 | Category pages shall list articles filtered by category with a featured hero and grid layout | **Must Have** |
| FR-03.3 | Article detail page shall render full content, source attribution, share buttons, and related articles | **Must Have** |
| FR-03.4 | Search page shall support full-text search with category, date range, and sort filters | **Must Have** |
| FR-03.5 | Site shall be fully responsive — mobile, tablet, desktop | **Must Have** |
| FR-03.6 | Site shall generate RSS feed (`feed.xml`), sitemap (`sitemap.xml`), and robots.txt for SEO | **Must Have** |

### FR-04: Admin Panel

| ID | Requirement | Priority |
|---|---|---|
| FR-04.1 | Admin dashboard shall show overview stats: total articles, views, drafts, category distribution, top articles, daily trends | **Must Have** |
| FR-04.2 | Article management: create, edit, publish, archive, delete articles | **Must Have** |
| FR-04.3 | RSS feed management: add, edit, activate/deactivate feeds | **Must Have** |
| FR-04.4 | AI agent management: configure providers, models, API keys | **Must Have** |
| FR-04.5 | System logs: view operational logs with category, level, and date filters | **Must Have** |
| FR-04.6 | AI agent logs: view detailed AI call history with provider, model, status, duration | **Must Have** |
| FR-04.7 | Manual cron trigger: ability to trigger RSS fetch manually from admin | **Should Have** |

### FR-05: Authentication & Authorization

| ID | Requirement | Priority |
|---|---|---|
| FR-05.1 | Admin login using email/password with JWT token authentication | **Must Have** |
| FR-05.2 | Role-based access: admin, editor, viewer (hierarchical) | **Must Have** |
| FR-05.3 | All admin routes protected by middleware — redirect to login if unauthenticated | **Must Have** |
| FR-05.4 | Auth tokens stored in httpOnly secure cookies (24h expiry) | **Must Have** |

### FR-06: Analytics & Tracking

| ID | Requirement | Priority |
|---|---|---|
| FR-06.1 | Track article page views with user agent, referrer, and IP address | **Must Have** |
| FR-06.2 | Track source clicks when users visit original article sources | **Must Have** |
| FR-06.3 | Dashboard shall display analytics data (view counts, source stats) | **Must Have** |

### FR-07: Logging & Observability

| ID | Requirement | Priority |
|---|---|---|
| FR-07.1 | All API requests and responses shall be logged (method, path, status, duration, IP) | **Must Have** |
| FR-07.2 | Cron job execution shall be logged step-by-step (feeds processed, articles added, errors) | **Must Have** |
| FR-07.3 | AI agent calls shall be logged (provider, model, tokens, duration, status) | **Must Have** |
| FR-07.4 | Log files shall rotate daily, stored as JSON-lines in the `logs/` directory | **Must Have** |
| FR-07.5 | Log level shall be configurable: `debug` for local, `info` for production | **Must Have** |
| FR-07.6 | Logs shall be written to both file system and database (`system_logs` table) | **Must Have** |

---

## 3. Non-Functional Requirements

| ID | Category | Requirement |
|---|---|---|
| NFR-01 | **Performance** | Homepage shall load in < 3 seconds on a 4G connection |
| NFR-02 | **Performance** | API responses shall return in < 500ms (excluding AI calls) |
| NFR-03 | **Performance** | Cron job shall process 34 RSS feeds in < 2 minutes |
| NFR-04 | **Security** | All passwords stored as bcrypt hashes (12 salt rounds) |
| NFR-05 | **Security** | API keys encrypted at rest using AES-256-GCM |
| NFR-06 | **Security** | SQL injection prevented via parameterized queries |
| NFR-07 | **Security** | JWT tokens stored in httpOnly, secure, sameSite=lax cookies |
| NFR-08 | **Scalability** | Database designed with proper indexes for full-text search |
| NFR-09 | **Reliability** | Cron and AI failures shall not crash the application |
| NFR-10 | **Maintainability** | All API routes use consistent error handling and logging patterns |
| NFR-11 | **SEO** | Server-side rendered pages with proper meta tags, sitemap, and robots.txt |
| NFR-12 | **Accessibility** | Responsive design for mobile, tablet, and desktop viewports |
| NFR-13 | **Deployment** | Deployable on Hostinger / VPS with Docker Compose for database |

---

## 4. RSS Feed Sources (34 Pre-configured)

| Category | Sources | Count |
|---|---|---|
| India | Hindustan Times India, The Hindu National | 2 |
| Business | Hindustan Times Business, The Hindu (Agri, Industry, Economy, Markets, Budget) | 6 |
| Technology | Hindustan Times Tech, The Hindu (Science, Technology, Internet, Gadgets) | 5 |
| Sports | Hindustan Times (Cricket, Football, Tennis, Other), The Hindu (Sport, Cricket, Football, Tennis, Hockey, Other) | 10 |
| Entertainment | Hindustan Times (Entertainment, Bollywood, Hollywood, Music, TV), The Hindu (Entertainment, Movies, Music, Theatre, Art, Dance) | 11 |
| Belgaum | (Placeholder for local feeds) | 0 |

---

## 5. User Roles

| Role | Permissions |
|---|---|
| **Admin** | Full access: manage articles, feeds, AI config, API keys, logs, users |
| **Editor** | Manage articles (create, edit, publish), view dashboard and logs |
| **Viewer** | View admin dashboard only (read-only) |
