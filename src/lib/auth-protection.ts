/**
 * Authentication brute force protection
 * Tracks failed login attempts and implements account lockout
 */

import { redis } from './redis'
import { authRateLimiter } from './rate-limiter'
import { createRequestLogger } from './logger'

// ============================================================================
// Configuration
// ============================================================================

const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 // 15 minutes in seconds
const ATTEMPT_WINDOW = 60 * 60 // 1 hour in seconds
const SUSPICIOUS_ACTIVITY_THRESHOLD = 10 // Failed attempts across all users

// ============================================================================
// Types
// ============================================================================

export interface AuthAttemptResult {
  allowed: boolean
  reason?: string
  remainingAttempts?: number
  lockoutEndsAt?: Date
}

export interface FailedAttemptRecord {
  count: number
  lastAttempt: number
  lockedUntil?: number
}

// ============================================================================
// Failed Attempt Tracking
// ============================================================================

/**
 * Record a failed authentication attempt
 */
export async function recordFailedAttempt(
  identifier: string,
  metadata?: {
    ip?: string
    userAgent?: string
    reason?: string
  }
): Promise<void> {
  const logger = createRequestLogger({ headers: new Headers() } as any)
  const key = `auth:failed:${identifier}`

  try {
    // Get current record
    const current = await redis.get(key)
    const record: FailedAttemptRecord = current
      ? (typeof current === 'string' ? JSON.parse(current) : current)
      : { count: 0, lastAttempt: 0 }

    // Increment count
    record.count++
    record.lastAttempt = Date.now()

    // Check if we should lock the account
    if (record.count >= MAX_FAILED_ATTEMPTS) {
      record.lockedUntil = Date.now() + LOCKOUT_DURATION * 1000
    }

    // Store updated record
    await redis.set(key, record, ATTEMPT_WINDOW)

    // Log the failed attempt
    logger.warn('Failed authentication attempt', {
      identifier,
      attemptCount: record.count,
      locked: !!record.lockedUntil,
      ip: metadata?.ip,
      userAgent: metadata?.userAgent,
      reason: metadata?.reason,
    })

    // Track suspicious activity
    if (record.count > SUSPICIOUS_ACTIVITY_THRESHOLD) {
      logger.logSecurityEvent('suspicious_auth_activity', 'high', {
        identifier,
        attemptCount: record.count,
        ip: metadata?.ip,
      })
    }
  } catch (error) {
    logger.error('Error recording failed attempt', error as Error)
  }
}

/**
 * Record a successful authentication (clears failed attempts)
 */
export async function recordSuccessfulAttempt(identifier: string): Promise<void> {
  const key = `auth:failed:${identifier}`

  try {
    await redis.delete(key)
  } catch (error) {
    console.error('Error clearing failed attempts:', error)
  }
}

/**
 * Check if authentication is allowed
 */
export async function checkAuthAllowed(identifier: string): Promise<AuthAttemptResult> {
  const key = `auth:failed:${identifier}`

  try {
    // Check rate limiting first
    const { allowed: rateLimitAllowed, result } = await authRateLimiter.check(identifier)

    if (!rateLimitAllowed) {
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
      }
    }

    // Check failed attempts
    const current = await redis.get(key)

    if (!current) {
      return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS }
    }

    const record: FailedAttemptRecord =
      typeof current === 'string' ? JSON.parse(current) : current

    // Check if account is locked
    if (record.lockedUntil && record.lockedUntil > Date.now()) {
      return {
        allowed: false,
        reason: 'Account temporarily locked due to multiple failed attempts',
        lockoutEndsAt: new Date(record.lockedUntil),
      }
    }

    // Account is not locked, return remaining attempts
    const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - record.count)

    return {
      allowed: true,
      remainingAttempts,
    }
  } catch (error) {
    console.error('Error checking auth allowed:', error)
    // Fail open (allow authentication attempt) if we can't check
    return { allowed: true }
  }
}

/**
 * Reset failed attempts for an identifier (admin function)
 */
export async function resetFailedAttempts(identifier: string): Promise<void> {
  const key = `auth:failed:${identifier}`
  await redis.delete(key)
}

// ============================================================================
// IP-based Protection
// ============================================================================

/**
 * Track failed attempts by IP address
 */
export async function recordFailedAttemptByIp(
  ip: string,
  metadata?: {
    identifier?: string
    userAgent?: string
  }
): Promise<void> {
  const logger = createRequestLogger({ headers: new Headers() } as any)
  const key = `auth:failed:ip:${ip}`

  try {
    const count = await redis.incrementKey(key, ATTEMPT_WINDOW)

    if (count > SUSPICIOUS_ACTIVITY_THRESHOLD) {
      logger.logSecurityEvent('suspicious_ip_activity', 'high', {
        ip,
        attemptCount: count,
        identifier: metadata?.identifier,
        userAgent: metadata?.userAgent,
      })
    }
  } catch (error) {
    logger.error('Error recording failed attempt by IP', error as Error)
  }
}

/**
 * Check if IP is blocked
 */
export async function checkIpAllowed(ip: string): Promise<AuthAttemptResult> {
  const key = `auth:failed:ip:${ip}`

  try {
    const count = await redis.get(key)

    if (!count) {
      return { allowed: true }
    }

    const attemptCount = typeof count === 'string' ? parseInt(count) : count

    // Block IP if too many failed attempts
    if (attemptCount > SUSPICIOUS_ACTIVITY_THRESHOLD * 2) {
      return {
        allowed: false,
        reason: 'IP address temporarily blocked due to suspicious activity',
      }
    }

    return { allowed: true }
  } catch (error) {
    console.error('Error checking IP allowed:', error)
    return { allowed: true } // Fail open
  }
}

