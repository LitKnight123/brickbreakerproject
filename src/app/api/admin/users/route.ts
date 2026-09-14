import { NextRequest, NextResponse } from 'next/server';
import { updateUserRole, adminUpdatePassword, adminUpdateUsername, deleteAccount } from '@/lib/auth';

export async function PUT(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const body = await request.json();
    const { targetUserId, action, value } = body;
    
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'Target user ID required' }, { status: 400 });
    }
    
    // Prevent admin from modifying their own role
    if (action === 'role' && targetUserId === parseInt(userId)) {
      return NextResponse.json({ success: false, message: 'Cannot change your own role' }, { status: 400 });
    }
    
    let result;
    
    switch (action) {
      case 'role':
        result = updateUserRole(targetUserId, value);
        break;
      case 'password':
        result = adminUpdatePassword(targetUserId, value);
        break;
      case 'username':
        result = adminUpdateUsername(targetUserId, value);
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  if (userRole !== 'admin') {
    return NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 });
  }
  
  try {
    const { targetUserId } = await request.json();
    
    if (!targetUserId) {
      return NextResponse.json({ success: false, message: 'Target user ID required' }, { status: 400 });
    }
    
    // Prevent admin from deleting themselves
    if (targetUserId === parseInt(userId)) {
      return NextResponse.json({ success: false, message: 'Cannot delete your own account' }, { status: 400 });
    }
    
    const result = deleteAccount(targetUserId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
