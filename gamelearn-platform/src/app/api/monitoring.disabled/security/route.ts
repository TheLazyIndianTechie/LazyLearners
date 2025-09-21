import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  securityMonitor,
  getSecurityDashboard,
  detectSecurityPatterns,
  logSecurityEvent,
  SECURITY_EVENT_TYPES,
  SEVERITY_LEVELS
} from "@/lib/security/monitoring"
import { z } from "zod"

// Validation schemas
const securityQuerySchema = z.object({
  timeRange: z.coerce.number().min(3600).max(2592000).default(86400), // 1 hour to 30 days
  eventType: z.string().optional(),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).optional(),
  ipAddress: z.string().ip().optional(),
  userId: z.string().uuid().optional(),
  includePatterns: z.coerce.boolean().default(false)
})

const patternAnalysisSchema = z.object({
  ipAddress: z.string().ip('Invalid IP address'),
  timeWindow: z.coerce.number().min(300).max(86400).default(3600) // 5 minutes to 24 hours
})

const manualEventSchema = z.object({
  type: z.enum(Object.keys(SECURITY_EVENT_TYPES) as [string, ...string[]]),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
  description: z.string().min(1).max(1000),
  metadata: z.record(z.any()).optional(),
  ipAddress: z.string().ip().optional(),
  userId: z.string().uuid().optional()
})

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('security_monitoring')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing security monitoring request")

    // 1. Authentication check - restrict to admin users
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      requestLogger.warn("Unauthorized security monitoring access attempt")
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'security_monitoring',
          method: request.method,
          url: request.url
        },
        undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-correlation-id') || undefined
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // For now, allowing all authenticated users - in production, restrict to security admins
    // if (!['ADMIN', 'SECURITY_ADMIN'].includes(session.user.role)) {
    //   requestLogger.warn("Non-admin user attempted to access security monitoring", {
    //     userId: session.user.id,
    //     userRole: session.user.role
    //   })
    //
    //   await logSecurityEvent(
    //     'privilege_escalation',
    //     'high',
    //     {
    //       attemptedResource: 'security_monitoring',
    //       userRole: session.user.role,
    //       requiredRole: 'SECURITY_ADMIN'
    //     },
    //     session.user.id
    //   )
    //
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: { message: "Security admin access required" }
    //     },
    //     { status: 403 }
    //   )
    // }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validationResult = securityQuerySchema.safeParse({
      timeRange: searchParams.get('timeRange'),
      eventType: searchParams.get('eventType'),
      severity: searchParams.get('severity'),
      ipAddress: searchParams.get('ipAddress'),
      userId: searchParams.get('userId'),
      includePatterns: searchParams.get('includePatterns')
    })

    if (!validationResult.success) {
      requestLogger.warn("Invalid security monitoring query parameters", {
        validationErrors: validationResult.error.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid query parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { timeRange, eventType, severity, ipAddress, userId, includePatterns } = validationResult.data

    // 3. Get security dashboard data
    const dashboardData = await getSecurityDashboard(timeRange)

    // 4. Perform pattern analysis if requested
    let patternAnalysis = null
    if (includePatterns && ipAddress) {
      patternAnalysis = await detectSecurityPatterns(ipAddress, timeRange)
    }

    // 5. Get filtered events based on query parameters
    const filteredEvents = await getFilteredSecurityEvents({
      timeRange,
      eventType,
      severity,
      ipAddress,
      userId
    })

    // 6. Calculate additional security metrics
    const securityMetrics = calculateSecurityMetrics(filteredEvents, timeRange)

    // 7. Get threat landscape overview
    const threatLandscape = await getThreatLandscape(timeRange)

    // 8. Generate security recommendations
    const recommendations = generateSecurityRecommendations(dashboardData, filteredEvents)

    requestLogger.info("Security monitoring data retrieved successfully", {
      eventsReturned: filteredEvents.length,
      timeRange,
      filters: { eventType, severity, ipAddress, userId }
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          dashboard: dashboardData,
          events: filteredEvents.slice(0, 1000), // Limit response size
          metrics: securityMetrics,
          threatLandscape,
          patternAnalysis,
          recommendations,
          metadata: {
            totalEvents: filteredEvents.length,
            timeRange,
            filters: { eventType, severity, ipAddress, userId },
            generatedAt: new Date().toISOString()
          }
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString(),
          generatedBy: 'LazyGameDevs Security Monitor'
        }
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    )

  } catch (error) {
    requestLogger.error("Security monitoring request failed", error as Error, {
      operation: 'security_monitoring'
    })

    // Log this as a security event - system errors could indicate attacks
    await logSecurityEvent(
      'system_compromise',
      'medium',
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation: 'security_monitoring',
        stack: error instanceof Error ? error.stack?.substring(0, 500) : undefined
      }
    )

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to retrieve security monitoring data" }
      },
      { status: 500 }
    )
  }
}

