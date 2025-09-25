import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/courses(.*)',
  '/instructor(.*)',
  '/profile(.*)',
  '/settings(.*)',
  '/api/courses(.*)',
  '/api/lessons(.*)',
  '/api/progress(.*)',
  '/api/video(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  // Dev-only bypass: when debugging via MCP or local tools, allow access with ?debug=mcp
  const debugBypass = process.env.NODE_ENV !== 'production' && req.nextUrl.searchParams.get('debug') === 'mcp'

  if (!debugBypass && isProtectedRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
}