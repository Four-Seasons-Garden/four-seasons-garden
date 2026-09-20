# Four Seasons Garden

A watercolor garden scene that re-skins itself by location and live weather, with a
background music player, a Japanese lyric-study mode, and an interactive reference for
the Japanese verb system at `/pond`.

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
| `npm run typecheck` | `tsc --noEmit` — the check `dev` skips |
| `npm test` | Unit tests for the pure `lib/` modules |
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

Two rules decide where anything goes:

1. **Logic with no React coupling lives in `lib/`**, where it can be imported and
   tested on its own. `app/` holds rendering.
2. **Every directory is a domain, not a category.** There is no `utils/`, no
   `constants/`, and no `helpers/` — a file sits with the feature it serves.

```text
app/
  page.tsx                      # the garden scene, HUD chips, page composition
  layout.tsx                    # Cormorant Garamond (display) + Geist Mono (labels)
  globals.css                   # watercolor CSS, biome palettes, animations, all page styles
  components/
    AppShell.tsx                # nav + heading chrome for the interior pages
    scene/                      # SceneArt (cottage, plants, fence), WeatherEffects
    music/                      # LocationMusic player, JapaneseLearningModal
    japanese/                   # JapaneseText (furigana), verbs/ (the Pond, see below)
  pond/                         # Japanese verb reference
  greenhouse/  nursery/  garden-sutra/
  api/
    weather/                    # current + hourly reads, manual sync
    music/playlists/            # tracks from Supabase, falling back to defaults
    cron/                       # supabase-keepalive, weather-sync
lib/
  biomes.ts                     # biome identity, palette (CSS vars), effects flags
  japanese/
    verbs.ts                    # verb data + conjugator — every form is derived
    verb-grammar.ts             # rules, example sentences, て-form patterns
    verb-settings.ts            # Pond study settings, as an external store
    lesson.ts                   # lesson types + track-to-lesson lookup
    lesson-text.ts              # furigana part matching, 五十音順 sorting
  music/
    tracks.ts                   # default playlists per biome
    lrc.ts                      # .lrc parsing, visible-lyric window
    youtube.ts                  # URL/id parsing, IFrame Player types + loader
  weather/
    open-meteo.ts               # forecast fetch + normalization
    display.ts                  # weather signal/kind/intensity, formatters
  ui/                           # useBiomeWeather, usePreciseClock, useSceneDraggable
  supabase/                     # read client (browser) + service client (server)
  time/almanac.ts               # zoned clock, Chinese lunar almanac
content/learning/               # lesson JSON (see below)
tests/                          # <domain>-<module>.test.ts, mirroring lib/
scripts/validate-learning.mjs   # lesson JSON + cross-reference check
supabase/migrations/            # schema + seed migrations
tools/lyrics-transcriber/       # local-only Python transcription helper (gitignored)
```

The `lib/japanese/` prefixes are load-bearing: `verb-*` is the Pond reference and
`lesson-*` is the lyric-study content, two subsystems that share only the
`JapanesePart` type. Sorting the directory groups them.

So `partIndexesForTerm` (which part of a line a vocabulary entry covers) and
`kanaToGojuonKey` (kana sort order) live in `lib/japanese/lesson-text.ts`, while the
component that renders furigana lives in `app/components/japanese/`.

Everything in `app/components/` is `"use client"`, as are the three hooks in
`lib/ui/`. The root page is a client component — the scene uses `useState` and
`useId`. The rest of `lib/` is plain TypeScript with no React import.

### Tests

`tests/` covers the pure modules with Node's built-in runner — no test framework
is installed, and none is needed. Node strips the types and runs the source
directly, so a test imports `../lib/music/lrc.ts` with the extension included.
`tests/` is excluded from `tsconfig.json` for that reason.

This only works for modules with no runtime imports, which is the practical
payoff of the `lib/` boundary: `lesson-text.ts` and `lrc.ts` are reachable from
a test precisely because they import nothing but types. Modules that reach for
the `@/` alias at runtime (`weather/display.ts`) are not covered — Node does not
read `tsconfig` paths.

`lib/japanese/` stays testable for the same reason: it does use the `@/` alias, but
only under `import type`, which is erased before Node ever resolves it. An `import`
without `type` in those files would break `npm test` while leaving the build green.

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
lib/japanese/lesson.ts           # shared types + track-to-lesson lookup
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
4. Add one lookup branch in `lib/japanese/lesson.ts` keyed on the track's `biomeId` and `youtubeId`.
5. Open the lesson and test all three tabs — furigana alignment, 五十音順 sorting, sentence → entry and entry → sentence links, desktop and mobile.
6. Run `npm run validate:learning`, then commit the JSON and the lookup change together.

