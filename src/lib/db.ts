import 'server-only';
import Database from 'better-sqlite3';
import { join } from 'path';

const dbPath = join(process.cwd(), 'game.db');
const db = new Database(dbPath);

export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export function getDb() {
  return db;
}

initDb();