// POST endpoint for pattern analysis
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('security_pattern_analysis')

  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'analyze_patterns':
        return await handlePatternAnalysis(body, requestLogger, endTimer)

      case 'log_manual_event':
        return await handleManualEventLogging(body, session, requestLogger, endTimer)

      case 'mitigate_threat':
        return await handleThreatMitigation(body, session, requestLogger, endTimer)

      default:
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid action specified" }
          },
          { status: 400 }
        )
    }

  } catch (error) {
    requestLogger.error("Security monitoring POST request failed", error as Error)
    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Request processing failed" }
      },
      { status: 500 }
    )
  }
}

// Handler functions

async function handlePatternAnalysis(body: any, logger: any, endTimer: () => void) {
  const validationResult = patternAnalysisSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid pattern analysis parameters",
          details: validationResult.error.errors
        }
      },
      { status: 400 }
    )
  }

  const { ipAddress, timeWindow } = validationResult.data
  const analysis = await detectSecurityPatterns(ipAddress, timeWindow)

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        ipAddress,
        timeWindow,
        analysis,
        analyzedAt: new Date().toISOString()
      }
    },
    { status: 200 }
  )
}

async function handleManualEventLogging(body: any, session: any, logger: any, endTimer: () => void) {
  const validationResult = manualEventSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid manual event parameters",
          details: validationResult.error.errors
        }
      },
      { status: 400 }
    )
  }

  const { type, severity, description, metadata, ipAddress, userId } = validationResult.data

  // Log the manual security event
  const event = await logSecurityEvent(
    type as any,
    severity as any,
    {
      ...metadata,
      description,
      manualEntry: true,
      loggedBy: session.user.id,
      loggedByEmail: session.user.email
    },
    userId,
    ipAddress
  )

  logger.info("Manual security event logged", {
    eventId: event.id,
    type,
    severity,
    loggedBy: session.user.id
  })

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        eventId: event.id,
        message: "Security event logged successfully"
      }
    },
    { status: 201 }
  )
}

async function handleThreatMitigation(body: any, session: any, logger: any, endTimer: () => void) {
  const { threatId, action, ipAddress, userId, reason } = body

  if (!threatId || !action) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Threat ID and action are required" }
      },
      { status: 400 }
    )
  }

  // Log mitigation action
  await logSecurityEvent(
    'configuration_change',
    'medium',
    {
      threatId,
      mitigationAction: action,
      targetIp: ipAddress,
      targetUser: userId,
      reason,
      performedBy: session.user.id,
      performedByEmail: session.user.email
    },
    session.user.id
  )

  // Perform mitigation based on action type
  let result = null
  switch (action) {
    case 'block_ip':
      if (ipAddress) {
        // In production, this would actually block the IP
        result = { action: 'IP blocked', ipAddress, duration: '1 hour' }
        logger.info("IP address blocked via manual mitigation", { ipAddress, performedBy: session.user.id })
      }
      break

    case 'lock_account':
      if (userId) {
        // In production, this would lock the user account
        result = { action: 'Account locked', userId, reason }
        logger.info("User account locked via manual mitigation", { userId, performedBy: session.user.id })
      }
      break

    case 'quarantine_file':
      // File quarantine logic
      result = { action: 'File quarantined', threatId }
      break

    default:
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid mitigation action" }
        },
        { status: 400 }
      )
  }

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        threatId,
        mitigation: result,
        performedBy: session.user.email,
        timestamp: new Date().toISOString()
      }
    },
    { status: 200 }
  )
}

