-- Rank Arena Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS games (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  title               TEXT NOT NULL,
  year                INTEGER,
  genre               TEXT,          -- JSON array string: '["Action","RPG"]'
  cover_url           TEXT,
  metacritic          INTEGER,
  user_score          REAL,
  sales_millions      REAL,
  peak_players        INTEGER,
  avg_playtime_hours  REAL,
  platform_tags       TEXT,          -- JSON array string: '["PC","PS5"]'
  fun_fact            TEXT,
  surprise_factor     TEXT,
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_challenges (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_date  TEXT UNIQUE NOT NULL,  -- 'YYYY-MM-DD'
  stat_category   TEXT NOT NULL,
  matchups        TEXT NOT NULL,          -- JSON string
  created_at      TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,        -- UUID as text
  email         TEXT UNIQUE,
  display_name  TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_results (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         TEXT REFERENCES users(id),
  challenge_date  TEXT NOT NULL,
  score           INTEGER NOT NULL,
  completed_at    TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, challenge_date)
);

CREATE TABLE IF NOT EXISTS endless_scores (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id      TEXT REFERENCES users(id),
  score        INTEGER NOT NULL,
  achieved_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS streaks (
  user_id          TEXT REFERENCES users(id) PRIMARY KEY,
  current_streak   INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  last_played      TEXT   -- 'YYYY-MM-DD'
);

CREATE INDEX IF NOT EXISTS idx_daily_results_date_score ON daily_results(challenge_date, score DESC);
CREATE INDEX IF NOT EXISTS idx_endless_scores_score ON endless_scores(score DESC);
CREATE INDEX IF NOT EXISTS idx_daily_challenges_date ON daily_challenges(challenge_date);
