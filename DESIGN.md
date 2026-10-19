---
name: "Belgaum Today — Broadcast Briefing"
description: "A mobile-first news experience with a cobalt Home cover, compact briefings, and original publisher reports."
colors:
  primary: "#2F4BEB"
  primary-hover: "#243AC4"
  background: "#F5F7FC"
  surface: "#FFFFFF"
  ink: "#17243E"
  muted: "#5E6D85"
  hairline: "#DEE5F0"
  soft: "#E9EEFF"
  home-mist: "#B9C6DD"
  dark-background: "#101C31"
  dark-surface: "#192840"
  dark-ink: "#EEF3FF"
  dark-muted: "#ADBDD5"
  dark-primary: "#9CAFFF"
  dark-primary-hover: "#BCC9FF"
  dark-hairline: "#30415D"
  dark-soft: "#223453"
  dark-masthead: "#233DC8"
  field-focus: "oklch(62.3% 0.214 259.815)"
  danger: "oklch(58.6% 0.253 17.585)"
  danger-hover: "oklch(51.4% 0.222 16.935)"
typography:
  home-section:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(38px, 4.3vw, 60px)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  home-action:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.5
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(27px, 2.7vw, 39px)"
    fontWeight: 750
    lineHeight: 1.13
    letterSpacing: "-0.04em"
  display-mobile:
    fontFamily: "Sora, sans-serif"
    fontSize: "29px"
    fontWeight: 750
    lineHeight: 1.17
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "clamp(30px, 4vw, 48px)"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.035em"
  section:
    fontFamily: "Sora, sans-serif"
    fontSize: "26px"
    fontWeight: 750
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  story-title:
    fontFamily: "Sora, sans-serif"
    fontSize: "18px"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.5
  body-mobile:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  prose:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: 1.8
  label:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    letterSpacing: "0.035em"
  metadata:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  button:
    fontFamily: "Source Sans 3, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "20px"
rounded:
  control: "8px"
  panel: "12px"
  lead: "10px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
  3xl: "28px"
  4xl: "32px"
  section: "40px"
components:
  home-action-white:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.home-action}"
    rounded: "{rounded.control}"
    padding: "12px 20px"
    height: "50px"
  home-action-white-hover:
    backgroundColor: "{colors.soft}"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.background}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-ghost:
    textColor: "{colors.ink}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-danger:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.surface}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "8px 16px"
    height: "44px"
  button-danger-hover:
    backgroundColor: "{colors.danger-hover}"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  category-nav:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    height: "48px"
  category-nav-mobile:
    height: "44px"
  follow-topic:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "8px 16px"
    height: "44px"
  follow-topic-selected:
    backgroundColor: "{colors.primary-hover}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.control}"
  story-row:
    textColor: "{colors.ink}"
    padding: "20px 0"
  login-input:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "12px 44px 12px 14px"
    height: "50px"
---

# Design System: Belgaum Today

The site owner restored the original logo after the Home review. `BrandLogo` displays the supplied `public/images/belgaum-today-logo.png` unchanged: BT symbol, black/orange serif lettering and its light ground. This is a fixed brand asset, including in dark mode, and is the exception to the Sora content typography. Use it within the 44px-minimum `.wordmark` link in public headers, footer, editorial header and login. It scales proportionally from its 1086×158 source without cropping, tinting or stretching; mobile flex sizing preserves adjacent 44px controls. The surrounding cobalt interface stays in the approved system.

## Overview

**Creative North Star: "Broadcast Briefing"**

Broadcast Briefing uses a committed cobalt masthead, cool-white reading ground, navy text, bold geometric headings, and compact publisher-linked story streams. The character is direct and readable: photography carries the reporting while typography establishes a clear scan order.

