# Handoff → `Four-Seasons-Garden/four-seasons-garden`

## Supabase keep-alive

This app includes a Vercel Cron keep-alive at `/api/cron/supabase-keepalive`.
It runs daily from `vercel.json` and performs one small read against
`biome_hourly_weather` so the Supabase project receives regular database
activity.

For production, add a `CRON_SECRET` environment variable in Vercel. Vercel sends
that value as `Authorization: Bearer <CRON_SECRET>` when it invokes the cron job,
and the route will require it whenever the variable is configured.

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

## Language learning content

Learning content is stored as versioned JSON rather than one TypeScript file per lesson. JSON owns the editable lesson; TypeScript owns the shared types, lesson lookup, rendering, sorting, and cross-link behavior. The machine-readable contract is [`content/learning/lesson.schema.json`](content/learning/lesson.schema.json).

### Content structure

```text
content/learning/
  lesson.schema.json             # shared JSON Schema for every lesson
  ja/
    kyoto/
      secret-base.json           # song lesson: one file per song/article
    <city-or-biome>/
      <lesson-id>.json
lib/music/learning.ts             # shared types + track-to-lesson lookup
```

Every lesson must have:

- `id`: stable kebab-case ID, for example `ja-kyoto-secret-base`.
- `contentType`: `song` or `article`.
- `language`, `title`, `subtitle`, and optional `translationLanguage`.
- `source`: at least `biomeId`; songs should also include `trackYoutubeId`, while articles can include `url` and `attribution`.
- `sequence`: the exact reading/listening order as sentence IDs. Repeated lyric lines should repeat their ID here instead of duplicating lesson content.
- `sentences`: the canonical source lines. Each has a stable ID such as `s01`, `parts`, and a translation.
- `words`: vocabulary entries with `word`, `reading`, `meaning`, and `sentenceIds`.
- `grammar`: grammar entries with `title`, `explanation`, `example`, `translation`, and `sentenceIds`.

Keep Japanese text split into `{ "text": "漢字", "reading": "かな" }` parts so the UI can render furigana above each kanji group. For precise future linking, parts may also declare `wordIds` and `grammarIds`; vocabulary and grammar entries may declare stable `id` values. The current Kyoto lesson supports text matching as a compatibility fallback, but new lessons should prefer explicit IDs when a phrase can be ambiguous or conjugated.

The links are intentionally bidirectional:

```text
sentence.parts ──► vocabulary / grammar entries
       ▲                    │
       └──── sentenceIds ◄──┘
```

Clicking an underlined Japanese segment or sentence link opens the matching Vocabulary/Grammar entry. Clicking an entry jumps back to and highlights its source sentence. `sentenceIds` must always refer to real sentence IDs in the same lesson.

### Adding a song or article

1. Copy the nearest lesson shape into `content/learning/<language>/<biome>/<lesson-id>.json`.
2. Set the lesson metadata and source information. Use `contentType: "song"` for lyrics and `contentType: "article"` for literature or reading material.
3. Add the exact ordered `sequence` (including repeated choruses), canonical sentence IDs, furigana parts, translations, vocabulary, grammar, and reciprocal `sentenceIds` links. Add explicit part-level IDs where text matching could be unclear.
4. Add one lookup branch in `lib/music/learning.ts` using the track’s `biomeId` and `youtubeId` (or extend the lookup when article pages are added).
5. Open the lesson and test all three tabs. Check furigana alignment, Japanese 五十音順（あいうえお順）sorting, sentence → entry links, and entry → sentence links on desktop and mobile.
6. Run `npm run validate:learning` to check JSON metadata and all cross-reference IDs, then commit the JSON and lookup change together. The same structure is described formally in `content/learning/lesson.schema.json`.

Keep lesson IDs, sentence IDs, vocabulary IDs, and grammar IDs stable after publishing. Reordering content is safe; reusing an old ID for a different meaning is not. This file-based contract keeps lessons easy to review now and gives us a clean migration target for a future database or Supabase table without changing the player UI.
