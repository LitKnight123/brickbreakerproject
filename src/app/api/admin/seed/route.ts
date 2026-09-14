import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
  return NextResponse.json({
    message: 'Use POST method to create admin. Or run: curl -X POST http://localhost:3000/api/admin/seed'
  });
}

export async function POST() {
  const db = getDb();
  
  // Check if admin already exists
  const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');
  if (existingAdmin) {
    return NextResponse.json({ 
      success: false, 
      message: 'Admin user already exists. Login with: admin / admin' 
    });
  }

  const username = 'admin';
  const password = 'admin';
  const hash = bcrypt.hashSync(password, 10);

  try {
    db.prepare('INSERT INTO users (username, password, role) VALUES (?, ?, ?)').run(username, hash, 'admin');
    return NextResponse.json({ 
      success: true, 
      message: 'Admin user created! Login with: admin / admin' 
    });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return NextResponse.json({ success: false, message: 'Username already exists' });
    }
    return NextResponse.json({ success: false, message: 'Failed to create admin' });
  }
}
