import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db'; // Sesuaikan path file koneksi SQLite kamu
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Token and new password required' },
        { status: 400 }
      );
    }

    // 1. Ambil data dari cookie
    const storedToken = request.cookies.get('resetToken')?.value;
    const storedUser = request.cookies.get('resetUser')?.value;

    // 2. Validasi token dan user
    if (!storedToken || storedToken !== token || !storedUser) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired reset token' },
        { status: 400 }
      );
    }

    // 3. Hash password baru (sesuai format hashing saat register/login)
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 4. Update password di database SQLite
    const db = getDb();
    const stmt = db.prepare('UPDATE users SET password = ? WHERE username = ?');
    const result = stmt.run(hashedPassword, storedUser);

    if (result.changes === 0) {
      return NextResponse.json(
        { success: false, message: 'User not found in database' },
        { status: 404 }
      );
    }

    // 5. Response & Hapus Cookie Reset
    const response = NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });

    response.cookies.delete('resetToken');
    response.cookies.delete('resetUser');

    return response;
  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}