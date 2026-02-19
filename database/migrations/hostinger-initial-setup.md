# Hostinger Database — Initial Setup Migration

**Date:** 2026-02-20  
**Performed by:** GitHub Copilot (automated via `mysql` CLI from local machine)  
**Target:** Hostinger MySQL — `u915919430_belgaum_today`  
**Server:** `srv873.hstgr.io:3306`  
**Script executed:** `database/schema.sql`

---

## Overview

This migration bootstrapped the production MySQL database on Hostinger by running the full `database/schema.sql` file. It created all 16 tables and inserted the default seed data required for the application to run.

---

## Pre-migration Steps

1. Verified `mysql` CLI was available locally (`brew install mysql-client`).
2. Confirmed remote MySQL access was enabled on Hostinger (hPanel → Remote MySQL → Add IP).
3. Resolved correct database name by running `SHOW DATABASES` — the database is  
   `u915919430_belgaum_today` (not `u915919430_tinycut_db` as initially assumed).

---

## Command Executed

```bash
mysql -h srv873.hstgr.io -P 3306 \
  -u u915919430_belgaum_user \
  -p'<password>' \
  u915919430_belgaum_today \
  --connect-timeout=15 \
  < database/schema.sql
```

---

## Tables Created (16)

| Table | Purpose |
|---|---|
| `categories` | News categories (India, Business, Technology, Entertainment, Sports, Belgaum) |
| `users` | Admin/editor user accounts |
| `articles` | Main article store (RSS-fetched + AI-processed) |
| `tags` | Freeform article tags |
| `article_tags` | Junction table — articles ↔ tags |
| `article_views` | Per-article view tracking |
| `source_clicks` | Outbound source link click tracking |
| `newsletter_subscriptions` | Future newsletter feature |
| `rss_feed_config` | RSS feed source configuration (URL, interval, category) |
| `rss_fetch_logs` | Per-feed fetch audit log (success/partial/error, counts, duration) |
| `trending_articles` | AI-ranked trending articles per category |
| `ai_providers` | Unified AI provider config (OpenAI, Anthropic, Gemini, DeepSeek, Sarvam) |
| `ai_system_prompts` | Global editorial system prompt + guardrails |
| `ai_provider_events` | Audit trail for AI config changes |
| `ai_agent_logs` | Per-call AI agent execution log |
| `system_logs` | General operational logs (cron, admin actions) |

---

## Seed Data Inserted

### Categories (6)
| Name | Slug | Color |
|---|---|---|
| India | `india` | `#FF9933` |
| Business | `business` | `#4CAF50` |
| Technology | `technology` | `#2196F3` |
| Entertainment | `entertainment` | `#E91E63` |
| Sports | `sports` | `#FF5722` |
| Belgaum | `belgaum` | `#9C27B0` |

### Admin User (1)
| Email | Role | Note |
|---|---|---|
| `admin@belgaum.today` | `admin` | Default password — **change in production** |

### RSS Feed Sources (36)
Feeds from Hindustan Times and The Hindu covering all 6 categories, each with a 120-minute fetch interval. Managed from **Admin → Feeds**.

### AI Providers (5)
| Provider | Model | Active |
|---|---|---|
| OpenAI | `gpt-4o-mini` | ✅ |
| Anthropic | `claude-3-5-sonnet-20241022` | ❌ |
| DeepSeek | `deepseek-chat` | ❌ |
| Google Gemini | `gemini-2.0-flash` | ❌ |
| SarvamAI | `sarvam-m` | ❌ |

### AI System Prompt (1)
Default editorial prompt: *"You are a senior Indian news editor. Rank stories by impact, novelty, credibility, and relevance to readers."*

---

## Post-migration Verification

```sql
SHOW TABLES;                              -- 16 tables
SELECT COUNT(*) FROM categories;          -- 6
SELECT COUNT(*) FROM users;               -- 1
SELECT COUNT(*) FROM rss_feed_config;     -- 36
SELECT COUNT(*) FROM ai_providers;        -- 5
```

All passed ✅

---

## Environment Variable

Set the following in Hostinger hPanel → Node.js → Environment Variables:

```
DATABASE_URL=mysql://u915919430_belgaum_user:<password>@srv873.hstgr.io:3306/u915919430_belgaum_today
```

---

## Notes

- All `CREATE TABLE` statements use `IF NOT EXISTS` — the script is safe to re-run.
- All `INSERT` statements use `ON DUPLICATE KEY UPDATE` — no duplicate seed rows.
- The `articles` table has a `FULLTEXT` index on `(title, excerpt, content)` for search.
- The `ai_providers` table enforces a singleton constraint — only one provider can be active at a time via a generated `active_singleton` column.
