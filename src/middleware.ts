import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/dashboard', '/game', '/leaderboard', '/admin'];
const adminRoutes = ['/admin'];
const authRoutes = ['/login', '/register'];

export function middleware(request: NextRequest) {
  const userId = request.cookies.get('userId')?.value;
  const userRole = request.cookies.get('userRole')?.value;
  const path = request.nextUrl.pathname;

  // Redirect logged-in users away from auth pages
  if (authRoutes.some(route => path.startsWith(route)) && userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Redirect unauthenticated users to login
  if (protectedRoutes.some(route => path.startsWith(route)) && !userId) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Block non-admin users from admin pages
  if (adminRoutes.some(route => path.startsWith(route)) && userId && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/game/:path*',
    '/leaderboard/:path*',
    '/admin/:path*',
    '/login',
    '/register'
  ]
};