# Self-hosted type assets

Retrieved on 2026-10-19 from official Google Fonts services. The font binaries and OFL texts are unmodified. Both binaries are normal style, Latin subsets, WOFF2 variable fonts.

| File | Intended role and weight range | Verified binary `wght` axis | Bytes | SHA-256 |
|---|---|---|---:|---|
| `sora-latin-variable.woff2` | Headings, 400–800 | 400–800; default 400 | 25,240 | `3902474d3ece89c8580d5ef3325cf58753e6e45a86f9957b4dacc4fce2e7fde1` |
| `source-sans-3-latin-variable.woff2` | Body, 400–700 | 200–900; default 200 | 28,804 | `587435ca9d90732b8c1ce4958222c6ad3ade2b875500188e1d318efbcb61f4c5` |

Configure the local font declarations for the intended ranges above. Google Fonts advertises Source Sans 3 as 400–700 in this request but serves a binary containing the full 200–900 weight axis; it has been preserved without subsetting or modification.

## Official sources

- [Google Fonts CSS request](https://fonts.googleapis.com/css2?family=Sora:wght@400..800&family=Source+Sans+3:wght@400..700&display=swap), saved verbatim as `google-fonts-source.css` for provenance only. Do not import this remote-source response in app styles.
- [Sora Latin WOFF2](https://fonts.gstatic.com/s/sora/v17/xMQ9uFFYT72X5wkB_18qmnndmSdSnh2BAfO5mnuyOo1lfiQwV6-xo6eeIw.woff2), Google Fonts CDN version 17.
- [Source Sans 3 Latin WOFF2](https://fonts.gstatic.com/s/sourcesans3/v20/nwpStKy2OAdR1K-IwhWudF-R3w8aZejf5Hc.woff2), Google Fonts CDN version 20.
- [Sora OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/sora/OFL.txt), saved as `Sora-OFL.txt`; SHA-256 `ba0b9729c9428ba79a0459ab8ec575791b51509dbec213e383d0316d37fec299`.
- [Source Sans 3 OFL](https://raw.githubusercontent.com/google/fonts/main/ofl/sourcesans3/OFL.txt), saved as `Source-Sans-3-OFL.txt`; SHA-256 `09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392`.

Both license files are the official SIL Open Font License 1.1 notices. Source Sans 3's license includes the Reserved Font Name “Source.”

The CSS request used a modern Chrome user agent to obtain variable WOFF2 responses. Both WOFF2 signatures, Brotli payloads, and `fvar` axis tables were validated locally.

Latin coverage reported by Google Fonts: `U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD`. Other scripts should use the app's system fallback stack.
