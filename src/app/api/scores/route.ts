import { NextRequest, NextResponse } from 'next/server';
import { getTopScores, getPlayerStats, getGlobalStats, getPlayerHistory } from '@/lib/leaderboard';

export async function GET(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'leaderboard';
  
  try {
    if (type === 'leaderboard') {
      const limit = parseInt(searchParams.get('limit') || '10');
      const scores = getTopScores(limit);
      return NextResponse.json({ success: true, scores });
    }
    
    if (type === 'playerStats' && userId) {
      const stats = getPlayerStats(parseInt(userId));
      return NextResponse.json({ success: true, stats });
    }
    
    if (type === 'globalStats') {
      const stats = getGlobalStats();
      return NextResponse.json({ success: true, stats });
    }
    
    if (type === 'history' && userId) {
      const limit = parseInt(searchParams.get('limit') || '10');
      const history = getPlayerHistory(parseInt(userId), limit);
      return NextResponse.json({ success: true, history });
    }
    
    return NextResponse.json({ success: false, message: 'Invalid type or not authenticated' }, { status: 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}