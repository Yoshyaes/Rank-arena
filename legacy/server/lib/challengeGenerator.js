const queries = require('../db/queries');
const { STAT_LABELS } = require('./constants');

function getStatLabel(category) {
  return STAT_LABELS[category] || category;
}

function getStatCategoryForDate(dateStr) {
  const schedule = ['metacritic', 'sales_millions', 'peak_players', 'avg_playtime_hours'];
  const date = new Date(dateStr + 'T00:00:00Z');
  const dayOfWeek = date.getUTCDay();
  return schedule[dayOfWeek % schedule.length];
}

function generateChallenge(dateStr, statCategory) {
  // Check if challenge already exists
  const existing = queries.getChallengeByDate(dateStr);
  if (existing) return null;

  if (!statCategory) {
    statCategory = getStatCategoryForDate(dateStr);
  }

  const allGames = queries.getGamesWithStat(statCategory);
  if (allGames.length < 20) {
    throw new Error(`Not enough games with ${statCategory} data (need 20, have ${allGames.length})`);
  }

  // Get recently used game IDs
  let recentIds = queries.getRecentGameIds(14);
  let available = allGames.filter(g => !recentIds.has(g.id));

  if (available.length < 20) {
    recentIds = queries.getRecentGameIds(7);
    available = allGames.filter(g => !recentIds.has(g.id));
  }

  if (available.length < 20) {
    available = allGames;
  }

  // Sort by stat value
  available.sort((a, b) => {
    const aVal = parseFloat(a[statCategory]) || 0;
    const bVal = parseFloat(b[statCategory]) || 0;
    return aVal - bVal;
  });

  const matchups = [];
  const usedIds = new Set();

  // 1. Close-call matchups (~6)
  const closeCallPairs = [];
  for (let i = 0; i < available.length - 1; i++) {
    const a = available[i];
    const b = available[i + 1];
    const aVal = parseFloat(a[statCategory]) || 0;
    const bVal = parseFloat(b[statCategory]) || 0;
    const max = Math.max(aVal, bVal);
    if (max > 0) {
      const spread = Math.abs(aVal - bVal) / max;
      if (spread < 0.25 && spread > 0.01) {
        closeCallPairs.push({ a, b, spread });
      }
    }
  }

  shuffleArray(closeCallPairs);
  for (const pair of closeCallPairs) {
    if (matchups.length >= 6) break;
    if (usedIds.has(pair.a.id) || usedIds.has(pair.b.id)) continue;
    usedIds.add(pair.a.id);
    usedIds.add(pair.b.id);
    if (Math.random() < 0.5) {
      matchups.push({ game_a_id: pair.a.id, game_b_id: pair.b.id });
    } else {
      matchups.push({ game_a_id: pair.b.id, game_b_id: pair.a.id });
    }
  }

  // 2. Surprise matchups (2+)
  const surpriseGames = available.filter(g => g.surprise_factor === 'high' && !usedIds.has(g.id));
  const normalGames = available.filter(g => (g.surprise_factor === 'low' || g.surprise_factor === 'medium') && !usedIds.has(g.id));

  shuffleArray(surpriseGames);
  shuffleArray(normalGames);

  let surpriseCount = 0;
  for (let i = 0; i < surpriseGames.length && surpriseCount < 2; i++) {
    const surprise = surpriseGames[i];
    if (usedIds.has(surprise.id)) continue;
    const sVal = parseFloat(surprise[statCategory]) || 0;
    for (const normal of normalGames) {
      if (usedIds.has(normal.id)) continue;
      const nVal = parseFloat(normal[statCategory]) || 0;
      if (sVal > nVal) {
        usedIds.add(surprise.id);
        usedIds.add(normal.id);
        matchups.push({ game_a_id: normal.id, game_b_id: surprise.id });
        surpriseCount++;
        break;
      }
    }
  }

  // 3. Fill remaining with random pairs
  const remaining = available.filter(g => !usedIds.has(g.id));
  shuffleArray(remaining);

  while (matchups.length < 10 && remaining.length >= 2) {
    const a = remaining.pop();
    const b = remaining.pop();
    if (!a || !b) break;
    usedIds.add(a.id);
    usedIds.add(b.id);
    matchups.push({ game_a_id: a.id, game_b_id: b.id });
  }

  // Fallback: reuse games if needed
  if (matchups.length < 10) {
    const all = [...allGames];
    shuffleArray(all);
    const tempUsed = new Set();
    for (const m of matchups) {
      tempUsed.add(m.game_a_id);
      tempUsed.add(m.game_b_id);
    }
    while (matchups.length < 10) {
      const pool = all.filter(g => !tempUsed.has(g.id));
      if (pool.length < 2) break;
      tempUsed.add(pool[0].id);
      tempUsed.add(pool[1].id);
      matchups.push({ game_a_id: pool[0].id, game_b_id: pool[1].id });
    }
  }

  // Sort: easier (large spread) first, harder (close) last
  matchups.sort((m1, m2) => {
    const g1a = allGames.find(g => g.id === m1.game_a_id);
    const g1b = allGames.find(g => g.id === m1.game_b_id);
    const g2a = allGames.find(g => g.id === m2.game_a_id);
    const g2b = allGames.find(g => g.id === m2.game_b_id);
    const spread1 = g1a && g1b
      ? Math.abs(parseFloat(g1a[statCategory]) - parseFloat(g1b[statCategory])) / Math.max(parseFloat(g1a[statCategory]), parseFloat(g1b[statCategory]), 1)
      : 0.5;
    const spread2 = g2a && g2b
      ? Math.abs(parseFloat(g2a[statCategory]) - parseFloat(g2b[statCategory])) / Math.max(parseFloat(g2a[statCategory]), parseFloat(g2b[statCategory]), 1)
      : 0.5;
    return spread2 - spread1;
  });

  // Insert into DB
  return queries.insertChallenge(dateStr, statCategory, matchups);
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

module.exports = { generateChallenge, getStatLabel, getStatCategoryForDate };
