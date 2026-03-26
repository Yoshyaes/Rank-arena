const router = require('express').Router();
const queries = require('../db/queries');
const { generateChallenge, getStatLabel } = require('../lib/challengeGenerator');
const { optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const challengeSubmitLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please slow down' },
});

// In-memory cache for today's challenge
let cachedChallenge = null;
let cachedDate = null;

const LAUNCH_DATE = new Date('2026-03-22T00:00:00Z');

function getChallengeNumber(dateStr) {
  const date = new Date(dateStr + 'T00:00:00Z');
  return Math.floor((date - LAUNCH_DATE) / 86400000) + 1;
}

function getTodayDateStr() {
  return new Date().toISOString().split('T')[0];
}

function getTodayChallenge() {
  const today = getTodayDateStr();
  if (cachedDate === today && cachedChallenge) {
    return cachedChallenge;
  }

  let challenge = queries.getChallengeByDate(today);

  if (!challenge) {
    challenge = generateChallenge(today);
    if (!challenge) {
      challenge = queries.getChallengeByDate(today);
    }
  }

  if (challenge) {
    cachedChallenge = challenge;
    cachedDate = today;
  }

  return challenge;
}

// GET /api/challenge/today
// SECURITY: Returns ONLY safe game data — NEVER stat values
router.get('/today', (req, res) => {
  try {
    const challenge = getTodayChallenge();
    if (!challenge) {
      return res.status(404).json({ message: 'No challenge available for today' });
    }

    const matchups = challenge.matchups;
    const safeMatchups = [];

    for (let i = 0; i < matchups.length; i++) {
      const m = matchups[i];
      const gameA = queries.getGameSafe(m.game_a_id);
      const gameB = queries.getGameSafe(m.game_b_id);
      if (!gameA || !gameB) continue;
      safeMatchups.push({ round: i, game_a: gameA, game_b: gameB });
    }

    res.json({
      challengeNumber: getChallengeNumber(challenge.challenge_date),
      date: challenge.challenge_date,
      statCategory: challenge.stat_category,
      statLabel: getStatLabel(challenge.stat_category),
      totalRounds: safeMatchups.length,
      matchups: safeMatchups,
    });
  } catch (err) {
    console.error('GET /challenge/today error:', err);
    res.status(500).json({ message: 'Failed to load challenge' });
  }
});

// POST /api/challenge/submit
router.post('/submit', challengeSubmitLimiter, (req, res) => {
  try {
    const { round, choice, date } = req.body;

    if (typeof round !== 'number' || !['a', 'b'].includes(choice) || !date) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    // Always validate against server's current date to prevent stale client submissions
    const today = getTodayDateStr();
    if (date !== today) {
      return res.status(400).json({ message: 'Challenge date mismatch — please refresh' });
    }

    const challenge = getTodayChallenge();
    if (!challenge) {
      return res.status(404).json({ message: 'No challenge available' });
    }

    const matchups = challenge.matchups;
    if (round < 0 || round >= matchups.length) {
      return res.status(400).json({ message: 'Invalid round index' });
    }

    const matchup = matchups[round];
    const gameA = queries.getGameById(matchup.game_a_id);
    const gameB = queries.getGameById(matchup.game_b_id);

    if (!gameA || !gameB) {
      return res.status(500).json({ message: 'Game data not found' });
    }

    const statCategory = challenge.stat_category;
    const aVal = parseFloat(gameA[statCategory]) || 0;
    const bVal = parseFloat(gameB[statCategory]) || 0;

    let correctAnswer;
    if (aVal > bVal) correctAnswer = 'a';
    else if (bVal > aVal) correctAnswer = 'b';
    else correctAnswer = choice; // Tie

    res.json({
      correct: choice === correctAnswer,
      game_a_stat: parseFloat(gameA[statCategory]),
      game_b_stat: parseFloat(gameB[statCategory]),
      game_a_fun_fact: gameA.fun_fact,
      game_b_fun_fact: gameB.fun_fact,
      correctAnswer,
    });
  } catch (err) {
    console.error('POST /challenge/submit error:', err);
    res.status(500).json({ message: 'Failed to submit answer' });
  }
});

// POST /api/challenge/result
router.post('/result', optionalAuth, (req, res) => {
  try {
    const { date, score, wp_user_id, wp_display_name } = req.body;

    if (!date || typeof score !== 'number' || score < 0 || score > 10) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    if (date !== getTodayDateStr()) {
      return res.status(400).json({ message: 'Can only submit results for today' });
    }

    // Use WordPress user if provided (from PHP proxy), or Supabase user
    let userId = req.user?.id;
    let displayName = req.user?.displayName;

    if (wp_user_id) {
      // Verify WP user via HMAC signature if WP_AUTH_SECRET is configured
      const wpSecret = process.env.WP_AUTH_SECRET;
      if (wpSecret) {
        const crypto = require('crypto');
        const expected = crypto.createHmac('sha256', wpSecret)
          .update(String(wp_user_id))
          .digest('hex');
        if (req.body.wp_auth_sig !== expected) {
          return res.status(403).json({ message: 'Invalid WordPress auth signature' });
        }
      }
      userId = 'wp_' + wp_user_id;
      displayName = wp_display_name || 'Player';
      queries.upsertUser(userId, null, displayName);
    }

    if (userId) {
      // Check if already submitted for today
      const existing = queries.getDailyResult(userId, date);
      if (existing) {
        return res.json({ saved: false, alreadyPlayed: true, result: existing });
      }

      // Insert result + update streak atomically
      const result = queries.saveDailyResultWithStreak(userId, date, score);

      return res.json({ saved: true, result });
    }

    res.json({ saved: false, message: 'Sign in to save your score to the leaderboard' });
  } catch (err) {
    console.error('POST /challenge/result error:', err);
    res.status(500).json({ message: 'Failed to save result' });
  }
});

module.exports = router;
