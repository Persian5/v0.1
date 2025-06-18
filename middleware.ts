import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  // Minimal middleware - just pass everything through
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for static files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
} 