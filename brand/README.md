# Tone Brand Kit

Everything you need to represent Tone consistently. All assets are generated
from one source of truth — `brand/generate.js` — so the logo, icons, favicon,
and social image never drift apart. Rebuild anytime with:

```bash
npm i -D sharp png-to-ico   # build-only tools for the generator
node brand/generate.js
```

## The logo

The Tone mark is a **microphone capsule with a sound waveform cut out of it**,
seated in a cradle. It says "voice" and "recording" at a glance, which maps
directly to the product: capturing and reproducing *your* voice.

Three forms:

- **Lockup** — mark stacked above the TONE wordmark. Use for splash screens,
  the login page, decks, and anywhere with room to breathe.
- **Mark only** — the mic. Use for app icons, favicons, avatars, and tight
  spaces.
- **Wordmark only** — the letters TONE. Use inline in headers next to the mark
  or in running text.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Ink (background) | `#0D0D0C` | Primary background, app icon field |
| Cream (foreground) | `#F7F3E9` | The mark and wordmark on dark surfaces |
| Accent (brand) | `#6366f1` | Per-workspace accent (configurable in-app); default indigo |

The logo is **monochrome by design** — cream on ink, or ink on cream. It is
not tied to the accent color, so a workspace can recolor its accent without
touching the logo. Keep the mark single-color; do not fill the waveform bars
with the accent.

### Contrast rules

- On **dark** surfaces (the default app theme): use the **cream** mark.
- On **light** surfaces: use the **black** mark (`tone-logo-black.svg`,
  `tone-mark-black.svg`).
- In-app, the `ToneMark` React component uses `currentColor`, so it inherits
  the surrounding text color and stays correct in both light and dark mode
  automatically.

## Typography

- **Interface + wordmark:** Geist Sans (already the app font). The TONE
  wordmark is drawn as vector paths, so it needs no font at render time.
- **Monospace (code, tokens):** Geist Mono.

## Clear space and minimum size

- Keep clear space around the lockup equal to the height of the "T" in TONE.
- Minimum mark size: **16px** (favicon). Below that the waveform cut-outs stop
  reading; use a solid silhouette if you ever need smaller.

## Don'ts

- Don't recolor the waveform bars or fill them with the accent.
- Don't add gradients, shadows, or bevels to the mark.
- Don't stretch, rotate, or outline the logo.
- Don't place the cream mark on a light background (or the black mark on dark).
- Don't rebuild the letters in a different typeface and call it the wordmark.

## Asset index

### `brand/svg/` (vector, infinitely scalable)

| File | What it is |
| --- | --- |
| `tone-logo-dark.svg` | Master lockup: cream on ink (the file you provided) |
| `tone-logo-cream.svg` | Lockup, cream, transparent bg — for dark surfaces |
| `tone-logo-black.svg` | Lockup, black, transparent bg — for light surfaces |
| `tone-mark.svg` | Mic mark, cream, transparent |
| `tone-mark-black.svg` | Mic mark, black, transparent |
| `tone-mark-on-dark.svg` | Mic mark, cream on ink — the app icon |
| `tone-maskable.svg` | Mark inside the 80% safe zone for Android maskable icons |
| `tone-wordmark-cream.svg` / `tone-wordmark-black.svg` | Just the letters |
| `tone-og.svg` | 1200x630 social card |

### `brand/png/` (raster, for platforms that need PNG)

- `icon-16 … icon-1024.png` — square app/favicon sizes
- `favicon.ico` (in `brand/`) — multi-size 16/32/48 favicon
- `apple-touch-icon.png` — 180x180 for iOS home screen
- `android-chrome-192.png`, `android-chrome-512.png` — PWA icons
- `maskable-512.png` — Android adaptive icon
- `og-image.png` — 1200x630 Open Graph / Twitter card
- `tone-logo-1024.png` — master lockup raster

## Where these are wired into the app

- `src/app/favicon.ico`, `src/app/icon.png`, `src/app/apple-icon.png`,
  `src/app/opengraph-image.png` — Next.js file-based metadata (auto-served).
- `public/site.webmanifest` + `public/android-chrome-*.png` — installable PWA.
- `public/brand/*.svg` — logos available at `/brand/…` for decks and emails.
- `src/components/tone-logo.tsx` — the inline `ToneMark` React component used
  in the header, sidebar, and auth pages.
