import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(request: NextRequest) {
  // secureCookie must match how the auth handler names the session cookie:
  // "__Secure-authjs.session-token" on HTTPS (production), plain on localhost.
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  })
  
  const isLoggedIn = !!token
  const { pathname } = request.nextUrl
  
  const isOnProtectedPage = pathname.startsWith('/users') || 
                             pathname.startsWith('/conversations')
  
  // Redirect to login if trying to access protected pages without auth
  if (isOnProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL('/', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/users/:path*',
    '/conversations/:path*'
  ]
}