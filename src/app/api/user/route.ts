import { NextRequest, NextResponse } from 'next/server';
import { getUsername, updateUsername, deleteAccount } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  const username = getUsername(parseInt(userId));
  
  if (!username) {
    return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
  }
  
  return NextResponse.json({ success: true, username, userId: parseInt(userId) });
}

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const { username } = await request.json();
    
    if (!username) {
      return NextResponse.json({ success: false, message: 'Username required' }, { status: 400 });
    }
    
    const result = updateUsername(parseInt(userId), username);
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
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
  }
  
  return response;
}