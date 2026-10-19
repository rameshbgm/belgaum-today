# Broadcast Briefing surface contract

Primary target: src/app/briefing/page.tsx. Related targets: public reading and archive pages, shared navigation, admin workspace. Home now occupies /; Today’s briefing remains at /briefing.

Reader mode: Read. Editorial workspace mode: Operate.

The user approved the mobile Broadcast Briefing comp and its detailed prompt. Mobile is the primary design target because most readers use phones. The approved image represents a 390px-wide browser at export scale; browser chrome is excluded from implementation. Use the desktop companion to adapt the same world to larger viewports.

Approved reference: .impeccable/mocks/approved/broadcast-mobile-approved.png.
Desktop companion: .impeccable/mocks/approved/broadcast-desktop-companion.png.

The user pin overrides concept seed 4617e83d. Cobalt header, 44px category strip, Sora headlines, Source Sans 3 body, a 16:9 lead photo and strong 29px mobile headline, followed by compact text-and-thumbnail rows. Real long headlines may clamp to four mobile lines; the full title remains in the link. Navigation order is India, Business, Technology, Sports, Entertainment, Belgaum.

Follow-up accepted: remove all six category search forms and subcategory tags and their filtering implementation. Preserve global search, category pagination, and saved followed topics. Restore actual stored view counts, including zero, throughout article presentations. Do not fabricate activity.

Latest user correction: remove the landing-page scrolling headline strip, including its tiles, arrows, Pause/Resume control, and animation. The lead story follows the briefing heading directly. This supersedes both earlier requests to add and animate the strip.

Components: white or cool-white surfaces, 8px photos/controls, 12px panels, one quiet hairline for functional grouping. No old broadsheet masthead, warm orange/cream palette, serif display typography, or scrollable lead carousel. Mobile controls have 44px targets and body text is 16px. The source publisher remains visible and opens in a new tab.

Media inventory:
| Ingredient | Medium | Origin |
| --- | --- | --- |
| News photography | Publisher-provided remote images | Existing source metadata in Hostinger; no generated reporting |
| Empty image state | Semantic text and Lucide newspaper icon | Application UI |
| Wordmark and headlines | Sora variable WOFF2 | Official Google Fonts; OFL license alongside font |
| Body and metadata | Source Sans 3 variable WOFF2 | Official Google Fonts; OFL license alongside font |
| Controls and navigation | Semantic HTML/CSS and Lucide icons | Application UI |
| Approved comps | Generated PNG design references | User-approved design, not shipping article assets |

Preview: READ_ONLY_PREVIEW=1. Live reads; database mutation helpers and mutating request paths blocked; analytics no-op; scheduler, AI generation, and mail delivery disabled. Authentication still uses the usual login. Normal operation remains available when the flag is off.
