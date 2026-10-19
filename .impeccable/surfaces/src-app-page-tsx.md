---
version: 1
slug: "src-app-page-tsx"
primary_target: "src/app/page.tsx"
related_targets: ["src/app/home.css","src/components/home/HomeMotion.tsx"]
---

# Home: Make sense of today

Scope: src/app/page.tsx, src/app/home.css, src/components/home/HomeMotion.tsx; shared navigation adds Home before the existing categories. Visitor mode: Persuade. The existing Read surface moves intact to /briefing.

Audience: mobile readers discovering Belgaum Today. Job: explain the national and local coverage and invite an original-source read. Primary action: Read the briefing. Secondary: Explore categories, a native anchor into six category links. Real headlines, publisher names, and stored view counts prove the reading experience below the cover.

User approval: structured reply on 2026-10-20 selected “Make sense of today — bold cobalt cover.” Approved comp: .impeccable/mocks/decision/home-cover.png, approval and exact prompt in adjacent JSON. Surface seed 3ea3ae07, grounded candidate 4. Established Broadcast Briefing identity remains authoritative. Flat comp cobalt sampled RGB 35,75,231; existing primary #2F4BEB retains the same saturated cobalt identity. Neutral fields use established cool white #F5F7FC, navy #17243E and white. Sora and Source Sans 3 remain fixed.

First viewport: compact masthead, white Home-first navigation, full cobalt cover, oversized white three-line mobile headline, supporting sentence, white primary action and a secondary down link. A real local heritage photograph rises from the lower right in a curved frame and enters the cool-white next section, headed “Across India. Closer to home.” Desktop expands the same cover into headline and action columns.

Signature motion: a single short headline entrance; as the reader scrolls, the rising photo frame unfolds into a full window, with bounded 24px copy movement and 7px photo movement. A thin page progress indicator follows reading. Passive events and requestAnimationFrame avoid continuous idle work. Reduced motion keeps the content static and visible; no content depends on a reveal.

Media: authentic Kamal Basadi inside Belagavi Fort photo replaces the explicitly illustrative comp scene. Asset provenance and crop guidance: .impeccable/home-assets.md; visible credit and license are required. No generated reporting. Later images come directly from real publisher metadata.

Constraints: preserve removed category forms/tags and removed headline ticker; no autoplay carousel. Keep original publisher links and view counts. Native category links, responsive layout to 320px, visible focus, readable contrast, useful failed-fetch states. Review uses live Hostinger reads with all preview mutation/background guards unchanged. No open design decisions.
