import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  // Check for the session cookie manually to avoid importing next-auth in the middleware
  // which seems to be causing a parsing error in this Next.js version.
  const sessionToken = request.cookies.get('next-auth.session-token') || 
                       request.cookies.get('__Secure-next-auth.session-token') ||
                       request.cookies.get('authjs.session-token'); // NextAuth v5 default

  const isAuthPage = request.nextUrl.pathname.startsWith('/login') || 
                     request.nextUrl.pathname.startsWith('/signup') ||
                     request.nextUrl.pathname.startsWith('/forgot-password');

  const { pathname } = request.nextUrl;

  // Protect all routes except auth pages and static assets
  if (!sessionToken && !isAuthPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to dashboard if logged in and trying to access auth pages
  if (sessionToken && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Matcher allows you to filter Middleware to run on specific paths.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest|.*\\.png$).*)'],
};
