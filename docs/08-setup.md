# Complete Setup Guide — Belgaum Today

## 1. Prerequisites

| Software | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 18.x (recommended 20.x+) | Runtime for Next.js |
| **npm** | 9.x+ | Package management |
| **Docker** | 20.x+ | MySQL database container |
| **Docker Compose** | 2.x+ | Container orchestration |
| **Git** | 2.x+ | Version control |

---

## 2. Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/rameshbgm/belgaum-today.git
cd belgaum-today

# 2. Start MySQL database
docker compose up -d

# 3. Install dependencies
npm install

# 4. Create environment file
cp .env.local.example .env.local
# Edit .env.local with your credentials (see Section 4 below)

# 5. Start development server
npm run dev
```

Open `http://localhost:3000` in your browser.

**Admin panel:** `http://localhost:3000/admin/login`

- Email: `admin@belgaum.today`
- Password: `admin123`

---

## 3. Database Setup

### 3.1 Docker Compose (Recommended for Local)

The database is containerized via `docker-compose.yml`:

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: belgaum-today-db
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: root_pass
      MYSQL_DATABASE: belgaum_today
      MYSQL_USER: belgaum_user
      MYSQL_PASSWORD: belgaum_pass
    ports:
      - "3307:3306"    # Exposed on port 3307 to avoid conflicts
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
```

**Commands:**

```bash
# Start database
docker compose up -d

# Check database status
docker compose ps

# View database logs
docker compose logs mysql

# Stop database
docker compose down

# Reset database (delete all data and re-initialize)
docker compose down -v
docker compose up -d
```

### 3.2 Schema Initialization

The schema is auto-loaded from `database/schema.sql` when the Docker container starts for the first time. It creates:

| Tables Created | Count |
|---|---|
| Core (categories, users, articles, tags, article_tags) | 5 |
| Analytics (article_views, source_clicks) | 2 |
| RSS (rss_feed_config) | 1 |
| Logging (system_logs) | 1 |
| Future (newsletter_subscriptions) | 1 |
| **Total** | **10** |

**Seed data automatically inserted:**

- 6 categories with colors
- 1 admin user (<admin@belgaum.today>)
- 34 RSS feeds (Hindustan Times + The Hindu)

### 3.3 Manual Database Connection

```bash
# Connect to MySQL via Docker
docker exec -it belgaum-today-db mysql -u belgaum_user -p belgaum_today
# Password: belgaum_pass

# Or from host machine
mysql -h 127.0.0.1 -P 3307 -u belgaum_user -p belgaum_today
```

### 3.4 Production Database

For production deployments, use a managed MySQL 8.0 instance. Update the `.env.local` with production credentials:

```env
DATABASE_HOST=your-mysql-host.com
DATABASE_PORT=3306
DATABASE_USER=belgaum_prod_user
DATABASE_PASSWORD=<strong-production-password>
DATABASE_NAME=belgaum_today
```

Then import the schema:

```bash
mysql -h your-host -u your-user -p belgaum_today < database/schema.sql
```

---

## 4. Environment Variables

Create `.env.local` at the project root with the following variables:

```env
# ─── Database Configuration ───
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3307                    # 3307 for Docker local, 3306 for production
DATABASE_USER=belgaum_user
DATABASE_PASSWORD=belgaum_pass
DATABASE_NAME=belgaum_today

# ─── JWT Authentication ───
JWT_SECRET=your-super-secret-jwt-key-change-in-production
# IMPORTANT: Change this in production! Used for:
#   - JWT token signing/verification
#   - AES-256-GCM API key encryption passphrase

# ─── Site Configuration ───
SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Belgaum Today

# ─── RSS Feed Configuration ───
RSS_FETCH_INTERVAL_MINUTES=120        # Default: fetch every 2 hours
CRON_SECRET=belgaum-today-cron-secret-2026
# Used to authenticate cron job calls: /api/cron/fetch-rss?secret=<CRON_SECRET>

# ─── OpenAI Configuration (gpt-4o-mini) ───
OPENAI_API_KEY=sk-...your-openai-api-key...
OPENAI_MODEL=gpt-4o-mini              # Latest cost-effective model
OPENAI_TEMPERATURE=0.3                # 0-2, lower = consistent rankings
OPENAI_MAX_TOKENS=1000                # Sufficient for JSON rankings
OPENAI_REQUEST_TIMEOUT_MS=45000       # Request timeout in milliseconds
```

### Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_HOST` | Yes | `127.0.0.1` | MySQL host |
| `DATABASE_PORT` | Yes | `3306` | MySQL port |
| `DATABASE_USER` | Yes | `belgaum_user` | MySQL username |
| `DATABASE_PASSWORD` | Yes | `belgaum_pass` | MySQL password |
| `DATABASE_NAME` | Yes | `belgaum_today` | MySQL database name |
| `JWT_SECRET` | Yes | — | Secret for JWT functions. **MUST change in production** |
| `SITE_URL` | Yes | — | Full site URL (server-side) |
| `NEXT_PUBLIC_SITE_URL` | Yes | — | Full site URL (client-side, exposed to browser) |
| `NEXT_PUBLIC_SITE_NAME` | No | — | Site name for meta tags |
| `RSS_FETCH_INTERVAL_MINUTES` | No | `120` | Cron fetch interval |
| `CRON_SECRET` | Yes | — | Secret to authenticate cron endpoints |
| `OPENAI_API_KEY` | Yes | — | OpenAI API key from https://platform.openai.com/api-keys |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | GPT model name |
| `OPENAI_TEMPERATURE` | No | `0.3` | Temperature for AI responses (0-2) |
| `OPENAI_MAX_TOKENS` | No | `1000` | Maximum tokens in AI response |
| `OPENAI_REQUEST_TIMEOUT_MS` | No | `45000` | Request timeout in milliseconds |

