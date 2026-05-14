const router = require('express').Router();
const queries = require('../db/queries');
const { requireAuth } = require('../middleware/auth');

router.get('/stats', requireAuth, (req, res) => {
  try {
    const stats = queries.getUserStats(req.user.id);
    res.json(stats);
  } catch (err) {
    console.error('GET /user/stats error:', err);
    res.status(500).json({ message: 'Failed to load stats' });
  }
});

module.exports = router;
