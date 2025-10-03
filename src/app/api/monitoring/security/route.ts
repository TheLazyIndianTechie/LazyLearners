/**
 * Security Monitoring API
 * Provides real-time security metrics and statistics
 */

import { NextRequest } from 'next/server'
import { createSuccessResponse, createAuthorizationErrorResponse } from '@/lib/api-response'
import { getAuthStats } from '@/lib/auth-protection'
import { databaseMonitor } from '@/lib/monitoring/database'
import { auth } from '@clerk/nextjs/server'

export const dynamic = 'force-dynamic'

/**
 * Get comprehensive security metrics
 * Requires admin authentication
 */
export async function GET(request: NextRequest) {
  // Verify admin authentication
  const { userId } = await auth()

  if (!userId) {
    return createAuthorizationErrorResponse('Authentication required')
  }

  // TODO: Add role check for admin
  // const user = await prisma.user.findUnique({ where: { clerkId: userId } })
  // if (user?.role !== 'ADMIN') {
  //   return createAuthorizationErrorResponse('Admin access required')
  // }

  try {
    // Gather security metrics
    const [authStats, dbStats] = await Promise.all([
      getAuthStats(),
      databaseMonitor.getDatabaseStats(),
    ])

    const metrics = {
      authentication: {
        totalFailedAttempts: authStats.totalFailedAttempts,
        lockedAccounts: authStats.lockedAccounts,
        suspiciousIps: authStats.suspiciousIps,
      },
      database: {
        totalQueries: dbStats.totalQueries,
        averageResponseTime: Math.round(dbStats.averageResponseTime),
        slowQueries: dbStats.slowQueries,
        slowQueryPercentage:
          dbStats.totalQueries > 0
            ? ((dbStats.slowQueries / dbStats.totalQueries) * 100).toFixed(2)
            : '0.00',
        topSlowQueries: dbStats.topSlowQueries.slice(0, 5).map(q => ({
          operation: q.operation,
          model: q.model,
          duration: Math.round(q.duration),
          warning: q.warning,
        })),
      },
      system: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
        },
      },
    }

    return createSuccessResponse(metrics)
  } catch (error) {
    console.error('Error fetching security metrics:', error)

    return createSuccessResponse({
      authentication: {
        totalFailedAttempts: 0,
        lockedAccounts: 0,
        suspiciousIps: 0,
      },
      database: {
        totalQueries: 0,
        averageResponseTime: 0,
        slowQueries: 0,
        slowQueryPercentage: '0.00',
        topSlowQueries: [],
      },
      system: {
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: {
          heapUsed: 0,
          heapTotal: 0,
          rss: 0,
        },
      },
      error: 'Some metrics unavailable',
    })
  }
}
