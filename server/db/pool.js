const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.SQLITE_PATH || path.join(__dirname, '..', '..', 'data', 'rankarena.db');

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
