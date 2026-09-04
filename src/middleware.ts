import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/game', '/leaderboard'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const path = request.nextUrl.pathname;

  if (protectedRoutes.some(route => path.startsWith(route)) && !userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (authRoutes.some(route => path.startsWith(route)) && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/game/:path*',
    '/leaderboard/:path*',
    '/login',
    '/register'
  ]
};