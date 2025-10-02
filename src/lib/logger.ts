import { NextRequest } from "next/server"

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

export interface LogContext {
  correlationId?: string
  userId?: string
  sessionId?: string
  requestId?: string
  traceId?: string
  operation?: string
  component?: string
  environment?: string
  [key: string]: any
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context: LogContext
  error?: {
    name: string
    message: string
    stack?: string
    code?: string | number
  }
  performance?: {
    duration: number
    startTime: number
    endTime: number
  }
  metadata?: Record<string, any>
}

class Logger {
  private context: LogContext = {}
  private logLevel: LogLevel = 'info'

  constructor() {
    // Set log level from environment
    const envLogLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel
    if (envLogLevel && ['debug', 'info', 'warn', 'error', 'fatal'].includes(envLogLevel)) {
      this.logLevel = envLogLevel
    }

    // Set environment context
    this.context.environment = process.env.NODE_ENV || 'development'
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
      fatal: 4
    }

    return levels[level] >= levels[this.logLevel]
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context: LogContext = {},
    error?: Error,
    metadata?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
      metadata
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      }
    }

    return entry
  }

  private output(entry: LogEntry): void {
    if (!this.shouldLog(entry.level)) {
      return
    }

    // In production, you might want to send logs to a service like DataDog, Logz.io, etc.
    if (process.env.NODE_ENV === 'production') {
      // Structured JSON logging for production
      console.log(JSON.stringify(entry))
    } else {
      // Human-readable format for development
      const { timestamp, level, message, context, error } = entry
      const contextStr = Object.keys(context).length > 0 ?
        ` [${Object.entries(context).map(([k, v]) => `${k}=${v}`).join(', ')}]` : ''

      let logMessage = `${timestamp} ${level.toUpperCase()}: ${message}${contextStr}`

      if (error) {
        logMessage += `\nError: ${error.name} - ${error.message}`
        if (error.stack) {
          logMessage += `\nStack: ${error.stack}`
        }
      }

      // Use appropriate console method based on log level
      switch (level) {
        case 'debug':
          console.debug(logMessage)
          break
        case 'info':
          console.info(logMessage)
          break
        case 'warn':
          console.warn(logMessage)
          break
        case 'error':
        case 'fatal':
          console.error(logMessage)
          break
      }
    }
  }

  // Set global context that will be included in all logs
  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context }
  }

  // Create a child logger with additional context
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.context = { ...this.context, ...context }
    childLogger.logLevel = this.logLevel
    return childLogger
  }

  // Log methods
  debug(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('debug', message, context, undefined, metadata))
  }

  info(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('info', message, context, undefined, metadata))
  }

  warn(message: string, context?: LogContext, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('warn', message, context, undefined, metadata))
  }

  error(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('error', message, context, error, metadata))
  }

  fatal(message: string, error?: Error, context?: LogContext, metadata?: Record<string, any>): void {
    this.output(this.formatLogEntry('fatal', message, context, error, metadata))
  }

  // Performance logging
  time(operation: string, context?: LogContext): () => void {
    const startTime = Date.now()
    const correlationId = context?.correlationId || crypto.randomUUID()

    this.debug(`Starting operation: ${operation}`, {
      ...context,
      correlationId,
      operation,
      startTime
    })

    return () => {
      const endTime = Date.now()
      const duration = endTime - startTime

      this.info(`Completed operation: ${operation}`, {
        ...context,
        correlationId,
        operation
      }, {
        performance: {
          duration,
          startTime,
          endTime
        }
      })
    }
  }

  // HTTP request logging
  logRequest(req: NextRequest, context?: LogContext): void {
    const requestContext: LogContext = {
      ...context,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
      correlationId: req.headers.get('x-correlation-id') || undefined
    }

    this.info(`Incoming request: ${req.method} ${req.url}`, requestContext)
  }

  logResponse(
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this[level](`Response sent: ${statusCode}`, context, {
      statusCode,
      performance: {
        duration,
        startTime: Date.now() - duration,
        endTime: Date.now()
      }
    })
  }

  // Business logic logging
  logBusinessEvent(
    event: string,
    data: Record<string, any>,
    context?: LogContext
  ): void {
    this.info(`Business event: ${event}`, context, {
      event,
      data
    })
  }

  // Security logging
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any>,
    context?: LogContext
  ): void {
    const level = severity === 'critical' ? 'fatal' :
                 severity === 'high' ? 'error' :
                 severity === 'medium' ? 'warn' : 'info'

    this[level](`Security event: ${event}`, context, {
      security: {
        event,
        severity,
        details
      }
    })
  }

  // Database operation logging
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    context?: LogContext
  ): void {
    this.debug(`Database operation: ${operation} on ${table}`, context, {
      database: {
        operation,
        table,
        duration
      }
    })
  }

  // External API logging
  logExternalApiCall(
    service: string,
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    context?: LogContext
  ): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info'

    this[level](`External API call: ${method} ${service}${endpoint}`, context, {
      externalApi: {
        service,
        endpoint,
        method,
        statusCode,
        duration
      }
    })
  }
}

// Create and export a singleton logger instance
export const logger = new Logger()

// Helper functions for common use cases
export function createRequestLogger(req: NextRequest): Logger {
  const correlationId = req.headers.get('x-correlation-id') || crypto.randomUUID()
  const requestId = crypto.randomUUID()

  return logger.child({
    correlationId,
    requestId,
    method: req.method,
    url: req.url,
    userAgent: req.headers.get('user-agent') || undefined,
    ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined
  })
}

export function createUserLogger(userId: string, sessionId?: string): Logger {
  return logger.child({
    userId,
    sessionId
  })
}

export function createOperationLogger(operation: string, component: string): Logger {
  return logger.child({
    operation,
    component,
    correlationId: crypto.randomUUID()
  })
}

// Middleware helper to add logging to API routes
export function withLogging<T extends any[]>(
  operation: string,
  fn: (...args: T) => Promise<Response> | Response
) {
  return async (...args: T): Promise<Response> => {
    const req = args[0] as NextRequest
    const requestLogger = createRequestLogger(req)
    const endTimer = requestLogger.time(operation)

    try {
      requestLogger.logRequest(req)
      const response = await fn(...args)

      const statusCode = response.status
      const duration = Date.now() - parseInt(req.headers.get('x-request-start') || '0')

      requestLogger.logResponse(statusCode, duration, {
        operation,
        statusCode
      })

      endTimer()
      return response
    } catch (error) {
      requestLogger.error(`Operation failed: ${operation}`, error as Error, {
        operation
      })
      endTimer()
      throw error
    }
  }
}