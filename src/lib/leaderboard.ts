import 'server-only';
import { getDb } from './db';

export function updateScore(userId: number, score: number): void {
  const db = getDb();
  
  db.prepare('UPDATE users SET score = MAX(score, ?) WHERE id = ?').run(score, userId);
  db.prepare('INSERT INTO game_scores (user_id, score) VALUES (?, ?)').run(userId, score);
}

export function getTopScores(limit: number = 10): Array<{ username: string; score: number }> {
  const db = getDb();
  const stmt = db.prepare('SELECT username, score FROM users ORDER BY score DESC LIMIT ?');
  return stmt.all(limit) as Array<{ username: string; score: number }>;
}

export function getPlayerHistory(userId: number, limit: number = 10): Array<{ score: number; date_time: string }> {
  const db = getDb();
  const stmt = db.prepare('SELECT score, date_time FROM game_scores WHERE user_id = ? ORDER BY date_time DESC LIMIT ?');
  return stmt.all(userId, limit) as Array<{ score: number; date_time: string }>;
}

export function getPlayerStats(userId: number): {
  username: string;
  highest_score: number;
  average_score: number;
  games_played: number;
  recent_scores: number[];
} {
  const db = getDb();
  
  const user = db.prepare('SELECT username FROM users WHERE id = ?').get(userId) as { username: string } | undefined;
  if (!user) throw new Error('User not found');
  
  const highestScore = db.prepare('SELECT MAX(score) as max FROM game_scores WHERE user_id = ?').get(userId) as { max: number } | undefined;
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM game_scores WHERE user_id = ?').get(userId) as { avg: number } | undefined;
  const gamesPlayed = db.prepare('SELECT COUNT(*) as count FROM game_scores WHERE user_id = ?').get(userId) as { count: number } | undefined;
  const recentScores = db.prepare('SELECT score FROM game_scores WHERE user_id = ? ORDER BY date_time DESC LIMIT 5').all(userId) as Array<{ score: number }>;
  
  return {
    username: user.username,
    highest_score: highestScore?.max || 0,
    average_score: Math.round((avgScore?.avg || 0) * 10) / 10,
    games_played: gamesPlayed?.count || 0,
    recent_scores: recentScores.map(r => r.score)
  };
}

export function getGlobalStats(): {
  highest_player: string;
  highest_score: number;
  average_score: number;
  total_games: number;
} {
  const db = getDb();
  
  const highestResult = db.prepare(`
    SELECT u.username, MAX(g.score) as max_score
    FROM game_scores g
    JOIN users u ON g.user_id = u.id
    GROUP BY g.user_id
    ORDER BY max_score DESC
    LIMIT 1
  `).get() as { username: string; max_score: number } | undefined;
  
  const avgScore = db.prepare('SELECT AVG(score) as avg FROM game_scores').get() as { avg: number } | undefined;
  const totalGames = db.prepare('SELECT COUNT(*) as count FROM game_scores').get() as { count: number } | undefined;
  
  return {
    highest_player: highestResult?.username || 'None',
    highest_score: highestResult?.max_score || 0,
    average_score: Math.round((avgScore?.avg || 0) * 10) / 10,
    total_games: totalGames?.count || 0
  };
}