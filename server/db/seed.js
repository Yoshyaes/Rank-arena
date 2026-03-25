require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const fs = require('fs');
const path = require('path');
const db = require('./pool');
const { generateChallenge } = require('../lib/challengeGenerator');

function runSchema() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('Schema created successfully.');
}

function seedGames() {
  const gamesPath = path.join(__dirname, '..', '..', 'data', 'games.json');
  const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));

  const stmt = db.prepare(
    `INSERT OR IGNORE INTO games (title, year, genre, cover_url, metacritic, user_score, sales_millions, peak_players, avg_playtime_hours, platform_tags, fun_fact, surprise_factor)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((games) => {
    let inserted = 0;
    for (const game of games) {
      const result = stmt.run(
        game.title,
        game.year,
        JSON.stringify(game.genre),
        game.cover_url || null,
        game.metacritic,
        game.user_score,
        game.sales_millions,
        game.peak_players,
        game.avg_playtime_hours,
        JSON.stringify(game.platform_tags),
        game.fun_fact || null,
        game.surprise_factor || null,
      );
      if (result.changes > 0) inserted++;
    }
    return inserted;
  });

  const inserted = insertMany(games);
  console.log(`Seeded ${inserted} games.`);
  return inserted;
}

function seedChallenges() {
  const statSchedule = ['metacritic', 'sales_millions', 'peak_players', 'avg_playtime_hours'];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 3);
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 365);

  let challengeCount = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const dayIndex = Math.floor((current.getTime() - startDate.getTime()) / 86400000);
    const statCategory = statSchedule[dayIndex % statSchedule.length];

    try {
      const result = generateChallenge(dateStr, statCategory);
      if (result) challengeCount++;
    } catch (err) {
      console.warn(`Warning: Could not generate challenge for ${dateStr}: ${err.message}`);
    }

    current.setDate(current.getDate() + 1);
  }

  console.log(`Seeded ${challengeCount} daily challenges.`);
}

try {
  runSchema();
  seedGames();
  seedChallenges();
  console.log('Seeding complete!');
} catch (err) {
  console.error('Seed error:', err);
}
