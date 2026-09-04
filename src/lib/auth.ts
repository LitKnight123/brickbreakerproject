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

export function loginUser(username: string, password: string): { success: boolean; userId?: number; message: string } {
  const db = getDb();
  
  if (!username || !password) {
    return { success: false, message: 'Username and password cannot be empty' };
  }
  
  const stmt = db.prepare('SELECT id, password FROM users WHERE username = ?');
  const user = stmt.get(username) as { id: number; password: string } | undefined;
  
  if (!user) {
    return { success: false, message: 'Invalid username or password' };
  }
  
  if (bcrypt.compareSync(password, user.password)) {
    return { success: true, userId: user.id, message: 'Login successful!' };
  }
  
  return { success: false, message: 'Invalid username or password' };
}

export function getUsername(userId: number): string | null {
  const db = getDb();
  const stmt = db.prepare('SELECT username FROM users WHERE id = ?');
  const user = stmt.get(userId) as { username: string } | undefined;
  return user?.username || null;
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

export function deleteAccount(userId: number): { success: boolean; message: string } {
  const db = getDb();
  
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM game_scores WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  });
  
  try {
    transaction();
    return { success: true, message: 'Account deleted successfully' };
  } catch {
    return { success: false, message: 'Failed to delete account' };
  }
}