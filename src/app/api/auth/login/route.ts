import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ success: false, message: 'Username and password required' }, { status: 400 });
    }
    
    const result = loginUser(username, password);
    
    if (result.success) {
      const response = NextResponse.json({ success: true, userId: result.userId, message: result.message });
      response.cookies.set('userId', String(result.userId), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7
      });
      return response;
    }
    
    return NextResponse.json({ success: false, message: result.message }, { status: 401 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}