import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getAllUsersPlaytimeStats } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const users = getAllUsers();
    const playtimeStats = getAllUsersPlaytimeStats();
    
    return NextResponse.json({ success: true, users, playtimeStats });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
