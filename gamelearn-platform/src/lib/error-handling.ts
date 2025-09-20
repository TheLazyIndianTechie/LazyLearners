import { logger } from '@/lib/logger'
import { env, isProduction } from '@/lib/config/env'

// Error types and interfaces
export interface ErrorHandlerOptions {
  context?: Record<string, any>
  userId?: string
  correlationId?: string
  silent?: boolean
  retryable?: boolean
}

export interface AsyncErrorHandler<T> {
  (error: Error, options?: ErrorHandlerOptions): Promise<T | null>
}

export interface SyncErrorHandler<T> {
  (error: Error, options?: ErrorHandlerOptions): T | null
}

// Custom error classes
export class ApplicationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message)
    this.name = 'ApplicationError'
    Error.captureStackTrace(this, ApplicationError)
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400)
    this.name = 'ValidationError'
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTHENTICATION_ERROR', 401)
    this.name = 'AuthenticationError'
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 'AUTHORIZATION_ERROR', 403)
    this.name = 'AuthorizationError'
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 'NOT_FOUND_ERROR', 404)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string = 'Resource conflict') {
    super(message, 'CONFLICT_ERROR', 409)
    this.name = 'ConflictError'
  }
}

export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_ERROR', 429)
    this.name = 'RateLimitError'
  }
}

export class ExternalServiceError extends ApplicationError {
  constructor(service: string, message: string = 'External service error') {
    super(`${service}: ${message}`, 'EXTERNAL_SERVICE_ERROR', 502)
    this.name = 'ExternalServiceError'
  }
}

// Error categorization
export function categorizeError(error: Error): {
  category: 'client' | 'server' | 'network' | 'validation' | 'auth' | 'external'
  severity: 'low' | 'medium' | 'high' | 'critical'
  recoverable: boolean
  retryable: boolean
} {
  // Application errors
  if (error instanceof ValidationError) {
    return { category: 'validation', severity: 'low', recoverable: true, retryable: false }
  }

  if (error instanceof AuthenticationError) {
    return { category: 'auth', severity: 'medium', recoverable: true, retryable: false }
  }

  if (error instanceof AuthorizationError) {
    return { category: 'auth', severity: 'medium', recoverable: false, retryable: false }
  }

  if (error instanceof NotFoundError) {
    return { category: 'client', severity: 'low', recoverable: false, retryable: false }
  }

  if (error instanceof ConflictError) {
    return { category: 'client', severity: 'medium', recoverable: true, retryable: false }
  }

  if (error instanceof RateLimitError) {
    return { category: 'client', severity: 'medium', recoverable: true, retryable: true }
  }

  if (error instanceof ExternalServiceError) {
    return { category: 'external', severity: 'high', recoverable: true, retryable: true }
  }

  // Network errors
  if (error.message.includes('fetch') || error.message.includes('network') ||
      error.message.includes('timeout') || error.message.includes('ECONNREFUSED')) {
    return { category: 'network', severity: 'medium', recoverable: true, retryable: true }
  }

  // Database errors
  if (error.message.includes('prisma') || error.message.includes('database') ||
      error.message.includes('connection') || error.message.includes('ENOTFOUND')) {
    return { category: 'server', severity: 'high', recoverable: true, retryable: true }
  }

  // Default to server error
  return { category: 'server', severity: 'high', recoverable: true, retryable: false }
}

