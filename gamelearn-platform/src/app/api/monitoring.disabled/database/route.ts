import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { databaseMonitor } from "@/lib/monitoring/database"
import { z } from "zod"

// Validation schemas
const queryParamsSchema = z.object({
  period: z.enum(['hour', 'day', 'week', 'month']).default('day'),
  limit: z.coerce.number().min(1).max(1000).default(100),
  model: z.string().optional(),
  operation: z.string().optional(),
  includeSlowQueries: z.coerce.boolean().default(false)
})

export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('database_monitoring')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing database monitoring request")

    // 1. Authentication check - restrict to admin users
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      requestLogger.warn("Unauthorized monitoring access attempt")
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // For now, allowing all authenticated users - in production, restrict to admins
    // if (session.user.role !== 'ADMIN') {
    //   requestLogger.warn("Non-admin user attempted to access database monitoring", {
    //     userId: session.user.id,
    //     userRole: session.user.role
    //   })
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: { message: "Admin access required" }
    //     },
    //     { status: 403 }
    //   )
    // }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validationResult = queryParamsSchema.safeParse({
      period: searchParams.get('period'),
      limit: searchParams.get('limit'),
      model: searchParams.get('model'),
      operation: searchParams.get('operation'),
      includeSlowQueries: searchParams.get('includeSlowQueries')
    })

    if (!validationResult.success) {
      requestLogger.warn("Invalid query parameters", {
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

    const { period, limit, model, operation, includeSlowQueries } = validationResult.data

    // 3. Get database performance statistics
    const [
      databaseStats,
      recentQueries,
      slowQueries,
      performanceTrends
    ] = await Promise.all([
      databaseMonitor.getDatabaseStats(),
      databaseMonitor.getRecentQueries(limit),
      includeSlowQueries ? databaseMonitor.getSlowQueries() : [],
      databaseMonitor.getQueryPerformanceTrends(getPeriodDays(period))
    ])

    // 4. Filter queries if specific model or operation requested
    let filteredQueries = recentQueries
    if (model) {
      filteredQueries = filteredQueries.filter(q =>
        q.model.toLowerCase() === model.toLowerCase()
      )
    }
    if (operation) {
      filteredQueries = filteredQueries.filter(q =>
        q.operation.toLowerCase() === operation.toLowerCase()
      )
    }

    // 5. Calculate additional metrics
    const queryMetrics = calculateQueryMetrics(filteredQueries)
    const modelBreakdown = calculateModelBreakdown(filteredQueries)
    const operationBreakdown = calculateOperationBreakdown(filteredQueries)

    // 6. Get query distribution by performance category
    const performanceDistribution = calculatePerformanceDistribution(filteredQueries)

    // 7. Identify potential issues
    const issues = identifyPerformanceIssues(databaseStats, filteredQueries)

    requestLogger.info("Database monitoring data retrieved successfully", {
      queriesReturned: filteredQueries.length,
      slowQueriesCount: slowQueries.length,
      period,
      filters: { model, operation }
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          overview: {
            totalQueries: databaseStats.totalQueries,
            averageResponseTime: Math.round(databaseStats.averageResponseTime * 100) / 100,
            slowQueries: databaseStats.slowQueries,
            errorRate: databaseStats.errorRate,
            connectionCount: databaseStats.connectionCount,
            healthStatus: getHealthStatus(databaseStats)
          },
          metrics: {
            ...queryMetrics,
            performanceDistribution,
            modelBreakdown,
            operationBreakdown
          },
          queries: {
            recent: filteredQueries.slice(0, limit),
            slow: includeSlowQueries ? slowQueries.slice(0, limit) : [],
            top: databaseStats.topSlowQueries.slice(0, 10)
          },
          trends: performanceTrends,
          issues,
          filters: {
            period,
            model,
            operation,
            limit
          }
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString(),
          generatedBy: 'LazyGameDevs Database Monitor'
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
    requestLogger.error("Database monitoring request failed", error as Error, {
      operation: 'database_monitoring'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to retrieve database monitoring data" }
      },
      { status: 500 }
    )
  }
}

// POST endpoint for query analysis
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('query_analysis')

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
    const { query, explain = false } = body

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Query string is required" }
        },
        { status: 400 }
      )
    }

    // Analyze the query for potential issues
    const analysis = analyzeQuery(query)

    // If explain is requested, we would run EXPLAIN on the query
    // For security, we're not implementing actual query execution
    const explainPlan = explain ? await getQueryExplainPlan(query) : null

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          query: query.substring(0, 1000), // Truncate for response
          analysis,
          explainPlan,
          recommendations: generateQueryRecommendations(analysis)
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Query analysis failed", error as Error)
    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Query analysis failed" }
      },
      { status: 500 }
    )
  }
}

