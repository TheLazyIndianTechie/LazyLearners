import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from 'next/server'

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

const isInstructorRoute = createRouteMatcher([
  '/instructor(.*)',
  '/api/instructor(.*)'
])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()

  if (isProtectedRoute(req)) {
    await auth.protect()
  }

  // Check instructor role for instructor routes
  if (isInstructorRoute(req) && userId) {
    await auth.protect()

    const userRole = sessionClaims?.metadata?.role || sessionClaims?.publicMetadata?.role

    if (userRole !== 'INSTRUCTOR' && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
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