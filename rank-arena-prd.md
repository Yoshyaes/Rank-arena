# Rank Arena — Product Requirements Document

> **Build Target:** Replit (React + Node.js + PostgreSQL)
> **Version:** 1.0 | **Owner:** Fred Twum-Acheampong / Two Average Gamers

---

## Executive Summary

Rank Arena is a daily web-based Higher/Lower game for Two Average Gamers where players guess which of two video games has the higher stat — Metacritic score, total sales, peak Steam players, or average playtime. It is the first gaming-specific stat comparison game in a format proven by The Higher Lower Game (Google search volume) and numerous celebrity/sports clones. Designed for 1–3 minute sessions, Rank Arena drives daily repeat traffic through competitive streak chasing and a daily challenge mode that lets players compare scores with friends.

---

## Problem Statement

Gaming discourse thrives on comparison: "Which game sold more?", "Is this actually better rated than that?", "How many people still play X?" These debates happen constantly on Reddit, Discord, and Twitter — but nowhere can you test your knowledge and share the results. Existing Higher/Lower games use generic data (Google searches, celebrity net worth). No product exists that applies this format to the gaming stats that TAG's audience already debates. TAG needs a 1–3 minute daily ritual game that's the fastest to build, easiest to share, and most likely to generate the "wait, WHAT?!" moments that drive viral sharing.

---

## Solution Overview

A daily browser game playable at `twaveragegamers.com/arena`. Each day, a fixed sequence of 10 matchups drops (same for all players). Two game cards appear side by side — player picks which game ranks higher on the featured stat. Streak extends until wrong answer or end of daily challenge. An endless mode runs indefinitely for leaderboard chasing. Results card shows score + emoji trail. User accounts track all-time high score, current daily streak, and stat accuracy by category.

---

## Target Users

**Primary:** TAG readers, ages 28–42, who have strong opinions about game quality, popularity, and sales but enjoy having those assumptions challenged. Players who debate "which game actually sold more" in Discord. Competitive types who will replay endless mode to chase a high score.

**Secondary:** Casual gaming fans who find the game through a viral share card ("I got 9/10 on today's Rank Arena — can you beat me?") and become new TAG readers.

---

## Design System

### Brand Identity
Rank Arena should feel competitive and fast — like a sports scoreboard crossed with a trading card game. Dark, bold, high-contrast. Numbers are the hero. The design language rewards speed and creates urgency.

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-primary` | `#080B0F` | Main background — near-black with blue tint |
| `--bg-card` | `#111418` | Game card backgrounds |
| `--bg-card-hover` | `#191E25` | Card hover state |
| `--bg-surface` | `#1C2128` | Modals, result panels |
| `--accent-win` | `#22C55E` | Correct answer highlight, streak counter |
| `--accent-lose` | `#EF4444` | Wrong answer highlight, fail state |
| `--accent-gold` | `#F59E0B` | New high score, streak milestone, leaderboard rank |
| `--accent-blue` | `#3B82F6` | Interactive elements, "Higher" button |
| `--accent-purple` | `#8B5CF6` | "Lower" button, secondary actions |
| `--text-primary` | `#F1F5F9` | Headings, stat numbers |
| `--text-secondary` | `#64748B` | Labels, category tags |
| `--border` | `#1E2530` | Card borders, dividers |

### Typography

| Use | Font | Size | Weight |
|-----|------|------|--------|
| Stat numbers | `Space Grotesk` | 36–48px | 800 |
| Game title on card | `Inter` | 18–20px | 700 |
| Stat label | `Inter` | 12px | 500 |
| Category badge | `Inter` | 11px | 600 (all-caps) |
| Score counter | `Space Grotesk` | 24px | 700 |

### Card Design
Each game card shows:
- **Game title** — large, bold, center-top
- **Game cover art** (thumbnail, 16:9 or box art, sourced from IGDB/RAWG free API)
- **Year + Genre** — small label below title
- **Stat reveal zone** — center of card, shows "?" until answer submitted, then animates to actual number

Card dimensions: `~45% viewport width` on desktop, `full width stacked` on mobile.

