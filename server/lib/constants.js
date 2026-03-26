const STAT_LABELS = {
  metacritic: 'Metacritic Score',
  sales_millions: 'Total Sales',
  peak_players: 'Peak Steam Players',
  avg_playtime_hours: 'Avg Playtime',
  user_score: 'User Score',
};

const VALID_STAT_CATEGORIES = Object.keys(STAT_LABELS);

module.exports = { STAT_LABELS, VALID_STAT_CATEGORIES };
