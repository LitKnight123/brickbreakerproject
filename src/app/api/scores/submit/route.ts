import { NextRequest, NextResponse } from 'next/server';
import { updateScore } from '@/lib/leaderboard';

export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    
    if (!userId) {
      return NextResponse.json({ success: false, message: 'Not authenticated' }, { status: 401 });
    }
    
    const { score } = await request.json();
    
    if (typeof score !== 'number') {
      return NextResponse.json({ success: false, message: 'Invalid score' }, { status: 400 });
    }
    
    updateScore(parseInt(userId), score);
    
    return NextResponse.json({ success: true, message: 'Score submitted' });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}