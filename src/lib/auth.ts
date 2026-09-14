import 'server-only';
import bcrypt from 'bcryptjs';
import { getDb } from './db';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function registerUser(username: string, password: string): { success: boolean; userId?: number; message: string } {
  const db = getDb();
  
  if (!username || !password) {
    return { success: false, message: 'Username and password cannot be empty' };
  }
  
  const hash = bcrypt.hashSync(password, 10);
  
  try {
    const stmt = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)');
    const result = stmt.run(username, hash);
    return { success: true, userId: result.lastInsertRowid as number, message: 'Registration successful!' };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'Username already exists' };
    }
    return { success: false, message: 'Registration failed' };
  }
}

export function loginUser(username: string, password: string): { success: boolean; userId?: number; role?: string; message: string } {
  const db = getDb();
  
  if (!username || !password) {
    return { success: false, message: 'Username and password cannot be empty' };
  }
  
  const stmt = db.prepare('SELECT id, password, role FROM users WHERE username = ?');
  const user = stmt.get(username) as { id: number; password: string; role: string } | undefined;
  
  if (!user) {
    return { success: false, message: 'Invalid username or password' };
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    return { success: true, userId: user.id, role: user.role, message: 'Login successful!' };
  }
  
  return { success: false, message: 'Invalid username or password' };
}

export function getUsername(userId: number): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const user = stmt.get(userId) as { username: string } | undefined;
  return user?.username || null;
}

export function getUserById(userId: number): { id: number; username: string; role: string; score: number } | null {
  const db = getDb();
  const stmt = db.prepare('SELECT id, username, role, score FROM users WHERE id = ?');
  const user = stmt.get(userId) as { id: number; username: string; role: string; score: number } | undefined;
  return user || null;
}

export function updateUsername(userId: number, newUsername: string): { success: boolean; message: string } {
  const db = getDb();
  
  if (newUsername.length < 3) {
    return { success: false, message: 'Username must be at least 3 characters' };
  }
  
  if (newUsername.length > 15) {
    return { success: false, message: 'Username must be at most 15 characters' };
  }
  
  try {
    const stmt = db.prepare('UPDATE users SET username = ? WHERE id = ?');
    stmt.run(newUsername, userId);
    return { success: true, message: 'Username updated successfully!' };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'Username already exists' };
    }
    return { success: false, message: 'Failed to update username' };
  }
}

export function updatePassword(userId: number, currentPassword: string, newPassword: string): { success: boolean; message: string } {
  const db = getDb();
  
  if (newPassword.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters' };
  }
  
  const stmt = db.prepare('SELECT password FROM users WHERE id = ?');
  const user = stmt.get(userId) as { password: string } | undefined;
  
  if (!user) {
    return { success: false, message: 'User not found' };
  }
  
  if (!bcrypt.compareSync(currentPassword, user.password)) {
    return { success: false, message: 'Current password is incorrect' };
  }
  
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, userId);
  return { success: true, message: 'Password updated successfully!' };
}

export function deleteAccount(userId: number): { success: boolean; message: string } {
  const db = getDb();
  
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM game_scores WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM play_sessions WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  
  try {
    transaction();
    return { success: true, message: 'Account deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete account' };
  }
}

// Admin functions
export function getAllUsers(): Array<{ id: number; username: string; role: string; score: number }> {
  const db = getDb();
  return db.prepare('SELECT id, username, role, score FROM users ORDER BY id ASC').all() as Array<{ id: number; username: string; role: string; score: number }>;
}

export function updateUserRole(userId: number, role: string): { success: boolean; message: string } {
  const db = getDb();
  if (role !== 'user' && role !== 'admin') {
    return { success: false, message: 'Invalid role' };
  }
  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, userId);
  return { success: true, message: `Role updated to ${role}` };
}

export function adminUpdatePassword(userId: number, newPassword: string): { success: boolean; message: string } {
  const db = getDb();
  if (newPassword.length < 4) {
    return { success: false, message: 'Password must be at least 4 characters' };
  }
  const hash = bcrypt.hashSync(newPassword, 10);
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hash, userId);
  return { success: true, message: 'Password updated by admin' };
}

