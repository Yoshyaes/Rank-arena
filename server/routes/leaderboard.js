const router = require('express').Router();
const queries = require('../db/queries');
const { optionalAuth } = require('../middleware/auth');

const PAGE_SIZE = 20;

router.get('/daily', optionalAuth, (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || PAGE_SIZE));

    const rows = queries.getDailyLeaderboard(date, limit, offset);
    const total = queries.getDailyLeaderboardCount(date);

    const leaderboard = rows.map((row, i) => ({
      rank: offset + i + 1,
      displayName: row.display_name || 'Anonymous',
      score: row.score,
      completedAt: row.completed_at,
    }));

    // Include user's own rank if authenticated
    let userRank = null;
    const userId = req.user?.id || (req.query.wp_user_id ? 'wp_' + req.query.wp_user_id : null);
    if (userId) {
      userRank = queries.getUserDailyRank(userId, date);
    }

    res.json({ date, leaderboard, total, hasMore: offset + limit < total, userRank });
  } catch (err) {
    console.error('GET /leaderboard/daily error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

router.get('/endless', optionalAuth, (req, res) => {
  try {
    const offset = Math.max(0, parseInt(req.query.offset) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || PAGE_SIZE));

    const rows = queries.getEndlessLeaderboard(limit, offset);
    const total = queries.getEndlessLeaderboardCount();

    const leaderboard = rows.map((row, i) => ({
      rank: offset + i + 1,
      displayName: row.display_name || 'Anonymous',
      score: row.score,
      achievedAt: row.achieved_at,
    }));

    // Include user's own rank if authenticated
    let userRank = null;
    const userId = req.user?.id || (req.query.wp_user_id ? 'wp_' + req.query.wp_user_id : null);
    if (userId) {
      userRank = queries.getUserEndlessRank(userId);
    }

    res.json({ leaderboard, total, hasMore: offset + limit < total, userRank });
  } catch (err) {
    console.error('GET /leaderboard/endless error:', err);
    res.status(500).json({ message: 'Failed to load leaderboard' });
  }
});

module.exports = router;