The Home at `/` adds a persuasive, spacious expression of this identity: a full cobalt cover, oversized white display type, and an authentic Belagavi photograph. The reading feed lives at `/briefing`; its compact scan hierarchy remains the Read expression. The editorial workspace remains the denser Operate expression. The same palette, rounded controls, quiet borders, and sans-serif hierarchy connect these surfaces. Light and dark themes preserve these relationships. Real publisher content and images remain the material of news presentations; the built empty-image state uses a newspaper icon and the site name.

**Key Characteristics:**

- Cobalt identity with cool neutrals and a navy dark theme.
- Sora headings paired with Source Sans 3 reading text, with a distinct Home cover scale.
- A spacious Home opening into compact, responsive streams with visible publisher metadata.
- Quiet hairlines, rounded photos and controls, and visible focus.

## Colors

Cobalt supplies the broadcast identity; cool whites and navy provide the reading field. Frontmatter values are normative and record the shared CSS palette and reused Home tones.

### Primary

- **Broadcast Cobalt** (`primary`, `primary-hover`): masthead identity, primary buttons, links, active navigation, and category labels. In light mode, `masthead`, `accent`, and `primary` share the same cobalt.
- **Light Cobalt** (`dark-primary`, `dark-primary-hover`): links and selected details on navy surfaces. The dark masthead uses its own deeper cobalt (`dark-masthead`); the shared primary Button retains its fixed cobalt and white label.

### Neutral

- **Cool White** (`background`) and **White** (`surface`): page ground and raised tonal grouping.
- **Reading Navy** (`ink`), **Slate** (`muted`), **Quiet Hairline** (`hairline`), and **Pale Cobalt** (`soft`): text, metadata, rules, and soft contextual panels.
- **Home Mist** (`home-mist`): supporting copy in the navy Home category index. Home also uses pale white-cobalt cover copy and blue-gray index rules as local tonal treatments, without adding a second brand accent.
- The `dark-*` neutral counterparts replace these roles under the root `.dark` class. `foreground` follows `ink`, and `accent` follows `primary`.

The Home cover, closing band, and local action retain fixed Broadcast Cobalt in both themes; the category index retains Reading Navy and white. Their white actions keep a white fill and navy label in both themes. Story previews and the surrounding reading ground continue to use the theme-aware variables.

Form focus and destructive actions use the extracted `field-focus`, `danger`, and `danger-hover` utility colors. Status badges retain semantic green, amber, rose, or teal treatments; they do not become additional brand accents.

**The Publisher Rule.** Keep the publisher visible beside a story and preserve its source-linked action. Use real publisher imagery; never present mockup reporting as news.

## Typography

**Display Font:** self-hosted Sora, sans-serif fallback. **Body Font:** self-hosted Source Sans 3, Arial/sans-serif fallback. The local variable files load with `display: swap`; provenance and OFL licenses are in `src/app/fonts/PROVENANCE.md`. The legacy CSS name `font-serif` resolves to Sora, not a serif face.

Sora's close-set, geometric headings supply emphasis; Source Sans 3 keeps metadata and longer text open and readable. Weights remain variable, including the observed 650 and 750 heading weights.

- **Home cover:** the Persuade headline uses an intentional surface scale (750, `clamp(72px, 7.1vw, 96px)`, 1.01 line height, −0.04em tracking). Below 1024px it becomes 80px/0.98; below 640px it uses `clamp(50px, 15.38vw, 64px)`/0.9 and three lines. These values belong to the Home cover, not news headlines.
- **Home section and action:** `home-section` serves the recurring introduction/local headings; on phones they become 32px and 36px respectively. The category invitation and closing band have their own large headings. `home-action` labels become 17px on phone white actions; the local cobalt action also uses 17px. Home supporting copy stays sentence case.
- **Display:** the briefing lead uses the `display` role on desktop and `display-mobile` below the small breakpoint. At the narrowest width it reduces to 27px; mobile titles may clamp to four lines while the link retains the complete title.
- **Headline:** reading-page titles use `headline`, limited to 24ch; blog headings may use the observed heavier weight (700).
- **Section and story title:** `section` reduces to 24px on phones; `story-title` supplies compact rows. Desktop image cards use 20px titles, phone cards 18px.
- **Body:** `body` becomes `body-mobile` on phones. Long-form `prose` is limited to 72ch and becomes 17px/1.75 on phones.
- **Label and metadata:** category labels use uppercase `label` styling, reducing to 11px on phones. Metadata reduces to 12px; counts use tabular numerals and wrap with the publisher line.

