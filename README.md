# Four Seasons Garden

A watercolor garden scene that re-skins itself by location and live weather, with a
background music player and a Japanese lyric-study mode.

The whole scene is inline SVG — cottage, greenhouse, stone path, vegetable patch,
picket fence, and wildflower drifts, drawn with displacement-noise filters for the
wash effect. No external image assets.

Built with Next.js 16 (App Router), React 19, TypeScript, and Tailwind v4.
Deployed on Vercel as `four-seasons-garden` (`garden.yangran.org`).

## Getting started

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (**this** typechecks — `dev` does not) |
| `npm run start` | Serve a production build |
| `npm run lint` | ESLint |
| `npm run validate:learning` | Validate lesson JSON + all cross-reference IDs |

### Environment

Copy the Supabase values into `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WEATHER_SYNC_ADMIN_EMAILS=      # comma-separated, gates manual weather sync
WEATHER_SYNC_SECRET=            # optional shared secret for /api/weather/sync
CRON_SECRET=                    # set in Vercel; required by the cron routes when present
```

## Layout

```text
app/
  page.tsx                      # the scene, HUD, music player, learning modal
  globals.css                   # watercolor CSS, biome palettes, animations, HUD + modal styles
  layout.tsx                    # Cormorant Garamond (display) + Geist Mono (HUD labels)
  components/
    SceneArt.tsx                # cottage, greenhouse, plants, fence, paper grain
    WeatherEffects.tsx          # rain, snow, blossoms, mist, aurora, rainbow, lightning
    AppShell.tsx, useBiomeWeather.ts
  pond/  greenhouse/  nursery/  garden-sutra/
  api/
    weather/                    # current + hourly reads, manual sync
    music/playlists/            # tracks from Supabase, falling back to defaults
    cron/                       # supabase-keepalive, weather-sync
lib/
  constants/biomes.ts           # biome identity, palette (CSS vars), effects flags
  music/tracks.ts               # default playlists per biome
  music/learning.ts             # lesson types + track-to-lesson lookup
  weather/open-meteo.ts
content/learning/               # lesson JSON (see below)
supabase/migrations/            # schema + seed migrations
tools/lyrics-transcriber/       # local-only Python transcription helper (gitignored)
```

Components under `app/components/` are `"use client"` — the scene uses `useState`
and `useId`, and the page itself is a client component.

### Biomes

Williamsburg VA · Akureyri Iceland · Hualien Taiwan · Kyoto Japan · Mānoa Falls HI

Each biome carries a `palette` (CSS variables that re-skin the whole scene) and an
`effects` block (`rain`, `snow`, `aurora`, `blossoms`, `mist`, `rainbow`, `fireflies`,
`sun`). `page.tsx` reads both.

## Weather and Supabase

Hourly weather is synced from Open-Meteo into the `biome_hourly_weather` table.
Two Vercel crons are declared in `vercel.json`:

| Route | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/supabase-keepalive` | `17 13 * * *` | One small read so Supabase sees daily activity and doesn't pause the project |
| `/api/cron/weather-sync` | `7 14 * * *` | Refresh the hourly forecast cache |

Set `CRON_SECRET` in Vercel. Vercel sends it as `Authorization: Bearer <CRON_SECRET>`,
and the routes require it whenever the variable is configured.

## Language learning content

Learning content is versioned JSON, not one TypeScript file per lesson. JSON owns the
editable lesson; TypeScript owns the shared types, lesson lookup, rendering, sorting,
and cross-link behavior. The machine-readable contract is
[`content/learning/lesson.schema.json`](content/learning/lesson.schema.json).

```text
content/learning/
  lesson.schema.json             # shared JSON Schema for every lesson
  ja/kyoto/secret-base.json      # one file per song/article
lib/music/learning.ts            # shared types + track-to-lesson lookup
```

Every lesson has:

- `id` — stable kebab-case, e.g. `ja-kyoto-secret-base`
- `contentType` — `song` or `article`
- `language`, `title`, `subtitle`, optional `translationLanguage`
- `source` — at least `biomeId`; songs add `trackYoutubeId`, articles can add `url` and `attribution`
- `sequence` — the exact reading/listening order as sentence IDs. Repeated lines repeat their ID here rather than duplicating content.
- `blocks` — the visual stanza groups, in source order. **Flattening `blocks` must equal `sequence` exactly**; this preserves chorus and paragraph grouping without losing cross-links.
- `sentences` — canonical source lines, each with a stable ID (`s01`…), `parts`, and a translation
- `words` — `word`, `reading`, `meaning`, `sentenceIds`
- `grammar` — `title`, `explanation`, `example`, `translation`, `sentenceIds`

Keep Japanese split into `{ "text": "漢字", "reading": "かな" }` parts so the UI can
render furigana above each kanji group, and keep particles as their own parts so they
stay visible beside the ruby text. Parts may declare `wordIds` / `grammarIds`, and
vocabulary/grammar entries may declare stable `id` values. Text matching works as a
fallback, but prefer explicit IDs when a phrase is ambiguous or conjugated.

Links are bidirectional:

```text
sentence.parts ──► vocabulary / grammar entries
       ▲                    │
       └──── sentenceIds ◄──┘
```

Clicking an underlined segment opens the matching entry; clicking an entry jumps back
to and highlights its source sentence. `sentenceIds` must always refer to real sentence
IDs in the same lesson.

### Adding a song or article

1. Copy the nearest lesson into `content/learning/<language>/<biome>/<lesson-id>.json`.
2. Set metadata and `source`. Use `contentType: "song"` for lyrics, `"article"` for reading material.
3. Add the ordered `sequence` (including repeats), `blocks`, canonical sentences with furigana parts and translations, vocabulary, grammar, and reciprocal `sentenceIds`.
4. Add one lookup branch in `lib/music/learning.ts` keyed on the track's `biomeId` and `youtubeId`.
5. Open the lesson and test all three tabs — furigana alignment, 五十音順 sorting, sentence → entry and entry → sentence links, desktop and mobile.
6. Run `npm run validate:learning`, then commit the JSON and the lookup change together.

Keep lesson, sentence, vocabulary, and grammar IDs stable after publishing. Reordering
is safe; reusing an old ID for a different meaning is not.

> Lesson JSON imports widen literal fields to `string`, so `contentType` will not satisfy
> the `LearningContentType` union on its own — `lib/music/learning.ts` asserts the type,
> and `npm run validate:learning` is what actually guards the shape.

## Media and licensing

The app does not bundle copyrighted audio or lyrics. `public/audio/README.md` explains
where to place a file you have rights to, and `akureyri-bing-yu.lrc.template` provides
the timestamp slots for synced lyrics.

## Deploying

Pushing to `main` triggers a Vercel production deploy.

**Typecheck before you push.** `next dev` does not run TypeScript, but `next build`
does — so a type error runs fine locally and then fails every Vercel build, silently
freezing production on the last deploy that succeeded:

```bash
npx tsc --noEmit && npm run validate:learning
```