// ============================================================================
// Device Fingerprinting
// ============================================================================

/**
 * Generate device fingerprint from request headers
 */
export function generateDeviceFingerprint(headers: {
  userAgent?: string | null
  acceptLanguage?: string | null
  acceptEncoding?: string | null
}): string {
  const components = [
    headers.userAgent || '',
    headers.acceptLanguage || '',
    headers.acceptEncoding || '',
  ]

  return Buffer.from(components.join('|')).toString('base64')
}

/**
 * Track failed attempts by device fingerprint
 */
export async function recordFailedAttemptByDevice(
  fingerprint: string,
  metadata?: {
    ip?: string
    identifier?: string
  }
): Promise<void> {
  const key = `auth:failed:device:${fingerprint}`

  try {
    const count = await redis.incrementKey(key, ATTEMPT_WINDOW)

    if (count > SUSPICIOUS_ACTIVITY_THRESHOLD) {
      const logger = createRequestLogger({ headers: new Headers() } as any)
      logger.logSecurityEvent('suspicious_device_activity', 'medium', {
        fingerprint,
        attemptCount: count,
        ip: metadata?.ip,
        identifier: metadata?.identifier,
      })
    }
  } catch (error) {
    console.error('Error recording failed attempt by device:', error)
  }
}

// ============================================================================
// Comprehensive Protection
// ============================================================================

/**
 * Comprehensive authentication check
 * Checks identifier, IP, and device fingerprint
 */
export async function comprehensiveAuthCheck(params: {
  identifier: string
  ip: string
  userAgent: string | null
  acceptLanguage: string | null
  acceptEncoding: string | null
}): Promise<AuthAttemptResult> {
  // Check IP first (fastest)
  const ipCheck = await checkIpAllowed(params.ip)
  if (!ipCheck.allowed) {
    return ipCheck
  }

  // Check identifier
  const identifierCheck = await checkAuthAllowed(params.identifier)
  if (!identifierCheck.allowed) {
    return identifierCheck
  }

  // Check device fingerprint
  const fingerprint = generateDeviceFingerprint({
    userAgent: params.userAgent,
    acceptLanguage: params.acceptLanguage,
    acceptEncoding: params.acceptEncoding,
  })

  const deviceKey = `auth:failed:device:${fingerprint}`
  const deviceAttempts = await redis.get(deviceKey)

  if (deviceAttempts) {
    const count = typeof deviceAttempts === 'string'
      ? parseInt(deviceAttempts)
      : deviceAttempts

    if (count > SUSPICIOUS_ACTIVITY_THRESHOLD) {
      return {
        allowed: false,
        reason: 'Device temporarily blocked due to suspicious activity',
      }
    }
  }

  // All checks passed
  return {
    allowed: true,
    remainingAttempts: identifierCheck.remainingAttempts,
  }
}

/**
 * Record comprehensive failed attempt
 * Records by identifier, IP, and device
 */
export async function recordComprehensiveFailedAttempt(params: {
  identifier: string
  ip: string
  userAgent: string | null
  acceptLanguage: string | null
  acceptEncoding: string | null
  reason?: string
}): Promise<void> {
  // Record by identifier
  await recordFailedAttempt(params.identifier, {
    ip: params.ip,
    userAgent: params.userAgent || undefined,
    reason: params.reason,
  })

  // Record by IP
  await recordFailedAttemptByIp(params.ip, {
    identifier: params.identifier,
    userAgent: params.userAgent || undefined,
  })

  // Record by device
  const fingerprint = generateDeviceFingerprint({
    userAgent: params.userAgent,
    acceptLanguage: params.acceptLanguage,
    acceptEncoding: params.acceptEncoding,
  })

  await recordFailedAttemptByDevice(fingerprint, {
    ip: params.ip,
    identifier: params.identifier,
  })
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get authentication statistics
 */
export async function getAuthStats(): Promise<{
  totalFailedAttempts: number
  lockedAccounts: number
  suspiciousIps: number
}> {
  try {
    // Get all failed attempt keys
    const keys = await redis.getKeysByPattern('auth:failed:*')

    let totalFailedAttempts = 0
    let lockedAccounts = 0
    let suspiciousIps = 0

    for (const key of keys) {
      const value = await redis.get(key)

      if (key.startsWith('auth:failed:ip:')) {
        const count = typeof value === 'string' ? parseInt(value) : value
        if (count > SUSPICIOUS_ACTIVITY_THRESHOLD) {
          suspiciousIps++
        }
      } else if (!key.includes(':device:')) {
        const record: FailedAttemptRecord =
          typeof value === 'string' ? JSON.parse(value) : value

        totalFailedAttempts += record.count

        if (record.lockedUntil && record.lockedUntil > Date.now()) {
          lockedAccounts++
        }
      }
    }

    return {
      totalFailedAttempts,
      lockedAccounts,
      suspiciousIps,
    }
  } catch (error) {
    console.error('Error getting auth stats:', error)
    return {
      totalFailedAttempts: 0,
      lockedAccounts: 0,
      suspiciousIps: 0,
    }
  }
}
