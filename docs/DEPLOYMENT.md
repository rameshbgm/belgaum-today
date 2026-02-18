# 🚀 Belgaum Today - Production Deployment Guide

Complete step-by-step guide for deploying Belgaum Today to Hostinger Shared Hosting.

**Domain:** belgaum.today  
**Hosting:** Hostinger Shared Hosting  
**Tech Stack:** Next.js 16, MySQL 8.0, Node.js

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Setup & Testing](#local-setup--testing)
3. [Database Export](#database-export)
4. [Hostinger Configuration](#hostinger-configuration)
5. [Database Setup on Hostinger](#database-setup-on-hostinger)
6. [Application Deployment](#application-deployment)
7. [Environment Variables](#environment-variables)
8. [Cron Jobs Setup](#cron-jobs-setup)
9. [Post-Deployment Verification](#post-deployment-verification)
10. [Troubleshooting](#troubleshooting)

---

## ✅ Pre-Deployment Checklist

### Required Information

- [ ] Hostinger account credentials
- [ ] Database credentials from Hostinger
- [ ] Domain name configured (belgaum.today)
- [ ] SSL certificate enabled on Hostinger
- [ ] Git repository access (GitHub/GitLab/Bitbucket)
- [ ] OpenAI API key (if using AI features)
- [ ] Google Analytics ID (optional)
- [ ] AdSense ID (optional)

### Code Preparation

- [ ] All environment variables documented
- [ ] Database migrations tested locally
- [ ] Build process verified (`npm run build`)
- [ ] No console errors in production build
- [ ] All dependencies installed
- [ ] Secret keys generated

---

## 🔧 Local Setup & Testing

### 1. Install Dependencies

```bash
cd /Users/laxmi/ramesh/code/belgaum.today
npm install
```

### 2. Create Environment File

```bash
cp .env.example .env.local
```

Edit `.env.local` with your development credentials (see `.env.example` for all variables).

### 3. Test Local Build

```bash
# Build the application
npm run build

# Test production build locally
npm run start
```

Visit `http://localhost:3000` and verify:
- Home page loads correctly
- Articles display properly
- Admin panel accessible
- Database connections work
- No console errors

### 4. Run Database Migrations

```bash
# Ensure all migrations are applied
node scripts/migrate-run-logging.mjs
```

---

## 💾 Database Export

### Full Database Export (Recommended)

Export your complete database with all data:

```bash
# Export database (use your local credentials)
mysqldump -h 127.0.0.1 -P 3307 -u root -proot \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  belgaum_today > backup_$(date +%Y%m%d_%H%M%S).sql
```

**Location:** This creates a file like `backup_20260218_143000.sql` in your current directory.

### Export Only Structure (For Fresh Setup)

If you want to start with an empty database:

```bash
mysqldump -h 127.0.0.1 -P 3307 -u root -proot \
  --no-data \
  --routines \
  --triggers \
  belgaum_today > schema_only.sql
```

### Verify Export

```bash
# Check file size (should be > 100KB if you have data)
ls -lh backup_*.sql

# Verify SQL syntax
head -50 backup_*.sql
```

**Important Files to Backup:**
- `backup_YYYYMMDD_HHMMSS.sql` - Full database dump
- `database/schema.sql` - Original schema
- `database/migrations/*.sql` - All migration files

---

## 🖥️ Hostinger Configuration

### 1. Access Hostinger Control Panel

1. Log in to Hostinger at https://hpanel.hostinger.com
2. Select your hosting plan
3. Navigate to your domain: **belgaum.today**

### 2. Verify Domain & SSL

- Go to **Domains** section
- Ensure belgaum.today points to your hosting
- Enable **SSL Certificate** (Let's Encrypt)
- Wait for SSL activation (5-15 minutes)

### 3. Enable Node.js Support

1. Go to **Advanced → Node.js**
2. Click **Create Application**
3. Configure:
   - **Node.js version:** 20.x (latest LTS)
   - **Application mode:** Production
   - **Application root:** `/public_html/belgaum.today`
   - **Application startup file:** `server.js` (we'll create this)
   - **Entry point:** Leave empty or set to `server.js`

### 4. Configure Environment

1. In Node.js section, click **Environment Variables**
2. Add all variables from `.env.example` (see [Environment Variables](#environment-variables) section)

---

## 🗄️ Database Setup on Hostinger

### 1. Create MySQL Database

1. Go to **Databases → MySQL Databases**
2. Click **Create Database**
3. Database name: `[prefix]_belgaum` (Hostinger adds prefix automatically)
4. Create database user:
   - Username: `[prefix]_belgaum_user`
   - Password: Generate a strong password (save it!)
5. Assign user to database with **ALL PRIVILEGES**
6. Note down:
   - Database Host: Usually `localhost`
   - Database Name: Full name with prefix
   - Database User: Full username with prefix
   - Database Password: The password you created
   - Port: Usually `3306`

### 2. Import Database

#### Option A: Via phpMyAdmin (Recommended for small databases)

1. Go to **Databases → phpMyAdmin**
2. Select your database
3. Click **Import** tab
4. Choose your `backup_YYYYMMDD_HHMMSS.sql` file
5. Set **Format:** SQL
6. Click **Go**
7. Wait for completion (may take 5-30 minutes for large databases)

#### Option B: Via SSH (For large databases > 50MB)

```bash
# SSH into your Hostinger account
ssh username@your-server-ip

# Navigate to your home directory
cd ~

# Upload your SQL file via SFTP first, then import
mysql -h localhost -u [your_db_user] -p [your_db_name] < backup_YYYYMMDD_HHMMSS.sql

# Enter password when prompted
```

### 3. Verify Database Import

Via phpMyAdmin:
1. Check Tables → Should see all tables (articles, users, categories, etc.)
2. Check row counts match your local database
3. Test a query: `SELECT COUNT(*) FROM articles;`

### 4. Run Migrations (If Not in Backup)

If your backup doesn't include the new run-based logging tables:

```bash
# SSH into Hostinger
ssh username@your-server-ip

# Navigate to app directory
cd /public_html/belgaum.today

# Run migration
node scripts/migrate-run-logging.mjs
```

---

## 📦 Application Deployment

### Method 1: Git Deployment (Recommended)

#### 1. Initialize Git Repository (If Not Done)

```bash
cd /Users/laxmi/ramesh/code/belgaum.today

# Initialize Git if needed
git init

# Add all files
git add .

# Initial commit
git commit -m "Initial commit - Belgaum Today v1.0"
```

#### 2. Create Remote Repository

Create a repository on:
- **GitHub:** https://github.com/new
- **GitLab:** https://gitlab.com/projects/new
- **Bitbucket:** https://bitbucket.org/repo/create

Repository name: `belgaum-today`

#### 3. Push to Remote

```bash
# Add remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/belgaum-today.git

# Push code
git branch -M main
git push -u origin main
```

#### 4. Deploy to Hostinger via Git

```bash
# SSH into Hostinger
ssh username@your-server-ip

# Navigate to application root
cd /public_html/belgaum.today

# Clone repository
git clone https://github.com/yourusername/belgaum-today.git .

# Or if directory exists, pull changes
git pull origin main

# Install dependencies
npm install --production

# Build application
npm run build
```

### Method 2: FTP/SFTP Upload

#### 1. Prepare Build

```bash
# On local machine
cd /Users/laxmi/ramesh/code/belgaum.today

# Install and build
npm install
npm run build
```

#### 2. Upload via SFTP

Use an FTP client (FileZilla, Cyberduck, etc.):

**Connection Details:**
- Host: Your Hostinger FTP host
- Username: Your FTP username
- Password: Your FTP password
- Port: 21 (FTP) or 22 (SFTP)

**Upload these directories/files:**
- `.next/` (entire directory) → Upload to `/public_html/belgaum.today/.next/`
- `public/` → Upload to `/public_html/belgaum.today/public/`
- `node_modules/` → Upload to `/public_html/belgaum.today/node_modules/`
- `package.json`
- `package-lock.json`
- `next.config.ts`
- All other project files EXCEPT:
  - `.env.local`
  - `.git/`
  - `logs/`
  - `.next/cache/`

**Note:** Uploading `node_modules` via FTP is SLOW. Git deployment is faster.

### 3. Create Server File

Create `/public_html/belgaum.today/server.js`:

```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = false;
const hostname = 'localhost';
const port = process.env.PORT || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
```

### 4. Start Application

```bash
# In Hostinger SSH or via control panel
cd /public_html/belgaum.today

# Restart Node.js application
# Via control panel: Node.js → Restart Application
# Or via CLI:
npm run start
```

---

## 🔐 Environment Variables

Configure these in Hostinger Control Panel → Node.js → Environment Variables:

### Critical Variables (MUST SET)

```env
# Database (Get from Hostinger MySQL section)
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_prefix_belgaum_user
DATABASE_PASSWORD=your_strong_password
DATABASE_NAME=your_prefix_belgaum

# Site URL
NEXT_PUBLIC_SITE_URL=https://belgaum.today
NEXT_PUBLIC_SITE_NAME=Belgaum Today

# Security (Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-minimum-32-chars

# Cron Secrets
CRON_SECRET=your-cron-secret-key
TRENDING_CRON_SECRET=your-trending-secret-key

# Environment
NODE_ENV=production
```

### Optional Variables

```env
# OpenAI (if using AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXX

# SEO
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxx
NEXT_PUBLIC_BING_SITE_VERIFICATION=xxxx
```

### Generate Secrets

```bash
# On your local machine, generate secrets:
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('CRON_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('TRENDING_CRON_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

---

## ⏰ Cron Jobs Setup

### 1. Access Cron Jobs in Hostinger

1. Go to **Advanced → Cron Jobs**
2. Click **Create Cron Job**

### 2. RSS Feed Fetcher Cron

**Runs every 30 minutes to fetch latest news:**

- **Type:** Custom
- **Command:**
  ```bash
  curl -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"
  ```
- **Schedule:** 
  - Minute: `*/30` (every 30 minutes)
  - Hour: `*` (every hour)
  - Day: `*` (every day)
  - Month: `*` (every month)
  - Weekday: `*` (every weekday)
- **Common name:** RSS Feed Fetcher

**Alternative using wget:**
```bash
wget -q -O- "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"
```

### 3. Trending Analysis Cron

**Runs every 6 hours to analyze trending topics:**

- **Type:** Custom
- **Command:**
  ```bash
  curl -X POST "https://belgaum.today/api/cron/trending-analysis?secret=YOUR_TRENDING_CRON_SECRET"
  ```
- **Schedule:**
  - Minute: `0`
  - Hour: `*/6` (every 6 hours)
  - Day: `*`
  - Month: `*`
  - Weekday: `*`
- **Common name:** Trending Analysis

### 4. Verify Cron Jobs

Test cron endpoints manually:

```bash
# Test RSS fetcher
curl -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"

# Test trending analysis
curl -X POST "https://belgaum.today/api/cron/trending-analysis?secret=YOUR_TRENDING_CRON_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "RSS feeds processed successfully"
}
```

---

## ✅ Post-Deployment Verification

### 1. Website Health Check

Visit these URLs and verify they work:

- **Homepage:** https://belgaum.today
- **Category Pages:**
  - https://belgaum.today/india
  - https://belgaum.today/business
  - https://belgaum.today/technology
  - https://belgaum.today/entertainment
  - https://belgaum.today/sports
- **Article Page:** https://belgaum.today/article/[any-slug]
- **Search:** https://belgaum.today/search?q=test
- **RSS Feed:** https://belgaum.today/feed.xml
- **Sitemap:** https://belgaum.today/sitemap.xml
- **Robots:** https://belgaum.today/robots.txt

### 2. Admin Panel Check

- **Login:** https://belgaum.today/admin/login
- Test credentials (if you have admin user)
- **Dashboard:** https://belgaum.today/admin/dashboard
- **RSS Feeds:** https://belgaum.today/admin/feeds
- **RSS Logs:** https://belgaum.today/admin/rss-logs
- **Articles:** https://belgaum.today/admin/articles

### 3. Database Connectivity

Check admin dashboard statistics to confirm database is connected:
- Total articles count
- Recent articles displayed
- Categories populated

### 4. Performance Check

Use these tools:
- **PageSpeed Insights:** https://pagespeed.web.dev
- **GTmetrix:** https://gtmetrix.com
- **WebPageTest:** https://www.webpagetest.org

Target metrics:
- First Contentful Paint: < 1.8s
- Largest Contentful Paint: < 2.5s
- Total Blocking Time: < 200ms

### 5. SSL Certificate

- Visit https://belgaum.today
- Check for padlock icon in browser
- Verify SSL certificate is valid
- Test with: https://www.ssllabs.com/ssltest/

### 6. SEO Verification

- Submit sitemap to Google Search Console
- Submit sitemap to Bing Webmaster Tools
- Verify robots.txt is accessible
- Check meta tags on key pages

---

## 🔧 Troubleshooting

### Issue: Node.js Application Not Starting

**Symptoms:** 502 Bad Gateway or application offline

**Solutions:**
1. Check Node.js logs in Hostinger control panel
2. Verify `server.js` exists in application root
3. Ensure Node.js version is 18 or higher
4. Check if port is already in use
5. Restart application via control panel

```bash
# Check logs
cd /public_html/belgaum.today
cat logs/error.log

# Restart manually
pm2 restart all
# or
npm run start
```

### Issue: Database Connection Failed

**Symptoms:** 500 errors, "Too many connections"

**Solutions:**
1. Verify database credentials in environment variables
2. Check database user has correct privileges
3. Verify database host is `localhost` not `127.0.0.1`
4. Test connection:

```bash
mysql -h localhost -u your_db_user -p your_db_name
```

5. Increase connection pool in Hostinger if needed

### Issue: Build Failed

**Symptoms:** Build errors, missing dependencies

**Solutions:**
1. Clear node_modules and rebuild:

```bash
rm -rf node_modules .next
npm install
npm run build
```

2. Check Node.js version compatibility
3. Verify all dependencies in package.json
4. Check for TypeScript errors:

```bash
npm run lint
```

### Issue: Assets Not Loading

**Symptoms:** Images, CSS, JS not loading

**Solutions:**
1. Check file permissions: `755` for directories, `644` for files
2. Verify `.next/static` directory exists
3. Check for CORS issues in browser console
4. Clear CDN cache if using Cloudflare
5. Verify public directory is accessible

### Issue: Cron Jobs Not Running

**Symptoms:** News not updating, logs empty

**Solutions:**
1. Check cron secret matches environment variable
2. Test endpoint manually via curl
3. Check cron job schedule is correct
4. Verify cron job output/logs
5. Check API endpoint in code is not disabled

```bash
# Test manually
curl -v -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_SECRET"
```

### Issue: SSL Certificate Issues

**Symptoms:** "Not secure" warning, mixed content

**Solutions:**
1. Force HTTPS redirect in Hostinger
2. Check NEXT_PUBLIC_SITE_URL uses https://
3. Verify all asset URLs use https://
4. Clear browser cache
5. Disable HTTP in Hostinger settings

### Issue: Slow Performance

**Solutions:**
1. Enable caching in Hostinger
2. Optimize images before upload
3. Use CDN (Cloudflare)
4. Enable gzip compression
5. Increase Node.js memory limit
6. Check database query performance

---

## 📞 Support Resources

- **Hostinger Support:** 24/7 Live Chat in control panel
- **Next.js Documentation:** https://nextjs.org/docs
- **MySQL Documentation:** https://dev.mysql.com/doc/

---

## 📝 Post-Deployment Checklist

After deployment, verify:

- [ ] Website loads at https://belgaum.today
- [ ] SSL certificate active (green padlock)
- [ ] All pages accessible (home, categories, articles)
- [ ] Admin panel functional
- [ ] Database connected and displaying data
- [ ] RSS feeds working
- [ ] Cron jobs scheduled and running
- [ ] Environment variables set correctly
- [ ] Images and assets loading
- [ ] Search functionality working
- [ ] Analytics tracking (if enabled)
- [ ] Error logging configured
- [ ] Backup strategy in place
- [ ] DNS properly configured
- [ ] Email notifications working (if applicable)

---

## 🎉 Success!

Your Belgaum Today website should now be live at https://belgaum.today!

**Next Steps:**
1. Monitor logs for errors
2. Check cron job execution logs
3. Submit sitemap to search engines
4. Set up regular database backups
5. Monitor website uptime
6. Configure email alerts for errors

**Maintenance:**
- Daily: Check admin logs for errors
- Weekly: Review traffic analytics
- Monthly: Database backup
- Quarterly: Update dependencies
