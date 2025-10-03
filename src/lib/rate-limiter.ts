/**
 * Rate limiting utilities
 * Supports both Redis-based and in-memory rate limiting
 */

import { redis } from './redis'
import { NextRequest } from 'next/server'
import { getClientIp } from './api-middleware'

// ============================================================================
// Types
// ============================================================================

export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed in the window
   */
  maxRequests: number

  /**
   * Time window in seconds
   */
  windowSeconds: number

  /**
   * Custom key prefix for Redis
   */
  keyPrefix?: string

  /**
   * Whether to use Redis or in-memory storage
   * Defaults to Redis if available, falls back to in-memory
   */
  useRedis?: boolean
}

export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean

  /**
   * Number of requests remaining in current window
   */
  remaining: number

  /**
   * Total limit for the window
   */
  limit: number

  /**
   * Time in seconds until the window resets
   */
  resetIn: number

  /**
   * Timestamp when the window resets
   */
  resetAt: Date
}

// ============================================================================
// In-Memory Rate Limiter
// ============================================================================

interface InMemoryRecord {
  count: number
  resetAt: number
}

class InMemoryRateLimiter {
  private store = new Map<string, InMemoryRecord>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 60000)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (record.resetAt < now) {
        this.store.delete(key)
      }
    }
  }

  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const resetAt = now + config.windowSeconds * 1000
    const record = this.store.get(key)

    if (!record || record.resetAt < now) {
      // New window
      this.store.set(key, {
        count: 1,
        resetAt,
      })

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        limit: config.maxRequests,
        resetIn: config.windowSeconds,
        resetAt: new Date(resetAt),
      }
    }

    // Existing window
    const allowed = record.count < config.maxRequests

    if (allowed) {
      record.count++
      this.store.set(key, record)
    }

    return {
      allowed,
      remaining: Math.max(0, config.maxRequests - record.count),
      limit: config.maxRequests,
      resetIn: Math.ceil((record.resetAt - now) / 1000),
      resetAt: new Date(record.resetAt),
    }
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  async resetAll(): Promise<void> {
    this.store.clear()
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    this.store.clear()
  }
}

// Singleton instance
const inMemoryLimiter = new InMemoryRateLimiter()

// ============================================================================
// Redis Rate Limiter
// ============================================================================

class RedisRateLimiter {
  async check(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000

    try {
      // Get current count
      const current = await redis.get(key)
      const count = current ? parseInt(String(current), 10) : 0

      if (count === 0) {
        // First request in window
        await redis.set(key, 1, config.windowSeconds)

        return {
          allowed: true,
          remaining: config.maxRequests - 1,
          limit: config.maxRequests,
          resetIn: config.windowSeconds,
          resetAt: new Date(now + windowMs),
        }
      }

      const allowed = count < config.maxRequests

      if (allowed) {
        // Increment count
        await redis.incrementKey(key, config.windowSeconds)
      }

      // Get TTL for reset time
      const ttl = await redis.getTTL(key)
      const resetIn = ttl > 0 ? ttl : config.windowSeconds

      return {
        allowed,
        remaining: Math.max(0, config.maxRequests - (count + (allowed ? 1 : 0))),
        limit: config.maxRequests,
        resetIn,
        resetAt: new Date(now + resetIn * 1000),
      }
    } catch (error) {
      console.error('Redis rate limiter error:', error)
      // Fallback to allowing the request if Redis fails
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        limit: config.maxRequests,
        resetIn: config.windowSeconds,
        resetAt: new Date(now + windowMs),
      }
    }
  }

  async reset(key: string): Promise<void> {
    try {
      await redis.delete(key)
    } catch (error) {
      console.error('Redis rate limiter reset error:', error)
    }
  }

  async resetAll(pattern: string): Promise<void> {
    try {
      const keys = await redis.getKeysByPattern(pattern)
      if (keys.length > 0) {
        await Promise.all(keys.map(key => redis.delete(key)))
      }
    } catch (error) {
      console.error('Redis rate limiter reset all error:', error)
    }
  }
}

const redisLimiter = new RedisRateLimiter()

// ============================================================================
// Main Rate Limiter
// ============================================================================

export class RateLimiter {
  private config: Required<RateLimitConfig>
  private useRedis: boolean

  constructor(config: RateLimitConfig) {
    this.config = {
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
      keyPrefix: config.keyPrefix ?? 'ratelimit',
      useRedis: config.useRedis ?? true,
    }

    // Check if Redis is available
    this.useRedis = this.config.useRedis && redis.isEnabled()
  }

