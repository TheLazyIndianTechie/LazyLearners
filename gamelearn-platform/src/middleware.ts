import { NextRequest, NextResponse } from "next/server"
import { withAuth } from "next-auth/middleware"
import { getToken } from "next-auth/jwt"

// Configuration
const RATE_LIMITS = {
  default: { requests: 100, window: 15 * 60 }, // 100 requests per 15 minutes
  auth: { requests: 5, window: 15 * 60 }, // 5 auth attempts per 15 minutes
  api: { requests: 200, window: 15 * 60 }, // 200 API calls per 15 minutes
  payment: { requests: 10, window: 15 * 60 }, // 10 payment attempts per 15 minutes
}

function getRateLimitKey(req: NextRequest, type: keyof typeof RATE_LIMITS): string {
  // Extract the first IP from x-forwarded-for (client IP behind proxy)
  const forwarded = req.headers.get("x-forwarded-for")
  const realIp = req.headers.get("x-real-ip")
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : realIp || "127.0.0.1"

  // Create additional fingerprint using User-Agent for enhanced protection
  const userAgent = req.headers.get("user-agent") || ""
  const userAgentHash = userAgent ? btoa(userAgent).slice(0, 8) : "unknown"

  // Combine IP and User-Agent hash for more robust rate limiting
  return `ratelimit:${type}:${clientIp}:${userAgentHash}`
}

async function checkRateLimit(key: string, limit: { requests: number; window: number }): Promise<{
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
}> {
  // Use in-memory rate limiting for Edge Runtime compatibility
  return checkRateLimitMemory(key, limit)
}

// Fallback in-memory rate limiting
const rateLimit = new Map<string, { count: number; resetTime: number }>()

function checkRateLimitMemory(key: string, limit: { requests: number; window: number }): {
  allowed: boolean
  count: number
  remaining: number
  resetTime: number
} {
  const now = Date.now()
  const entry = rateLimit.get(key)

  if (!entry || now > entry.resetTime) {
    const resetTime = now + (limit.window * 1000)
    rateLimit.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      count: 1,
      remaining: limit.requests - 1,
      resetTime
    }
  }

  if (entry.count >= limit.requests) {
    return {
      allowed: false,
      count: entry.count,
      remaining: 0,
      resetTime: entry.resetTime
    }
  }

  entry.count++
  return {
    allowed: true,
    count: entry.count,
    remaining: limit.requests - entry.count,
    resetTime: entry.resetTime
  }
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()")

  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  }

  // CSP (Content Security Policy) - Relaxed for Next.js compatibility
  const nonce = crypto.randomUUID().replace(/-/g, '')
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' 'nonce-${nonce}' https://js.stripe.com https://checkout.stripe.com`,
    `style-src 'self' 'unsafe-inline' 'nonce-${nonce}' https://fonts.googleapis.com`,
    "font-src 'self' https://fonts.gstatic.com https://r2cdn.perplexity.ai",
    "img-src 'self' data: https://*.lazygamedevs.com https://cdn.lazygamedevs.com blob:",
    "media-src 'self' https://*.lazygamedevs.com https://cdn.lazygamedevs.com",
    "connect-src 'self' https://api.stripe.com https://*.lazygamedevs.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://checkout.stripe.com",
    "worker-src 'self' blob:",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join("; ")

  // Add nonce to response for script/style usage
  response.headers.set("X-Content-Nonce", nonce)

  response.headers.set("Content-Security-Policy", csp)

  return response
}

