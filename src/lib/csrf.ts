/**
 * CSRF (Cross-Site Request Forgery) Protection
 * Implements double-submit cookie pattern for CSRF protection
 */

import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// ============================================================================
// Constants
// ============================================================================

const CSRF_TOKEN_LENGTH = 32
const CSRF_COOKIE_NAME = '__Host-csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const CSRF_TOKEN_EXPIRY = 60 * 60 * 24 // 24 hours in seconds

// Cookie configuration for maximum security
const CSRF_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: CSRF_TOKEN_EXPIRY,
}

// ============================================================================
// Token Generation
// ============================================================================

/**
 * Generate a cryptographically secure random token
 */
export function generateCsrfToken(): string {
  return randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
}

/**
 * Hash a token for comparison (prevents timing attacks)
 */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

// ============================================================================
// Token Management
// ============================================================================

/**
 * Set CSRF token in cookie
 * Should be called when rendering forms or pages with state-changing actions
 */
export async function setCsrfToken(token?: string): Promise<string> {
  const csrfToken = token || generateCsrfToken()
  const cookieStore = await cookies()

  cookieStore.set(CSRF_COOKIE_NAME, csrfToken, CSRF_COOKIE_OPTIONS)

  return csrfToken
}

/**
 * Get CSRF token from cookie
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(CSRF_COOKIE_NAME)
  return token?.value || null
}

/**
 * Delete CSRF token cookie
 */
export async function deleteCsrfToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(CSRF_COOKIE_NAME)
}

// ============================================================================
// Token Validation
// ============================================================================

/**
 * Validate CSRF token from request
 * Compares token from header/body with token from cookie
 */
export async function validateCsrfToken(request: NextRequest): Promise<boolean> {
  // Get token from cookie
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) {
    return false
  }

  // Get token from header
  let requestToken = request.headers.get(CSRF_HEADER_NAME)

  // If not in header, check in body (for form submissions)
  if (!requestToken) {
    try {
      const body = await request.clone().json()
      requestToken = body.csrfToken || body._csrf
    } catch {
      // Not JSON or no body
      requestToken = null
    }
  }

  if (!requestToken) {
    return false
  }

  // Compare tokens using constant-time comparison to prevent timing attacks
  return constantTimeCompare(hashToken(cookieToken), hashToken(requestToken))
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false
  }

  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }

  return result === 0
}

// ============================================================================
// Middleware Integration
// ============================================================================

/**
 * CSRF protection middleware
 * Validates CSRF token for state-changing methods (POST, PUT, PATCH, DELETE)
 */
export async function csrfProtection(request: NextRequest): Promise<{
  valid: boolean
  reason?: string
}> {
  const method = request.method.toUpperCase()

  // Only protect state-changing methods
  const protectedMethods = ['POST', 'PUT', 'PATCH', 'DELETE']
  if (!protectedMethods.includes(method)) {
    return { valid: true }
  }

  // Skip CSRF for API authentication endpoints (they use other protection)
  const path = new URL(request.url).pathname
  const skipPaths = [
    '/api/webhooks/',  // Webhook endpoints have their own verification
    '/api/auth/',      // Auth endpoints use other protection
  ]

  if (skipPaths.some(skip => path.startsWith(skip))) {
    return { valid: true }
  }

  // Validate CSRF token
  const isValid = await validateCsrfToken(request)

  if (!isValid) {
    return {
      valid: false,
      reason: 'Invalid or missing CSRF token',
    }
  }

  return { valid: true }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get CSRF token for client-side use
 * Returns existing token or generates a new one
 */
export async function getCsrfTokenForClient(): Promise<string> {
  let token = await getCsrfToken()

  if (!token) {
    token = await setCsrfToken()
  }

  return token
}

/**
 * Validate CSRF token from form data
 */
export async function validateCsrfFromFormData(
  formData: FormData
): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!cookieToken) {
    return false
  }

  const formToken = formData.get('csrfToken') || formData.get('_csrf')

  if (!formToken || typeof formToken !== 'string') {
    return false
  }

  return constantTimeCompare(hashToken(cookieToken), hashToken(formToken))
}

/**
 * Create CSRF-protected form props
 * Returns token to include in form as hidden input
 */
export async function createCsrfFormProps(): Promise<{
  csrfToken: string
  csrfTokenName: string
}> {
  const token = await getCsrfTokenForClient()

  return {
    csrfToken: token,
    csrfTokenName: 'csrfToken',
  }
}

// ============================================================================
// React Helpers
// ============================================================================

/**
 * CSRF token input component props
 */
export interface CsrfTokenInputProps {
  token: string
}

/**
 * Generate props for hidden CSRF input field
 */
export function getCsrfInputProps(token: string): {
  type: 'hidden'
  name: string
  value: string
} {
  return {
    type: 'hidden',
    name: 'csrfToken',
    value: token,
  }
}

// ============================================================================
// Validation Rules
// ============================================================================

/**
 * Check if origin header matches the host
 * Additional protection against CSRF
 */
export function validateOriginHeader(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const host = request.headers.get('host')

  if (!origin || !host) {
    // If no origin header, it might be a same-origin request
    // Allow it to proceed to CSRF token validation
    return true
  }

  try {
    const originUrl = new URL(origin)
    const expectedOrigin = new URL(request.url)

    return originUrl.host === expectedOrigin.host
  } catch {
    return false
  }
}

/**
 * Comprehensive CSRF validation
 * Checks both origin header and CSRF token
 */
export async function validateCsrfComprehensive(
  request: NextRequest
): Promise<{
  valid: boolean
  reason?: string
}> {
  // First check origin header
  if (!validateOriginHeader(request)) {
    return {
      valid: false,
      reason: 'Origin header mismatch',
    }
  }

  // Then check CSRF token
  return csrfProtection(request)
}

// ============================================================================
// Documentation
// ============================================================================

/**
 * USAGE EXAMPLES:
 *
 * 1. Server Component (generating form):
 * ```tsx
 * import { createCsrfFormProps } from '@/lib/csrf'
 *
 * export default async function MyForm() {
 *   const { csrfToken } = await createCsrfFormProps()
 *
 *   return (
 *     <form action="/api/submit" method="POST">
 *       <input type="hidden" name="csrfToken" value={csrfToken} />
 *       // ... other form fields
 *     </form>
 *   )
 * }
 * ```
 *
 * 2. API Route (validating request):
 * ```ts
 * import { validateCsrfToken } from '@/lib/csrf'
 * import { NextRequest } from 'next/server'
 *
 * export async function POST(request: NextRequest) {
 *   if (!await validateCsrfToken(request)) {
 *     return new Response('Invalid CSRF token', { status: 403 })
 *   }
 *
 *   // Process request
 * }
 * ```
 *
 * 3. Client-side fetch:
 * ```ts
 * // Get token from meta tag or data attribute
 * const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content
 *
 * fetch('/api/submit', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'x-csrf-token': csrfToken
 *   },
 *   body: JSON.stringify({ data })
 * })
 * ```
 *
 * 4. Middleware (automatic validation):
 * ```ts
 * import { validateCsrfComprehensive } from '@/lib/csrf'
 * import { NextResponse } from 'next/server'
 * import type { NextRequest } from 'next/server'
 *
 * export async function middleware(request: NextRequest) {
 *   const { valid, reason } = await validateCsrfComprehensive(request)
 *
 *   if (!valid) {
 *     return new NextResponse('Forbidden', { status: 403 })
 *   }
 *
 *   return NextResponse.next()
 * }
 * ```
 */
