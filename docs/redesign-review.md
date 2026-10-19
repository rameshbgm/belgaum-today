# Belgaum Today review

Run `npm run dev:review` and open <http://localhost:3001>.

For a production build preview, build with `READ_ONLY_PREVIEW=1 DISABLE_BACKGROUND_SCHEDULER=1 npm run build`, then run `npm run start:review`. The delivered review session uses this build so development overlays do not cover the page.

The preview reads the existing Hostinger MySQL configuration from local environment files. Credentials remain outside source control. It binds to the local computer and sets `READ_ONLY_PREVIEW=1` and `DISABLE_BACKGROUND_SCHEDULER=1`.

## Preview behavior

- Public headlines, publisher images, archives, search, pagination, topic preferences, and stored view counts use real data.
- Publisher links open the original report in a new tab. New records can legitimately show zero views.
- Analytics requests are no-ops, and the client skips tracking in preview.
- Database mutation helpers and transactions reject before reaching the driver. Mutating API requests and cron/digest endpoints are blocked.
- Feed ingestion, AI generation, email delivery, and background scheduling are disabled. Admin mutation controls are disabled. Normal cookie authentication remains required for the editorial workspace.
- Theme and followed-topic preferences remain local to the browser.

The preview flag is explicit. For normal operation use the usual build/start commands with the flag unset. Rebuild when switching between a preview build and a normal build because static pages can contain the preview state. Do not expose this review session as a production deployment.

## Design changes

The user chose the mobile Broadcast Briefing direction: cobalt, cool white, navy, self-hosted Sora and Source Sans 3, compact navigation, a prominent lead, and publisher-linked story streams. Public and editorial pages share these tokens.

The default route is now the Home landing page: the user-selected “Make sense of today” cobalt cover, an authentic Kamal Basadi photograph, a scroll-driven photographic reveal, live headline previews, a category index, a local feature and a closing reading action. The existing news feed remains at `/briefing`, linked by the Home calls to action, category breadcrumbs, menu and footer. Image credit and licensing are visible beside the photograph; the source inventory is in `.impeccable/home-assets.md`.

The lead story follows the heading directly on `/briefing`. The user removed the scrolling headline strip, including its tiles and playback/navigation controls.

Navigation order: Home, India, Business, Technology, Sports, Entertainment, Belgaum. Category search forms and subcategory tabs and their filtering code were removed. Global search and category pagination remain available. Actual view counts appear throughout article presentations.

## Validation

Commands:

```sh
npm run test:preview
npm run lint -- --quiet
READ_ONLY_PREVIEW=1 DISABLE_BACKGROUND_SCHEDULER=1 npm run build
```

The eleven isolated tests exercise preview policy, the actual request proxy and database helpers, normal tracking increments, archive queries and pagination, and retrying transient read failures. They use a fake database driver with no network connection; no mutation tests run against Hostinger.

Browser checks covered all six category pages, category pagination, global search with a category, loading older stories, followed topics, theme switching, menu navigation, and the public → login → public layout transition. Public layouts were checked at 390×844 and 1440×1000. Captures are in `.impeccable/review/`.

The independent visual review found two material issues: header keyboard focus contrast and an empty-state Most read link. Both were corrected and scored resolved; the verdict pass issued `ship` for those two findings. The original review scope and verification limits remain in `.impeccable/review/finish-review.md`.

Home-specific checks: production build and TypeScript passed; lint has no errors (33 existing warnings); all eleven isolated preview tests passed. Browser checks at 390×844, 768×1024 and 1440×1000 covered Home layout, its briefing action, Home-first navigation, the preserved India archive, an Apple search returning 20 reports, the category anchor and actual scroll-driven SVG/transform updates. No browser console errors were reported. Reduced motion is implemented in CSS and the animation controller; it was inspected in source rather than emulated in the browser. Home captures and the independent review are under `.impeccable/review/home/`.

The Home review requested a tighter mobile cover-to-reading transition and documentation of the new surface. Both were corrected in one batch. The reviewer scored both resolved and returned `ship` for those fixes in `.impeccable/review/home/finish-verdict.md`. A fresh documenter updated `DESIGN.md` and `.impeccable/design.json` from the corrected implementation. The final build includes the preview flags and is running with `npm run start:review`.

Authenticated admin actions were not tested in the browser because an authenticated session was unavailable. Their write paths remain disabled in this preview. No live data was edited, no emails were sent, and no migrations were run.

The existing AI News feature flag is preserved. Empty editorial archives reflect the current database contents.

## Production and logo verification

The site owner restored the original BT symbol and black/orange Belgaum Today wordmark. The supplied PNG is used unchanged through `BrandLogo` in the reader header, footer, editorial header and login. Its pixels match the original upload; provenance is recorded in `.impeccable/logo-assets.md`. Desktop, 390px and 320px checks confirmed proportional rendering, no horizontal overflow, and preserved 44px header controls. The footer and login branding were also inspected.

After clearing `.next`, the production build passed with `READ_ONLY_PREVIEW=0` and the public site URL. All eleven isolated tests passed. ESLint reported zero errors and 33 existing warnings. Production HTTP checks returned 200 for Home, the briefing, all six categories, search, About and login, with the restored logo and no preview banner. The search API returned twenty real reports with pagination; unauthenticated dashboard access redirected to login. These checks sent GET requests only, with background scheduling disabled. The local review application remains available through `npm run dev:review`; production uses the normal build/start commands without preview flags.