// Global error handler
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: Array<{ error: Error; context: Record<string, any>; timestamp: Date }> = []
  private readonly maxQueueSize = 100

  private constructor() {
    this.setupGlobalHandlers()
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private setupGlobalHandlers() {
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      const error = reason instanceof Error ? reason : new Error(String(reason))
      this.handleError(error, {
        type: 'unhandledRejection',
        promise: promise.toString()
      })
    })

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.handleError(error, {
        type: 'uncaughtException'
      })

      // In production, we might want to gracefully shutdown
      if (isProduction) {
        logger.fatal('Uncaught exception in production, shutting down gracefully')
        process.exit(1)
      }
    })

    // Handle warnings
    process.on('warning', (warning: Error) => {
      logger.warn('Node.js warning', warning, {
        type: 'nodeWarning',
        warningName: warning.name
      })
    })
  }

  // Main error handling method
  handleError(error: Error, options: ErrorHandlerOptions = {}): void {
    try {
      const { category, severity, recoverable, retryable } = categorizeError(error)
      const errorId = crypto.randomUUID()

      // Add to error queue for analysis
      this.addToErrorQueue(error, {
        ...options.context,
        errorId,
        category,
        severity,
        recoverable,
        retryable
      })

      // Log the error
      const logContext = {
        errorId,
        category,
        severity,
        recoverable,
        retryable,
        userId: options.userId,
        correlationId: options.correlationId,
        ...options.context
      }

      if (severity === 'critical') {
        logger.fatal(error.message, error, logContext)
      } else if (severity === 'high') {
        logger.error(error.message, error, logContext)
      } else if (severity === 'medium') {
        logger.warn(error.message, error, logContext)
      } else {
        logger.info(error.message, error, logContext)
      }

      // Report to external services if not silent
      if (!options.silent && isProduction) {
        this.reportToExternalServices(error, {
          ...logContext,
          timestamp: new Date().toISOString()
        }).catch(reportingError => {
          logger.error('Failed to report error to external services', reportingError)
        })
      }

    } catch (handlingError) {
      // If error handling itself fails, log to console as fallback
      console.error('Error handler failed:', handlingError)
      console.error('Original error:', error)
    }
  }

  private addToErrorQueue(error: Error, context: Record<string, any>) {
    this.errorQueue.push({
      error,
      context,
      timestamp: new Date()
    })

    // Keep queue size manageable
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  private async reportToExternalServices(error: Error, context: Record<string, any>) {
    const promises: Promise<void>[] = []

    // Report to Sentry
    if (env.SENTRY_DSN) {
      promises.push(this.reportToSentry(error, context))
    }

    // Report to custom error service
    promises.push(this.reportToErrorAPI(error, context))

    await Promise.allSettled(promises)
  }

  private async reportToSentry(error: Error, context: Record<string, any>) {
    try {
      // In a real implementation, use Sentry SDK
      logger.debug('Would report to Sentry', context)
    } catch (error) {
      logger.warn('Failed to report to Sentry', error as Error)
    }
  }

  private async reportToErrorAPI(error: Error, context: Record<string, any>) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          errorId: context.errorId,
          message: error.message,
          stack: error.stack,
          severity: context.severity,
          category: context.category,
          timestamp: context.timestamp,
          context: {
            userId: context.userId,
            correlationId: context.correlationId,
            url: typeof window !== 'undefined' ? window.location.href : undefined,
            userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined
          }
        })
      })
    } catch (error) {
      logger.warn('Failed to report to error API', error as Error)
    }
  }

  // Get error statistics
  getErrorStats(): {
    totalErrors: number
    recentErrors: number
    categories: Record<string, number>
    severities: Record<string, number>
  } {
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const recentErrors = this.errorQueue.filter(item => item.timestamp >= oneHourAgo)

    const categories: Record<string, number> = {}
    const severities: Record<string, number> = {}

    this.errorQueue.forEach(item => {
      const category = item.context.category || 'unknown'
      const severity = item.context.severity || 'unknown'

      categories[category] = (categories[category] || 0) + 1
      severities[severity] = (severities[severity] || 0) + 1
    })

    return {
      totalErrors: this.errorQueue.length,
      recentErrors: recentErrors.length,
      categories,
      severities
    }
  }

  // Clear error queue (useful for testing)
  clearErrorQueue(): void {
    this.errorQueue = []
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance()

// Utility functions for common error handling patterns

// Async function wrapper with error handling
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: ErrorHandlerOptions = {}
): (...args: T) => Promise<R | null> {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args)
    } catch (error) {
      errorHandler.handleError(error as Error, options)

      if (options.retryable) {
        // Could implement retry logic here
        logger.info('Error is retryable but no retry mechanism implemented', {
          function: fn.name,
          args: args.length
        })
      }

      return null
    }
  }
}

// Sync function wrapper with error handling
export function withSyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => R,
  options: ErrorHandlerOptions = {}
): (...args: T) => R | null {
  return (...args: T): R | null => {
    try {
      return fn(...args)
    } catch (error) {
      errorHandler.handleError(error as Error, options)
      return null
    }
  }
}

// Promise wrapper with error handling
export async function handlePromise<T>(
  promise: Promise<T>,
  options: ErrorHandlerOptions = {}
): Promise<[T | null, Error | null]> {
  try {
    const result = await promise
    return [result, null]
  } catch (error) {
    errorHandler.handleError(error as Error, options)
    return [null, error as Error]
  }
}

// Retry wrapper for functions
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  options: ErrorHandlerOptions = {}
): Promise<T> {
  let lastError: Error

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === maxRetries) {
        errorHandler.handleError(lastError, {
          ...options,
          context: {
            ...options.context,
            retryAttempts: attempt,
            maxRetries
          }
        })
        throw lastError
      }

      // Wait before retrying (exponential backoff)
      const waitTime = delay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, waitTime))

      logger.debug(`Retrying function after error, attempt ${attempt + 1}/${maxRetries}`, {
        error: lastError.message,
        waitTime
      })
    }
  }

  throw lastError!
}

// Error boundary helper for React components
export function createErrorBoundaryWrapper(
  Component: React.ComponentType<any>,
  errorBoundaryProps?: any
) {
  return function WrappedComponent(props: any) {
    const ErrorBoundary = require('@/components/error-boundary').ErrorBoundary

    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}