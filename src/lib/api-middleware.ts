/**
 * API middleware utilities
 * Request/response logging, rate limiting, and request tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRequestLogger } from './logger'
import { getRequestId, generateRequestId, addStandardHeaders } from './api-response'

// ============================================================================
// Types
// ============================================================================

export interface ApiMiddlewareOptions {
  enableLogging?: boolean
  enableRateLimiting?: boolean
  enableRequestId?: boolean
  enableTiming?: boolean
  enableCors?: boolean
  corsOptions?: CorsOptions
}

export interface CorsOptions {
  origin?: string | string[]
  methods?: string[]
  allowedHeaders?: string[]
  exposedHeaders?: string[]
  credentials?: boolean
  maxAge?: number
}

export interface ApiHandlerContext {
  requestId: string
  startTime: number
  logger: ReturnType<typeof createRequestLogger>
}

// ============================================================================
// Request/Response Logging
// ============================================================================

/**
 * Log API request details
 */
export function logApiRequest(request: NextRequest, requestId: string): void {
  const logger = createRequestLogger(request)

  logger.info('API Request', {
    requestId,
    method: request.method,
    url: request.url,
    path: new URL(request.url).pathname,
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
  })
}

/**
 * Log API response details
 */
export function logApiResponse(
  request: NextRequest,
  response: NextResponse,
  requestId: string,
  duration: number
): void {
  const logger = createRequestLogger(request)

  const status = response.status
  const isError = status >= 400

  const logData = {
    requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    status,
    duration,
    contentType: response.headers.get('content-type'),
  }

  if (isError) {
    logger.warn('API Response (Error)', logData)
  } else if (duration > 1000) {
    logger.warn('API Response (Slow)', logData)
  } else {
    logger.info('API Response', logData)
  }
}

// ============================================================================
// Middleware Wrapper
// ============================================================================

/**
 * Wrap API handler with middleware functionality
 */
export function withApiMiddleware(
  handler: (
    request: NextRequest,
    context: ApiHandlerContext
  ) => Promise<NextResponse> | NextResponse,
  options: ApiMiddlewareOptions = {}
): (request: NextRequest) => Promise<NextResponse> {
  const {
    enableLogging = true,
    enableRequestId = true,
    enableTiming = true,
    enableCors = false,
    corsOptions = {},
  } = options

  return async function middlewareHandler(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const requestId = enableRequestId ? getRequestId(request) : generateRequestId()
    const logger = createRequestLogger(request)

    const context: ApiHandlerContext = {
      requestId,
      startTime,
      logger,
    }

    try {
      // Log incoming request
      if (enableLogging) {
        logApiRequest(request, requestId)
      }

      // Call the actual handler
      let response = await handler(request, context)

      // Add standard headers
      if (enableRequestId || enableTiming) {
        const duration = enableTiming ? Date.now() - startTime : undefined
        response = addStandardHeaders(response, {
          requestId,
          responseTime: duration,
        })
      }

      // Add CORS headers if enabled
      if (enableCors) {
        response = addCorsHeaders(response, request, corsOptions)
      }

      // Log response
      if (enableLogging) {
        const duration = Date.now() - startTime
        logApiResponse(request, response, requestId, duration)
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime

      logger.error('API Handler Error', error as Error, {
        requestId,
        duration,
        method: request.method,
        path: new URL(request.url).pathname,
      })

      // Re-throw to be handled by the error handler
      throw error
    }
  }
}

/**
 * Add CORS headers to response
 */
function addCorsHeaders(
  response: NextResponse,
  request: NextRequest,
  options: CorsOptions
): NextResponse {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = ['X-Request-ID', 'X-Response-Time'],
    credentials = false,
    maxAge = 86400, // 24 hours
  } = options

  // Handle origin
  if (Array.isArray(origin)) {
    const requestOrigin = request.headers.get('origin')
    if (requestOrigin && origin.includes(requestOrigin)) {
      response.headers.set('Access-Control-Allow-Origin', requestOrigin)
    }
  } else {
    response.headers.set('Access-Control-Allow-Origin', origin)
  }

  // Other CORS headers
  response.headers.set('Access-Control-Allow-Methods', methods.join(', '))
  response.headers.set('Access-Control-Allow-Headers', allowedHeaders.join(', '))
  response.headers.set('Access-Control-Expose-Headers', exposedHeaders.join(', '))
  response.headers.set('Access-Control-Max-Age', String(maxAge))

  if (credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }

  return response
}

