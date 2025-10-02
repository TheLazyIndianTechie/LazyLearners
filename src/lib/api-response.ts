/**
 * Standardized API response utilities
 * Provides consistent response formats and error handling for all API routes
 */

import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import type { NextRequest } from 'next/server'

// ============================================================================
// Types
// ============================================================================

export interface ApiError {
  code: string
  message: string
  details?: unknown
  path?: string
  timestamp: string
  requestId?: string
}

export interface ApiSuccessResponse<T = unknown> {
  success: true
  data: T
  meta?: {
    page?: number
    pageSize?: number
    total?: number
    totalPages?: number
  }
  requestId?: string
  timestamp: string
}

export interface ApiErrorResponse {
  success: false
  error: ApiError
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

// Standard HTTP status codes
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const

// Standard error codes
export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_REQUEST: 'BAD_REQUEST',
  METHOD_NOT_ALLOWED: 'METHOD_NOT_ALLOWED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  LICENSE_ERROR: 'LICENSE_ERROR',
  ENROLLMENT_ERROR: 'ENROLLMENT_ERROR',
} as const

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  options?: {
    status?: number
    meta?: ApiSuccessResponse<T>['meta']
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiSuccessResponse<T>> {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    meta: options?.meta,
    requestId: options?.requestId,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(response, {
    status: options?.status ?? HttpStatus.OK,
    headers: options?.headers,
  })
}

/**
 * Create a paginated success response
 */
export function createPaginatedResponse<T>(
  data: T[],
  pagination: {
    page: number
    pageSize: number
    total: number
  },
  options?: {
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiSuccessResponse<T[]>> {
  return createSuccessResponse(data, {
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      total: pagination.total,
      totalPages: Math.ceil(pagination.total / pagination.pageSize),
    },
    requestId: options?.requestId,
    headers: options?.headers,
  })
}

/**
 * Create a 201 Created response
 */
export function createCreatedResponse<T>(
  data: T,
  options?: {
    requestId?: string
    location?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiSuccessResponse<T>> {
  return createSuccessResponse(data, {
    status: HttpStatus.CREATED,
    requestId: options?.requestId,
    headers: {
      ...options?.headers,
      ...(options?.location && { Location: options.location }),
    },
  })
}

/**
 * Create a 204 No Content response
 */
export function createNoContentResponse(options?: {
  headers?: Record<string, string>
}): NextResponse {
  return new NextResponse(null, {
    status: HttpStatus.NO_CONTENT,
    headers: options?.headers,
  })
}

// ============================================================================
// Error Response Helpers
// ============================================================================

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  error: {
    code: string
    message: string
    details?: unknown
    path?: string
  },
  options?: {
    status?: number
    requestId?: string
    headers?: Record<string, string>
  }
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      path: error.path,
      timestamp: new Date().toISOString(),
      requestId: options?.requestId,
    },
  }

  return NextResponse.json(response, {
    status: options?.status ?? HttpStatus.INTERNAL_SERVER_ERROR,
    headers: options?.headers,
  })
}

/**
 * Create a validation error response (400)
 */
export function createValidationErrorResponse(
  details: unknown,
  options?: {
    message?: string
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.VALIDATION_ERROR,
      message: options?.message ?? 'Validation failed',
      details,
    },
    {
      status: HttpStatus.BAD_REQUEST,
      requestId: options?.requestId,
    }
  )
}

/**
 * Create an authentication error response (401)
 */
export function createAuthenticationErrorResponse(
  message = 'Authentication required',
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.AUTHENTICATION_ERROR,
      message,
    },
    {
      status: HttpStatus.UNAUTHORIZED,
      requestId: options?.requestId,
      headers: {
        'WWW-Authenticate': 'Bearer',
      },
    }
  )
}

/**
 * Create an authorization error response (403)
 */
export function createAuthorizationErrorResponse(
  message = 'Insufficient permissions',
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.AUTHORIZATION_ERROR,
      message,
    },
    {
      status: HttpStatus.FORBIDDEN,
      requestId: options?.requestId,
    }
  )
}

/**
 * Create a not found error response (404)
 */
export function createNotFoundErrorResponse(
  resource: string,
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.NOT_FOUND,
      message: `${resource} not found`,
    },
    {
      status: HttpStatus.NOT_FOUND,
      requestId: options?.requestId,
    }
  )
}

/**
 * Create a conflict error response (409)
 */
export function createConflictErrorResponse(
  message: string,
  options?: {
    details?: unknown
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.CONFLICT,
      message,
      details: options?.details,
    },
    {
      status: HttpStatus.CONFLICT,
      requestId: options?.requestId,
    }
  )
}