---

## 5. Logging Setup

### 5.1 Log Directory

Logs are written to the `logs/` directory at the project root. This directory is auto-created on first log write.

```
logs/
├── app-2026-02-15.log      # All logs (mirror of all channels)
├── error-2026-02-15.log    # Errors only
├── api-2026-02-15.log      # HTTP request/response logs
├── cron-2026-02-15.log     # Cron job execution logs
└── ai-2026-02-15.log       # AI operation logs
```

### 5.2 Log Storage

**Files:** All logs (cron, api, ai, error) are written to the `logs/` directory.

**Database:** No logs stored in database. All logging is file-based.

### 5.3 Log Format

Each line is a JSON object (JSON-lines format):

```json
{"timestamp":"2026-02-15T05:01:23.456Z","level":"info","channel":"api","message":"→ GET /api/articles","data":{"query":{"category":"india"},"ip":"127.0.0.1"}}
```

### 5.3 Log Levels

| Environment | `NODE_ENV` | Min Level | `debug` | `info` | `warn` | `error` |
|---|---|---|---|---|---|---|
| **Local/Dev** | `development` | `debug` | ✅ | ✅ | ✅ | ✅ |
| **Production** | `production` | `info` | ❌ | ✅ | ✅ | ✅ |

### 5.4 Log Rotation

Logs rotate daily automatically. Each file is named `<channel>-YYYY-MM-DD.log`.
Old log files are NOT automatically deleted — implement external cleanup (e.g., `logrotate` on Linux, or a cleanup cron) for production.

### 5.5 Gitignore

Log files are excluded from version control:

```
# .gitignore
logs/*.log
```

The `logs/.gitkeep` file ensures the directory exists in the repo.

---

## 6. Build & Deploy

### 6.1 Development

```bash
npm run dev          # Start dev server on http://localhost:3000
```

Features in dev mode:

- Hot module replacement (HMR)
- Debug-level logging to console and files
- React Compiler enabled
- Source maps enabled

### 6.2 Production Build

```bash
npm run build        # TypeScript check + compile + static generation
npm run start        # Start production server
```

### 6.3 Production Deployment Checklist

- [ ] **Database:** MySQL 8.0 instance running, schema imported
- [ ] **Environment:** `.env.local` or `.env.production` with production values
- [ ] **JWT_SECRET:** Strong random secret (≥32 characters)
- [ ] **CRON_SECRET:** Strong random secret
- [ ] **API Keys:** Configured via admin panel (encrypted in DB)
- [ ] **Build:** `npm run build` completes without errors
- [ ] **Logs:** `logs/` directory writable by Node.js process
- [ ] **Cron:** External cron scheduler configured to hit `/api/cron/fetch-rss?secret=<CRON_SECRET>` every 2 hours
- [ ] **Reverse Proxy:** Nginx configured for the domain

### 6.4 Cron Setup (Production)

Set up an external cron job to trigger RSS fetching:

```bash
# Crontab example: every 2 hours
0 */2 * * * curl -s "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET" > /dev/null 2>&1
```

Or use a managed cron service (Vercel Cron, Upstash, cron-job.org).

---

## 7. Scripts

| Script | Command | Purpose |
|---|---|---|
| Dev server | `npm run dev` | Start Next.js in development mode |
| Build | `npm run build` | Production build |
| Start | `npm run start` | Start production server |
| Lint | `npm run lint` | ESLint checks |

---

## 8. Docker Commands Reference

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View logs
docker compose logs -f mysql

# Reset database (CAUTION: deletes all data)
docker compose down -v && docker compose up -d

# Access MySQL shell
docker exec -it belgaum-today-db mysql -u belgaum_user -p belgaum_today

# Backup database
docker exec belgaum-today-db mysqldump -u belgaum_user -p belgaum_today > backup.sql