// ============================================================================
// Performance Monitoring
// ============================================================================

/**
 * Track API endpoint performance
 */
export class ApiPerformanceTracker {
  private static metrics = new Map<string, {
    count: number
    totalDuration: number
    minDuration: number
    maxDuration: number
    errors: number
  }>()

  static track(endpoint: string, duration: number, isError = false): void {
    const key = endpoint
    const current = this.metrics.get(key) ?? {
      count: 0,
      totalDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      errors: 0,
    }

    this.metrics.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      minDuration: Math.min(current.minDuration, duration),
      maxDuration: Math.max(current.maxDuration, duration),
      errors: current.errors + (isError ? 1 : 0),
    })
  }

  static getMetrics(endpoint?: string) {
    if (endpoint) {
      const metrics = this.metrics.get(endpoint)
      if (!metrics) return null

      return {
        endpoint,
        ...metrics,
        averageDuration: metrics.totalDuration / metrics.count,
        errorRate: (metrics.errors / metrics.count) * 100,
      }
    }

    // Return all metrics
    return Array.from(this.metrics.entries()).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
      averageDuration: metrics.totalDuration / metrics.count,
      errorRate: (metrics.errors / metrics.count) * 100,
    }))
  }

  static reset(endpoint?: string): void {
    if (endpoint) {
      this.metrics.delete(endpoint)
    } else {
      this.metrics.clear()
    }
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract route pattern from URL
 * Converts /api/courses/123/modules/456 to /api/courses/[id]/modules/[moduleId]
 */
export function extractRoutePattern(url: string): string {
  const path = new URL(url).pathname

  return path
    .replace(/\/[a-f0-9]{24,32}/g, '/[id]') // MongoDB ObjectIds
    .replace(/\/[a-f0-9-]{36}/g, '/[id]')   // UUIDs
    .replace(/\/[0-9]+/g, '/[id]')          // Numeric IDs
    .replace(/\/clid_[a-z0-9]+/g, '/[id]')  // CUID
}

/**
 * Sanitize URL for logging (remove sensitive query params)
 */
export function sanitizeUrl(url: string): string {
  const urlObj = new URL(url)
  const sensitiveParams = ['token', 'key', 'secret', 'password', 'api_key', 'apikey']

  sensitiveParams.forEach(param => {
    if (urlObj.searchParams.has(param)) {
      urlObj.searchParams.set(param, '***')
    }
  })

  return urlObj.toString()
}

/**
 * Get client IP address from request
 */
export function getClientIp(request: NextRequest): string | null {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null
  )
}

/**
 * Check if request is from a bot/crawler
 */
export function isBot(request: NextRequest): boolean {
  const userAgent = request.headers.get('user-agent')?.toLowerCase() || ''

  const botPatterns = [
    'bot',
    'crawler',
    'spider',
    'crawling',
    'scraper',
    'slurp',
    'mediapartners',
    'facebookexternalhit',
    'twitterbot',
    'whatsapp',
  ]

  return botPatterns.some(pattern => userAgent.includes(pattern))
}

// ============================================================================
// Request Context
// ============================================================================

/**
 * Extract useful context from request for logging
 */
export interface RequestContext {
  requestId: string
  method: string
  path: string
  url: string
  userAgent: string | null
  referer: string | null
  ip: string | null
  isBot: boolean
  locale: string | null
  timestamp: string
}

export function extractRequestContext(
  request: NextRequest,
  requestId: string
): RequestContext {
  return {
    requestId,
    method: request.method,
    path: new URL(request.url).pathname,
    url: sanitizeUrl(request.url),
    userAgent: request.headers.get('user-agent'),
    referer: request.headers.get('referer'),
    ip: getClientIp(request),
    isBot: isBot(request),
    locale: request.headers.get('accept-language')?.split(',')[0] || null,
    timestamp: new Date().toISOString(),
  }
}
