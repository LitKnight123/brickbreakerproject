import { NextRequest, NextResponse } from 'next/server';
import { getUsername, updateUsername, updatePassword, deleteAccount, getUserById, getUserPlaytimeStats } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  const user = getUserById(parseInt(userId));
  
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }
  
  const playtime = getUserPlaytimeStats(parseInt(userId));
  
  return NextResponse.json({ success: true, username: user.username, role: user.role, userId: user.id, playtime });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    // Update username
    if (body.username) {
      const result = updateUsername(parseInt(userId), body.username);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    // Update password
    if (body.currentPassword && body.newPassword) {
      const result = updatePassword(parseInt(userId), body.currentPassword, body.newPassword);
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid request' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  const result = deleteAccount(parseInt(userId));
  
  const response = NextResponse.json(result, { status: result.success ? 200 : 400 });
  
  if (result.success) {
    response.cookies.delete('userId');
    response.cookies.delete('userRole');
  }
  
  return response;
}