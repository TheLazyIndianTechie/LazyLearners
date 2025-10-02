import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { redis } from "@/lib/redis"
import { getEnvironmentHealth } from "@/lib/config/validate"
import { env } from "@/lib/config/env"

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy"
  timestamp: string
  version: string
  uptime: number
  checks: {
    database: {
      status: "pass" | "fail"
      responseTime?: number
      error?: string
    }
    redis: {
      status: "pass" | "fail" | "warn"
      responseTime?: number
      error?: string
      stats?: {
        memory: string
        connectedClients: number
        totalCommandsProcessed: string
        keyspace: Record<string, any>
      }
    }
    memory: {
      status: "pass" | "warn" | "fail"
      usage: {
        used: number
        total: number
        percentage: number
      }
    }
    environment: {
      status: "pass" | "warn" | "fail"
      message?: string
    }
    disk?: {
      status: "pass" | "warn" | "fail"
      available?: number
    }
  }
  environment: string
  configuration: {
    nodeEnv: string
    features: Record<string, boolean>
    services: Record<string, boolean>
  }
  correlationId: string
}

async function checkDatabase(): Promise<{ status: "pass" | "fail"; responseTime?: number; error?: string }> {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const responseTime = Date.now() - start

    return {
      status: "pass",
      responseTime
    }
  } catch (error) {
    return {
      status: "fail",
      error: error instanceof Error ? error.message : "Unknown database error"
    }
  }
}

async function checkRedis(): Promise<{
  status: "pass" | "fail"
  responseTime?: number
  error?: string
  stats?: {
    memory: string
    connectedClients: number
    totalCommandsProcessed: string
    keyspace: Record<string, any>
  }
}> {
  try {
    const start = Date.now()
    const isHealthy = await redis.isHealthy()
    const responseTime = Date.now() - start

    if (!isHealthy) {
      return {
        status: "fail",
        responseTime,
        error: "Redis ping failed"
      }
    }

    // Get Redis stats if connection is healthy
    const stats = await redis.getStats()

    return {
      status: "pass",
      responseTime,
      stats
    }
  } catch (error) {
    return {
      status: "fail",
      error: error instanceof Error ? error.message : "Redis connection failed"
    }
  }
}

function checkMemory(): { status: "pass" | "warn" | "fail"; usage: { used: number; total: number; percentage: number } } {
  const memUsage = process.memoryUsage()
  const totalMem = memUsage.heapTotal
  const usedMem = memUsage.heapUsed
  const percentage = (usedMem / totalMem) * 100

  let status: "pass" | "warn" | "fail" = "pass"
  if (percentage > 90) {
    status = "fail"
  } else if (percentage > 75) {
    status = "warn"
  }

  return {
    status,
    usage: {
      used: usedMem,
      total: totalMem,
      percentage: Math.round(percentage * 100) / 100
    }
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID()
  const timestamp = new Date().toISOString()

  try {
    // Get comprehensive environment health
    const envHealth = await getEnvironmentHealth()

    // Run additional checks
    const [databaseCheck, redisCheck, memoryCheck] = await Promise.all([
      checkDatabase(),
      checkRedis(),
      Promise.resolve(checkMemory())
    ])

    // Determine overall health status
    const hasFailures = databaseCheck.status === "fail" ||
                       redisCheck.status === "fail" ||
                       memoryCheck.status === "fail" ||
                       envHealth.checks.environment?.status === "fail"

    const hasWarnings = redisCheck.status === "warn" ||
                       memoryCheck.status === "warn" ||
                       envHealth.checks.environment?.status === "warn"

    let overallStatus: "healthy" | "degraded" | "unhealthy"
    if (hasFailures) {
      overallStatus = "unhealthy"
    } else if (hasWarnings) {
      overallStatus = "degraded"
    } else {
      overallStatus = "healthy"
    }

    const healthResult: HealthCheckResult = {
      status: overallStatus,
      timestamp,
      version: env.APP_VERSION,
      uptime: process.uptime(),
      checks: {
        database: databaseCheck,
        redis: redisCheck,
        memory: memoryCheck,
        environment: {
          status: envHealth.checks.environment?.status || "pass",
          message: envHealth.checks.environment?.message
        }
      },
      environment: env.NODE_ENV,
      configuration: {
        nodeEnv: env.NODE_ENV,
        features: {
          caching: env.ENABLE_CACHING,
          payments: env.ENABLE_PAYMENTS,
          email: env.ENABLE_EMAIL,
          analytics: env.ENABLE_ANALYTICS,
          collaboration: env.ENABLE_COLLABORATION,
          websockets: env.ENABLE_WEBSOCKETS,
        },
        services: envHealth.summary.services || {}
      },
      correlationId
    }

    const statusCode = overallStatus === "healthy" ? 200 :
                      overallStatus === "degraded" ? 200 : 503

    return NextResponse.json(healthResult, {
      status: statusCode,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "true",
        "X-Correlation-ID": correlationId
      }
    })

  } catch (error) {
    console.error("Health check failed:", error)

    const failedHealthResult: HealthCheckResult = {
      status: "unhealthy",
      timestamp,
      version: process.env.npm_package_version || "0.1.0",
      uptime: process.uptime(),
      checks: {
        database: {
          status: "fail",
          error: "Health check system failure"
        },
        memory: {
          status: "fail",
          usage: {
            used: 0,
            total: 0,
            percentage: 0
          }
        }
      },
      environment: process.env.NODE_ENV || "development",
      correlationId
    }

    return NextResponse.json(failedHealthResult, {
      status: 503,
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Health-Check": "true",
        "X-Correlation-ID": correlationId
      }
    })
  }
}

// Support HEAD requests for simple health checks
export async function HEAD(request: NextRequest): Promise<NextResponse> {
  try {
    const [databaseCheck, redisCheck] = await Promise.all([
      checkDatabase(),
      checkRedis()
    ])
    const memoryCheck = checkMemory()

    const isHealthy = databaseCheck.status === "pass" &&
                     redisCheck.status === "pass" &&
                     memoryCheck.status !== "fail"

    return new NextResponse(null, {
      status: isHealthy ? 200 : 503,
      headers: {
        "X-Health-Status": isHealthy ? "healthy" : "unhealthy",
        "X-Correlation-ID": request.headers.get("x-correlation-id") || crypto.randomUUID()
      }
    })
  } catch (error) {
    return new NextResponse(null, {
      status: 503,
      headers: {
        "X-Health-Status": "unhealthy",
        "X-Correlation-ID": request.headers.get("x-correlation-id") || crypto.randomUUID()
      }
    })
  }
}