async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Generate correlation ID for tracing
  const correlationId = crypto.randomUUID()
  const requestStart = Date.now()

  // Add correlation ID to headers
  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-correlation-id", correlationId)
  requestHeaders.set("x-request-start", requestStart.toString())

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  // Add security headers
  response = addSecurityHeaders(response)

  // Rate limiting logic
  let rateLimitType: keyof typeof RATE_LIMITS = "default"

  if (pathname.startsWith("/api/auth/")) {
    rateLimitType = "auth"
  } else if (pathname.startsWith("/api/payment/")) {
    rateLimitType = "payment"
  } else if (pathname.startsWith("/api/")) {
    rateLimitType = "api"
  }

  const rateLimitKey = getRateLimitKey(req, rateLimitType)
  const rateLimitResult = await checkRateLimit(rateLimitKey, RATE_LIMITS[rateLimitType])

  if (!rateLimitResult.allowed) {
    console.warn(`Rate limit exceeded for ${rateLimitKey} on ${pathname}`)
    return new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        correlationId
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          "X-RateLimit-Limit": RATE_LIMITS[rateLimitType].requests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          "X-RateLimit-Reset": rateLimitResult.resetTime.toString(),
          ...Object.fromEntries(response.headers),
        },
      }
    )
  }

  // Add rate limit headers to successful responses
  response.headers.set("X-RateLimit-Limit", RATE_LIMITS[rateLimitType].requests.toString())
  response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())
  response.headers.set("X-RateLimit-Reset", rateLimitResult.resetTime.toString())

  // Enhanced CSRF Protection for state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
    const origin = req.headers.get("origin")
    const host = req.headers.get("host")
    const referer = req.headers.get("referer")
    const contentType = req.headers.get("content-type")

    // Validate Content-Type for API endpoints to prevent CSRF via forms
    if (pathname.startsWith("/api/") && contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("multipart/form-data")) {
      console.warn(`CSRF attempt blocked: invalid content-type ${contentType}`)
      return new NextResponse(
        JSON.stringify({
          error: "Invalid content type",
          correlationId
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(response.headers),
          },
        }
      )
    }

    // Enhanced origin validation
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // For development
      process.env.NEXTAUTH_URL,
      ...(process.env.ALLOWED_ORIGINS?.split(",") || [])
    ].filter(Boolean)

    // In development, allow localhost variations and different ports
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001'
      )
    }

    if (origin) {
      if (!allowedOrigins.includes(origin)) {
        console.warn(`CSRF: Blocked request from origin ${origin} to ${pathname}`)
        return new NextResponse(
          JSON.stringify({
            error: "Forbidden: Invalid origin",
            correlationId
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(response.headers),
            },
          }
        )
      }
    } else if (referer) {
      // Fallback to referer validation if origin is missing
      const isValidReferer = allowedOrigins.some(allowed =>
        referer.startsWith(allowed)
      )

      if (!isValidReferer) {
        console.warn(`CSRF: Blocked request with invalid referer ${referer}`)
        return new NextResponse(
          JSON.stringify({
            error: "Forbidden: Invalid referer",
            correlationId
          }),
          {
            status: 403,
            headers: {
              "Content-Type": "application/json",
              ...Object.fromEntries(response.headers),
            },
          }
        )
      }
    } else if (pathname.startsWith("/api/") && process.env.NODE_ENV !== 'development') {
      // For API endpoints in production, require either origin or referer
      // In development, allow requests without these headers for testing
      console.warn(`CSRF: Blocked API request missing origin/referer headers`)
      return new NextResponse(
        JSON.stringify({
          error: "Forbidden: Missing security headers",
          correlationId
        }),
        {
          status: 403,
          headers: {
            "Content-Type": "application/json",
            ...Object.fromEntries(response.headers),
          },
        }
      )
    }
  }

  // API request logging
  if (pathname.startsWith("/api/")) {
    const duration = Date.now() - requestStart
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      correlationId,
      method: req.method,
      url: pathname,
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip"),
      duration,
      rateLimitType,
      type: "api_request"
    }))
  }

  return response
}

// Authentication middleware wrapper
export default withAuth(
  middleware,
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        // Public routes that don't require authentication
        const publicRoutes = [
          "/",
          "/courses",
          "/auth/signin",
          "/auth/signup",
          "/auth/error",
          "/api/auth",
          "/api/health"
        ]

        // Check if the route is public
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true
        }

        // API routes that require authentication
        if (pathname.startsWith("/api/")) {
          const protectedApiRoutes = [
            "/api/payment",
            "/api/progress",
            "/api/enrollment",
            "/api/cart",
            "/api/collaboration"
          ]

          if (protectedApiRoutes.some(route => pathname.startsWith(route))) {
            return !!token
          }

          return true // Allow other API routes
        }

        // Protected pages that require authentication
        const protectedRoutes = [
          "/dashboard",
          "/instructor",
          "/checkout",
          "/portfolio/create"
        ]

        if (protectedRoutes.some(route => pathname.startsWith(route))) {
          return !!token
        }

        return true // Allow other routes
      },
    },
  }
)

// Configure which routes this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}