# Restore database
docker exec -i belgaum-today-db mysql -u belgaum_user -p belgaum_today < backup.sql
```

---

## 9. Troubleshooting

### Database Connection Issues

| Problem | Solution |
|---|---|
| `ECONNREFUSED` | Ensure Docker is running: `docker compose ps` |
| `Access denied` | Check `DATABASE_USER` and `DATABASE_PASSWORD` in `.env.local` |
| Port conflict on 3307 | Change port in `docker-compose.yml` and `.env.local` |
| Schema not loaded | Run `docker compose down -v && docker compose up -d` to reinitialize |

### Build Errors

| Problem | Solution |
|---|---|
| Missing dependencies | Run `npm install` |
| TypeScript errors | Run `npm run build` and fix reported issues |
| Environment variable missing | Ensure all required vars are in `.env.local` |

### Cron Not Working

| Problem | Solution |
|---|---|
| 401 Unauthorized | Verify `CRON_SECRET` matches in `.env.local` and cron URL |
| No new articles | Check feed URLs are accessible; view `logs/cron-*.log` |
| AI trending not updating | Verify `OPENAI_API_KEY` is set in `.env.local`; check `logs/ai-*.log` for errors |

### Logging Issues

| Problem | Solution |
|---|---|
| No log files created | Check `logs/` directory exists and is writable |
| Debug logs not showing in production | Expected — production level is `info` |
| Logs too large | Implement external log rotation/cleanup |

---

## 10. OpenAI Configuration

### Getting an OpenAI API Key

1. Go to <https://platform.openai.com/api-keys>
2. Sign in with your OpenAI account (or create one)
3. Click "Create new secret key"
4. Copy the key and paste it in `.env.local` as `OPENAI_API_KEY`

### Configuration Variables

Once you have an API key, add these to your `.env.local`:

```bash
OPENAI_API_KEY=sk-...your-key-here...
OPENAI_MODEL=gpt-4o-mini              # Recommended for cost-effectiveness
OPENAI_TEMPERATURE=0.3                # Lower = consistent trending rankings
OPENAI_MAX_TOKENS=1000                # Sufficient for article rankings
OPENAI_REQUEST_TIMEOUT_MS=45000       # 45 second timeout for LLM calls
```

### Model Choice

- **gpt-4o-mini** (recommended): $0.15/$0.60 per 1M tokens, fast, cost-effective ✅
- **gpt-4o**: $5/$15 per 1M tokens, more capable, slower
- **gpt-4-turbo**: $10/$30 per 1M tokens, older, expensive

### How Trending Works

1. RSS feeds fetch articles every `RSS_FETCH_INTERVAL_MINUTES`
2. For each category, up to 50 articles are sent to `gpt-4o-mini`
3. The model ranks them by editorial significance (0-100 score)
4. Top 7-10 are displayed as "Trending" on the homepage
5. All calls are logged to `logs/ai-YYYY-MM-DD.log` for debugging

### Fallback Behavior

If OpenAI is unavailable or API key is missing:
- The system falls back to **recency-based ranking** (newest articles first)
- Fallback is automatic and logged: `Selected by recency (AI call failed)`
- No manual intervention required

---

## 11. API Key Management (Deprecated)

**AI API keys are NO LONGER managed through the admin panel.**

All AI configuration is environment-based. To add a new API key or change the model:

1. Edit your `.env.local` file
2. Update `OPENAI_API_KEY`, `OPENAI_MODEL`, or other settings
3. Restart the application

Previously removed admin pages:
- ~~`/admin/agents`~~ (AI provider/model management)
- ~~`/admin/system-prompts`~~ (Custom prompts editor)
- ~~`/admin/api-keys`~~ (Deprecated key storage)

---

## 11. Folder Structure (Key Files)

```
belgaum.today/
├── .env.local              ← Environment variables (DO NOT COMMIT)
├── .gitignore              ← Includes logs/*.log
├── database/
│   └── schema.sql          ← Full database schema + seed data
├── docker-compose.yml      ← MySQL 8.0 container config
├── docs/                   ← Project documentation (this file)
├── logs/                   ← Daily rotating log files
│   └── .gitkeep           ← Keeps directory in Git
├── next.config.ts          ← Next.js config (images, React Compiler)
├── package.json            ← Dependencies + scripts
├── prisma/                 ← Prisma schema + migrations
│   ├── schema.prisma       ← Database schema definition
│   └── migrations/         ← Database migration files
├── src/
│   ├── app/                ← Pages + API routes
│   │   ├── admin/          ← Admin dashboard pages (no AI pages)
│   │   └── api/            ← API endpoints (no AI CRUD endpoints)
│   ├── components/         ← React components
│   ├── lib/                ← Core libraries
│   │   ├── ai/
│   │   │   ├── agents.ts   ← Trending article analysis (uses env config)
│   │   │   ├── config.ts   ← Loads OPENAI_* from .env (NEW)
│   │   │   ├── prompts.ts  ← Prompt building
│   │   │   ├── crypto.ts   ← Encryption utilities
│   │   │   └── system-prompt.ts ← Detailed AI prompt spec (NEW)
│   │   ├── db.ts           ← MySQL wrapper
│   │   ├── logger.ts       ← Structured logging
│   │   └── ...
│   ├── middleware.ts       ← Auth guard + request logging
│   └── types/              ← TypeScript interfaces
└── tsconfig.json           ← TypeScript config
```
