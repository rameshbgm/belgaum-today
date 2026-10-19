# Belgaum Today

<!-- impeccable:product-schema 1 -->

## Platform
web

## Users
Readers across India, primarily using mobile browsers, and the editorial administrators who manage articles, publisher feeds, and ingestion logs.

## Product Purpose
Help readers scan news, identify its publisher, and follow the original report. Provide category archives, search, articles, blogs, topic preferences, and source-linked story timelines.

## Capabilities and Constraints
- Retain the Belgaum Today name and existing routes, content, permissions, source policies, SEO, and feature flags.
- Default to the Home landing page, followed by categories in this order: India, Business, Technology, Sports, Entertainment, Belgaum. Preserve the reading feed at /briefing.
- Use the existing Next.js / React / Tailwind application and Hostinger MySQL database.
- Local review must show real content without database writes, background ingestion, AI generation, or email delivery.
- Preserve users' saved topic and theme preferences.
- Category pages have no search form or subcategory tags, per the user's follow-up. Global archive search remains available. Show stored view counts throughout news and blog presentations, including zero counts; preview browsing does not increment them.

## Brand Commitments
The user approved the mobile Broadcast Briefing mockup on 2026-10-19: cobalt, cool white, navy, bold sans-serif type, compact mobile header, scrollable category links, a lead photo and headline, followed by compact story rows. Replace the incumbent visual identity completely.

On 2026-10-20 the user selected “Make sense of today — bold cobalt cover” for a full Home landing page, with purposeful animation, a page scroll effect, real imagery, and clear links into reading. The removed scrolling headline strip stays removed.

The user subsequently restored the original logo: the supplied BT symbol and black/orange serif Belgaum Today wordmark on its light ground. Use the supplied artwork unchanged across public and editorial branding; the cobalt interface and sans-serif content typography remain.

## Evidence on Hand
The live Hostinger connection was verified with read-only queries. Existing publisher images and headlines supply the application; generated mockup stories and imagery are illustrative and must not ship as reporting. Approved references are preserved under `.impeccable/mocks/approved/`.

## Accessibility & Inclusion
Mobile-first responsive layout down to 320px. Readable type, visible keyboard focus, 44px touch controls, reduced-motion support, clear loading/error/empty states, and accessible light and dark themes.
