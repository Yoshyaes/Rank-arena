const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const queries = require('../db/queries');
const { generateChallenge } = require('../lib/challengeGenerator');

router.post('/challenge', adminAuth, (req, res) => {
  try {
    const { challenge_date, stat_category, matchups, auto_generate } = req.body;

    if (!challenge_date || !stat_category) {
      return res.status(400).json({ message: 'challenge_date and stat_category are required' });
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

    const challenge = queries.insertChallenge(challenge_date, stat_category, matchups);
    res.json({ created: true, challenge });
  } catch (err) {
    console.error('POST /admin/challenge error:', err);
    res.status(500).json({ message: 'Failed to create challenge' });
  }
});

module.exports = router;