**The Cover Scale Rule.** Keep the oversized Home display on the Persuade cover; preserve the compact Read hierarchy and denser Operate scale elsewhere.

## Layout

Design mobile first, with the approved 390×844 target and support down to 320px. The public container is capped at 1352px including its gutters: 24px at desktop, 16px below 1024px. The core responsive transitions are 640px and 1024px, with a narrow adjustment below 360px. Spacing follows the extracted scale, with compact internal gaps and larger section intervals.

The public masthead is sticky: 64px on desktop and 56px below 1024px. Category links occupy 48px on desktop and 44px below 1024px, scroll horizontally, and preserve Home, India, Business, Technology, Sports, Entertainment, Belgaum order. The menu and footer also begin with Home; the briefing is a distinct destination. Desktop global search becomes a search icon below 1024px. The phone theme control is available in the menu.

The default `/` Home is the Persuade surface defined in `.impeccable/home-cover.md` and `.impeccable/surfaces/src-app-page-tsx.md`. It moves from the cobalt cover and shaped photo into an introduction, source-linked previews, category index, local report, and a closing reading action. Its desktop columns collapse into a phone sequence, using 24px desktop and 20px phone gutters. The latest-preview grid uses three columns, then one below 640px, with the first phone preview retaining a larger photo. The existing lead/support Read composition lives at `/briefing` and retains the `.impeccable/broadcast-briefing.md` contract. Neither composition is a template for every page. Story grids use three columns on desktop and become compact single-column rows below 640px. Reading pages constrain text width independently of the broader news grid. Footer groups wrap and stack on phones.

The editorial workspace uses a separate shell capped at 1500px, with 28px desktop, 20px intermediate, and 16px phone gutters. Its horizontally scrolling navigation and overflowable tables preserve access on small screens. The login has two desktop columns, a 390px maximum form width, and a compact cobalt brand band above the form on phones.

## Elevation & Depth

Depth comes mainly from white or navy surfaces against the page ground, soft tonal fills, and one-pixel functional borders. Story cards and buttons have no resting cast shadow. The menu uses a restrained downward shadow; the native editorial detail dialog uses a lateral shadow and dark translucent backdrop. Feedback may use a utility shadow. Exact shadow and motion values live in the sidecar.

**The Flat Surface Rule.** Reading surfaces stay flat. Reserve cast shadows for transient menus, dialogs, and feedback.

The briefing lead enters once with a short fade and small upward settlement. Home uses one short staggered headline entrance (700ms with 80ms and 160ms offsets), then scroll-linked changes to the photo frame. Cover copy movement is bounded at 24px and photo movement at 7px; the progress indicator is 3px high. Passive events schedule a single requestAnimationFrame, and there is no continuous idle animation. The initial clipped frame and all content remain visible before JavaScript runs. Reduced motion removes the entrance and transforms, fixes the frame in its initial visible shape, and removes smooth scrolling. The page-progress indicator still reflects scroll position. Controls use brief color transitions; exact values live in the sidecar.

## Shapes

Photos and everyday controls use softly squared `control` corners. Larger contextual panels use `panel`; the desktop lead and some editorial containers use `lead`. Follow-topic controls and status badges are pills. Most news rows use an open surface with a quiet bottom rule rather than a full box. Photo crops use `object-fit: cover`; briefing lead and desktop card images use a 16:9 frame. Home adds an asymmetric rising curved photo silhouette that unfolds into a complete window while retaining softly rounded lower corners. It is a cover signature, not a new general card shape. The real heritage frame uses a wide desktop crop (1.85:1), 1.65:1 below 1024px, and 2.1:1 below 640px; phone object positioning is 50% 55%. The local story photo uses `panel` corners and a 1.6:1 crop.

