# 🖥️ Hostinger Specific Setup Guide

Detailed configuration guide for deploying Belgaum Today on Hostinger Shared Hosting.

---

## 📋 Prerequisites

- Hostinger Premium/Business hosting plan
- Domain belgaum.today configured
- SSH access enabled (in some plans)
- Node.js support available

---

## 🚀 Hostinger Control Panel Setup

### 1. Initial Login

1. Visit https://hpanel.hostinger.com
2. Login with your credentials
3. Select your hosting account
4. Locate domain: **belgaum.today**

---

## 🌐 Domain & SSL Configuration

### 1. Domain Setup

**If domain is external (registered elsewhere):**

1. Go to **Domains → DNS Zone**
2. Update nameservers at your registrar:
   ```
   ns1.dns-parking.com
   ns2.dns-parking.com
   ```
3. Wait 24-48 hours for propagation

**If domain is with Hostinger:**

1. Already configured automatically
2. Verify in **Domains** section

### 2. SSL Certificate

1. Navigate to **Security → SSL**
2. Select domain: belgaum.today
3. Click **Install SSL** (Free Let's Encrypt)
4. Choose **Install Free SSL**
5. Wait 5-15 minutes for activation
6. Verify SSL is active (green checkmark)

### 3. Force HTTPS

1. Go to **Advanced → .htaccess Editor** or **Redirects**
2. Add HTTPS redirect:
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   ```

---

## 🗄️ MySQL Database Setup

### 1. Create Database

1. Go to **Databases → MySQL Databases**
2. Click **Create Database**
3. Enter database name: `belgaum` (Hostinger will add prefix)
4. Click **Create**
5. Note the full database name (e.g., `u123456789_belgaum`)

### 2. Create Database User

1. In same section, scroll to **MySQL Users**
2. Click **Create User**
3. Username: `belgaum_user`
4. Password: Generate strong password (click generate icon)
   - **IMPORTANT:** Copy and save this password securely!
5. Click **Create**
6. Note full username (e.g., `u123456789_belgaum_user`)

### 3. Assign User to Database

1. Scroll to **Add User to Database**
2. Select user: `u123456789_belgaum_user`
3. Select database: `u123456789_belgaum`
4. Check **ALL PRIVILEGES**
5. Click **Add**

### 4. Note Database Credentials

**Save these for environment variables:**

```
Database Host: localhost
Database Port: 3306
Database Name: u123456789_belgaum (your actual name)
Database User: u123456789_belgaum_user (your actual user)
Database Password: [the password you generated]
```

### 5. Access phpMyAdmin

1. Go to **Databases → phpMyAdmin**
2. Click **Manage** next to your database
3. Opens phpMyAdmin interface
4. You'll use this to import your database

---

## 📦 Import Database

### Method 1: phpMyAdmin (Recommended for databases < 50MB)

1. **Access phpMyAdmin**
   - From Hostinger: Databases → phpMyAdmin
   - Click on your database name in left sidebar

2. **Import Database**
   - Click **Import** tab
   - Click **Choose File**
   - Select your `backup_YYYYMMDD_HHMMSS.sql` file
   - Set **Format:** SQL
   - **Character set:** utf8mb4_unicode_ci
   - **Format-Specific Options:**
     - Allow interrupt: ✓ Checked
     - Partial import: ✓ Checked (if large file)
   - Click **Go**

3. **Monitor Import**
   - Progress bar will show
   - For large databases, this may take 10-30 minutes
   - Do not close the browser window

4. **Verify Import**
   - Click on database name
   - Verify all tables are present:
     ```
     articles
     categories
     users
     rss_feed_config
     rss_fetch_logs
     rss_fetch_runs
     rss_fetch_items
     article_views
     source_clicks
     trending_topics
     tags
     article_tags
     ```
   - Check row counts match your local database

### Method 2: SSH Import (For databases > 50MB)

**If you have SSH access:**

1. **Upload SQL File via SFTP**
   ```
   Host: your-hostinger-server.com
   Port: 22
   Username: your-ftp-username
   Password: your-ftp-password
   ```
   Upload your SQL file to: `/home/username/`

2. **SSH into Server**
   ```bash
   ssh username@your-server.hostinger.com
   ```

3. **Import Database**
   ```bash
   mysql -h localhost \
     -u u123456789_belgaum_user \
     -p \
     u123456789_belgaum < backup_YYYYMMDD_HHMMSS.sql
   ```
   - Enter password when prompted
   - Wait for import to complete

4. **Verify Import**
   ```bash
   mysql -h localhost -u u123456789_belgaum_user -p u123456789_belgaum -e "SHOW TABLES;"
   ```

### Method 3: Split Large Files

If your database is too large (> 50MB):

1. **Split SQL File Locally**
   ```bash
   # On your Mac
   split -l 50000 backup_20260218.sql backup_part_
   ```

2. **Import Each Part**
   - Import `backup_part_aa` first
   - Then `backup_part_ab`
   - Continue until all parts imported

---

## 📁 File Manager Setup

### 1. Access File Manager

1. Go to **Files → File Manager**
2. Navigate to `/public_html/`
3. This is your web root

### 2. Create Application Directory

1. Inside `/public_html/`, create folder: `belgaum.today`
2. This will be your application root
3. Path: `/public_html/belgaum.today/`

### 3. Directory Structure

Your final structure should be:
```
/public_html/
└── belgaum.today/
    ├── .next/
    ├── node_modules/
    ├── public/
    ├── src/
    ├── package.json
    ├── next.config.ts
    └── server.js
```

---

## ⚙️ Node.js Application Setup

### 1. Enable Node.js

1. Go to **Advanced → Node.js**
2. If not available, contact Hostinger support to enable
3. Click **Create Application**

### 2. Configure Application

**Application Settings:**
- **Node.js version:** 20.x (latest LTS)
- **Application mode:** Production
- **Application root:** `/public_html/belgaum.today`
- **Application URL:** https://belgaum.today
- **Application startup file:** `server.js`
- **Passenger log file:** Leave default

Click **Create**

### 3. Application Commands

After creation, you'll see:
- **Restart Application** button
- **Environment Variables** section
- **NPM Install** button

---

## 🔐 Environment Variables Configuration

### 1. Access Environment Section

1. In Node.js application details
2. Click **Environment Variables** tab
3. Click **Add Variable** for each

### 2. Add Critical Variables

Add these one by one (click **Add Variable** for each):

**Database Configuration:**
```
Name: DATABASE_HOST
Value: localhost

Name: DATABASE_PORT
Value: 3306

Name: DATABASE_USER
Value: u123456789_belgaum_user

Name: DATABASE_PASSWORD
Value: [your generated password]

Name: DATABASE_NAME
Value: u123456789_belgaum
```

**Application Configuration:**
```
Name: NEXT_PUBLIC_SITE_URL
Value: https://belgaum.today

Name: NEXT_PUBLIC_SITE_NAME
Value: Belgaum Today

Name: NODE_ENV
Value: production
```

**Security Keys:**

Generate secrets on your Mac:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

```
Name: JWT_SECRET
Value: [generated secret, min 32 chars]

Name: CRON_SECRET
Value: [generated secret]

Name: TRENDING_CRON_SECRET
Value: [generated secret]
```

**Optional - OpenAI (if using AI features):**
```
Name: OPENAI_API_KEY
Value: sk-xxxxxxxxxxxxx

Name: OPENAI_MODEL
Value: gpt-4o-mini

Name: OPENAI_TEMPERATURE
Value: 0.3

Name: OPENAI_MAX_TOKENS
Value: 1000
```

**Optional - Analytics:**
```
Name: NEXT_PUBLIC_GA_ID
Value: G-XXXXXXXXXX

Name: NEXT_PUBLIC_ADSENSE_ID
Value: ca-pub-XXXXXXXX
```

### 3. Save Environment Variables

- Click **Save** after adding all variables
- Application will restart automatically

---

## 📤 Upload Application Files

### Method 1: Git (Recommended)

**If Git is available via SSH:**

```bash
# SSH into Hostinger
ssh username@your-server.hostinger.com

# Navigate to application directory
cd /public_html/belgaum.today

# Clone repository
git clone https://github.com/yourusername/belgaum-today.git .

# Install dependencies
npm install --production

# Build application
npm run build
```

### Method 2: SFTP Upload

**Using FileZilla or similar:**

1. **Connect via SFTP**
   ```
   Host: your-server.hostinger.com
   Port: 22
   Protocol: SFTP
   Username: your-ftp-username
   Password: your-ftp-password
   ```

2. **Navigate to Directory**
   - Remote: `/public_html/belgaum.today/`
   - Local: Your project folder

3. **Upload Files**
   
   **Upload these:**
   - `.next/` folder (entire)
   - `public/` folder
   - `src/` folder
   - `scripts/` folder
   - `database/` folder
   - `package.json`
   - `package-lock.json`
   - `next.config.ts`
   - `tsconfig.json`
   - `postcss.config.mjs`
   - `tailwind.config.ts`

   **DO NOT upload:**
   - `.env.local` (use environment variables instead)
   - `.git/` folder
   - `node_modules/` (install on server)
   - `logs/` folder

4. **Install Dependencies on Server**
   ```bash
   # Via SSH
   cd /public_html/belgaum.today
   npm install --production
   ```

---

## 🔄 Create Server.js

Create file `/public_html/belgaum.today/server.js`:

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

**Via File Manager:**
1. Navigate to `/public_html/belgaum.today/`
2. Click **New File**
3. Name: `server.js`
4. Paste the code above
5. Save

---

## 🚀 Build & Start Application

### 1. Build Application

**Via SSH:**
```bash
cd /public_html/belgaum.today
npm run build
```

**This will:**
- Create optimized production build
- Generate `.next/` folder
- Take 2-5 minutes

### 2. Start Application

**Via Hostinger Control Panel:**
1. Go to **Node.js** section
2. Click **Restart Application**
3. Status should show "Running"

**Via SSH:**
```bash
cd /public_html/belgaum.today
npm run start
```

### 3. Verify Application

- Visit: https://belgaum.today
- Should see your website
- Check browser console for errors

---

## ⏰ Cron Jobs Configuration

### 1. Access Cron Jobs

1. Go to **Advanced → Cron Jobs**
2. Click **Create Cron Job**

### 2. RSS Feed Fetcher Cron

**Fetches news every 30 minutes:**

**Configuration:**
- **Type:** Custom
- **Command:**
  ```bash
  curl -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"
  ```
  Replace `YOUR_CRON_SECRET` with the secret you set in environment variables

**Schedule:**
- Minute: `*/30`
- Hour: `*`
- Day: `*`
- Month: `*`
- Weekday: `*`

**Settings:**
- Email output: Off (unless you want emails)
- Common name: `RSS Feed Fetcher`

Click **Create**

### 3. Trending Analysis Cron

**Analyzes trending topics every 6 hours:**

**Configuration:**
- **Type:** Custom
- **Command:**
  ```bash
  curl -X POST "https://belgaum.today/api/cron/trending-analysis?secret=YOUR_TRENDING_CRON_SECRET"
  ```

**Schedule:**
- Minute: `0`
- Hour: `*/6`
- Day: `*`
- Month: `*`
- Weekday: `*`

**Settings:**
- Email output: Off
- Common name: `Trending Analysis`

Click **Create**

### 4. Test Cron Jobs

**Via command line:**
```bash
# Test RSS fetcher
curl -X POST "https://belgaum.today/api/cron/fetch-rss?secret=YOUR_CRON_SECRET"

# Test trending analysis
curl -X POST "https://belgaum.today/api/cron/trending-analysis?secret=YOUR_TRENDING_CRON_SECRET"
```

Expected response:
```json
{"success":true,"message":"..."}
```

---

## 🔍 Monitoring & Logs

### 1. Application Logs

**Via File Manager:**
- Navigate to: `/public_html/belgaum.today/logs/`
- Files:
  - `app.log` - Application logs
  - `error.log` - Error logs
  - `access.log` - Access logs

### 2. Node.js Logs

**Via Control Panel:**
1. Go to **Node.js**
2. Click on your application
3. View **Application Logs**

### 3. Database Logs

**Via phpMyAdmin:**
1. Access phpMyAdmin
2. Check slow query log
3. Monitor connection status

---

## 🔧 Performance Optimization

### 1. Enable Caching

**In .htaccess** (create if doesn't exist):
```apache
# Enable compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Browser caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### 2. Cloudflare Integration

1. Sign up at cloudflare.com
2. Add domain: belgaum.today
3. Update nameservers in Hostinger
4. Enable:
   - Auto minify (JS, CSS, HTML)
   - Brotli compression
   - Rocket Loader
   - Always use HTTPS

### 3. Optimize Database

**Via phpMyAdmin:**
```sql
-- Optimize all tables
OPTIMIZE TABLE articles, categories, users, rss_feed_config, rss_fetch_logs;
```

---

## 🛡️ Security Checklist

- [ ] SSL certificate installed and active
- [ ] HTTPS redirect enabled
- [ ] Strong database password used
- [ ] JWT secret changed from default
- [ ] Cron secrets are unique and strong
- [ ] File permissions correct (755/644)
- [ ] .env.local not uploaded to server
- [ ] Database user has minimal privileges needed
- [ ] Admin password is strong
- [ ] Regular backups scheduled

---

## 🔄 Backup Strategy

### 1. Database Backups

**Via phpMyAdmin:**
1. Select database
2. Click **Export**
3. Method: Quick
4. Format: SQL
5. Click **Go**

**Scheduled Backups:**
- Set up Hostinger automatic backups
- Go to **Backups** section
- Enable weekly backups

### 2. File Backups

**Via File Manager:**
1. Select `/public_html/belgaum.today/`
2. Right-click → **Compress**
3. Download ZIP file

---

## 📞 Hostinger Support

**If you encounter issues:**

1. **Live Chat:** Available 24/7 in control panel
2. **Help Center:** https://support.hostinger.com
3. **Submit Ticket:** Via control panel

**Common Support Requests:**
- Enable Node.js support
- Increase resource limits
- SSL certificate issues
- Database performance optimization

---

## ✅ Final Verification Checklist

- [ ] Website loads at https://belgaum.today
- [ ] SSL certificate active (green padlock)
- [ ] All pages loading correctly
- [ ] Images displaying properly
- [ ] Admin panel accessible
- [ ] Database queries working
- [ ] Cron jobs scheduled
- [ ] Environment variables set
- [ ] Error logs clean
- [ ] Performance metrics acceptable

---

## 🎉 Deployment Complete!

Your Belgaum Today website is now live on Hostinger!

**Maintenance Tasks:**
- Check logs daily for errors
- Monitor cron job execution
- Review analytics weekly
- Backup database weekly
- Update dependencies monthly
- Review security quarterly
