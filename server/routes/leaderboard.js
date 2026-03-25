const router = require('express').Router();
const queries = require('../db/queries');

router.get('/daily', (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const rows = queries.getDailyLeaderboard(date);
    const leaderboard = rows.map((row, i) => ({
      rank: i + 1,
      displayName: row.display_name || 'Anonymous',
      score: row.score,
      completedAt: row.completed_at,
    }));
    res.json({ date, leaderboard });
  } catch (err) {
    console.error('GET /leaderboard/daily error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.get('/endless', (req, res) => {
  try {
    const rows = queries.getEndlessLeaderboard();
    const leaderboard = rows.map((row, i) => ({
      rank: i + 1,
      displayName: row.display_name || 'Anonymous',
      score: row.score,
      achievedAt: row.achieved_at,
    }));
    res.json({ leaderboard });
  } catch (err) {
    console.error('GET /leaderboard/endless error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
