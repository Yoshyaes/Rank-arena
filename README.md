# Rank Arena

Daily Higher/Lower game for **Two Average Gamers**. Players guess which of two video games has the higher stat — Metacritic score, total sales, peak Steam players, or average playtime.

This repo holds the React (Vite) client source. The production WordPress plugin that serves the game lives separately at [`Yoshyaes/TAG-rank-arena`](https://github.com/Yoshyaes/TAG-rank-arena) and consumes the bundle this repo builds.

## Architecture

```
Yoshyaes/Rank-arena              (this repo — React client source)
  └─ client/                     React + Vite app
  └─ scripts/postbuild-copy-dist.mjs   copies dist/ into TAG-rank-arena workspace
  └─ legacy/server/              ORIGINAL Express + better-sqlite3 backend.
                                 Retired when the API moved to the WP plugin
                                 (Apr 2026). Kept for reference + the code-review
                                 audit docs. Not run in production.
```

The runtime stack:
- **Client:** React 18 + Vite. Mounts on `#rank-arena-root` inside the WP `[rank_arena]` shortcode (or `#root` for standalone dev). Tailwind utilities are scoped to that root via `important: '#rank-arena-root'` so the surrounding TAG theme isn't affected.
- **Server:** WordPress plugin (`Yoshyaes/TAG-rank-arena`). REST namespace `rank-arena/v1`. Cookie + `X-WP-Nonce` auth. MySQL via `$wpdb`.
- **Design tokens:** `client/src/theme/` — `tokens.css` + `tailwind-preset.js` are the shared TAG palette used across game plugins.

## Development

```bash
npm install
cd client && npm install && cd ..
npm run dev
```

- Frontend on http://localhost:5173 (Vite).
- API calls hit `/wp-json/rank-arena/v1/*`. Set `WP_DEV_URL` to point Vite's dev proxy at a local WordPress install (defaults to `http://localhost:8080`):

```bash
WP_DEV_URL=http://localhost:8080 npm run dev
```

Standalone dev (no WordPress at all) loads via the fallback `#root` mount in `client/index.html`. The game UI renders but API calls fail until you proxy a real WP install or stub the responses.

### Lint + tests

```bash
npm run lint           # client/src ESLint
npm test               # client vitest
npm run test:legacy-server   # only if you're poking the legacy/server/ code
```

## Build for the TAG WordPress plugin

`npm run build` triggers a `postbuild` step (`scripts/postbuild-copy-dist.mjs`) that copies the freshly built `dist/` into the TAG-rank-arena workspace, ready for deploy:

```bash
# 1. Build + auto-copy dist into TAG-rank-arena
npm run build

# 2. From the tag-wp-tools workspace, deploy the plugin to Cloudways
cd "../TAG Wordpress Website"
./scripts/deploy/deploy-plugin.sh plugins/rank-arena plugins/rank-arena
```

The postbuild target defaults to `../TAG Wordpress Website/plugins/rank-arena` (sibling of this repo on Fred's machine). Override with the `TAG_RANK_ARENA_PLUGIN_DIR` env var when working elsewhere:

```bash
TAG_RANK_ARENA_PLUGIN_DIR=/path/to/TAG-rank-arena npm run build
```

PHP edits (Arcade registration, REST endpoints, etc.) belong in `Yoshyaes/TAG-rank-arena`, not in this repo. This repo's `wp-plugin/` directory is legacy from before the split and is now gitignored.

## Legacy server (`legacy/server/`)

The original Express + better-sqlite3 backend that powered Rank Arena during initial development. Retired when the API moved to the WP plugin. Kept here because:

- It documents the original API contract that the React client was built against.
- `legacy/server/code-review.md` and `legacy/server/FIXES_APPLIED.md` capture a security audit + remediations performed in April 2026. Some classes of issues (CORS, HMAC verification, rate limiting, SVG injection, path traversal) are worth re-checking against the new WP plugin REST API.
- The remote branch `fix/code-review-issues` on `Yoshyaes/Rank-arena` was the working branch for those fixes.

The legacy code is not built or deployed by the current pipeline. Dependencies it still references (`express`, `cors`, `better-sqlite3`, `sharp`, `express-rate-limit`, `@supabase/supabase-js`, etc.) are retained in `package.json` so the legacy code can still be run locally for reference.

If you want to run it:

```bash
cd legacy/server
node index.js
```

You'll need a `.env` with `DATABASE_URL`, `RAWG_API_KEY`, `ADMIN_PASSWORD`, etc. See `legacy/server/.env.example` in the `fix/code-review-issues` branch for the full list.
