# Belgaum Today UI Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand belgaum.today to an editorial, light-first "Saffron + Teal on cream" aesthetic with serif display headlines, mobile-first, without changing any functionality.

**Architecture:** Token-driven transformation. Rewrite design tokens in `globals.css` and add a serif font in `layout.tsx` first so the whole site shifts at the base; then restyle shared primitives (Badge/Button/Card); then chrome (Header/Footer); then article surfaces; then page composition. All component prop interfaces are frozen — only Tailwind classes / inline styles / token values change. Verification is `npm run build` (type-check) + browser visual inspection, not unit tests (this is a visual project with no testable logic changes).

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4 (`@theme inline`), `next/font/google`, lucide-react.

**Design tokens (light / dark):**
- primary saffron `#E8590C` / hover `#C2410C`
- accent teal `#0F766E`
- background cream `#FFFBF5` / dark `#15130F`
- surface white `#FFFFFF` / dark `#211D17`
- ink text `#1A1A1A` / dark `#F5F0E8`
- muted `#6B6B66` / dark `#A7A095`
- hairline `#ECE7DD` / dark `#322C24`

---

## Task 1: Design tokens + typography foundation (globals.css)

**Files:**
- Modify: `src/app/globals.css` (top theme/token block + body/scrollbar/prose/gradient-text; PRESERVE the entire `── Admin Layout ──` block and below verbatim)

- [ ] **Step 1: Replace the `:root` / `.dark` / `@theme inline` / `body` block**

Replace the existing block (from `:root {` through the `body { ... }` rule) with:

