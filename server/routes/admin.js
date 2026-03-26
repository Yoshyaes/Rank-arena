const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const queries = require('../db/queries');
const { generateChallenge } = require('../lib/challengeGenerator');
const { VALID_STAT_CATEGORIES } = require('../lib/constants');
const rateLimit = require('express-rate-limit');

const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { message: 'Too many admin requests' },
});

router.post('/challenge', adminAuth, adminLimiter, (req, res) => {
  try {
    const { challenge_date, stat_category, matchups, auto_generate } = req.body;

    if (!challenge_date || !stat_category) {
      return res.status(400).json({ message: 'challenge_date and stat_category are required' });
    }

    // Validate date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(challenge_date)) {
      return res.status(400).json({ message: 'Invalid date format. Use YYYY-MM-DD' });
    }

    // Validate stat category
    if (!VALID_STAT_CATEGORIES.includes(stat_category)) {
      return res.status(400).json({ message: `Invalid stat_category. Must be one of: ${VALID_STAT_CATEGORIES.join(', ')}` });
    }

    if (auto_generate) {
      const challenge = generateChallenge(challenge_date, stat_category);
      if (!challenge) {
        return res.status(409).json({ message: 'Challenge already exists for this date' });
      }
      return res.json({ created: true, challenge });
    }

    if (!matchups || !Array.isArray(matchups) || matchups.length === 0) {
      return res.status(400).json({ message: 'matchups array required when not auto-generating' });
    }

    // Validate each matchup has valid game IDs
    for (const m of matchups) {
      if (!m.game_a_id || !m.game_b_id || typeof m.game_a_id !== 'number' || typeof m.game_b_id !== 'number') {
        return res.status(400).json({ message: 'Each matchup must have numeric game_a_id and game_b_id' });
      }
      if (!queries.getGameById(m.game_a_id) || !queries.getGameById(m.game_b_id)) {
        return res.status(400).json({ message: `Game ID not found in matchup: ${m.game_a_id} vs ${m.game_b_id}` });
      }
    }

    const challenge = queries.insertChallenge(challenge_date, stat_category, matchups);
    res.json({ created: true, challenge });
  } catch (err) {
    console.error('POST /admin/challenge error:', err);
    res.status(500).json({ message: 'Failed to create challenge' });
  }
});

module.exports = router;