// Helper functions

function getPeriodDays(period: string): number {
  switch (period) {
    case 'hour': return 1
    case 'day': return 1
    case 'week': return 7
    case 'month': return 30
    default: return 1
  }
}

function calculateQueryMetrics(queries: any[]) {
  if (queries.length === 0) {
    return {
      totalQueries: 0,
      averageResponseTime: 0,
      medianResponseTime: 0,
      p95ResponseTime: 0,
      fastQueries: 0,
      slowQueries: 0,
      criticalQueries: 0
    }
  }

  const durations = queries.map(q => q.duration).sort((a, b) => a - b)
  const total = durations.reduce((sum, d) => sum + d, 0)

  return {
    totalQueries: queries.length,
    averageResponseTime: Math.round((total / queries.length) * 100) / 100,
    medianResponseTime: durations[Math.floor(durations.length / 2)],
    p95ResponseTime: durations[Math.floor(durations.length * 0.95)],
    fastQueries: queries.filter(q => q.duration < 100).length,
    slowQueries: queries.filter(q => q.duration >= 500).length,
    criticalQueries: queries.filter(q => q.duration >= 5000).length
  }
}

function calculateModelBreakdown(queries: any[]) {
  const breakdown: Record<string, any> = {}

  queries.forEach(query => {
    if (!breakdown[query.model]) {
      breakdown[query.model] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowQueries: 0
      }
    }

    breakdown[query.model].count++
    breakdown[query.model].totalDuration += query.duration
    if (query.isSlowQuery) {
      breakdown[query.model].slowQueries++
    }
  })

  // Calculate averages
  Object.values(breakdown).forEach((model: any) => {
    model.averageDuration = Math.round((model.totalDuration / model.count) * 100) / 100
  })

  return Object.entries(breakdown)
    .map(([model, stats]) => ({ model, ...stats }))
    .sort((a: any, b: any) => b.count - a.count)
}

function calculateOperationBreakdown(queries: any[]) {
  const breakdown: Record<string, any> = {}

  queries.forEach(query => {
    if (!breakdown[query.operation]) {
      breakdown[query.operation] = {
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        slowQueries: 0
      }
    }

    breakdown[query.operation].count++
    breakdown[query.operation].totalDuration += query.duration
    if (query.isSlowQuery) {
      breakdown[query.operation].slowQueries++
    }
  })

  // Calculate averages
  Object.values(breakdown).forEach((operation: any) => {
    operation.averageDuration = Math.round((operation.totalDuration / operation.count) * 100) / 100
  })

  return Object.entries(breakdown)
    .map(([operation, stats]) => ({ operation, ...stats }))
    .sort((a: any, b: any) => b.count - a.count)
}

function calculatePerformanceDistribution(queries: any[]) {
  const distribution = {
    fast: 0,      // < 100ms
    moderate: 0,  // 100-500ms
    slow: 0,      // 500ms-1s
    verySlow: 0,  // 1s-5s
    critical: 0   // > 5s
  }

  queries.forEach(query => {
    if (query.duration < 100) distribution.fast++
    else if (query.duration < 500) distribution.moderate++
    else if (query.duration < 1000) distribution.slow++
    else if (query.duration < 5000) distribution.verySlow++
    else distribution.critical++
  })

  return distribution
}