/**
 * Create a rate limit error response (429)
 */
export function createRateLimitErrorResponse(
  options?: {
    retryAfter?: number
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.RATE_LIMIT_EXCEEDED,
      message: 'Rate limit exceeded. Please try again later.',
      details: options?.retryAfter ? { retryAfter: options.retryAfter } : undefined,
    },
    {
      status: HttpStatus.TOO_MANY_REQUESTS,
      requestId: options?.requestId,
      headers: options?.retryAfter
        ? { 'Retry-After': String(options.retryAfter) }
        : undefined,
    }
  )
}

/**
 * Create a method not allowed error response (405)
 */
export function createMethodNotAllowedErrorResponse(
  allowedMethods: string[],
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  return createErrorResponse(
    {
      code: ErrorCode.METHOD_NOT_ALLOWED,
      message: `Method not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      details: { allowedMethods },
    },
    {
      status: HttpStatus.METHOD_NOT_ALLOWED,
      requestId: options?.requestId,
      headers: {
        Allow: allowedMethods.join(', '),
      },
    }
  )
}

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * Handle Zod validation errors
 */
export function handleZodError(
  error: ZodError,
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  const details = error.errors.map(err => ({
    field: err.path.join('.'),
    message: err.message,
    code: err.code,
  }))

  return createValidationErrorResponse(details, {
    message: 'Invalid request data',
    requestId: options?.requestId,
  })
}

/**
 * Handle Prisma errors
 */
export function handlePrismaError(
  error: any,
  options?: {
    requestId?: string
  }
): NextResponse<ApiErrorResponse> {
  // Prisma error codes: https://www.prisma.io/docs/reference/api-reference/error-reference
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return createConflictErrorResponse('Resource already exists', {
        details: { field: error.meta?.target },
        requestId: options?.requestId,
      })

    case 'P2025':
      // Record not found
      return createNotFoundErrorResponse('Resource', {
        requestId: options?.requestId,
      })

    case 'P2003':
      // Foreign key constraint violation
      return createValidationErrorResponse(
        { message: 'Invalid reference to related resource' },
        { requestId: options?.requestId }
      )

    default:
      return createErrorResponse(
        {
          code: ErrorCode.DATABASE_ERROR,
          message: 'Database operation failed',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          requestId: options?.requestId,
        }
      )
  }
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(
  error: unknown,
  options?: {
    requestId?: string
    path?: string
  }
): NextResponse<ApiErrorResponse> {
  // Log error for monitoring
  console.error('API Error:', error)

  // Handle known error types
  if (error instanceof ZodError) {
    return handleZodError(error, options)
  }

  if (error && typeof error === 'object' && 'code' in error) {
    // Prisma error
    return handlePrismaError(error, options)
  }

  if (error instanceof Error) {
    // Check for specific error messages
    if (error.message.includes('Unauthorized') || error.message.includes('Authentication')) {
      return createAuthenticationErrorResponse(error.message, options)
    }

    if (error.message.includes('Forbidden') || error.message.includes('Permission')) {
      return createAuthorizationErrorResponse(error.message, options)
    }

    if (error.message.includes('Not found')) {
      return createNotFoundErrorResponse('Resource', options)
    }
  }

  // Generic error
  return createErrorResponse(
    {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : undefined,
      path: options?.path,
    },
    {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      requestId: options?.requestId,
    }
  )
}

// ============================================================================
// Request Utilities
// ============================================================================

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return crypto.randomUUID()
}

/**
 * Extract request ID from headers or generate new one
 */
export function getRequestId(request: NextRequest): string {
  return request.headers.get('x-request-id') ?? generateRequestId()
}

/**
 * Add standard headers to response
 */
export function addStandardHeaders(
  response: NextResponse,
  options: {
    requestId: string
    responseTime?: number
  }
): NextResponse {
  response.headers.set('X-Request-ID', options.requestId)

  if (options.responseTime !== undefined) {
    response.headers.set('X-Response-Time', `${options.responseTime}ms`)
  }

  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

/**
 * Validate HTTP method
 */
export function validateMethod(
  request: NextRequest,
  allowedMethods: string[],
  requestId?: string
): NextResponse<ApiErrorResponse> | null {
  if (!allowedMethods.includes(request.method)) {
    return createMethodNotAllowedErrorResponse(allowedMethods, { requestId })
  }
  return null
}

/**
 * Parse JSON body safely
 */
export async function parseJsonBody<T>(request: NextRequest): Promise<T> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('Invalid JSON in request body')
  }
}
