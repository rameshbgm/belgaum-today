# Broadcast asset manifest

These PNGs are design references only. The mobile mock is explicitly approved by the user; the desktop file is its companion reference. Their adjacent JSON files record source paths, approval scope, dimensions, and checksums. Neither PNG nor any mock crop is a shipping news asset.

No additional raster art is required for this functional news-reader design. The real Hostinger database supplies publisher photographs and article content. Do not generate news imagery or copy illustrative mock headlines, dates, or publisher metadata into production.

## Produce

Empty. No raster generation, mock cropping, or clean-plate work is required.

## Direct

| ID | Source | Output | Strategy | Dimensions / format / transparency | Deviations | QA |
|---|---|---|---|---|---|---|
| `mobile-reference` | Original mobile source path in adjacent JSON; no crop | `broadcast-mobile-approved.png` | Byte-for-byte reference copy, excluded from app assets | 887 × 1774 / PNG / opaque | None | accepted: visually inspected and checksum verified |
| `desktop-reference` | Original desktop source path in adjacent JSON; no crop | `broadcast-desktop-companion.png` | Byte-for-byte companion reference copy, excluded from app assets | 1536 × 1024 / PNG / opaque | No separate desktop approval asserted | accepted: visually inspected and checksum verified |
| `heading-font` | Official Google Fonts; no crop | `src/app/fonts/sora-latin-variable.woff2` from repository root | Unmodified self-hosted Latin font, heading weights 400–800 | Vector glyph outlines / WOFF2 / n/a | None | accepted: WOFF2 and `fvar` verified |
| `body-font` | Official Google Fonts; no crop | `src/app/fonts/source-sans-3-latin-variable.woff2` from repository root | Unmodified self-hosted Latin font; declare intended weights 400–700 | Vector glyph outlines / WOFF2 / n/a | Official binary contains 200–900; see font provenance | accepted: WOFF2 and `fvar` verified |

Font sources, hashes, weight axes, and official OFL licenses are recorded in `src/app/fonts/PROVENANCE.md` from the repository root. No prompts were used; all assets were copied or downloaded from the supplied and official sources.

## Semantic

| ID | Implementation handoff | Notes | QA |
|---|---|---|---|
| `shell-navigation` | Semantic header, linked wordmark, `nav`, category links, search form, and buttons. Use CSS for the blue masthead, active underline, separators, responsive spacing, overflow navigation, and keyboard focus. Draw search, menu, theme, and arrow controls with the existing icon library or inline SVG. | Exclude the mobile mock's browser chrome; it is not part of the app. | accepted: reference inventory complete; parent owns implementation QA |
| `news-layout` | Render an article lead and reusable story rows/cards from database records. Use headings, links, text metadata, and responsive CSS grid/flex for the mobile stacked lead and desktop lead-plus-rail structure. CSS owns borders, radius, image clipping, spacing, and text hierarchy. | Compose with live publisher image URLs; do not reuse mock imagery or copy. | accepted: reference inventory complete; parent owns implementation QA |
| `topics-controls` | Implement topic selection, most-read links, filters, and latest-story navigation as semantic links/buttons and responsive layout. | Preserve real behavior, accessible names, and visible focus. | accepted: reference inventory complete; parent owns implementation QA |

## Execution order

Load the local fonts with the intended weight ranges, implement the semantic shell and story layout, then compose real database photographs and content. There is no raster production queue.

## Blockers

None for asset delivery.

## Assumptions

The existing Hostinger data integration remains the authority for production news content and publisher images. The parent implementation will validate those records and responsive behavior.