function identifyPerformanceIssues(stats: any, queries: any[]) {
  const issues = []

  // High average response time
  if (stats.averageResponseTime > 1000) {
    issues.push({
      type: 'high_average_response_time',
      severity: 'high',
      message: `Average response time is ${Math.round(stats.averageResponseTime)}ms`,
      recommendation: 'Review slow queries and consider adding indexes'
    })
  }

  // High percentage of slow queries
  const slowQueryPercentage = (stats.slowQueries / stats.totalQueries) * 100
  if (slowQueryPercentage > 10) {
    issues.push({
      type: 'high_slow_query_percentage',
      severity: 'medium',
      message: `${Math.round(slowQueryPercentage)}% of queries are slow`,
      recommendation: 'Optimize frequently used queries'
    })
  }

  // Potential N+1 queries
  const frequentQueries = queries.reduce((acc: any, query) => {
    const key = query.queryHash
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const suspiciousQueries = Object.values(frequentQueries).filter((count: any) => count > 10)
  if (suspiciousQueries.length > 0) {
    issues.push({
      type: 'potential_n_plus_one',
      severity: 'medium',
      message: 'Detected potential N+1 query patterns',
      recommendation: 'Use eager loading or batch queries'
    })
  }

  return issues
}

function getHealthStatus(stats: any): string {
  if (stats.averageResponseTime > 2000 || stats.slowQueries / stats.totalQueries > 0.2) {
    return 'critical'
  } else if (stats.averageResponseTime > 1000 || stats.slowQueries / stats.totalQueries > 0.1) {
    return 'warning'
  } else {
    return 'healthy'
  }
}

function analyzeQuery(query: string) {
  const issues = []
  const suggestions = []

  // Check for SELECT *
  if (/SELECT\s+\*/i.test(query)) {
    issues.push('Uses SELECT * - consider selecting specific columns')
    suggestions.push('Replace SELECT * with specific column names')
  }

  // Check for missing LIMIT
  if (/SELECT/i.test(query) && !/LIMIT/i.test(query) && !/COUNT/i.test(query)) {
    issues.push('SELECT without LIMIT clause')
    suggestions.push('Add LIMIT clause to prevent large result sets')
  }

  // Check for OR in WHERE clause
  if (/WHERE.*OR/i.test(query)) {
    issues.push('OR condition in WHERE clause may not use indexes efficiently')
    suggestions.push('Consider using UNION or restructuring the query')
  }

  // Check for LIKE with leading wildcard
  if (/LIKE\s*['"][%]/i.test(query)) {
    issues.push('LIKE with leading wildcard prevents index usage')
    suggestions.push('Avoid leading wildcards in LIKE clauses')
  }

  return {
    issues,
    suggestions,
    complexity: calculateQueryComplexity(query),
    estimatedPerformance: estimateQueryPerformance(query)
  }
}

function calculateQueryComplexity(query: string): string {
  let score = 0

  // Count JOINs
  const joinCount = (query.match(/JOIN/gi) || []).length
  score += joinCount * 2

  // Count subqueries
  const subqueryCount = (query.match(/\(\s*SELECT/gi) || []).length
  score += subqueryCount * 3

  // Count WHERE conditions
  const whereConditions = (query.match(/AND|OR/gi) || []).length
  score += whereConditions

  // Count aggregations
  const aggregations = (query.match(/COUNT|SUM|AVG|MAX|MIN|GROUP BY/gi) || []).length
  score += aggregations

  if (score < 3) return 'simple'
  if (score < 8) return 'moderate'
  if (score < 15) return 'complex'
  return 'very_complex'
}

function estimateQueryPerformance(query: string): string {
  // Simple heuristic-based performance estimation
  if (/SELECT\s+\*.*JOIN.*JOIN/i.test(query)) return 'slow'
  if (/LIKE\s*['"][%].*[%]['"]/.test(query)) return 'slow'
  if (/SELECT.*FROM.*WHERE.*IN\s*\(.*SELECT/i.test(query)) return 'moderate'
  if (/SELECT\s+\*/i.test(query)) return 'moderate'
  return 'fast'
}

async function getQueryExplainPlan(query: string): Promise<any> {
  // In a real implementation, you would safely execute EXPLAIN on the query
  // For security reasons, we're not implementing actual query execution
  return {
    note: 'Query execution not implemented for security reasons',
    recommendation: 'Use database tools to analyze query execution plan'
  }
}