Card states:
- **Default:** neutral dark card, both side-by-side
- **Hover/selected intent:** glowing border (blue = higher pick, purple = lower pick)
- **Correct reveal:** card floods with `--accent-win` green, stat number counts up from 0
- **Wrong reveal:** card floods with `--accent-lose` red, correct answer shown on other card
- **Streak broken:** full-width red flash + score card slides up

### Comparison Divider
Between the two cards: a circular badge showing the current stat category. E.g., "📊 Metacritic" or "🎮 Peak Players." On mobile, this sits between the stacked cards.

### Animations
- Stat reveal: number counter animation (0 → actual value) — 600ms ease-out
- Correct: card border pulses green, streak counter ticks up — 300ms
- Wrong: red flash, cards lock, answer shown — 400ms, then result modal
- New high score: gold particle burst from score counter
- Daily challenge complete: results card expands with full score breakdown

### Score Card (Share Format)
```
Rank Arena Daily #47 — March 27, 2026
🎮 Stat: Peak Steam Players

✅✅✅❌ — Score: 3/10
Best: 7/10  |  Streak: 12 days

Can you beat me?
twaveragegamers.com/arena
```

---

## Core Features

### Phase 1: MVP (Days 1–5)

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| Game card UI | Two cards side-by-side with cover art, title, year | P0 | Low |
| Higher/Lower buttons | Tap card or tap button to make pick | P0 | Low |
| Stat reveal animation | "?" animates to real number after pick | P0 | Low |
| Correct/wrong feedback | Color flash + streak counter | P0 | Low |
| Daily challenge mode | 10 fixed matchups/day, same for all players | P0 | Low |
| Score card + share | Emoji trail + score, copy-to-clipboard | P0 | Low |
| Game data file | JSON of 300+ games with verified stats | P0 | Med |
| Endless mode | Randomized infinite matchups for high-score chasing | P0 | Low |
| localStorage state | Game state survives refresh; one play per day enforced | P0 | Low |
| Mobile responsive | Stacked cards on mobile, full playability | P0 | Low |

### Phase 2: Accounts + Leaderboards (Weeks 2–3)

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| User auth | Email/Google via Replit Auth or Supabase | P0 | Med |
| Daily leaderboard | Top 20 scores for today's challenge, resets daily | P0 | Med |
| All-time leaderboard | Endless mode high score board | P1 | Low |
| Streak tracking | Daily challenge streak, displayed in header | P0 | Med |
| Profile + stats | Win rate by stat category, play history, best score | P1 | Med |

### Phase 3: Depth + Discovery (Weeks 4–8)

| Feature | Description | Priority | Complexity |
|---------|-------------|----------|------------|
| Stat categories | Rotate between Metacritic, Sales, Steam Players, Playtime, User Score | P1 | Low |
| Weekly theme mode | All 10 daily matchups from same genre/franchise/era | P1 | Med |
| "Explain the result" panel | After each answer: quick fact about why the stat is what it is | P2 | Med |
| Data freshness pipeline | Auto-update Steam player counts monthly via API | P2 | Med |
| TAG article linking | Each game card links to relevant TAG review/article | P2 | Low |
| Discord challenge | Daily challenge link auto-posts to TAG Discord | P2 | Low |

---

## Technical Architecture

### System Overview

```
Browser (React SPA)
    │
    ├── Game card components (cover art, title, stat reveal)
    ├── Daily challenge state machine (10 rounds)
    ├── localStorage (today's result, guest high score)
    └── REST API ──────────────► Node.js/Express (Replit)
                                      │
                                      ├── /api/challenge/today    (GET daily 10 matchups)
                                      ├── /api/challenge/submit   (POST daily result)
                                      ├── /api/endless/pair       (GET random matchup)
                                      ├── /api/leaderboard/daily  (GET top 20)
                                      ├── /api/user/stats         (GET profile stats)
                                      └── PostgreSQL
                                            ├── games
                                            ├── daily_challenges
                                            ├── results
                                            ├── leaderboard
                                            └── users/streaks
```

### Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React (Vite) | Component model fits card/game state architecture; fast Replit builds |
| Styling | Tailwind CSS + custom CSS vars | Dark-mode theming; utility-first keeps styling co-located with components |
| Animations | CSS transitions + custom counter hook | Stat counter effect is pure CSS/JS — no heavy animation library needed |
| Backend | Node.js + Express | Lightweight; Replit-native; daily challenge seeding is a simple cron |
| Database | PostgreSQL (Replit DB) | Leaderboard queries and streak tracking benefit from relational structure |
| Game Data | Static JSON (games.json) seeded to DB | 300+ game records: title, year, genre, cover_url, metacritic, sales_millions, peak_players, avg_playtime_hours |
| Cover Art | RAWG.io API (free, 100k req/month) | Free game database API with cover art + metadata; fallback to placeholder |
| Auth | Replit Auth | Zero-config, OAuth-ready |
| Deployment | Replit Autoscale | Handles daily midnight spike when new challenge drops |

### Data Model

```sql
-- Game library
games (
  id              SERIAL PRIMARY KEY,
  title           TEXT NOT NULL,
  year            INTEGER,
  genre           TEXT[],
  cover_url       TEXT,
  metacritic      INTEGER,              -- 0–100
  user_score      NUMERIC(3,1),         -- 0.0–10.0
  sales_millions  NUMERIC(6,2),         -- e.g. 33.41
  peak_players    INTEGER,              -- Steam peak concurrent
  avg_playtime_hours NUMERIC(5,1),      -- HowLongToBeat median
  platform_tags   TEXT[],               -- ['PC', 'PS5', 'Xbox']
  updated_at      TIMESTAMP DEFAULT NOW()
)

-- Daily challenge definitions
daily_challenges (
  id            SERIAL PRIMARY KEY,
  challenge_date DATE UNIQUE NOT NULL,
  stat_category  TEXT NOT NULL,         -- 'metacritic' | 'sales' | 'peak_players' | 'playtime'
  matchups       JSONB NOT NULL,        -- Array of 10 {game_a_id, game_b_id}
  created_at     TIMESTAMP DEFAULT NOW()
)

-- Users
users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  display_name  TEXT,
  created_at    TIMESTAMP DEFAULT NOW()
)

-- Daily challenge results
daily_results (
  id              SERIAL PRIMARY KEY,
  user_id         UUID REFERENCES users(id),
  challenge_date  DATE NOT NULL,
  score           INTEGER NOT NULL,     -- 0–10
  completed_at    TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, challenge_date)
)

-- Endless mode high scores
endless_scores (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES users(id),
  score       INTEGER NOT NULL,
  achieved_at TIMESTAMP DEFAULT NOW()
)

-- Streak tracking
streaks (
  user_id         UUID REFERENCES users(id) PRIMARY KEY,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_played     DATE
)
```

