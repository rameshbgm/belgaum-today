# Indian publisher feeds and Story Tracker rollout

Production schema status (2026-09-28): `2026-09-source-attribution-and-digest.sql`, `2026-09-indian-sources-story-tracker.sql`, and `2026-09-admin-added-feeds.sql` were applied to the configured Hostinger MySQL database. Do not rerun them there. A private pre-migration schema and feed-settings backup is at `/private/tmp/belgaum-migration-backup-20260928.json` on the migration workstation.

Admin-added RSS feeds are trusted without a second approval step. A feed must be active, hosted on its publisher's domain, and return direct links on that domain to ingest. Google News, Reuters, FeedBurner, excluded publisher domains, and World feeds are not eligible. GPT-6 Luna classifies each feed item for India relevance; uncertain or foreign-only reports stay hidden. Existing articles are shown only when their exact URL is found in an eligible RSS feed and classified as India-related.

To initialize another database, apply the three migrations above in order. Configure Indian publisher RSS feeds in Admin → RSS Feeds, then run the RSS fetch job. The scheduler also retries pending classification and builds Story Tracker timelines. If using external cron without the in-process scheduler, call `POST /api/cron/story-tracker` with `Authorization: Bearer <CRON_SECRET>` after RSS fetching. The daily digest uses the same public articles and event timelines.

Verify the homepage, category pages, search, story timelines, feed.xml, and daily digest with a current India-focused item and a foreign-only item from the same feed. The foreign-only item must not appear. If the OpenAI API is unavailable, new items stay pending and hidden until classification succeeds.