## Components

- **Buttons:** shared primary, secondary, outline, ghost, and danger variants use semibold body type, 8px corners, a 44px minimum height, and compact icon gaps. Medium padding is in the frontmatter; small and large sizes change padding and type while preserving the minimum target. Primary darkens on hover; outline/ghost gain the soft fill; secondary reduces opacity; danger deepens. Disabled/loading states reduce opacity and suppress activation. Public primary actions use 10px/20px padding and the masthead color; bordered text actions use 10px/18px.
- **Home reading actions:** repeated white links on the cobalt cover and closing band use `home-action-white`, a 50px minimum height, 8px corners, and a right-arrow SVG. Their fixed white/navy color pairing stays readable in both themes. The gap expands on hover; phone actions become 48px high with 11px/17px padding. The secondary exploration link is a native `#explore` anchor with a 44px target. The local cobalt action shares the shape and darkens on hover.
- **Fields:** the shared input uses a surface fill, hairline/gray stroke, and 8px corners. It has a blue two-pixel focus ring and red validation treatment linked to error text. Login fields use the page-ground fill and a 50px minimum height. Labels remain visible. The global masthead search uses a translucent white fill and white text.
- **Navigation and focus:** category and editorial navigation mark the current route with primary text and a three-pixel underline. The default focus outline is three pixels with a four-pixel offset; shared Buttons use a three-pixel offset. Masthead, editorial-header, and login-brand focus is white. Search gets a separate two-pixel white `focus-within` outline with a three-pixel offset and no duplicate input ring. Menus support Escape and outside dismissal.
- **Topic controls and badges:** saved follow-topic choices use pill buttons with `aria-pressed`, an outlined unselected state, and a filled selected state. Editorial badges use compact pill labels and semantic status colors. Category archives omit their former search forms and subcategory tags; global search, pagination, and saved topics remain separate capabilities.
- **Cards and story rows:** the shared container is a flat, bordered surface with optional header/footer rules and 24px content padding. News cards use image, category, headline, excerpt, then publisher/count metadata; at phone width they become text plus a 90px thumbnail. News rows use a 16px gap, a trailing thumbnail when available, and a quiet bottom rule. Metadata wraps without hiding zero counts. Publisher actions open the original report in a new tab.
- **Home cover and evidence:** an authentic photograph of Kamal Basadi inside Belagavi Fort supplies local identity. Keep its visible source-linked creator credit and license beside the figure (12px), including the resized/cropped disclosure. Attribution and crop evidence live in `.impeccable/home-assets.md` and `public/images/home/image-license.json`; the approved comp photograph remains illustrative. Home previews use real feed articles through the existing publisher-linked cards, including stored counts and zero values. The local feature uses the original publisher link and count. Missing data produces useful links into the briefing or local archive rather than fabricated news.
- **Editorial surfaces:** navigation, stat strips, tables, and forms reuse the palette and control language at a denser working scale. Detail panels use native dialog focus containment and Escape handling. Login remains visually distinct from the reader shell while preserving the brand band and type pairing.

## Do's and Don'ts

### Do:

- **Do** use the shared semantic color variables so light and dark themes stay coherent.
- **Do** preserve readable mobile type, visible keyboard focus, and 44px primary touch controls.
- **Do** keep source names, timestamps, and stored view counts legible, including zero counts.
- **Do** use the approved sans-serif pairing and real publisher photography.
- **Do** preserve the Home photo’s visible source/license credit and bounded, reduced-motion-aware cover behavior.

### Don't:

- **Don't** restore the old warm orange/cream palette, broadsheet masthead, or serif display typography.
- **Don't** restore the removed headline strip, category search forms, or subcategory tags, or make the lead story a scrollable carousel.
- **Don't** fabricate readership activity or replace publisher reporting with mock content.
- **Don't** remove focus outlines without an equally visible replacement.
