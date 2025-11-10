import { NextResponse } from 'next/server'

export function middleware(request) {
  const hostname = request.headers.get('host')

  // Clone the request headers
  const requestHeaders = new Headers(request.headers)

  // Add the original host as a custom header that will be forwarded to Render
  requestHeaders.set('x-forwarded-host', hostname)
  requestHeaders.set('x-original-host', hostname)

  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

// Run middleware on all paths that need domain resolution
export const config = {
  matcher: [
    '/robots.txt',
    '/sitemap.xml',
    '/public/:path*/robots.txt',
    '/public/:path*/sitemap.xml',
    '/api/:path*',
  ],
}
