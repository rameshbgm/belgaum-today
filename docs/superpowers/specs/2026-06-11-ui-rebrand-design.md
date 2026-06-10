# Belgaum Today — UI Rebrand & Redesign Design

**Date:** 2026-06-11
**Goal:** Complete rebrand and visual redesign of belgaum.today. Fresh, editorial, light-first aesthetic. Mobile-responsive first. No change to functionality, data flow, routes, or APIs.

## Direction (decided with user)

- **Aesthetic:** Editorial & Bold — magazine-style. Big serif display headlines, strong typographic hierarchy, generous whitespace, confident single accent color. Premium local-news brand feel.
- **Palette:** Saffron + Teal on cream.
  - Primary (saffron): `#E8590C`
  - Primary dark/hover: `#C2410C`
  - Accent (teal): `#0F766E`
  - Background (cream): `#FFFBF5`
  - Surface (card): `#FFFFFF`
  - Ink (text): `#1A1A1A`
  - Muted text: `#6B6B66`
  - Hairline border: `#ECE7DD`
- **Dark mode:** Keep it. Light is the default. The existing toggle stays functional and gets restyled to match. Dark palette: ink background `#15130F`, surface `#211D17`, cream-tinted text, saffron/teal accents preserved.
- **Mobile-first:** Every layout designed for small screens first, enhanced upward.

## Scope

### In scope (visual only)
- `src/app/globals.css` — replace design tokens, typography, scrollbar, prose, animations, keep admin CSS block intact (admin is out of scope visually but must not break).
- `src/app/layout.tsx` — fonts (add a serif display font), background classes, theme bootstrap.
- `src/types/index.ts` — `CATEGORY_META` colors retuned to the new palette (still 6 categories, same keys).
- Layout components: `Header`, `Footer`, `Sidebar`.
- Article components: `ArticleCard`, `FeaturedArticle`, `ArticleList`/`ArticleGrid` (visual classes only), `CategorySearchHeader`, `ShareButtons`.
- UI primitives: `Badge`, `Button`, `Card`.
- Feature components: `BreakingNewsTicker`, `TrendingCarousel`.
- Page-level visual composition: `page.tsx` (home), `[category]/page.tsx`, `article/[slug]/page.tsx`, `search`, `about`, static pages — section headers, spacing, accent usage. No data-fetching changes.

### Out of scope (do not touch behavior)
- All `/api/*` routes, `src/lib/db.ts`, auth, middleware, RSS/AI cron pipeline.
- Admin UI redesign (`/admin/*`) — leave functional; only ensure shared primitives (Badge/Button) don't break it. Admin keeps its current look.
- Data shapes, props contracts (component prop interfaces stay the same), routing.
- Tracking (`TrackingProvider`, view/click tracking), ad scripts.

## Design System

### Typography
- **Display / headlines:** a strong serif — `Fraunces` (variable, expressive) via `next/font/google`. Used for h1/h2 article titles, section headers, featured headline.
- **Body / UI:** keep `Inter` for body, meta, nav, buttons (readable, already loaded).
- Scale: featured headline `text-3xl`→`md:text-5xl`; section header `text-2xl`→`md:text-3xl` serif; card title `text-base`→`text-lg`; meta `text-xs`.
- Headlines: tight leading, slightly negative tracking.

### Color tokens (CSS variables in globals.css)
Light theme variables on `:root`, dark overrides on `.dark`. Tailwind v4 `@theme inline` maps them so utilities like `bg-background`, `text-ink`, `text-primary`, `border-hairline` work. Replaces the old `--background/--foreground` only.

### Accent usage rules
- Saffron = primary action, active state, the brand "Today", kickers/category eyebrows, breaking label.
- Teal = secondary accent, links, trending/most-viewed rank chips, RSS block.
- No multi-color gradients on text or buttons. One flat accent or a subtle saffron→deep-saffron gradient max.

