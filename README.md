# Handoff → `Four-Seasons-Garden/four-seasons-garden`

These files port the watercolor cottage design from this prototype into your Next.js repo. Drop each file into the matching path in the repo.

## File-by-file mapping

| Repo path (replace / add) | Source in handoff bundle | Action |
|---|---|---|
| `app/page.tsx` | `handoff-to-github/app/page.tsx` | **Replace** (this is the whole new scene) |
| `app/globals.css` | `handoff-to-github/app/globals.css` | **Replace** (all watercolor CSS, palettes, animations, HUD styles) |
| `lib/constants/biomes.ts` | `handoff-to-github/lib/constants/biomes.ts` | **Replace** (new schema with `palette` + `effects`) |
| `app/components/SceneArt.tsx` | `handoff-to-github/app/components/SceneArt.tsx` | **Add** (cottage, greenhouse, stone path, wildflowers, veggies, fence, paper grain, lucide-ish icons) |
| `app/components/WeatherEffects.tsx` | `handoff-to-github/app/components/WeatherEffects.tsx` | **Add** (rain, snow, blossoms, mist, aurora, rainbow, lightning) |
| `app/layout.tsx` | — | **Edit one line.** Swap the Geist Google import for Cormorant Garamond + Geist Mono. See "Layout tweak" below. |

You can delete these from the repo — they aren't referenced anymore:
- The old `BackgroundLayer`, `MidgroundLayer`, `ForegroundLayer`, `Tulip`, `Rose`, etc. inside `app/page.tsx` (the new `page.tsx` replaces all of it)
- `framer-motion` and `lucide-react` are no longer required by the new code — you can keep them installed or run `npm uninstall framer-motion lucide-react`. Nothing in the handoff imports them.

## Layout tweak (`app/layout.tsx`)

The scene uses Cormorant Garamond (display serif, italic) + Geist Mono (HUD labels). Replace the font imports in `app/layout.tsx` with:

```ts
import { Cormorant_Garamond, Geist_Mono } from "next/font/google";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});
```

Then change the `<html className={...}>` to:

```tsx
<html lang="en" className={`${cormorant.variable} ${geistMono.variable} h-full antialiased`}>
```

`globals.css` already references these via `var(--font-cormorant)` and `var(--font-geist-mono)`.

## What changed conceptually

- The old scene was flat stylized flowers (tulips, sunflowers, roses) on stepping stones. The new scene is a layered watercolor cottage with chimney smoke, thatch, climbing wisteria, greenhouse, stone path, vegetable patch, picket fence, and wildflower drifts — all built from SVG with displacement-noise filters for the wash effect.
- Biome data carries a `palette` (CSS variables that re-skin the whole scene) and an `effects` block (`rain`, `snow`, `aurora`, `blossoms`, `mist`, `rainbow`, `fireflies`, `sun`). The new `page.tsx` reads both.
- The HUD is now wordmark (bottom-left), weather chip (top-right), and a biome dropdown (below the chip) — all glass-morph styled and tinted by the active biome's palette.

## Notes

- Everything inside `app/components/` is marked `"use client"` since the scene uses `useState` and `useId`. The page itself is also a client component.
- No external image assets are needed — the entire scene is SVG.
- The five biomes (Williamsburg, Akureyri, Hualien, Kyoto, Mānoa) are unchanged in identity but their visual treatment is new.
