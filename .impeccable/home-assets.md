# Home asset manifest

Approved direction: `.impeccable/mocks/decision/home-cover.png` and its approved JSON sidecar. The concept photograph is illustrative and is replaced by this authentic source photograph. PRODUCT.md and DESIGN.md reviewed.

| Comp ingredient | Implementation medium | Delivery / evidence |
| --- | --- | --- |
| Large landscape photo reveal, natural greenery and local heritage | Sourced raster, real Belagavi photograph | `public/images/home/belagavi-heritage.webp`, 2000×1500, 399,850 bytes (391 KiB) |
| Headline, supporting text, primary and secondary actions, navigation, later news previews | Semantic HTML/CSS | Parent implementation; no rasterized text or UI supplied |
| Cobalt cover, shaped photo reveal, corners and responsive crop | Semantic CSS/SVG geometry | Parent implementation; no image-native material was flattened to CSS |

## Source and license

- Subject: Kamal Basadi (Neminath Digambara Jain temple), within Belagavi Fort, Belagavi, Karnataka, India. Garden, palms, historic stone pavilion.
- Title: **Kamal Basti view, Belgaum**.
- Creator: **Shubham S. Sankannavar** ([creator](https://commons.wikimedia.org/wiki/User:Shubham_S._Sankannavar)).
- Source page: https://commons.wikimedia.org/wiki/File:Kamal_Basti_view,_Belgaum.jpg
- Exact original media: https://upload.wikimedia.org/wikipedia/commons/7/72/Kamal_Basti_view%2C_Belgaum.jpg
- License: [Creative Commons Attribution-ShareAlike 4.0 International](https://creativecommons.org/licenses/by-sa/4.0/). The optimized derivative remains CC BY-SA 4.0.
- Captured: 19 May 2018; source lists 17:46:50 and iPhone SE EXIF. Commons records own work by the uploader and the Wiki Loves Monuments 2018 submission.
- Verified: 20 October 2026. Source description, attribution and license inspected; original and final raster visually inspected. Commons' Kamal Basadi category identifies the monument in Belgaum Fort. This is a real local photograph, not a generated depiction or news event claim.

Suggested visible credit (with source and license links): **Kamal Basadi, Belagavi — Shubham S. Sankannavar / Wikimedia Commons · CC BY-SA 4.0. Resized and cropped.** Link the first location/title to the source page and the license name to the license. Use “Resized and compressed” if the frame is displayed uncropped. Keep a reasonable visible credit near the figure or in a clear photo credit destination.

Machine-readable attribution, exact source, changes and hashes: `public/images/home/image-license.json`. Source origin also embedded with the prescribed `embed-prompt.mjs` helper, which uses the adjacent `belagavi-heritage.webp.json` sidecar for WebP. No generation prompt exists because the asset is sourced photography.

## Treatment and crop

Converted the 4032×3024 JPEG to 2000×1500 WebP, quality 77, with cwebp. No retouching, compositing, color grading, synthetic fill, or subject alterations. No photo was cropped from the approved comp. The asset keeps its full source frame for responsive art direction.

Suggested alt text: **Kamal Basadi’s stone pavilion surrounded by palms and a green lawn inside Belagavi Fort.**

For an approximately 1.6:1 landscape reveal, start with `object-position: 50% 62%`; preserve the complete temple roof and lower stone pavilion. The actual subject is a temple within the fort, so do not caption it as the fort gateway or a generic street. The original top sky and palms give the curved reveal breathing room. Use the natural colors without cobalt tinting.

## Verification

- Output dimensions verified: 2000×1500, above the requested 1600px minimum.
- Output weight: 399,850 bytes, below the requested ~450KB ceiling.
- Final WebP opened and visually verified after compression.
- Provenance helper read/scan succeeds for the shipped raster.
- No changes to application code, news data, source policies or routes.
