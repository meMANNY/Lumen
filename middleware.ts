import NextAuth from "next-auth"

// Minimal auth config for middleware (Edge runtime compatible)
// Full auth config with providers is in auth.ts
export default NextAuth({
  pages: {
    signIn: "/",
  },
  callbacks: {
    authorized: ({ auth, request: { nextUrl } }) => {
      const isLoggedIn = !!auth?.user
      const isOnProtectedPage = nextUrl.pathname.startsWith('/users') || 
                                 nextUrl.pathname.startsWith('/conversations')
      
      if (isOnProtectedPage) {
        if (isLoggedIn) return true
        return false // Redirect to login
      }
      
      return true
    },
  },
  providers: [], // Providers defined in auth.ts
}).auth

export const config = {
  matcher: [
    '/users/:path*',
    '/conversations/:path*'
  ]
}