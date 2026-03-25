require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const db = require('../db/pool');

const RAWG_KEY = process.env.RAWG_API_KEY;
const DELAY_MS = 300;

function sanitizeTitle(title) {
  return title
    .replace(/\s*\(\d{4}\)/, '')
    .split(' / ')[0]
    .trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchCovers() {
  if (!RAWG_KEY) {
    console.error('RAWG_API_KEY not set in .env');
    process.exit(1);
  }

  const games = db.prepare(
    'SELECT id, title FROM games WHERE cover_url IS NULL ORDER BY id'
  ).all();

  console.log(`Found ${games.length} games without cover art.`);

  let updated = 0;
  let failed = 0;
  const updateStmt = db.prepare('UPDATE games SET cover_url = ? WHERE id = ?');

  for (const game of games) {
    const searchTitle = sanitizeTitle(game.title);
    const url = `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${encodeURIComponent(searchTitle)}&page_size=1`;

    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.results && data.results.length > 0 && data.results[0].background_image) {
        updateStmt.run(data.results[0].background_image, game.id);
        console.log(`  [OK] ${game.title} → cover fetched`);
        updated++;
      } else {
        updateStmt.run('/placeholder-cover.svg', game.id);
        console.log(`  [--] ${game.title} → no result, using placeholder`);
        failed++;
      }
    } catch (err) {
      console.error(`  [ERR] ${game.title}: ${err.message}`);
      updateStmt.run('/placeholder-cover.svg', game.id);
      failed++;
    }

    await sleep(DELAY_MS);
  }

  console.log(`\nDone! Updated: ${updated}, Placeholder: ${failed}`);
}

fetchCovers();
