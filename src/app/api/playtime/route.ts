import { NextRequest, NextResponse } from 'next/server';
import { startPlaySession, endPlaySession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  
  if (!userId) {
    return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { action, sessionId, score } = body;
    
    if (action === 'start') {
      const result = startPlaySession(parseInt(userId));
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    
    if (action === 'end') {
      if (!sessionId) {
        return NextResponse.json({ success: false, message: 'Session ID required' }, { status: 400 });
      }
      const result = endPlaySession(sessionId, score || 0);
      return NextResponse.json(result, { status: result.success ? 200 : 500 });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid action' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