  /**
   * Check if a request should be rate limited
   */
  async check(identifier: string): Promise<RateLimitResult> {
    const key = `${this.config.keyPrefix}:${identifier}`

    if (this.useRedis) {
      return redisLimiter.check(key, this.config)
    } else {
      return inMemoryLimiter.check(key, this.config)
    }
  }

  /**
   * Reset rate limit for a specific identifier
   */
  async reset(identifier: string): Promise<void> {
    const key = `${this.config.keyPrefix}:${identifier}`

    if (this.useRedis) {
      await redisLimiter.reset(key)
    } else {
      await inMemoryLimiter.reset(key)
    }
  }

  /**
   * Reset all rate limits for this limiter
   */
  async resetAll(): Promise<void> {
    if (this.useRedis) {
      await redisLimiter.resetAll(`${this.config.keyPrefix}:*`)
    } else {
      await inMemoryLimiter.resetAll()
    }
  }
}

// ============================================================================
// Preset Rate Limiters
// ============================================================================

/**
 * Strict rate limiter for authentication endpoints
 * 5 requests per 15 minutes
 */
export const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowSeconds: 900, // 15 minutes
  keyPrefix: 'ratelimit:auth',
})

/**
 * Standard rate limiter for API endpoints
 * 100 requests per minute
 */
export const apiRateLimiter = new RateLimiter({
  maxRequests: 100,
  windowSeconds: 60,
  keyPrefix: 'ratelimit:api',
})

/**
 * Lenient rate limiter for public endpoints
 * 300 requests per 5 minutes
 */
export const publicRateLimiter = new RateLimiter({
  maxRequests: 300,
  windowSeconds: 300,
  keyPrefix: 'ratelimit:public',
})

/**
 * Strict rate limiter for payment endpoints
 * 10 requests per 10 minutes
 */
export const paymentRateLimiter = new RateLimiter({
  maxRequests: 10,
  windowSeconds: 600,
  keyPrefix: 'ratelimit:payment',
})

/**
 * Rate limiter for file uploads
 * 20 uploads per hour
 */
export const uploadRateLimiter = new RateLimiter({
  maxRequests: 20,
  windowSeconds: 3600,
  keyPrefix: 'ratelimit:upload',
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get rate limit identifier from request
 * Uses IP address by default, can be customized
 */
export function getRateLimitIdentifier(
  request: NextRequest,
  options?: {
    useUserId?: string
    useApiKey?: string
  }
): string {
  // Prefer user ID or API key if provided
  if (options?.useUserId) {
    return `user:${options.useUserId}`
  }

  if (options?.useApiKey) {
    return `apikey:${options.useApiKey}`
  }

  // Fall back to IP address
  const ip = getClientIp(request)
  return `ip:${ip ?? 'unknown'}`
}

/**
 * Check rate limit and return headers
 */
export async function checkRateLimit(
  limiter: RateLimiter,
  identifier: string
): Promise<{
  result: RateLimitResult
  headers: Record<string, string>
}> {
  const result = await limiter.check(identifier)

  const headers = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': result.resetAt.toISOString(),
  }

  if (!result.allowed) {
    headers['Retry-After'] = String(result.resetIn)
  }

  return { result, headers }
}

/**
 * Apply rate limiting to request
 */
export async function applyRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  options?: {
    useUserId?: string
    useApiKey?: string
  }
): Promise<{
  allowed: boolean
  result: RateLimitResult
  headers: Record<string, string>
}> {
  const identifier = getRateLimitIdentifier(request, options)
  const { result, headers } = await checkRateLimit(limiter, identifier)

  return {
    allowed: result.allowed,
    result,
    headers,
  }
}

// ============================================================================
// Middleware Integration
// ============================================================================

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(
  limiter: RateLimiter,
  options?: {
    getUserId?: (request: NextRequest) => Promise<string | null>
    getApiKey?: (request: NextRequest) => string | null
    onRateLimited?: (request: NextRequest, result: RateLimitResult) => void
  }
) {
  return async function rateLimitMiddleware(request: NextRequest) {
    const userId = options?.getUserId ? await options.getUserId(request) : null
    const apiKey = options?.getApiKey ? options.getApiKey(request) : null

    const { allowed, result, headers } = await applyRateLimit(request, limiter, {
      useUserId: userId ?? undefined,
      useApiKey: apiKey ?? undefined,
    })

    if (!allowed && options?.onRateLimited) {
      options.onRateLimited(request, result)
    }

    return {
      allowed,
      result,
      headers,
    }
  }
}