### Surfaces & shape
- Cards: white surface, 1px hairline border (`#ECE7DD`), `rounded-lg` (less bubbly than current `rounded-xl`), soft shadow only on hover. Editorial cards favor clean borders over heavy shadows.
- Generous section spacing (`space-y-12` between home sections on desktop).

### Component redesign notes
- **Header:** Cream/translucent sticky bar. Serif wordmark "Belgaum **Today**" (Today in saffron, no glow/gradient). Clean underline-on-hover nav with saffron active indicator. Theme toggle = sun/moon icon (kept). Mobile hamburger menu restyled, category dots use new palette.
- **Featured Article:** Editorial hero — large image, dark ink overlay (warm, not blue-gray), saffron kicker + serif headline, single saffron "Read Full Story" button. Magazine cover energy.
- **ArticleCard:** Image top, saffron category eyebrow above title, serif title, clean meta row. Hover = subtle lift + saffron title. Compact variant preserved (props unchanged).
- **Sidebar:** Section headers in serif with a short saffron rule. Rank chips: teal for Most Viewed, saffron for Trending (flat, not gradient). RSS block = teal solid, not blue/purple.
- **BreakingNewsTicker:** Warm dark (ink) bar, saffron "Breaking" label, teal dot markers. Animation unchanged.
- **TrendingCarousel:** Restyle to palette; pass saffron accent instead of `#3b82f6`.
- **Footer:** Warm dark (ink, not gray-900). Serif wordmark, saffron section headings rules, teal social hovers, new palette category dots.
- **Badge:** keep variants/API; retune palette (info→teal-tinted, danger stays warm red for "breaking"/"featured").
- **Button:** primary = flat saffron (no blue/purple gradient); outline/ghost neutral warm; keep API and sizes.
- **Card:** swap blue hover border → saffron, gray surfaces → cream/white tokens.

## Architecture & Approach

**Token-driven transformation.** All components already consume a small shared layer: `globals.css` tokens, `CATEGORY_META` colors, and the `Badge`/`Button`/`Card` primitives. Strategy:

1. **Foundations first** — rewrite `globals.css` tokens + typography, add Fraunces in `layout.tsx`, retune `CATEGORY_META`. This shifts the whole site's base instantly and de-risks later steps.
2. **Primitives** — `Badge`, `Button`, `Card` to new palette. Cascades to every consumer including admin (verified non-breaking).
3. **Chrome** — `Header`, `Footer`.
4. **Article surfaces** — `ArticleCard`, `FeaturedArticle`, `Sidebar`, `BreakingNewsTicker`, `TrendingCarousel`, list/grid wrappers.
5. **Page composition** — home, category, article detail, search, static pages: section headers to serif, spacing, accent eyebrows.
6. **Verify** — `npm run build` (type-check), run dev server, screenshot key pages at mobile (375px) and desktop widths in light + dark.

**Isolation:** Each component is independently restyled; prop interfaces are frozen so no consumer breaks. CSS tokens are the single source of truth for color, so a later tweak to the saffron value updates everywhere.

## Functionality preservation (hard constraint)
- No prop interface changes. No removed/renamed exports.
- No changes to data fetching, queries, routes, API handlers, tracking, auth, cron.
- Dark-mode toggle keeps working (localStorage + `.dark` class bootstrap unchanged in logic, only styled).
- All `lucide-react` icon usage and links/hrefs preserved.

## Testing / Verification
- `npm run build` must pass (TS + lint clean for touched files).
- Dev server renders home, a category page, an article page, search — no console errors.
- Visual check via browser at 375px (mobile) and 1280px (desktop), light and dark.
- Spot-check admin pages still render (shared primitives didn't break them).

## Risks
- Tailwind v4 `@theme inline` token names must match utility usage — define before use.
- Admin CSS is large and hand-written in globals.css; preserve that block verbatim.
- `next-env.d.ts` has a tracked modification per CLAUDE.md — do not revert.