export function adminUpdateUsername(userId: number, newUsername: string): { success: boolean; message: string } {
  const db = getDb();
  if (newUsername.length < 3 || newUsername.length > 15) {
    return { success: false, message: 'Username must be 3-15 characters' };
  }
  try {
    db.prepare('UPDATE users SET username = ? WHERE id = ?').run(newUsername, userId);
    return { success: true, message: 'Username updated by admin' };
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return { success: false, message: 'Username already exists' };
    }
    return { success: false, message: 'Failed to update username' };
  }
}

// Play session functions
export function startPlaySession(userId: number): { success: boolean; sessionId?: number } {
  const db = getDb();
  const result = db.prepare('INSERT INTO play_sessions (user_id) VALUES (?)').run(userId);
  return { success: true, sessionId: result.lastInsertRowid as number };
}

export function endPlaySession(sessionId: number, scoreEarned: number): { success: boolean } {
  const db = getDb();
  db.prepare(`
    UPDATE play_sessions 
    SET end_time = CURRENT_TIMESTAMP, 
        duration_seconds = CAST((julianday(CURRENT_TIMESTAMP) - julianday(start_time)) * 86400 AS INTEGER),
        score_earned = ?
    WHERE id = ?
  `).run(scoreEarned, sessionId);
  return { success: true };
}

export function getUserPlaytimeStats(userId: number): {
  totalSessions: number;
  totalPlaytimeSeconds: number;
  totalPlaytimeFormatted: string;
  avgSessionSeconds: number;
  avgSessionFormatted: string;
  lastSession: string | null;
} {
  const db = getDb();
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as totalSessions,
      COALESCE(SUM(duration_seconds), 0) as totalPlaytimeSeconds,
      COALESCE(AVG(duration_seconds), 0) as avgSessionSeconds
    FROM play_sessions WHERE user_id = ?
  `).get(userId) as { totalSessions: number; totalPlaytimeSeconds: number; avgSessionSeconds: number };
  
  const lastSession = db.prepare(`
    SELECT start_time FROM play_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 1
  `).get(userId) as { start_time: string } | undefined;
  
  return {
    totalSessions: stats.totalSessions,
    totalPlaytimeSeconds: stats.totalPlaytimeSeconds,
    totalPlaytimeFormatted: formatDuration(stats.totalPlaytimeSeconds),
    avgSessionSeconds: Math.round(stats.avgSessionSeconds),
    avgSessionFormatted: formatDuration(Math.round(stats.avgSessionSeconds)),
    lastSession: lastSession?.start_time || null
  };
}

export function getAllUsersPlaytimeStats(): Array<{
  userId: number;
  username: string;
  totalSessions: number;
  totalPlaytimeSeconds: number;
  totalPlaytimeFormatted: string;
  avgSessionSeconds: number;
  avgSessionFormatted: string;
  lastSession: string | null;
  totalScore: number;
}> {
  const db = getDb();
  const users = db.prepare('SELECT id, username, score FROM users ORDER BY id ASC').all() as Array<{ id: number; username: string; score: number }>;
  
  return users.map(user => {
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as totalSessions,
        COALESCE(SUM(duration_seconds), 0) as totalPlaytimeSeconds,
        COALESCE(AVG(duration_seconds), 0) as avgSessionSeconds
      FROM play_sessions WHERE user_id = ?
    `).get(user.id) as { totalSessions: number; totalPlaytimeSeconds: number; avgSessionSeconds: number };
    
    const lastSession = db.prepare(`
      SELECT start_time FROM play_sessions WHERE user_id = ? ORDER BY start_time DESC LIMIT 1
    `).get(user.id) as { start_time: string } | undefined;
    
    return {
      userId: user.id,
      username: user.username,
      totalSessions: stats.totalSessions,
      totalPlaytimeSeconds: stats.totalPlaytimeSeconds,
      totalPlaytimeFormatted: formatDuration(stats.totalPlaytimeSeconds),
      avgSessionSeconds: Math.round(stats.avgSessionSeconds),
      avgSessionFormatted: formatDuration(Math.round(stats.avgSessionSeconds)),
      lastSession: lastSession?.start_time || null,
      totalScore: user.score
    };
  });
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}