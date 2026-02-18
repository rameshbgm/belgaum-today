# 📝 Configuration Files Summary

Quick reference for all configuration files needed for production deployment.

---

## 1. server.js (Required for Hostinger)

**Location:** `/public_html/belgaum.today/server.js`

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

---

## 2. .htaccess (Optional - For HTTPS redirect)

**Location:** `/public_html/belgaum.today/.htaccess`

```apache
# Force HTTPS
RewriteEngine On
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/javascript "access plus 1 month"
</IfModule>

# Security Headers
<IfModule mod_headers.c>
  Header set X-Content-Type-Options "nosniff"
  Header set X-Frame-Options "SAMEORIGIN"
  Header set X-XSS-Protection "1; mode=block"
  Header set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 3. Environment Variables (Hostinger Control Panel)

**Location:** Hostinger → Node.js → Environment Variables

### Critical Variables

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=u123456789_belgaum_user
DATABASE_PASSWORD=your_strong_password_here
DATABASE_NAME=u123456789_belgaum

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://belgaum.today
NEXT_PUBLIC_SITE_NAME=Belgaum Today
NODE_ENV=production

# Security
JWT_SECRET=generate-with-openssl-rand-base64-32
CRON_SECRET=generate-with-openssl-rand-base64-32
TRENDING_CRON_SECRET=generate-with-openssl-rand-base64-32
```

### Optional Variables

```env
# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxx
OPENAI_MODEL=gpt-4o-mini
OPENAI_TEMPERATURE=0.3
OPENAI_MAX_TOKENS=1000
OPENAI_REQUEST_TIMEOUT_MS=45000

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_META_PIXEL_ID=XXXXXXXXXXXXXXXX

# SEO
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_BING_SITE_VERIFICATION=xxxxxxxxxxxxxxxxxx
```

---

## 4. Cron Jobs Configuration

**Location:** Hostinger → Advanced → Cron Jobs

### RSS Feed Fetcher

```
Command: curl -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"
Schedule: */30 * * * * (Every 30 minutes)
Name: RSS Feed Fetcher
```

**Breakdown:**
- Minute: `*/30` (every 30 minutes)
- Hour: `*` (every hour)
- Day: `*` (every day)
- Month: `*` (every month)
- Weekday: `*` (every weekday)

### Trending Analysis

```
Command: curl -X POST "https://belgaum.today/api/cron/trending-analysis?secret=YOUR_TRENDING_CRON_SECRET"
Schedule: 0 */6 * * * (Every 6 hours)
Name: Trending Analysis
```

**Breakdown:**
- Minute: `0` (at minute 0)
- Hour: `*/6` (every 6 hours)
- Day: `*`
- Month: `*`
- Weekday: `*`

---

## 5. Database Configuration

### Connection Settings (from Hostinger)

```
Host: localhost
Port: 3306
Database Name: u123456789_belgaum (with your prefix)
Username: u123456789_belgaum_user (with your prefix)
Password: [Your generated password]
```

### Required Tables

Ensure these tables exist after import:

```sql
-- Core tables
articles
categories
users
tags
article_tags

-- RSS system
rss_feed_config
rss_fetch_logs
rss_fetch_runs
rss_fetch_items

-- Analytics
article_views
source_clicks
trending_topics
```

---

## 6. Node.js Application Settings

**In Hostinger Control Panel → Node.js**

```
Node.js Version: 20.x (Latest LTS)
Application Mode: Production
Application Root: /public_html/belgaum.today
Application Startup File: server.js
Entry Point: server.js
```

---

## 7. File Permissions

Set correct permissions via File Manager or SSH:

```bash
# Directories
find /public_html/belgaum.today -type d -exec chmod 755 {} \;

# Files
find /public_html/belgaum.today -type f -exec chmod 644 {} \;

# Executable scripts
chmod +x /public_html/belgaum.today/scripts/*.sh
```

---

## 8. DNS Configuration (if needed)

**If domain registered elsewhere:**

Update nameservers to:
```
ns1.dns-parking.com
ns2.dns-parking.com
```

**Or configure A record:**
```
Type: A
Name: @
Points to: [Your Hostinger server IP]
TTL: 14400
```

**WWW subdomain:**
```
Type: CNAME
Name: www
Points to: belgaum.today
TTL: 14400
```

---

## 9. Cloudflare Configuration (Optional)

If using Cloudflare CDN:

### DNS Settings
```
Type: A
Name: @
Content: [Hostinger IP]
Proxy status: Proxied (orange cloud)

Type: CNAME
Name: www
Content: belgaum.today
Proxy status: Proxied
```

### SSL/TLS Settings
```
Mode: Full (strict)
Always Use HTTPS: On
Automatic HTTPS Rewrites: On
```

### Performance
```
Auto Minify: JS, CSS, HTML (all enabled)
Brotli: On
Rocket Loader: On
```

### Caching
```
Caching Level: Standard
Browser Cache TTL: 4 hours
```

---

## 10. Git Configuration

### Remote Repository

```bash
# Add remote
git remote add origin https://github.com/yourusername/belgaum-today.git

# Or SSH
git remote add origin git@github.com:yourusername/belgaum-today.git
```

### .gitignore (Already configured)

Key exclusions:
```
/node_modules
/.next/
.env.local
.env.production
logs/*.log
database/backups/*.sql
```

---

## 11. Package.json Scripts

Ensure these scripts are available:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

---

## 12. Security Checklist

### Secrets Generation

Generate secure secrets:

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Cron Secrets
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### Verification

- [ ] All secrets are unique
- [ ] No default passwords used
- [ ] `JWT_SECRET` is minimum 32 characters
- [ ] Database password is strong (16+ chars, mixed)
- [ ] No secrets committed to Git
- [ ] `.env.local` not uploaded to server

---

## 13. Backup Configuration

### Automated Backups

**Database Backup (Weekly):**
```bash
# Add to cron
0 2 * * 0 mysqldump -h localhost -u USER -pPASSWORD DATABASE > /home/backup/db_$(date +\%Y\%m\%d).sql
```

**File Backup:**
- Enable Hostinger automatic backups
- Schedule: Weekly
- Retention: 30 days

---

## 14. Monitoring & Logs

### Log Locations

```
Application Logs: /public_html/belgaum.today/logs/app.log
Error Logs: /public_html/belgaum.today/logs/error.log
Node.js Logs: View in Hostinger Control Panel
Cron Logs: /home/username/cron_logs/
```

### Log Rotation

Add to cron (monthly):
```bash
0 0 1 * * find /public_html/belgaum.today/logs -name "*.log" -mtime +30 -delete
```

---

## 15. Quick Commands Reference

### Deployment
```bash
# Build
npm run build

# Start
npm run start

# Restart (via Hostinger control panel or)
pm2 restart all
```

### Git
```bash
# Pull latest
git pull origin main

# Rebuild after update
npm install --production
npm run build

# Restart application
```

### Database
```bash
# Backup
mysqldump -h localhost -u USER -pPASS DB > backup.sql

# Import
mysql -h localhost -u USER -pPASS DB < backup.sql

# Run migration
node scripts/migrate-run-logging.mjs
```

---

## 📞 Support & Resources

- **Documentation:** `docs/DEPLOYMENT.md`
- **Setup Guide:** `docs/HOSTINGER-SETUP.md`
- **Checklist:** `docs/DEPLOYMENT-CHECKLIST.md`
- **Hostinger Support:** 24/7 Live Chat
- **Emergency:** https://support.hostinger.com

---

**Last Updated:** February 18, 2026  
**Version:** 1.0  
**Domain:** belgaum.today
