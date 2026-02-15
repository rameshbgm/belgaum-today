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
| AI (ai_providers, ai_models, ai_api_keys, trending_articles) | 4 |
| Logging (system_logs, ai_agent_logs) | 2 |
| Future (newsletter_subscriptions) | 1 |
| **Total** | **15** |

**Seed data automatically inserted:**

- 6 categories with colors
- 1 admin user (<admin@belgaum.today>)
- 34 RSS feeds (Hindustan Times + The Hindu)
- 5 AI providers + 9 AI models

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

# ─── AI Configuration (Optional) ───
# API keys can also be managed from the admin panel (stored encrypted in DB)
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

### Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_HOST` | Yes | `127.0.0.1` | MySQL host |
| `DATABASE_PORT` | Yes | `3306` | MySQL port |
| `DATABASE_USER` | Yes | `belgaum_user` | MySQL username |
| `DATABASE_PASSWORD` | Yes | `belgaum_pass` | MySQL password |
| `DATABASE_NAME` | Yes | `belgaum_today` | MySQL database name |
| `JWT_SECRET` | Yes | — | Secret for JWT + API key encryption. **MUST change in production** |
| `SITE_URL` | Yes | — | Full site URL (server-side) |
| `NEXT_PUBLIC_SITE_URL` | Yes | — | Full site URL (client-side, exposed to browser) |
| `NEXT_PUBLIC_SITE_NAME` | No | — | Site name for meta tags |
| `RSS_FETCH_INTERVAL_MINUTES` | No | `120` | Cron fetch interval |
| `CRON_SECRET` | Yes | — | Secret to authenticate cron endpoints |
| `OPENAI_API_KEY` | No | — | Fallback OpenAI key (prefer admin panel) |

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
└── ai-2026-02-15.log       # AI agent call logs
```

### 5.2 Log Format

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
| AI trending not updating | Verify AI API key is configured and active in admin panel |

### Logging Issues

| Problem | Solution |
|---|---|
| No log files created | Check `logs/` directory exists and is writable |
| Debug logs not showing in production | Expected — production level is `info` |
| Logs too large | Implement external log rotation/cleanup |

---

## 10. API Key Management

### Adding an AI API Key (Admin Panel)

1. Navigate to `http://localhost:3000/admin/api-keys`
2. Click "Add API Key"
3. Select the provider (OpenAI, Anthropic, etc.)
4. Enter a name (e.g., "Production Key")
5. Paste the API key
6. Click Save — key is encrypted with AES-256-GCM before storage
7. Navigate to `http://localhost:3000/admin/agents` to set default provider/model

### Supported Providers & API Key Sources

| Provider | Get API Key |
|---|---|
| OpenAI | <https://platform.openai.com/api-keys> |
| Anthropic | <https://console.anthropic.com/settings/keys> |
| DeepSeek | <https://platform.deepseek.com/api_keys> |
| Google Gemini | <https://aistudio.google.com/app/apikey> |
| SarvamAI | <https://dashboard.sarvam.ai> |

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
├── src/
│   ├── app/                ← Pages + API routes
│   ├── components/         ← React components
│   ├── lib/                ← Core libraries (DB, auth, RSS, AI, logger)
│   ├── middleware.ts       ← Auth guard + request logging
│   └── types/              ← TypeScript interfaces
└── tsconfig.json           ← TypeScript config
```
