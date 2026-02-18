# 🚀 Production Deployment Checklist

Quick reference checklist for deploying Belgaum Today to Hostinger.

---

## 📋 Pre-Deployment

### Local Preparation
- [ ] All code committed to Git
- [ ] `.env.example` file created
- [ ] `.gitignore` properly configured
- [ ] Application builds successfully (`npm run build`)
- [ ] All tests passing
- [ ] No console errors in production build

### Database Preparation
- [ ] Database schema up to date
- [ ] All migrations applied
- [ ] Database exported using export script
- [ ] Export file verified (file size > 0)
- [ ] Sensitive data reviewed/cleaned

### Security
- [ ] JWT secret generated (min 32 chars)
- [ ] Cron secrets generated
- [ ] Database password is strong
- [ ] No hardcoded secrets in code
- [ ] Admin user created with strong password

---

## 🖥️ Hostinger Setup

### Domain & SSL
- [ ] Domain belgaum.today configured
- [ ] Nameservers pointed to Hostinger
- [ ] SSL certificate installed
- [ ] HTTPS redirect enabled
- [ ] SSL verified at https://www.ssllabs.com

### Database
- [ ] MySQL database created
- [ ] Database user created with strong password
- [ ] User assigned to database with ALL PRIVILEGES
- [ ] Database credentials noted securely
- [ ] Database imported successfully
- [ ] All tables present and populated
- [ ] Row counts verified

### Node.js Application
- [ ] Node.js support enabled (v20.x)
- [ ] Application created in control panel
- [ ] Application root set: `/public_html/belgaum.today`
- [ ] Application startup file: `server.js`
- [ ] Application mode: Production

### Environment Variables
- [ ] DATABASE_HOST set
- [ ] DATABASE_PORT set
- [ ] DATABASE_USER set
- [ ] DATABASE_PASSWORD set
- [ ] DATABASE_NAME set
- [ ] NEXT_PUBLIC_SITE_URL set
- [ ] JWT_SECRET set (min 32 chars)
- [ ] CRON_SECRET set
- [ ] TRENDING_CRON_SECRET set
- [ ] NODE_ENV=production set
- [ ] Optional: OPENAI_API_KEY set
- [ ] Optional: Google Analytics ID set

---

## 📦 Code Deployment

### Git Repository
- [ ] Git repository created (GitHub/GitLab/Bitbucket)
- [ ] Code pushed to remote
- [ ] Repository accessible

### File Upload
**Option A: Git Clone (Recommended)**
- [ ] SSH access verified
- [ ] Repository cloned to `/public_html/belgaum.today`
- [ ] Dependencies installed (`npm install --production`)
- [ ] Application built (`npm run build`)

**Option B: SFTP Upload**
- [ ] All necessary files uploaded
- [ ] `.next/` directory uploaded
- [ ] `node_modules/` installed on server
- [ ] File permissions correct (755/644)

### Server Configuration
- [ ] `server.js` file created
- [ ] Application started
- [ ] Application status: Running

---

## ⏰ Cron Jobs

### RSS Feed Fetcher
- [ ] Cron job created
- [ ] Schedule: Every 30 minutes (`*/30 * * * *`)
- [ ] URL: `https://belgaum.today/api/cron/fetch-rss?secret=YOUR_SECRET`
- [ ] Secret matches environment variable
- [ ] Test run successful

### Trending Analysis
- [ ] Cron job created
- [ ] Schedule: Every 6 hours (`0 */6 * * *`)
- [ ] URL: `https://belgaum.today/api/cron/trending-analysis?secret=YOUR_SECRET`
- [ ] Secret matches environment variable
- [ ] Test run successful

---

## ✅ Verification

### Website Health
- [ ] Homepage loads: https://belgaum.today
- [ ] All category pages work
- [ ] Article pages display correctly
- [ ] Search functionality works
- [ ] RSS feed accessible: https://belgaum.today/feed.xml
- [ ] Sitemap accessible: https://belgaum.today/sitemap.xml
- [ ] Robots.txt accessible

### Admin Panel
- [ ] Admin login works: https://belgaum.today/admin/login
- [ ] Dashboard displays data
- [ ] Articles management functional
- [ ] RSS Feeds page works
- [ ] RSS Logs displaying runs
- [ ] Can manually trigger RSS fetch

### Database
- [ ] Articles displaying on frontend
- [ ] Categories populated
- [ ] View counts incrementing
- [ ] Database queries executing fast (< 500ms)

### Performance
- [ ] PageSpeed score > 80
- [ ] First Contentful Paint < 2s
- [ ] Images loading properly
- [ ] No 404 errors
- [ ] No console errors

### Security
- [ ] SSL certificate valid (green padlock)
- [ ] All pages using HTTPS
- [ ] No mixed content warnings
- [ ] Authentication working
- [ ] Admin panel password-protected

---

## 📊 SEO & Analytics

### Search Engines
- [ ] Google Search Console set up
- [ ] Sitemap submitted to Google
- [ ] Bing Webmaster Tools set up
- [ ] Sitemap submitted to Bing
- [ ] Google verification code set
- [ ] Bing verification code set

### Analytics
- [ ] Google Analytics installed
- [ ] GA tracking verified
- [ ] AdSense set up (if applicable)
- [ ] Meta Pixel installed (if applicable)

---

## 🔧 Post-Deployment

### Monitoring
- [ ] Uptime monitoring set up
- [ ] Error logging configured
- [ ] Application logs accessible
- [ ] Database performance monitored

### Backups
- [ ] Automated backups enabled
- [ ] Backup schedule configured (daily/weekly)
- [ ] Backup restoration tested
- [ ] Off-site backup solution considered

### Documentation
- [ ] Team members have access
- [ ] Credentials securely stored (password manager)
- [ ] Deployment process documented
- [ ] Emergency contacts noted

---

## 🚨 Troubleshooting Reference

### Common Issues

**502 Bad Gateway**
- Check Node.js application status
- Restart application via control panel
- Check server logs for errors
- Verify `server.js` exists

**Database Connection Errors**
- Verify environment variables
- Check database credentials
- Test database connection via phpMyAdmin
- Check connection pool settings

**Cron Jobs Not Running**
- Test endpoints manually with curl
- Verify cron secrets match
- Check cron job logs
- Verify schedule is correct

**Assets Not Loading**
- Check file permissions
- Clear browser cache
- Verify `.next/static` directory
- Check CDN/Cloudflare settings

---

## 📞 Support Contacts

- **Hostinger Support:** 24/7 Live Chat in control panel
- **Emergency:** support@hostinger.com
- **Documentation:** See `docs/DEPLOYMENT.md`
- **Hostfinger Setup:** See `docs/HOSTINGER-SETUP.md`

---

## ✅ Final Sign-Off

**Deployment Date:** _______________

**Deployed By:** _______________

**Verified By:** _______________

**Production URL:** https://belgaum.today

**Status:** 🟢 Live and Operational

---

## 📝 Notes

Additional notes about this deployment:

_____________________________________________________________________

_____________________________________________________________________

_____________________________________________________________________

---

**Congratulations! 🎉**

Belgaum Today is now live in production!