// Helper functions

async function getFilteredSecurityEvents(filters: any) {
  // In production, this would query the actual security events storage
  // For now, returning mock data that would come from securityMonitor
  return []
}

function calculateSecurityMetrics(events: any[], timeRange: number) {
  if (events.length === 0) {
    return {
      totalEvents: 0,
      eventsPerHour: 0,
      averageRiskScore: 0,
      topEventTypes: [],
      criticalEventCount: 0,
      mitigatedEventCount: 0,
      falsePositiveRate: 0
    }
  }

  const criticalEvents = events.filter(e => e.severity === 'critical')
  const mitigatedEvents = events.filter(e => e.mitigated === true)
  const falsePositives = events.filter(e => e.falsePositive === true)

  // Count events by type
  const eventTypeCounts: Record<string, number> = {}
  events.forEach(event => {
    eventTypeCounts[event.type] = (eventTypeCounts[event.type] || 0) + 1
  })

  const topEventTypes = Object.entries(eventTypeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([type, count]) => ({ type, count }))

  const totalRiskScore = events.reduce((sum, event) => sum + event.riskScore, 0)

  return {
    totalEvents: events.length,
    eventsPerHour: Math.round((events.length / (timeRange / 3600)) * 100) / 100,
    averageRiskScore: Math.round((totalRiskScore / events.length) * 100) / 100,
    topEventTypes,
    criticalEventCount: criticalEvents.length,
    mitigatedEventCount: mitigatedEvents.length,
    falsePositiveRate: Math.round((falsePositives.length / events.length) * 10000) / 100 // percentage
  }
}

async function getThreatLandscape(timeRange: number) {
  // In production, this would analyze threat patterns and provide landscape overview
  return {
    activeThreatSources: 0,
    blockedIPs: 0,
    maliciousFileUploads: 0,
    injectionAttempts: 0,
    bruteForceAttacks: 0,
    suspiciousUserAgents: [],
    topAttackVectors: [],
    geographicDistribution: {}
  }
}

function generateSecurityRecommendations(dashboardData: any, events: any[]) {
  const recommendations = []

  // Analyze dashboard data for recommendations
  if (dashboardData.health?.status === 'critical') {
    recommendations.push({
      priority: 'high',
      category: 'system_health',
      title: 'Critical Security Health Status',
      description: 'System is experiencing critical security issues',
      action: 'Review and address critical security events immediately',
      estimatedEffort: 'high'
    })
  }

  // Analyze events for patterns
  const highRiskEvents = events.filter(e => e.riskScore > 80)
  if (highRiskEvents.length > 10) {
    recommendations.push({
      priority: 'high',
      category: 'threat_detection',
      title: 'High Number of High-Risk Events',
      description: `${highRiskEvents.length} high-risk security events detected`,
      action: 'Implement additional security controls and monitoring',
      estimatedEffort: 'medium'
    })
  }

  // Check for common attack patterns
  const injectionEvents = events.filter(e =>
    ['sql_injection', 'xss_attempt', 'command_injection'].includes(e.type)
  )
  if (injectionEvents.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'input_validation',
      title: 'Injection Attacks Detected',
      description: 'Multiple injection attack attempts detected',
      action: 'Review and strengthen input validation and sanitization',
      estimatedEffort: 'medium'
    })
  }

  // Add general recommendations
  recommendations.push({
    priority: 'medium',
    category: 'monitoring',
    title: 'Regular Security Monitoring',
    description: 'Maintain regular security monitoring practices',
    action: 'Schedule weekly security dashboard reviews',
    estimatedEffort: 'low'
  })

  return recommendations
}