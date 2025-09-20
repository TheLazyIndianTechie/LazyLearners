import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { errorReportingSchema } from "@/lib/validations/common"
import { ZodError } from "zod"
import { redis } from "@/lib/redis"
import { env, isProduction } from "@/lib/config/env"

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('error_reporting')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing error report")

    const body = await request.json()

    // Validate input using Zod schema
    const validatedData = errorReportingSchema.parse(body)
    requestLogger.debug("Error report validation successful")

    const {
      errorId,
      message,
      stack,
      componentStack,
      severity,
      category,
      url,
      userAgent,
      timestamp,
      context
    } = validatedData

    // Create error report object
    const errorReport = {
      errorId,
      message,
      stack,
      componentStack,
      severity,
      category,
      url,
      userAgent,
      timestamp,
      context,
      environment: env.NODE_ENV,
      reportedAt: new Date().toISOString(),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      correlationId: request.headers.get('x-correlation-id') || undefined
    }

    // Log the error for our systems
    requestLogger.error("Client error reported", new Error(message), {
      errorId,
      severity,
      category,
      url,
      userAgent: userAgent?.substring(0, 100), // Truncate for logging
      clientStack: stack?.substring(0, 500), // Truncate stack for logging
      context
    })

    // Store error report for analysis (with TTL to prevent storage bloat)
    try {
      await redis.set(
        `error_report:${errorId}`,
        errorReport,
        60 * 60 * 24 * 7 // 7 days TTL
      )

      // Also add to error summary for monitoring
      const errorKey = `error_summary:${category}:${new Date().toISOString().split('T')[0]}`
      await redis.incrementKey(errorKey, 60 * 60 * 24) // Daily summary with 24h TTL

      requestLogger.debug("Error report stored successfully", {
        errorId,
        category
      })
    } catch (storageError) {
      requestLogger.warn("Failed to store error report", storageError as Error, {
        errorId
      })
      // Continue processing even if storage fails
    }

    // Send to external error monitoring service in production
    if (isProduction) {
      await reportToExternalServices(errorReport, requestLogger)
    }

    // Check if this is a critical error that needs immediate attention
    if (severity === 'critical' || (category === 'server' && severity === 'high')) {
      requestLogger.logSecurityEvent('critical_error_reported', 'high', {
        errorId,
        category,
        severity,
        url,
        message: message.substring(0, 200) // Truncate for security log
      })

      // In a real implementation, you might want to:
      // - Send immediate alerts to on-call engineers
      // - Create incidents in incident management systems
      // - Trigger automated recovery procedures
    }

    // Rate limit error reporting from the same IP to prevent spam
    const rateLimitKey = `error_rate_limit:${errorReport.ip}`
    try {
      const errorCount = await redis.incrementKey(rateLimitKey, 60 * 15) // 15 minute window

      if (errorCount > 100) { // More than 100 errors in 15 minutes
        requestLogger.logSecurityEvent('error_reporting_rate_limit_exceeded', 'medium', {
          ip: errorReport.ip,
          errorCount,
          timeWindow: '15_minutes'
        })

        return NextResponse.json(
          {
            success: false,
            error: { message: "Error reporting rate limit exceeded" }
          },
          { status: 429 }
        )
      }
    } catch (rateLimitError) {
      requestLogger.warn("Error rate limiting failed", rateLimitError as Error)
      // Continue processing even if rate limiting fails
    }

    requestLogger.info("Error report processed successfully", {
      errorId,
      category,
      severity
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          errorId,
          received: true,
          message: "Error report received and will be processed"
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof ZodError) {
      requestLogger.warn("Error report validation failed", {
        validationErrors: error.errors
      })

      endTimer()
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid error report format",
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    requestLogger.error("Error report processing failed", error as Error, {
      operation: 'error_reporting'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to process error report" }
      },
      { status: 500 }
    )
  }
}

async function reportToExternalServices(errorReport: any, logger: any): Promise<void> {
  const promises: Promise<void>[] = []

  // Report to Sentry if configured
  if (env.SENTRY_DSN) {
    promises.push(reportToSentry(errorReport, logger))
  }

  // Report to DataDog if configured
  if (env.DATADOG_API_KEY) {
    promises.push(reportToDataDog(errorReport, logger))
  }

  // Report to custom webhook if configured
  if (env.ERROR_WEBHOOK_URL) {
    promises.push(reportToWebhook(errorReport, logger))
  }

  // Wait for all reporting attempts to complete (but don't fail if they error)
  const results = await Promise.allSettled(promises)

  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      logger.warn(`External error reporting failed for service ${index}`, result.reason)
    }
  })
}

async function reportToSentry(errorReport: any, logger: any): Promise<void> {
  try {
    // In a real implementation, you would use the Sentry SDK
    // For now, we'll just log that we would send to Sentry
    logger.debug("Would report to Sentry", {
      errorId: errorReport.errorId,
      severity: errorReport.severity
    })

    // Example Sentry reporting (would need actual Sentry SDK):
    // Sentry.captureException(new Error(errorReport.message), {
    //   tags: {
    //     category: errorReport.category,
    //     severity: errorReport.severity,
    //   },
    //   extra: errorReport,
    //   fingerprint: [errorReport.errorId]
    // })
  } catch (error) {
    logger.warn("Failed to report to Sentry", error as Error)
  }
}

async function reportToDataDog(errorReport: any, logger: any): Promise<void> {
  try {
    // In a real implementation, you would use the DataDog SDK
    logger.debug("Would report to DataDog", {
      errorId: errorReport.errorId,
      severity: errorReport.severity
    })

    // Example DataDog reporting (would need actual DataDog SDK):
    // dogstatsd.increment('client_errors', 1, {
    //   category: errorReport.category,
    //   severity: errorReport.severity,
    //   environment: env.NODE_ENV
    // })
  } catch (error) {
    logger.warn("Failed to report to DataDog", error as Error)
  }
}

async function reportToWebhook(errorReport: any, logger: any): Promise<void> {
  try {
    const response = await fetch(env.ERROR_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': `LazyGameDevs-GameLearn-Platform/${env.APP_VERSION}`
      },
      body: JSON.stringify({
        type: 'client_error',
        data: errorReport,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`Webhook responded with status ${response.status}`)
    }

    logger.debug("Successfully reported to webhook", {
      errorId: errorReport.errorId,
      webhookStatus: response.status
    })
  } catch (error) {
    logger.warn("Failed to report to webhook", error as Error)
  }
}

// GET endpoint for error analytics (admin only)
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)

  try {
    // TODO: Add admin authentication check
    // const session = await getServerSession(authOptions)
    // if (!session?.user || session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    // }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")
    const category = searchParams.get("category")

    if (days < 1 || days > 30) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Days parameter must be between 1 and 30" }
        },
        { status: 400 }
      )
    }

    // Get error statistics from Redis
    const errorStats: Record<string, any> = {}
    const categories = category ? [category] : ['network', 'validation', 'auth', 'permission', 'server', 'client', 'unknown']

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateKey = date.toISOString().split('T')[0]

      for (const cat of categories) {
        const errorKey = `error_summary:${cat}:${dateKey}`
        try {
          const count = await redis.get(errorKey) || 0
          if (!errorStats[cat]) errorStats[cat] = {}
          errorStats[cat][dateKey] = count
        } catch (error) {
          requestLogger.warn("Failed to get error stats", error as Error, { errorKey })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        errorStats,
        period: `${days} days`,
        categories: categories
      }
    })

  } catch (error) {
    requestLogger.error("Failed to get error analytics", error as Error)
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to retrieve error analytics" }
      },
      { status: 500 }
    )
  }
}