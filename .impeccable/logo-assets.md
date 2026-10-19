# Logo restoration asset

## Direct

| Field | Value |
| --- | --- |
| ID | belgaum-today-logo |
| Source | User-supplied `codex-clipboard-0NjXKJ.png` |
| Output | `public/images/belgaum-today-logo.png` |
| Strategy | Exact production raster copied from the supplied image; provenance added as PNG metadata |
| User approval | User explicitly requested restoration of this exact Belgaum Today logo |
| Dimensions / format | 1086 × 158 px, PNG, original RGBA channels preserved |
| Weight | 46,229 bytes; source was 45,869 bytes, with the difference solely provenance metadata |
| Deviations | None in image pixels; no generation, tracing, recoloring, background removal, or resizing |
| QA | Accepted: visually inspected and decoded source/output pixels compare byte-for-byte identical |
| Pixel SHA-256 | `bba73e7014e02f602e21a3860246528c21aff48dd6b18f6a6ac8eb2eb896fee5` |
| Provenance | Embedded `impeccable:prompt` read-back verified; adjacent `.png.json` records source and approval |

## Produce

None.

## Semantic

None assigned. Parent owns logo placement and responsive sizing in application code.

## Execution order

Complete. Parent can consume `/images/belgaum-today-logo.png` at its intrinsic aspect ratio.

## Blockers

None.

## Assumptions

The supplied raster is the approved production logo. Its off-white background and full wordmark are intentional. Existing `public/images/logo.jpeg` remains unchanged.
