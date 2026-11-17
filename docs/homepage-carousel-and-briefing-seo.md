# Homepage carousel and daily briefing indexing

The home cover shows up to five distinct, current AI-ranked India reports, in rank order. The carousel is manual: previous/next, numbered selectors and left/right arrows. Hidden slides are excluded from keyboard and screen-reader navigation. Only the first image loads eagerly; missing images use the existing empty-image presentation. It displays fewer than five when fewer valid rankings exist, without repeating stories.

## Permanent editions

After a successful India ranking, the AI scheduler attempts one daily briefing per Asia/Kolkata calendar date. It requires five distinct ranked publisher reports from the preceding two days and unexpired rankings. One additional model call creates the introduction and five original summaries from the supplied excerpts. Article IDs must match the input exactly; links come from the database, never model output. This validates references, not factual correctness; the reader page discloses that summaries have not been independently verified by editors.

The existing articles table stores an immutable JSON source snapshot with source_name 'Belgaum Today Briefing' and a unique india-daily-briefing-YYYY-MM-DD slug. No new tables or database migrations are required. Feed attribution remains null, so these compilations are not mixed into the publisher RSS view. They are also distinct from existing blog articles. Existing editions are not overwritten on future ranking runs. Archived or draft editions are not automatically republished.

/briefing/YYYY-MM-DD serves the saved edition, with a self canonical URL, Article JSON-LD, publication dates, publisher/author identity, original-source links and relevant image metadata. /briefing/archive lists editions, with ordinary crawlable pagination. The homepage and live briefing link to the archive and latest saved edition. The sitemap includes published, valid editions and their actual modification dates. RSS mirrors remain noindex.

## Release and measurement

- Deploy the code. The first edition appears after the next successful India AI ranking with five eligible reports. Deployment and page visits do not generate or backdate editions.
- Check the runtime log for 'Daily India briefing published'; failures log 'Daily India briefing publication deferred' and do not invalidate successful rankings.
- Confirm the dated URL returns 200 and appears in /sitemap.xml. Unknown or malformed dates return 404, never placeholder articles.
- Verify the site's Search Console property and submit https://belgaum.today/sitemap.xml. URL Inspection can confirm Google's indexing state; sitemap inclusion does not guarantee indexing or ranking.
- Existing analytics integration uses NEXT_PUBLIC_GA_ID; verification supports NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION. These public build-time values need the user's actual property IDs and a new build. Do not invent IDs or claim Search Console/analytics are configured without checking the account.
- Track search impressions/clicks, engaged readers and repeat readership. Content usefulness and editorial review remain necessary; these technical changes do not guarantee traffic.

## Checks

Run `node --test tests/daily-briefing.test.mjs tests/preview.test.mjs`.

Tests cover date boundaries, invalid dates, invented/duplicate sources, source ordering, generation failures, duplicate publication, canonical/indexing metadata, rendered source links and sitemap discovery. Run TypeScript, ESLint on changed files and a preview build. Browser review uses temporary fixture stories so it makes no production database writes or AI calls.
