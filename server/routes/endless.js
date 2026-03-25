const router = require('express').Router();
const queries = require('../db/queries');
const { getStatLabel } = require('../lib/challengeGenerator');
const { optionalAuth } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const endlessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { message: 'Too many requests, please slow down' },
});

const STAT_CATEGORIES = ['metacritic', 'sales_millions', 'peak_players', 'avg_playtime_hours'];

// GET /api/endless/pair — SAFE data only, no stats
router.get('/pair', endlessLimiter, (req, res) => {
  try {
    const statCategory = STAT_CATEGORIES[Math.floor(Math.random() * STAT_CATEGORIES.length)];
    const games = queries.getGamesWithStat(statCategory);
    if (games.length < 2) {
      return res.status(500).json({ message: 'Not enough games available' });
    }

    const excludeStr = req.query.exclude || '';
    const excludeIds = new Set(excludeStr.split(',').filter(Boolean).map(Number));

    let available = games.filter(g => !excludeIds.has(g.id));
    if (available.length < 2) available = games;

    // Shuffle
    for (let i = available.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [available[i], available[j]] = [available[j], available[i]];
    }

    const gameA = available[0];
    const gameB = available[1];

    res.json({
      statCategory,
      statLabel: getStatLabel(statCategory),
      game_a: { id: gameA.id, title: gameA.title, year: gameA.year, genre: gameA.genre, cover_url: gameA.cover_url, platform_tags: gameA.platform_tags },
      game_b: { id: gameB.id, title: gameB.title, year: gameB.year, genre: gameB.genre, cover_url: gameB.cover_url, platform_tags: gameB.platform_tags },
    });
  } catch (err) {
    console.error('GET /endless/pair error:', err);
    res.status(500).json({ message: 'Failed to load pair' });
  }
});

// POST /api/endless/score — validates answer, reveals stats
router.post('/score', (req, res) => {
  try {
    const { game_a_id, game_b_id, stat_category, choice } = req.body;
    if (!game_a_id || !game_b_id || !stat_category || !['a', 'b'].includes(choice)) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const gameA = queries.getGameById(game_a_id);
    const gameB = queries.getGameById(game_b_id);
    if (!gameA || !gameB) {
      return res.status(400).json({ message: 'Invalid game IDs' });
    }

    const aVal = parseFloat(gameA[stat_category]) || 0;
    const bVal = parseFloat(gameB[stat_category]) || 0;

    let correctAnswer;
    if (aVal > bVal) correctAnswer = 'a';
    else if (bVal > aVal) correctAnswer = 'b';
    else correctAnswer = choice;

    res.json({
      correct: choice === correctAnswer,
      game_a_stat: parseFloat(gameA[stat_category]),
      game_b_stat: parseFloat(gameB[stat_category]),
      game_a_fun_fact: gameA.fun_fact,
      game_b_fun_fact: gameB.fun_fact,
      correctAnswer,
    });
  } catch (err) {
    console.error('POST /endless/score error:', err);
    res.status(500).json({ message: 'Failed to validate answer' });
  }
});

// POST /api/endless/result
router.post('/result', optionalAuth, (req, res) => {
  try {
    const { score } = req.body;
    if (typeof score !== 'number' || score < 0) {
      return res.status(400).json({ message: 'Invalid score' });
    }
    if (req.user) {
      const result = queries.insertEndlessScore(req.user.id, score);
      return res.json({ saved: true, result });
    }
    res.json({ saved: false, message: 'Sign in to save your score' });
  } catch (err) {
    console.error('POST /endless/result error:', err);
    res.status(500).json({ message: 'Failed to save score' });
  }
});

module.exports = router;