```css
:root {
  --background: #FFFBF5;
  --surface: #FFFFFF;
  --ink: #1A1A1A;
  --muted: #6B6B66;
  --primary: #E8590C;
  --primary-hover: #C2410C;
  --accent: #0F766E;
  --hairline: #ECE7DD;
  /* legacy aliases kept so existing utilities don't break */
  --foreground: #1A1A1A;
}

.dark {
  --background: #15130F;
  --surface: #211D17;
  --ink: #F5F0E8;
  --muted: #A7A095;
  --primary: #E8590C;
  --primary-hover: #F97316;
  --accent: #2DD4BF;
  --hairline: #322C24;
  --foreground: #F5F0E8;
}

@theme inline {
  --color-background: var(--background);
  --color-surface: var(--surface);
  --color-ink: var(--ink);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-accent: var(--accent);
  --color-hairline: var(--hairline);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-inter);
  --font-serif: var(--font-fraunces);
}

body {
  background: var(--background);
  color: var(--ink);
  font-family: var(--font-inter), 'Inter', system-ui, sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: Restyle scrollbar (flat saffron, not blue/purple gradient)**

Replace the `::-webkit-scrollbar-thumb` background rules:

```css
::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.04);
}
::-webkit-scrollbar-thumb {
  background: #E8590C;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #C2410C;
}
```

- [ ] **Step 3: Repaint `.gradient-text` and prose/focus accents to saffron/teal**

Replace `.gradient-text` background with a flat saffron→deep-saffron:

```css
.gradient-text {
  background: linear-gradient(135deg, #E8590C, #C2410C);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

In the prose block, change link color `#3b82f6`→`#0F766E`, link hover `#2563eb`→`#115E59`, and blockquote `border-left` `#3b82f6`→`#E8590C`. Change `.skip-link` background `#3b82f6`→`#E8590C` and `*:focus-visible` outline `#3b82f6`→`#E8590C`.

- [ ] **Step 4: Add a serif display helper class** (after `.gradient-text`)

```css
.font-display {
  font-family: var(--font-fraunces), Georgia, 'Times New Roman', serif;
  letter-spacing: -0.02em;
}
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS (no TS/CSS errors). Admin block untouched.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style: new saffron+teal design tokens and editorial typography base"
```

---

## Task 2: Load Fraunces serif + cream background in layout

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import Fraunces alongside Inter**

Replace the font import lines (top of file):

```tsx
import { Inter, Fraunces } from "next/font/google";
```

And the `inter` declaration block with both:

```tsx
const inter = Inter({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

const fraunces = Fraunces({
  subsets: ["latin"],
  display: 'swap',
  weight: ['400', '500', '600', '700', '900'],
  variable: '--font-fraunces',
});
```

- [ ] **Step 2: Apply both font variables on `<body>` and swap public wrapper background**

Change the `<body className=...>` to include fraunces:

```tsx
<body className={`${inter.variable} ${fraunces.variable} font-sans antialiased`}>
```

Change the public wrapper div background from `bg-gray-50 dark:bg-gray-900` to:

```tsx
<div className="min-h-screen flex flex-col bg-background">
```

- [ ] **Step 3: Verify build + dev render**

Run: `npm run build`
Expected: PASS. Fraunces and Inter both load.

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx
git commit -m "style: load Fraunces display serif and apply cream background"
```

---

## Task 3: Retune CATEGORY_META colors

**Files:**
- Modify: `src/types/index.ts:127-158`

- [ ] **Step 1: Replace the `CATEGORY_META` color values** (keep keys, names, descriptions)

```ts
export const CATEGORY_META: Record<Category, { name: string; description: string; color: string }> = {
  india:         { name: 'India',         description: 'Latest news from across India',        color: '#E8590C' },
  business:      { name: 'Business',      description: 'Business and economy updates',          color: '#0F766E' },
  technology:    { name: 'Technology',    description: 'Tech news and innovations',             color: '#1D4ED8' },
  entertainment: { name: 'Entertainment', description: 'Movies, music, and pop culture',        color: '#BE123C' },
  sports:        { name: 'Sports',        description: 'Sports news and updates',               color: '#15803D' },
  belgaum:       { name: 'Belgaum',       description: 'Local news from Belgaum region',        color: '#B45309' },
};
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "style: retune category colors to new palette"
```

---

## Task 4: Restyle UI primitives (Badge, Button, Card)

**Files:**
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Card.tsx`

- [ ] **Step 1: Badge — retune variants to warm palette** (keep `variant`/`color`/`size` API)

Replace the `variants` object:

```tsx
const variants = {
  default: 'bg-[#F3EEE4] text-[#6B6B66] dark:bg-[#2A251E] dark:text-[#A7A095]',
  success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  info: 'bg-teal-50 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
  custom: '',
};
```

- [ ] **Step 2: Button — flat saffron primary** (keep API/sizes)

Replace the `variants` object:

```tsx
const variants = {
  primary: 'bg-primary text-white hover:bg-primary-hover focus:ring-primary shadow-sm',
  secondary: 'bg-accent text-white hover:bg-teal-800 focus:ring-accent',
  outline: 'border border-hairline text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] focus:ring-primary',
  ghost: 'text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] focus:ring-primary',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500',
};
```

- [ ] **Step 3: Card — cream/white surfaces, saffron hover, less rounding**

Replace the `cn(...)` class list in `Card`:

```tsx
className={cn(
  'rounded-lg overflow-hidden',
  'bg-surface',
  'border border-hairline',
  hover && 'transition-all duration-300 hover:shadow-md hover:border-primary/40',
  gradient && 'bg-gradient-to-br from-surface to-[#FBF6EE] dark:from-[#211D17] dark:to-[#1A1712]',
  className
)}
```

And update `CardHeader`/`CardFooter` borders `border-gray-200 dark:border-gray-700` → `border-hairline`, and `CardFooter` bg `bg-gray-50 dark:bg-gray-800/50` → `bg-[#FBF6EE] dark:bg-[#1A1712]`.

- [ ] **Step 4: Verify build + admin smoke**

Run: `npm run build`
Expected: PASS. (These primitives are used by admin — build proves types/classes valid; admin keeps its layout.)

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Badge.tsx src/components/ui/Button.tsx src/components/ui/Card.tsx
git commit -m "style: restyle Badge, Button, Card to saffron+teal palette"
```

---

## Task 5: Redesign Header

**Files:**
- Modify: `src/components/layout/Header.tsx`

- [ ] **Step 1: Restyle the sticky bar + wordmark** (keep all state/logic: dark toggle, scroll, menu)

Replace the `<header className={cn(...)}>` scrolled/unscrolled classes:

```tsx
className={cn(
  'sticky top-0 z-50 transition-all duration-300 border-b border-hairline',
  isScrolled
    ? 'bg-background/85 backdrop-blur-lg shadow-sm'
    : 'bg-background'
)}
```

Replace the logo text block (the nested gradient/glow `<span>` + `<h1>` + tagline) with a clean serif wordmark:

```tsx
<div>
  <h1 className="font-display text-xl font-bold text-ink leading-none">
    Belgaum <span className="text-primary">Today</span>
  </h1>
  <p className="text-[11px] text-muted mt-0.5 tracking-wide">Local News, Global Standards</p>
</div>
```

- [ ] **Step 2: Restyle desktop nav links + search** (saffron hover/active)

Replace the desktop nav `<Link>` className and the search `<Link>` className:

```tsx
className="px-3 py-2 text-sm font-medium text-ink/80 hover:text-primary rounded-md hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E] transition-colors"
```

(search link keeps `flex items-center gap-1` appended.)

- [ ] **Step 3: Restyle action buttons + mobile menu**

Theme toggle + hamburger buttons: replace `text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800` with `text-ink hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E]`.

Mobile menu nav: replace `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900` → `border-hairline bg-background`; replace each mobile link's text/hover classes with `text-ink/80 hover:text-primary hover:bg-[#F3EEE4] dark:hover:bg-[#2A251E]`. Category dots keep `style={{ backgroundColor: CATEGORY_META[cat].color }}`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/Header.tsx
git commit -m "style: editorial header with serif wordmark and saffron nav"
```

---

## Task 6: Redesign Footer

**Files:**
- Modify: `src/components/layout/Footer.tsx`

- [ ] **Step 1: Warm ink footer + serif wordmark**

Change `<footer className="bg-gray-900 text-gray-300">` → `<footer className="bg-[#1A1712] text-[#C9C1B4]">`.

Replace the brand logo block: change the gradient logo box `bg-gradient-to-br from-blue-600 to-purple-600` → `bg-primary`, and the wordmark `<h2>` to:

```tsx
<h2 className="font-display text-xl font-bold text-white">
  Belgaum <span className="text-primary">Today</span>
</h2>
```

- [ ] **Step 2: Repaint section headings, links, social, contact accents**

- Social hover backgrounds: replace `hover:bg-blue-600 / hover:bg-sky-500 / hover:bg-pink-600 / hover:bg-red-600` so all use `hover:bg-primary` (Facebook/Twitter) and keep Instagram/Youtube branded is fine; simplest: set all four to `hover:bg-primary`. Base `bg-gray-800` → `bg-white/10`.
- Contact icons: `text-blue-400` → `text-accent` (3 occurrences).
- Bottom bar border `border-gray-800` → `border-white/10`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Footer.tsx
git commit -m "style: warm editorial footer in new palette"
```

---

## Task 7: Redesign ArticleCard

**Files:**
- Modify: `src/components/articles/ArticleCard.tsx`

- [ ] **Step 1: Surface + serif title + saffron category eyebrow** (keep `compact`/`priority` props and all logic)

Change the root `<article>` class from gray surface to:

```tsx
className={`group bg-surface rounded-lg overflow-hidden border border-hairline transition-all duration-300 hover:shadow-md hover:border-primary/40 ${compact ? 'text-sm' : ''}`}
```

Add a saffron category eyebrow above the title (inside the content `<div>`, before the title `<Link>`):

```tsx
<span className="block text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">
  {CATEGORY_META[article.category]?.name}
</span>
```

Add `import { CATEGORY_META } from '@/types';` to the imports.

Change the title `<h3>` classes: `text-gray-900 dark:text-white` → `text-ink`, `group-hover:text-blue-600 dark:group-hover:text-blue-400` → `group-hover:text-primary`, and add `font-display` to the class list. Non-compact size `text-lg` stays.

- [ ] **Step 2: Repaint excerpt + meta**

Excerpt `text-gray-600 dark:text-gray-400` → `text-muted`. Meta row `text-gray-500 dark:text-gray-400` → `text-muted`. Source hover `hover:text-blue-500` → `hover:text-accent`. Tooltip "Read Original" link `text-blue-400` → `text-accent`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/articles/ArticleCard.tsx
git commit -m "style: editorial ArticleCard with serif title and saffron eyebrow"
```

---

## Task 8: Redesign FeaturedArticle hero

**Files:**
- Modify: `src/components/articles/FeaturedArticle.tsx`

- [ ] **Step 1: Warm overlay + serif headline + single saffron CTA** (keep logic/props)

- Root `<article>`: `from-gray-900 to-gray-800` → `from-[#1A1712] to-[#2A251E]`.
- Overlay gradient: `from-gray-900 via-gray-900/70` → `from-[#120F0B] via-[#120F0B]/70`.
- Replace the "🔥 Featured" `Badge variant="danger"` with `variant="custom" color="#E8590C"` and text `Featured` (drop the pulse, keep `size="md"`).
- Headline `<h2>`: add `font-display`, change `group-hover:text-blue-300` → `group-hover:text-[#FDBA74]`.
- CTA `<Link>`: `bg-white text-gray-900 ... hover:bg-blue-500 hover:text-white` → `bg-primary text-white ... hover:bg-primary-hover`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/articles/FeaturedArticle.tsx
git commit -m "style: editorial featured hero with serif headline and saffron CTA"
```

---

## Task 9: Redesign Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Cards + serif headings + flat rank chips** (keep props/logic)

For each panel container (`Most Viewed`, `Trending`, `Categories`): `bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700` → `bg-surface rounded-lg border border-hairline`.

Panel `<h3>` headings: `text-gray-900 dark:text-white` → `text-ink`, add `font-display`. Icon colors: Most Viewed `text-blue-500` → `text-accent`; Trending `text-red-500` → `text-primary`; Categories `text-purple-500` → `text-accent`.

Rank chips: Most Viewed `bg-gradient-to-br from-blue-500 to-cyan-500` → `bg-accent`; Trending `bg-gradient-to-br from-red-500 to-orange-500` → `bg-primary`.

Item titles `text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400` → `text-ink group-hover:text-primary`. Meta `text-gray-500 dark:text-gray-400` → `text-muted`.

- [ ] **Step 2: RSS block → teal**

RSS container `bg-gradient-to-br from-blue-600 to-purple-600` → `bg-accent`. Inner button `bg-white text-blue-600` → `bg-white text-accent`.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: editorial sidebar with serif headings and flat accent chips"
```

---

## Task 10: Redesign BreakingNewsTicker + TrendingCarousel

**Files:**
- Modify: `src/components/BreakingNewsTicker.tsx`
- Modify: `src/components/TrendingCarousel.tsx`
- Modify: `src/app/page.tsx` (carousel accentColor prop only)

- [ ] **Step 1: Ticker — warm bar, saffron label, teal dots**

- Section: `bg-gray-900 dark:bg-black border-y border-gray-800` → `bg-[#1A1712] border-y border-[#322C24]`.
- "Breaking" label `bg-red-600` → `bg-primary`.
- Link text `text-gray-300 hover:text-white` → `text-[#C9C1B4] hover:text-white`. Dot `bg-red-500` → `bg-accent`.

- [ ] **Step 2: TrendingCarousel — read file, repaint blues/grays to palette**

Read `src/components/TrendingCarousel.tsx`. Replace surface grays (`bg-white dark:bg-gray-800`→`bg-surface`, borders→`border-hairline`, title grays→`text-ink`, hover blues→`group-hover:text-primary`, muted grays→`text-muted`). Keep the `accentColor` prop and all carousel/scroll logic intact.

- [ ] **Step 3: Pass saffron accent from home page**

In `src/app/page.tsx`, change `<TrendingCarousel articles={trendingArticles} accentColor="#3b82f6" />` → `accentColor="#E8590C"`.

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/BreakingNewsTicker.tsx src/components/TrendingCarousel.tsx src/app/page.tsx
git commit -m "style: ticker and trending carousel in new palette"
```

---

## Task 11: Page composition — section headers & spacing

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/[category]/page.tsx`
- Modify: `src/components/articles/CategorySearchHeader.tsx`
- Modify: `src/components/articles/CategoryPageClient.tsx`

- [ ] **Step 1: Home — serif section headers + saffron accents**

In `src/app/page.tsx`: change every section `<h2 className="text-2xl font-bold text-gray-900 dark:text-white">` → `className="font-display text-2xl md:text-3xl font-bold text-ink"`. The "Trending Now" 🔥 header keeps its emoji. Increase outer wrapper bottom rhythm: section `mb-10` → `mb-12` (3 occurrences acceptable).

- [ ] **Step 2: Category page surfaces**

Read `src/app/[category]/page.tsx`, `CategorySearchHeader.tsx`, `CategoryPageClient.tsx`. Replace gray text/surface utilities (`text-gray-900 dark:text-white`→`text-ink`, `text-gray-500/600 dark:text-gray-400`→`text-muted`, `bg-white dark:bg-gray-800`→`bg-surface`, borders→`border-hairline`, blue accents `text-blue-*`/`bg-blue-*`→`text-primary`/`bg-primary`). Add `font-display` to the main category title heading. Do not change data fetching, filters, or props.

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx "src/app/[category]/page.tsx" src/components/articles/CategorySearchHeader.tsx src/components/articles/CategoryPageClient.tsx
git commit -m "style: editorial section headers and palette on home + category pages"
```

---

## Task 12: Article detail + search + static pages + remaining article components

**Files:**
- Modify: `src/app/article/[slug]/page.tsx`
- Modify: `src/components/articles/ShareButtons.tsx`
- Modify: `src/app/search/page.tsx`
- Modify: `src/app/about/page.tsx`, `src/app/not-found.tsx`, `src/app/error.tsx`
- Modify: `src/components/articles/ArticleList.tsx`, `ArticleGrid.tsx` (only if they carry gray/blue utilities)

- [ ] **Step 1: Article detail page**

Read `src/app/article/[slug]/page.tsx`. Add `font-display` to the article `<h1>` title. Replace gray text utilities → `text-ink`/`text-muted`, surfaces → `bg-surface`/`border-hairline`, blue accents → saffron/teal. Prose already themed via globals.css. Do not change metadata, data fetching, or tracking.

- [ ] **Step 2: ShareButtons**

Read `src/components/articles/ShareButtons.tsx`. Repaint button backgrounds/hovers to palette (primary saffron for the main share, keep branded social colors or neutralize to `bg-[#F3EEE4]` hover `bg-primary/10`). Keep share logic and props.

- [ ] **Step 3: Search + static pages**

Read `src/app/search/page.tsx`, `about/page.tsx`, `not-found.tsx`, `error.tsx`. Replace gray/blue/purple utilities with palette tokens (`text-ink`, `text-muted`, `bg-surface`, `border-hairline`, `text-primary`, `bg-primary`). Add `font-display` to large page headings. Keep all logic.

- [ ] **Step 4: ArticleList / ArticleGrid**

Read both. If they contain section headers or gray/blue utilities, repaint to tokens; add `font-display` to any heading. If purely layout wrappers, leave unchanged. Props frozen.

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "style: palette + serif headings across article, search, static pages"
```

---

## Task 13: Final verification — build, dev run, visual QA

**Files:** none (verification only)

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: PASS with no errors/warnings on touched files.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors on touched files.

- [ ] **Step 3: Start dev server and visual-check**

Run: `npm run dev` (background). Using the browser MCP, load and screenshot at 375px (mobile) and 1280px (desktop), in both light and dark:
- `/` home
- one `/[category]` page (e.g. `/belgaum`)
- one `/article/[slug]`
- `/search`

Confirm: cream background, serif headlines, saffron primary, teal accents, no leftover blue/purple gradients, no console errors, dark-mode toggle flips correctly.

- [ ] **Step 4: Grep for leftover legacy accents in touched public components**

Run: `grep -rn "from-blue-\|to-purple-\|from-purple-\|text-blue-6\|bg-blue-6" src/components/layout src/components/articles src/components/*.tsx src/app/page.tsx "src/app/[category]" src/app/article src/app/search`
Expected: no public-facing matches remain (admin matches are fine).

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "style: final UI rebrand polish and verification fixes"
```

---

## Notes for the implementer
- **Do NOT** change any prop interface, exported name, data query, API route, auth, middleware, tracking, or cron logic. Visual classes / inline color values only.
- **Preserve** the entire `── Admin Layout ──` CSS block in `globals.css` and the `next-env.d.ts` tracked modification.
- Admin pages (`/admin/*`) are intentionally NOT redesigned — only verify they still build/render.
- Tailwind v4: the new utilities (`bg-surface`, `text-ink`, `text-primary`, `border-hairline`, `text-muted`, `bg-background`, `text-accent`) work because tokens are mapped in `@theme inline` (Task 1). Define before use.
