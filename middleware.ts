import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Handle root redirects
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Handle module routes
  if (pathname.startsWith('/modules')) {
    // Allow valid module routes to pass through
    return NextResponse.next()
  }

  // Handle account and pricing routes
  if (pathname === '/account' || pathname === '/pricing') {
    return NextResponse.next()
  }

  // Handle static assets
  if (pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') || 
      pathname.startsWith('/public') ||
      pathname.includes('.')) {
    return NextResponse.next()
  }

  // For any other invalid routes, redirect to home
  if (!pathname.match(/^\/modules\/module\d+$/) && 
      !pathname.match(/^\/modules\/module\d+\/lesson\d+/) &&
      !pathname.match(/^\/modules\/module\d+\/lesson\d+\/(summary|completion)$/)) {
    // Only redirect if it's not a valid route pattern
    if (pathname !== '/' && pathname !== '/modules' && 
        pathname !== '/account' && pathname !== '/pricing') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 