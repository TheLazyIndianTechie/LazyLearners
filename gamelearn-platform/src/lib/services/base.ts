import { Logger, createOperationLogger } from "@/lib/logger"
import { redis } from "@/lib/redis"
import { prisma } from "@/lib/prisma"

// Base service error types
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ServiceError'
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'VALIDATION_ERROR', 400, details)
    this.name = 'ValidationError'
  }
}

export class NotFoundError extends ServiceError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`
    super(message, 'NOT_FOUND', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ServiceError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 'CONFLICT', 409, details)
    this.name = 'ConflictError'
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403)
    this.name = 'ForbiddenError'
  }
}

// Base service configuration
export interface ServiceConfig {
  cacheEnabled?: boolean
  cacheTTL?: number
  logger?: Logger
  correlationId?: string
}

// Base service class with common functionality
export abstract class BaseService {
  protected logger: Logger
  protected cacheEnabled: boolean
  protected cacheTTL: number
  protected serviceName: string

  constructor(serviceName: string, config: ServiceConfig = {}) {
    this.serviceName = serviceName
    this.logger = config.logger || createOperationLogger('service', serviceName)
    this.cacheEnabled = config.cacheEnabled ?? true
    this.cacheTTL = config.cacheTTL ?? 300 // 5 minutes default
  }

  // Cache helpers
  protected getCacheKey(prefix: string, ...parts: string[]): string {
    return `${this.serviceName}:${prefix}:${parts.join(':')}`
  }

  protected async getFromCache<T>(key: string): Promise<T | null> {
    if (!this.cacheEnabled) return null

    try {
      return await redis.get(key)
    } catch (error) {
      this.logger.warn('Cache get failed', error as Error, { cacheKey: key })
      return null
    }
  }

  protected async setCache<T>(key: string, value: T, ttl?: number): Promise<void> {
    if (!this.cacheEnabled) return

    try {
      await redis.set(key, value, ttl || this.cacheTTL)
    } catch (error) {
      this.logger.warn('Cache set failed', error as Error, { cacheKey: key })
    }
  }

  protected async invalidateCache(pattern: string): Promise<void> {
    if (!this.cacheEnabled) return

    try {
      await redis.clearPattern(pattern)
      this.logger.debug('Cache invalidated', { pattern })
    } catch (error) {
      this.logger.warn('Cache invalidation failed', error as Error, { pattern })
    }
  }

  // Database helpers with logging
  protected async dbOperation<T>(
    operation: string,
    table: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()

    try {
      this.logger.debug(`Starting DB operation: ${operation} on ${table}`)
      const result = await fn()
      const duration = Date.now() - startTime

      this.logger.logDatabaseOperation(operation, table, duration)
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      this.logger.error(`DB operation failed: ${operation} on ${table}`, error as Error, {
        operation,
        table,
        duration
      })
      throw error
    }
  }

  // Transaction wrapper
  protected async withTransaction<T>(fn: (tx: typeof prisma) => Promise<T>): Promise<T> {
    return this.dbOperation('TRANSACTION', 'multiple', () =>
      prisma.$transaction(fn)
    )
  }

  // Performance monitoring
  protected timeOperation<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
    const endTimer = this.logger.time(operationName)

    return fn().finally(() => {
      endTimer()
    })
  }

  // Validation helpers
  protected validateRequired(value: any, fieldName: string): void {
    if (value === null || value === undefined || value === '') {
      throw new ValidationError(`${fieldName} is required`)
    }
  }

  protected validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw new ValidationError('Invalid email format')
    }
  }

  protected validateUUID(uuid: string, fieldName: string = 'ID'): void {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(uuid)) {
      throw new ValidationError(`Invalid ${fieldName} format`)
    }
  }

  // Pagination helpers
  protected validatePagination(page: number, limit: number): { skip: number; take: number } {
    if (page < 1) {
      throw new ValidationError('Page must be greater than 0')
    }

    if (limit < 1 || limit > 100) {
      throw new ValidationError('Limit must be between 1 and 100')
    }

    return {
      skip: (page - 1) * limit,
      take: limit
    }
  }

  // Common response formatting
  protected formatListResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): {
    items: T[]
    pagination: {
      total: number
      page: number
      limit: number
      pages: number
      hasNext: boolean
      hasPrev: boolean
    }
  } {
    const pages = Math.ceil(total / limit)

    return {
      items,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1
      }
    }
  }

  // Business event logging
  protected logBusinessEvent(event: string, data: Record<string, any>): void {
    this.logger.logBusinessEvent(event, data, {
      service: this.serviceName
    })
  }

  // Security event logging
  protected logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>
  ): void {
    this.logger.logSecurityEvent(event, severity, details, {
      service: this.serviceName
    })
  }
}

// Repository pattern interface
export interface Repository<T, K = string> {
  findById(id: K): Promise<T | null>
  findMany(filter?: any): Promise<T[]>
  create(data: Partial<T>): Promise<T>
  update(id: K, data: Partial<T>): Promise<T>
  delete(id: K): Promise<void>
  count(filter?: any): Promise<number>
}

// Service result types for consistent API responses
export interface ServiceResult<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    correlationId?: string
    timestamp: string
    [key: string]: any
  }
}

export function createSuccessResult<T>(
  data: T,
  meta: Record<string, any> = {}
): ServiceResult<T> {
  return {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  }
}

export function createErrorResult(
  error: ServiceError,
  correlationId?: string
): ServiceResult<never> {
  return {
    success: false,
    error: {
      code: error.code,
      message: error.message,
      details: error.details
    },
    meta: {
      correlationId,
      timestamp: new Date().toISOString()
    }
  }
}