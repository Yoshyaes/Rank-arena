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
