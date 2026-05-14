# Rank Arena

Daily Higher/Lower game for **Two Average Gamers**. Players guess which of two video games has the higher stat — Metacritic score, total sales, peak Steam players, or average playtime.

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Install

```bash
npm install
cd client && npm install && cd ..
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```bash
cp .env.example .env
```

Required variables:
- `DATABASE_URL` — PostgreSQL connection string
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_KEY` — for auth (optional for dev)
- `RAWG_API_KEY` — for fetching game cover art
- `ADMIN_PASSWORD` — for the admin challenge creation endpoint

### Database Setup

Run the schema and seed data:

```bash
npm run seed
```

This creates all tables, inserts 50+ games from `data/games.json`, and generates daily challenges from 3 days ago through 14 days from now.

### Fetch Cover Art

After seeding, fetch cover art from RAWG:

```bash
npm run fetch-covers
```

### Development

Run Express + Vite concurrently:

```bash
npm run dev
```

- Frontend: http://localhost:5173
- API: http://localhost:3001

### Production Build

```bash
npm run build
npm start
```

Express serves the built frontend from `/dist` and handles all `/api/*` routes.

### Build for the TAG WordPress plugin

This repo holds the React + Node source. The deployed WordPress plugin (PHP + the React `dist/` it serves + the TAG Arcade integration) lives in a separate repo: [`Yoshyaes/TAG-rank-arena`](https://github.com/Yoshyaes/TAG-rank-arena).

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

## Create a Daily Challenge Manually

```bash
curl -X POST http://localhost:3001/api/admin/challenge \
  -H "Authorization: Basic $(echo -n 'admin:YOUR_PASSWORD' | base64)" \
  -H "Content-Type: application/json" \
  -d '{"challenge_date": "2026-03-26", "stat_category": "metacritic", "auto_generate": true}'
```

## Deploy on Replit

1. Import the repo
2. Set environment variables in Replit Secrets
3. Run `npm run seed` in the shell
4. Set the run command to `npm run build && npm start`
