disposition: fix

Inputs/limits: No separate QUALITY BAR board survived; the user-pinned mobile comp is the visual authority. Authenticated admin, dark theme, article/blog reading routes, and focused/error/loading states have no supplied captures. This is a review of the five named landing/category/login captures and sampled source, not certification of every route or live database operation.

## persistence

Pass, with comparison limits. PRODUCT.md, the surface contract, approved comp/approval sidecar, asset manifest, and official self-hosted font provenance exist. The contract records user approval and seed 4617e83d, explicitly superseded by that user pin. DESIGN.md is to be recorded after the final correction.

Evidence is valid: all five required files show settled content at the document top and match their names. Public mobile/category images are stored at 384×831, public desktop/category at 1434×996, and login at 390×844; the modest tool-output size differences do not make the captures malformed. The landing and category captures contain coherent content without blank or half-loaded regions. The dev badge and read-only badge are environment UI.

hero-repro.png exists and matches the current landing capture, including the approved strip. It is 384×831 rather than the approved raster's 887×1774, so it supports normalized logical-width comparison, not a literal pixel-dimension reproduction claim. The supplied contract establishes the comp as a 390px logical mobile design with browser chrome excluded.

The supplied detector has one thick blog excerpt border finding; sampled source confirms that border is removed. No second detector ran. Parent-reported tests, live-content provenance, mutation suppression, and navigation interactions were not independently executed by this browserless reviewer.

## fidelity

| Salient element | Classification | Evidence |
| --- | --- | --- |
| Compact cobalt masthead, white wordmark, mobile search/menu icons | match | The captured shell retains the comp's compact broadcast identity and hierarchy. |
| Category navigation, order, active underline, horizontal mobile continuation | match | India, Business, Technology, Sports, Entertainment, Belgaum follow the approved order. |
| Briefing heading and dateline | match | Same reading order and compact hierarchy; actual current date replaces illustrative copy. |
| Scrolling linked tiles before the lead | adaptation | Explicit later user request and surface-contract amendment authorize this addition and resulting hero displacement. Source shows publisher links, category order, stored counts, manual scroll, desktop arrows, and no autoplay. |
| Mobile lead photograph above headline, then excerpt and publisher metadata | match | A 16:9 publisher photograph and strong headline remain the focal sequence. |
| Long real lead headline, four-line mobile clamp | adaptation | Contract explicitly permits four-line clamping while retaining the complete linked title; real Hostinger text replaces the short mock headline. |
| Desktop text/photo lead with compact right-hand stream | adaptation | Same topology as the companion; actual long reporting text increases the lead's height. Mobile remains the primary approval target. |
| TYPE | match | Sora's heavy geometric sans character and clear display/body separation reproduce the approved lettering direction; Sora and Source Sans 3 are self-hosted with documented official origins. |
| MATERIAL | match | Real publisher photography supplies the image regions; the interface uses clean white/cool surfaces, restrained hairlines, and consistent drawn icons. No mock imagery appears in the captures. |
| GROUND | adaptation | Captured blank field samples are approximately RGB 246/247/252 versus the mobile comp's 247–248/250–251/253–254: slightly darker, still the approved cool-white family, consistent with the contract's #F5F7FC surface. No warm-cream drift. |
| Category archive | match | Supplied category captures retain headline streams and visible zero counts without the removed search forms or subcategory controls; source ignores retired q/subcategory filtering. |
| Editorial login | match | Cobalt brand band, readable labeled fields, visible submit action, and return link; public category chrome is absent. Authenticated workspace fidelity remains unverified. |
| Global search and header keyboard focus | contradicted | Search is retained, but the source removes the input outline and uses the cobalt primary outline against the same cobalt masthead. See material fix 1. |
| Most-read action in an empty ranking state | contradicted | The action always links to #most-read while its destination is conditional on nonempty ranking data. See material fix 2. |

## ceiling

The pinned comp's relevant devices are present: committed cobalt field, heavy sans headlines, photographic lead, compact publisher-linked streams, restrained framing, and cool white ground. No separate board supports a higher ornament or motion requirement. The simple manual strip fits the reading task. Floor sampling found no remaining thick side accent, hard offset shadow, gradient lettering, glyph substitute, or system display-face fallback in the reviewed surfaces. Category labels serve real taxonomy rather than decorative heading eyebrows.

The evidence covers landing, category, and unauthenticated login at the named device sizes. It does not establish the finish of authenticated admin screens or dark/focus/error states. No authentication bypass, fabricated admin capture, or live database mutation is warranted to close those limits.

## material_fixes

1. P1 — Restore visible keyboard focus across the masthead in src/app/globals.css:11 and :13. The generic primary outline blends into the masthead, and .header-search input overrides it with outline:none. Use a contrasting light focus treatment for masthead links/buttons and an explicit search :focus-visible or :focus-within treatment. Acceptance: keyboard traversal clearly locates wordmark, desktop search, theme, and menu controls in both themes, with no layout movement; provide focused-state evidence or computed-style confirmation alongside the normal recaptures.
2. P2 — Keep the Most read action and its destination consistent in src/app/page.tsx:52 and :75. Render the action only when a ranking exists, or retain a useful #most-read empty state. Acceptance: with an empty mostRead array, the page contains no dead #most-read link; with results, the action reaches the visible ranking. Preserve stored zero counts throughout ordinary story presentations.

## keep

Keep the mobile-first cobalt/Sora hierarchy, real publisher photos and links, visible stored zero counts, approved manually scrolling tiles, removed category filters, and strict read-only preview behavior intact.
