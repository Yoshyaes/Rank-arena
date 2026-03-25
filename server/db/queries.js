const db = require('./pool');

// Helper: parse JSON array fields from SQLite TEXT columns
function parseGame(row) {
  if (!row) return null;
  return {
    ...row,
    genre: row.genre ? JSON.parse(row.genre) : [],
    platform_tags: row.platform_tags ? JSON.parse(row.platform_tags) : [],
  };
}

// SAFE: returns only non-stat fields — used for client-facing responses
function getGameSafe(id) {
  const row = db.prepare(
    'SELECT id, title, year, genre, cover_url, platform_tags FROM games WHERE id = ?'
  ).get(id);
  return parseGame(row);
}

// FULL: returns all fields — server-side only, NEVER send directly to client
function getGameById(id) {
  const row = db.prepare('SELECT * FROM games WHERE id = ?').get(id);
  return parseGame(row);
}

function getAllGames() {
  const rows = db.prepare('SELECT * FROM games ORDER BY id').all();
  return rows.map(parseGame);
}

// Returns games where a specific stat column is NOT NULL
function getGamesWithStat(statColumn) {
  const allowed = ['metacritic', 'user_score', 'sales_millions', 'peak_players', 'avg_playtime_hours'];
  if (!allowed.includes(statColumn)) {
    throw new Error(`Invalid stat column: ${statColumn}`);
  }
  const rows = db.prepare(
    `SELECT * FROM games WHERE ${statColumn} IS NOT NULL ORDER BY id`
  ).all();
  return rows.map(parseGame);
}

// Daily challenges
function getChallengeByDate(date) {
  const row = db.prepare(
    'SELECT * FROM daily_challenges WHERE challenge_date = ?'
  ).get(date);
  if (row) {
    row.matchups = JSON.parse(row.matchups);
  }
  return row || null;
}

function insertChallenge(date, statCategory, matchups) {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO daily_challenges (challenge_date, stat_category, matchups) VALUES (?, ?, ?)'
  );
  const result = stmt.run(date, statCategory, JSON.stringify(matchups));
  if (result.changes === 0) return null; // Already existed
  return getChallengeByDate(date);
}

// Get game IDs used in recent challenges (for recency filtering)
function getRecentGameIds(days = 14) {
  const rows = db.prepare(
    `SELECT matchups FROM daily_challenges WHERE challenge_date > date('now', '-' || ? || ' days')`
  ).all(days);
  const ids = new Set();
  for (const row of rows) {
    const matchups = JSON.parse(row.matchups);
    for (const matchup of matchups) {
      ids.add(matchup.game_a_id);
      ids.add(matchup.game_b_id);
    }
  }
  return ids;
}

// Daily results
function insertDailyResult(userId, date, score) {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO daily_results (user_id, challenge_date, score) VALUES (?, ?, ?)'
  );
  const result = stmt.run(userId, date, score);
  if (result.changes === 0) return null;
  return { user_id: userId, challenge_date: date, score };
}

function getDailyLeaderboard(date, limit = 20) {
  return db.prepare(
    `SELECT dr.score, dr.completed_at, u.display_name
     FROM daily_results dr
     LEFT JOIN users u ON dr.user_id = u.id
     WHERE dr.challenge_date = ?
     ORDER BY dr.score DESC, dr.completed_at ASC
     LIMIT ?`
  ).all(date, limit);
}

// Endless scores
function insertEndlessScore(userId, score) {
  const stmt = db.prepare(
    'INSERT INTO endless_scores (user_id, score) VALUES (?, ?)'
  );
  stmt.run(userId, score);
  return { user_id: userId, score };
}

function getEndlessLeaderboard(limit = 20) {
  return db.prepare(
    `SELECT es.score, es.achieved_at, u.display_name
     FROM endless_scores es
     LEFT JOIN users u ON es.user_id = u.id
     ORDER BY es.score DESC, es.achieved_at ASC
     LIMIT ?`
  ).all(limit);
}

// Streaks
function getStreak(userId) {
  return db.prepare('SELECT * FROM streaks WHERE user_id = ?').get(userId) || null;
}

function upsertStreak(userId, currentStreak, longestStreak, lastPlayed) {
  db.prepare(
    `INSERT INTO streaks (user_id, current_streak, longest_streak, last_played)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       current_streak = excluded.current_streak,
       longest_streak = excluded.longest_streak,
       last_played = excluded.last_played`
  ).run(userId, currentStreak, longestStreak, lastPlayed);
  return getStreak(userId);
}

// Users
function upsertUser(id, email, displayName) {
  db.prepare(
    `INSERT INTO users (id, email, display_name)
     VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, display_name = excluded.display_name`
  ).run(id, email, displayName);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function getUserStats(userId) {
  const streak = getStreak(userId);
  const bestDaily = db.prepare(
    'SELECT MAX(score) as best FROM daily_results WHERE user_id = ?'
  ).get(userId);
  const totalGames = db.prepare(
    'SELECT COUNT(*) as count FROM daily_results WHERE user_id = ?'
  ).get(userId);
  return {
    currentStreak: streak?.current_streak || 0,
    longestStreak: streak?.longest_streak || 0,
    bestDailyScore: bestDaily?.best || 0,
    totalGamesPlayed: totalGames?.count || 0,
  };
}

module.exports = {
  getGameSafe,
  getGameById,
  getAllGames,
  getGamesWithStat,
  getChallengeByDate,
  insertChallenge,
  getRecentGameIds,
  insertDailyResult,
  getDailyLeaderboard,
  insertEndlessScore,
  getEndlessLeaderboard,
  getStreak,
  upsertStreak,
  upsertUser,
  getUserStats,
};
