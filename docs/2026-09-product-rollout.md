# Product rollout: direct publisher news and feed health

The application code, database change, source cleanup, and scheduled jobs form one release. Keep the existing RSS job paused while the schema and code are being switched.

## Before release

1. Take a fresh production database backup outside the repository. Confirm a restore path.
2. Configure `BLOCKED_SOURCE_DOMAINS` in the production Node.js environment with the excluded publisher domain. Keep this value out of Git. Publishing will fail closed when it is absent in production.
3. Pause RSS and trending jobs. Record the current deployment revision and application environment.
4. Run `node scripts/sweep-public-sources.mjs` with production database variables and inspect the dry run counts. The script archives excluded publisher stories, unresolved Google News links, and non-English stories; it does not delete them.

## Coordinated release

1. Apply `database/migrations/2026-09-world-and-feed-attribution.sql` once to the backed-up production database. It adds World, feed attribution, subscription verification fields, and reader visit storage. It also repairs existing World records and disables the audited empty or non-English feeds.
2. Deploy this application revision and restart the Node.js application. The old application should not serve traffic for long after the schema change because it does not recognize World.
3. Run `node scripts/sweep-public-sources.mjs --apply` with the same production environment. Review the reported archive counts. Do this before restoring public traffic.
4. Check the public homepage, World and Belgaum sections, search, publisher links, `/feed.xml`, and `/admin/feeds`. Confirm excluded or unresolved sources are absent. Check that feed health shows the direct publisher feeds already configured by the administrator.
5. Resume the RSS job. It can still be called through the existing `GET /api/cron/fetch-rss?secret=...` endpoint; each feed now observes its own configured interval. Inspect the first two run cycles for errors, empty feeds, local relevance, and direct publisher links.

## Daily digest activation

The digest stays hidden until `RESEND_API_KEY`, `DIGEST_FROM_EMAIL`, and a `JWT_SECRET` of at least 32 characters are configured. Verify the sending domain with the email provider. Then schedule a once-daily `GET /api/cron/daily-digest?secret=...` call using `CRON_SECRET`. Only confirmed subscribers receive mail, with at most one send per subscriber per day. Do a controlled signup, confirmation, delivery, and unsubscribe check before promoting the signup.

## Metrics and cleanup

The admin dashboard reports weekly returning Belgaum readers using a first-party reader cookie and section visit days. Source opens use publisher-link clicks. Expect these to begin from zero after deployment.

The removed SQL backup and obsolete publisher references must also be purged from all Git refs before a force push. Coordinate any force push with everyone who has cloned the repository; existing clones retain old objects until replaced and garbage collected. Do not store new SQL backups in Git.
