import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const appPassword = process.env.APP_PASSWORD;

  // Intercept all requests except static assets (_next/static, _next/image, favicon.ico)
  // Public files with extensions like .svg, .png, .jpg, .ico are also excluded
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Allow public access to /login and /api/auth
  if (pathname === '/login' || pathname.startsWith('/api/auth')) {
    // If the user already possesses a valid auth_token, redirect them away from /login to /
    const authToken = request.cookies.get('auth_token')?.value;
    if (pathname === '/login' && authToken && authToken === appPassword) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // For all other pages, check if the auth_token cookie matches process.env.APP_PASSWORD
  const authToken = request.cookies.get('auth_token')?.value;

  if (!authToken || authToken !== appPassword) {
    const loginUrl = new URL('/login', request.url);
    // Redirect immediately to /login
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