### API Specifications

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/challenge/today` | None | Returns today's 10 matchups (game titles, covers — NO stats until submitted) |
| POST | `/api/challenge/submit` | Optional | Submits completed daily result, returns full stat reveal + leaderboard position |
| GET | `/api/endless/pair` | None | Returns random game pair for endless mode |
| POST | `/api/endless/score` | Optional | Records endless score |
| GET | `/api/leaderboard/daily` | None | Top 20 daily scores with display names |
| GET | `/api/leaderboard/endless` | None | All-time endless high scores |
| GET | `/api/user/stats` | Required | Streak, best score, win rate by category |
| POST | `/api/admin/challenge` | Admin | Creates a daily challenge for a specific date |

### Daily Challenge Seeding Logic

```javascript
// Runs via cron at 11:55 PM EST to prep next day's challenge
async function seedDailyChallenge(date, statCategory) {
  // Pull 20 games from pool: mix of recognizable + surprising
  // Pair them so ~60% of answers are non-obvious (spread < 20%)
  // Avoid repeating any game from past 14 days
  // Ensure at least 2 matchups with "surprising" answers (e.g., indie beats AAA)
  const matchups = generateBalancedMatchups(gamePool, statCategory);
  await db.daily_challenges.insert({ challenge_date: date, stat_category: statCategory, matchups });
}
```

### Game Data Sources (for initial 300-game dataset)

| Stat | Source | Update Frequency |
|------|--------|-----------------|
| Metacritic score | Metacritic (manual/scrape) | One-time + as new games release |
| Sales figures | VGChartz, press releases, Wikipedia | Quarterly |
| Peak Steam players | SteamSpy API (free) or SteamCharts | Monthly |
| Avg playtime | HowLongToBeat (manual or API) | One-time |
| Cover art | RAWG.io free API | On-demand |

---

## User Flows

### Daily Challenge (First-Time Visitor)

1. User lands on `/arena`, sees "Daily Challenge #47" with today's stat category badge
2. Two game cards appear: cover art, title, year visible; stat shows "?"
3. User taps card (or taps Higher/Lower button below) to make pick
4. Stat reveals on both cards with count-up animation
5. Correct: green flash, streak +1, "Next →" button appears
6. Wrong: red flash, correct answer highlighted, result modal slides up
7. Result modal shows: score (X/10), emoji trail, share button
8. Share copies formatted card to clipboard
9. Soft CTA: "Create account to save your streak"

### Endless Mode

1. User clicks "Play Endless" after daily challenge (or from home screen)
2. Continuous random matchups — same UI, infinite until wrong answer
3. Score counter increments in header
4. Wrong answer: all-time high score compared, prompted to sign in to save score
5. Leaderboard shows top 10 scores for today's endless session

### Return Visitor (Logged In)

1. User sees streak counter in header on page load: "🔥 8 days"
2. Daily challenge complete badge if already played today, shows score
3. Endless mode available immediately
4. Profile tab shows: 7-day streak calendar, best score by stat category

---

## Non-Functional Requirements

### Performance
- Page load: < 1s (cover art lazy-loaded, stats served from DB cache)
- Daily challenge API response: < 150ms
- Zero wrong-answer spoiling: stats never included in GET response payload until POST submit

### Security
- Stats withheld from initial payload (server validates answer, not client)
- Rate limit: 30 requests/min on `/endless/pair` to prevent data scraping
- Admin challenge creation endpoint: IP-restricted + basic auth

### Scalability
- Daily challenge JSON cached in-memory on Node server (same 10 matchups for all users — one DB read per server restart)
- Cover art CDN-cached via RAWG; fallback SVG placeholder if API fails
- Leaderboard queries: indexed on `challenge_date + score DESC`

---

## Success Metrics

| Metric | 30-Day Target | 90-Day Target | Measurement Method |
|--------|--------------|--------------|-------------------|
| Daily challenge completions | 300/day | 1,500/day | daily_results table count |
| Share rate | 20% of completions | 35% | Share button click events |
| Endless mode sessions | 150/day | 750/day | endless_scores entries |
| 7-day retention | 20% | 35% | Cohort analysis on users table |
| Daily challenge streak (7+) | 10% of active users | 25% | Streak query |
| New TAG readers from referral | 150/month | 800/month | UTM referral attribution |
| Average session length | 2 min | 3 min | Analytics event tracking |

---

## Game Data: Initial 300-Game Seed List Categories

The stat comparisons are only as good as the game selection. Prioritize:

- **AAA titles with surprising stats:** Games players assume are #1 but aren't (e.g., Minecraft outselling everything, Terraria outselling most AAA titles)
- **Metacritic surprises:** Beloved games with lower scores than expected; critically acclaimed games the audience hasn't played
- **Sales shockers:** Mobile game sales dwarfing console titles; indie outliers
- **Player count ghosts:** Once-huge games with near-zero active players now vs. still-thriving communities
- **TAG audience titles:** Marvel Rivals, Apex Legends, Fortnite, Diablo 4, Palworld, Valorant, Elden Ring — these should appear frequently to validate or challenge what players "know"

Stat categories to rotate across the week:
- Monday: Metacritic score
- Tuesday: Total sales (millions)
- Wednesday: Peak Steam concurrent players
- Thursday: Average playtime (hours)
- Friday: User review score
- Weekend: "Mix" (randomized stat per matchup)

---

## Cost Estimates

### Development (One-Time)
| Phase | Est. Hours (Vibe Coding w/ Replit Agent) | Est. Cost |
|-------|------------------------------------------|-----------|
| MVP — Game + Data (Phase 1) | 6–10 hrs | $0 (self-build) |
| Accounts + Leaderboards (Phase 2) | 5–8 hrs | $0 |
| Depth Features (Phase 3) | 8–12 hrs | $0 |
| **Initial game data compilation** | 3–5 hrs | $0 (manual research) |

### Operations (Monthly)
| Service | Cost |
|---------|------|
| Replit Core (hosting + DB) | $20 |
| RAWG.io API (cover art) | $0 (free tier) |
| Analytics (Plausible, shared with Connections) | $9 |
| **Total** | **$29/month** |

_(If both TAG Connections and Rank Arena share the same Replit project and Plausible instance, combined hosting stays at $29/month.)_

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Game stats become outdated / inaccurate | Med | High | Version all stats with `updated_at`; add disclaimer "Stats as of [date]"; quarterly refresh pipeline |
| RAWG API rate-limits or deprecates | Low | Med | Cache all cover art locally in DB after first fetch; fallback SVG with game title |
| Matchups feel too easy / not surprising enough | High | Med | Curation guideline: 60% of matchups should be <20% spread; include at least 2 "shocking" results per daily set |
| Players feel cheated by ambiguous stats (sales includes DLC?) | Med | Med | Show stat methodology tooltip on each card: "Includes all platforms, DLC excluded" |
| Daily challenge feels repetitive after 30 days | High | Med | Stat category rotation + weekly theme mode prevents staleness; endless mode provides infinite replayability |
| Someone else builds gaming Higher/Lower first | Med | Low | Build Rank Arena in 3–5 days before window closes; it's the fastest build of the three concepts |

---

## Timeline & Milestones

| Day/Week | Milestone | Deliverable |
|----------|-----------|-------------|
| Day 1–2 | Game data compiled | `games.json` with 300+ entries, verified stats |
| Day 2–3 | Core game built | Two-card layout, Higher/Lower logic, stat reveal |
| Day 3–4 | Daily challenge + endless mode | 10-round fixed daily, infinite mode, score tracking |
| Day 4–5 | Share card + mobile QA | Emoji result card, clipboard copy, responsive layout |
| Day 5 | Soft launch | Live on TAG, Discord announcement, newsletter CTA |
| Week 2 | User accounts + leaderboard | Auth, daily leaderboard, streak tracking |
| Week 3 | Profile + stats | Category accuracy breakdown, play history |
| Week 4–6 | Stat rotation + theme mode | Weekly franchise/genre theme challenges |

---

## Open Questions

- [ ] Should the daily challenge enforce one-play-only, or allow replays that don't count toward leaderboard?
- [ ] Do we show the stat category before playing, or reveal it as part of the surprise?
- [ ] For sales data: digital sales only, physical only, or combined? Need a consistent methodology stated clearly.
- [ ] Should Rank Arena and TAG Connections share a unified account system from day one (single TAG profile for both games)?
- [ ] First daily challenge: should it feature TAG's most-read games (Marvel Rivals vs Fortnite etc.) to feel immediately relevant?

---

## Appendix: Sample Matchup Ideas (Surprising Results)

| Game A | Game B | Stat | Surprising Because |
|--------|--------|------|-------------------|
| Terraria | Far Cry 6 | Sales | Terraria (~44M) outsells Far Cry 6 (~10M) |
| Stardew Valley | Cyberpunk 2077 | Sales | Stardew (~30M) outsells Cyberpunk (~25M) |
| Minecraft | GTA V | Sales | Minecraft (~300M) is 4x GTA V (~200M) |
| Disco Elysium | Call of Duty: Vanguard | Metacritic | Disco (97) vs CoD (63) |
| Palworld | Elden Ring | Peak Steam | Palworld (2.1M) vs Elden Ring (952K) |
| CS:GO | Fortnite | Peak Steam Players | Fortnite is web-only — 0 Steam players |
| Hades | God of War Ragnarök | User Score | Hades (93) vs GoW:R (94) — nearly tied, surprises people |

---

*PRD Version 1.0 — Two Average Gamers × Rank Arena*
*Build in Replit using Replit Agent. Reference this PRD as the system prompt context.*