Keep lesson, sentence, vocabulary, and grammar IDs stable after publishing. Reordering
is safe; reusing an old ID for a different meaning is not.

> Lesson JSON imports widen literal fields to `string`, so `contentType` will not satisfy
> the `LearningContentType` union on its own — `lib/japanese/lesson.ts` asserts the type,
> and `npm run validate:learning` is what actually guards the shape.

## Japanese verb reference

`/pond` renders the verb system — three classes, twelve forms, two registers — as one
interactive table. Nothing in it is transcribed: `lib/japanese/verbs.ts` holds eighteen
verbs and conjugates them on demand, so a cell and its explanation cannot drift apart.

```text
lib/japanese/
  verbs.ts                      # verb data + conjugator; returns forms AND their pieces
  verb-grammar.ts               # rules per (class x register x form), examples, patterns
  verb-settings.ts              # study settings, read via useSyncExternalStore
app/components/japanese/verbs/
  VerbLab.tsx                   # sidebar controls, collapsible sections
  ConjugationTable.tsx          # the table, family grouping, inline detail row
  CellDetail.tsx                # derivation strip, rule, example sentences
  BaseChart.tsx                 # the five godan bases
  PatternSections.tsx           # て-form patterns, causative-passive
```

A verb is stored as `head` + `tail` (`書` + `く`) alongside `headReading` (`か`).
Conjugation only ever rewrites `tail`, so the kanji and its furigana stay in sync
without a second table to maintain.

`conjugate()` returns the finished form **and** the segments it was built from:

| Role | Meaning | Seen in |
|---|---|---|
| `stem` | the part that never moves | 書 in 書きます |
| `base` | the kana-row swap godan verbs make | き in 書きます (い base) |
| `sound` | the euphonic change behind past and て | いて in 書いて |
| `suffix` | what is bolted on the end | ます in 書きます |

Those segments are what the detail card draws, so clicking a cell explains how that
exact form was derived rather than showing prose stored beside it. Forms that do not
exist — polite conditional, polite imperative — come back with `available: false`
carrying the reason and the construction to use instead.

Every cell also carries an English gloss, built the same compositional way. A verb
stores its principal parts, and each form owns one template, so a gloss exists for all
eighteen verbs across all twelve forms without writing two hundred of them by hand:

```ts
english: { base: "write", third: "writes", past: "wrote", participle: "written" }
potential: (e) => `can ${e.base}`          // 書ける  → can write
passive:   (e) => `is ${e.participle}`     // 書かれる → is written
```

The one template that lies is the passive, which is why `english` carries
`intransitive`. 死なれる is not "is died" — an intransitive verb's passive is the
adversative one, so it glosses as "have … die" instead. `glossFor()` branches on that
flag, and `tests/verbs.test.ts` pins both readings.

Glosses ignore politeness, because English does not mark it: 書きます and 書く are both
"writes". They render under each cell in Study density and vanish in Table, so the
compact view stays a bare reference grid.

Only `する` and `来る` are written out by hand; there is no rule to encode, which is
what makes them irregular. `来る` stores a reading per form, because the kanji hides
the こ / き / く shift that runs through its paradigm.

`tests/verbs.test.ts` encodes the reference conjugation tables verbatim and checks
every cell against the conjugator, along with the invariants that are easy to break:
the polite て column equals the plain one, 行く takes the っ sound change despite its
く ending, ichidan potential and passive are the same string, the causative-passive
contracts except after す, and every cell's segments reassemble into the exact form
and reading it renders.

### Adding a verb

1. Append it to `VERBS` in `lib/japanese/verbs.ts` with its `head` / `headReading` /
   `tail` split, a `group`, and its `english` principal parts. Godan family grouping,
   all twelve forms, and all twelve glosses follow from that — there is no per-verb
   table to fill in. Mark `intransitive: true` if the verb takes no direct object, or
   its passive will gloss as nonsense.
2. Add an example sentence under `VERB_EXAMPLES` in `lib/japanese/verb-grammar.ts`, split
   into `{ "text": "漢字", "reading": "かな" }` parts like the lesson JSON above.
3. Add a row to `tests/verbs.test.ts` if the verb demonstrates a rule no existing verb
   covers (a new ending, or an exception).

Irregular readings and sound-change exceptions are per-verb data, not new code:
`soundException` overrides the て/た change (`行く`), and `notes` surfaces caveats in
the detail card.

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
npm run typecheck && npm test && npm run lint && npm run validate:learning
```

`.github/workflows/ci.yml` runs those same four on every push to `main` and on
pull requests, so a type error surfaces in GitHub rather than only in a Vercel
failure email. The build itself stays Vercel's job — it needs the Supabase
environment, which CI does not have.

A red Vercel deploy does not roll production back; it leaves the previous
successful deploy serving. Check `vercel ls` if the site looks stale.
