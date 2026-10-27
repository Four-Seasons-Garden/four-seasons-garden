<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Credential file

The real `.env.local` lives outside the repo, in `~/.secrets/four-seasons/.env.local` (folder mode 700, file 600; owner, 2026-10-27, moved from the working copy). Never open, print, copy or commit it, and never move it back. `npm run dev` and `npm run start` load it through `scripts/next-local.mjs` (`node --env-file-if-exists` doesn't work with `next dev`; the script says why); `npm run build` doesn't, because Vercel builds with its own environment settings. See the README's Environment section.
