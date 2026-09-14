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
      score INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin'))
    );

    CREATE TABLE IF NOT EXISTS game_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      date_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS play_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      end_time TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0,
      score_earned INTEGER DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Migration: add role column if it doesn't exist
  try {
    db.exec(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`);
  } catch {
    // Column already exists, ignore
  }
}

export function getDb() {
  return db;
}

initDb();