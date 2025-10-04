import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'
import { createRequestLogger } from '@/lib/logger'
import { redis } from '@/lib/redis'

// Performance thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  fast: 100,      // Under 100ms
  moderate: 500,  // 100-500ms
  slow: 1000,     // 500ms-1s
  critical: 5000  // Over 5s
} as const

// Query analysis patterns
const PROBLEMATIC_PATTERNS = {
  n_plus_one: /SELECT.*FROM.*WHERE.*IN\s*\(/gi,
  missing_index: /FULL TABLE SCAN|TABLE ACCESS FULL/gi,
  cartesian_product: /CROSS JOIN|FROM.*,.*WHERE/gi,
  inefficient_like: /LIKE\s*['"][%].*[%]['"]|LIKE\s*['"].*[%]['"].*[%]/gi,
  subquery_dependent: /EXISTS\s*\(\s*SELECT.*WHERE.*=.*\./gi
} as const

// Query performance metrics
interface QueryMetrics {
  queryHash: string
  query: string
  duration: number
  timestamp: number
  model: string
  operation: string
  recordCount?: number
  isSlowQuery: boolean
  warning?: string
  stackTrace?: string
}

// Database performance stats
interface DatabaseStats {
  totalQueries: number
  averageResponseTime: number
  slowQueries: number
  errorRate: number
  connectionCount: number
  topSlowQueries: QueryMetrics[]
  memoryUsage?: number
}

export class DatabaseMonitor {
  private static instance: DatabaseMonitor
  private queryLog: QueryMetrics[] = []
  private maxLogSize = 1000
  private logger = createRequestLogger({ headers: new Headers() } as any)

  private constructor() {}

  static getInstance(): DatabaseMonitor {
    if (!DatabaseMonitor.instance) {
      DatabaseMonitor.instance = new DatabaseMonitor()
    }
    return DatabaseMonitor.instance
  }

  // Create enhanced Prisma client with monitoring
  static createMonitoredPrismaClient(): PrismaClient {
    const monitor = DatabaseMonitor.getInstance()

    const prisma = new PrismaClient({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'warn' },
        { emit: 'stdout', level: 'info' }
      ],
      errorFormat: 'pretty',
      // Connection pool configuration for optimal performance
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    })

    // Query event monitoring
    prisma.$on('query', (event: any) => {
      monitor.logQuery({
        query: event.query,
        duration: event.duration,
        params: event.params,
        target: event.target
      })
    })

    // Error event monitoring
    prisma.$on('error', (event: any) => {
      monitor.logDatabaseError(event)
    })

    // Warning event monitoring
    prisma.$on('warn', (event: any) => {
      monitor.logDatabaseWarning(event)
    })

    return monitor.wrapPrismaWithMetrics(prisma)
  }

  private wrapPrismaWithMetrics(prisma: PrismaClient): PrismaClient {
    const monitor = this

    // Wrap Prisma operations with performance tracking
    const originalMethods = ['findFirst', 'findMany', 'create', 'update', 'delete', 'upsert', 'aggregate', 'count']

    // Check if Prisma client has datamodel information
    const dmmf = (prisma as any)._dmmf
    if (!dmmf || !dmmf.datamodel || !dmmf.datamodel.models) {
      console.warn('Prisma datamodel not available, skipping database monitoring')
      return prisma
    }

    for (const modelName of Object.keys(dmmf.datamodel.models)) {
      const model = (prisma as any)[modelName.toLowerCase()]

      if (model) {
        for (const method of originalMethods) {
          if (typeof model[method] === 'function') {
            const originalMethod = model[method]

            model[method] = async function (...args: any[]) {
              const startTime = Date.now()
              const operation = `${modelName}.${method}`

              try {
                const result = await originalMethod.apply(this, args)
                const duration = Date.now() - startTime

                // Log operation metrics
                monitor.logOperation(operation, duration, args, result)

                return result
              } catch (error) {
                const duration = Date.now() - startTime
                monitor.logOperationError(operation, duration, error as Error, args)
                throw error
              }
            }
          }
        }
      }
    }

    return prisma
  }

  private logQuery(event: any): void {
    const duration = event.duration
    const query = event.query
    const queryHash = this.generateQueryHash(query)
    const isSlowQuery = duration > PERFORMANCE_THRESHOLDS.moderate

    const metrics: QueryMetrics = {
      queryHash,
      query: this.sanitizeQuery(query),
      duration,
      timestamp: Date.now(),
      model: this.extractModelFromQuery(query),
      operation: this.extractOperationFromQuery(query),
      isSlowQuery,
      warning: this.analyzeQueryPerformance(query, duration)
    }

    // Add to in-memory log
    this.addToQueryLog(metrics)

    // Log slow queries
    if (isSlowQuery) {
      this.logger.warn('Slow database query detected', {
        queryHash,
        duration,
        operation: metrics.operation,
        model: metrics.model,
        warning: metrics.warning
      })

      // Store slow query for analysis
      this.storeSlowQuery(metrics)
    }

    // Log critical queries
    if (duration > PERFORMANCE_THRESHOLDS.critical) {
      this.logger.error('Critical slow database query', new Error('Database performance critical'), {
        queryHash,
        duration,
        operation: metrics.operation,
        model: metrics.model,
        query: metrics.query.substring(0, 500) // Truncate for logging
      })

      // Alert for critical performance issues
      this.alertCriticalPerformance(metrics)
    }

    // Update performance metrics
    this.updatePerformanceMetrics(metrics)
  }

  private logOperation(operation: string, duration: number, args: any[], result: any): void {
    const recordCount = this.extractRecordCount(result)

    this.logger.debug('Database operation completed', {
      operation,
      duration,
      recordCount,
      argsCount: args.length,
      performance: this.categorizePerformance(duration)
    })

    // Check for potential N+1 queries
    if (recordCount && recordCount > 1 && duration > PERFORMANCE_THRESHOLDS.moderate) {
      this.logger.warn('Potential N+1 query detected', {
        operation,
        duration,
        recordCount,
        ratio: duration / recordCount
      })
    }
  }

  private logOperationError(operation: string, duration: number, error: Error, args: any[]): void {
    this.logger.error('Database operation failed', error, {
      operation,
      duration,
      argsCount: args.length,
      errorMessage: error.message
    })

    // Store error for analysis
    this.storeOperationError({
      operation,
      duration,
      error: error.message,
      timestamp: Date.now()
    })
  }

  private logDatabaseError(event: any): void {
    this.logger.error('Database error event', new Error(event.message), {
      target: event.target,
      timestamp: event.timestamp
    })
  }

  private logDatabaseWarning(event: any): void {
    this.logger.warn('Database warning event', {
      message: event.message,
      target: event.target,
      timestamp: event.timestamp
    })
  }

  private generateQueryHash(query: string): string {
    // Normalize query by removing parameters and whitespace
    const normalized = query
      .replace(/\$\d+/g, '?')           // Replace $1, $2, etc. with ?
      .replace(/\s+/g, ' ')            // Normalize whitespace
      .replace(/['"][^'"]*['"]/g, '?') // Replace string literals
      .replace(/\b\d+\b/g, '?')        // Replace numbers
      .trim()
      .toLowerCase()

    return createHash('md5').update(normalized).digest('hex')
  }

  private sanitizeQuery(query: string): string {
    // Remove potential sensitive data from query for logging
    return query
      .replace(/['"][^'"]*['"]/g, "'***'") // Replace string literals
      .replace(/\b\d{10,}\b/g, '***')      // Replace long numbers (potential IDs)
      .substring(0, 1000)                  // Limit length
  }

  private extractModelFromQuery(query: string): string {
    const fromMatch = query.match(/FROM\s+["']?(\w+)["']?/i)
    const intoMatch = query.match(/INTO\s+["']?(\w+)["']?/i)
    const updateMatch = query.match(/UPDATE\s+["']?(\w+)["']?/i)

    return fromMatch?.[1] || intoMatch?.[1] || updateMatch?.[1] || 'unknown'
  }

  private extractOperationFromQuery(query: string): string {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.startsWith('select')) return 'select'
    if (trimmed.startsWith('insert')) return 'insert'
    if (trimmed.startsWith('update')) return 'update'
    if (trimmed.startsWith('delete')) return 'delete'
    if (trimmed.startsWith('create')) return 'create'
    if (trimmed.startsWith('drop')) return 'drop'
    if (trimmed.startsWith('alter')) return 'alter'
    return 'unknown'
  }

  private analyzeQueryPerformance(query: string, duration: number): string | undefined {
    const warnings: string[] = []

    // Check for problematic patterns
    for (const [pattern, regex] of Object.entries(PROBLEMATIC_PATTERNS)) {
      if (regex.test(query)) {
        warnings.push(`Potential ${pattern.replace('_', ' ')}: ${pattern}`)
      }
    }

    // Check for missing LIMIT clause on SELECT
    if (query.toLowerCase().includes('select') &&
        !query.toLowerCase().includes('limit') &&
        !query.toLowerCase().includes('count(')) {
      warnings.push('SELECT without LIMIT clause')
    }

    // Check for SELECT *
    if (query.toLowerCase().includes('select *')) {
      warnings.push('SELECT * query - consider selecting specific columns')
    }

    // Performance-based warnings
    if (duration > PERFORMANCE_THRESHOLDS.critical) {
      warnings.push('Critical performance issue')
    } else if (duration > PERFORMANCE_THRESHOLDS.slow) {
      warnings.push('Slow query performance')
    }

    return warnings.length > 0 ? warnings.join('; ') : undefined
  }

  private categorizePerformance(duration: number): string {
    if (duration < PERFORMANCE_THRESHOLDS.fast) return 'fast'
    if (duration < PERFORMANCE_THRESHOLDS.moderate) return 'moderate'
    if (duration < PERFORMANCE_THRESHOLDS.slow) return 'slow'
    if (duration < PERFORMANCE_THRESHOLDS.critical) return 'very_slow'
    return 'critical'
  }

  private extractRecordCount(result: any): number | undefined {
    if (Array.isArray(result)) return result.length
    if (result && typeof result === 'object' && 'count' in result) return result.count
    if (result && typeof result === 'object' && '_count' in result) return result._count
    return undefined
  }

  private addToQueryLog(metrics: QueryMetrics): void {
    this.queryLog.push(metrics)

    // Maintain max log size
    if (this.queryLog.length > this.maxLogSize) {
      this.queryLog = this.queryLog.slice(-this.maxLogSize)
    }
  }

  private async storeSlowQuery(metrics: QueryMetrics): Promise<void> {
    try {
      await redis.set(
        `slow_query:${metrics.queryHash}:${metrics.timestamp}`,
        {
          ...metrics,
          stackTrace: new Error().stack
        },
        60 * 60 * 24 // 24 hours TTL
      )

      // Increment slow query counter
      await redis.incrementKey(
        `slow_query_count:${new Date().toISOString().split('T')[0]}`,
        60 * 60 * 24
      )
    } catch (error) {
      this.logger.warn('Failed to store slow query metrics', error as Error)
    }
  }

  private async storeOperationError(errorData: any): Promise<void> {
    try {
      await redis.set(
        `db_error:${Date.now()}:${Math.random()}`,
        errorData,
        60 * 60 * 24 // 24 hours TTL
      )
    } catch (error) {
      this.logger.warn('Failed to store operation error', error as Error)
    }
  }

  private async updatePerformanceMetrics(metrics: QueryMetrics): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const metricsKey = `db_metrics:${today}`

      // Update daily metrics
      await redis.incrementKey(`${metricsKey}:total_queries`, 60 * 60 * 24)
      await redis.incrementKey(`${metricsKey}:total_duration`, 60 * 60 * 24, metrics.duration)

      if (metrics.isSlowQuery) {
        await redis.incrementKey(`${metricsKey}:slow_queries`, 60 * 60 * 24)
      }

      // Update model-specific metrics
      await redis.incrementKey(`${metricsKey}:${metrics.model}:queries`, 60 * 60 * 24)
      await redis.incrementKey(`${metricsKey}:${metrics.model}:duration`, 60 * 60 * 24, metrics.duration)
    } catch (error) {
      this.logger.warn('Failed to update performance metrics', error as Error)
    }
  }

  private async alertCriticalPerformance(metrics: QueryMetrics): Promise<void> {
    // In production, this would send alerts to monitoring systems
    // For now, we'll log the critical issue
    this.logger.logSecurityEvent('critical_database_performance', 'high', {
      queryHash: metrics.queryHash,
      duration: metrics.duration,
      operation: metrics.operation,
      model: metrics.model,
      timestamp: metrics.timestamp
    })
  }

  // Public methods for retrieving performance data

  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const today = new Date().toISOString().split('T')[0]
      const metricsKey = `db_metrics:${today}`

      const [totalQueries, totalDuration, slowQueries] = await Promise.all([
        redis.get(`${metricsKey}:total_queries`).catch(() => 0),
        redis.get(`${metricsKey}:total_duration`).catch(() => 0),
        redis.get(`${metricsKey}:slow_queries`).catch(() => 0)
      ])

      const totalQueriesNum = typeof totalQueries === 'number' ? totalQueries : 0
      const totalDurationNum = typeof totalDuration === 'number' ? totalDuration : 0
      const slowQueriesNum = typeof slowQueries === 'number' ? slowQueries : 0
      const averageResponseTime = totalQueriesNum > 0 ? totalDurationNum / totalQueriesNum : 0

      return {
        totalQueries: totalQueriesNum,
        averageResponseTime,
        slowQueries: slowQueriesNum,
        errorRate: 0, // Calculate from error data
        connectionCount: 0, // Would get from connection pool
        topSlowQueries: this.getTopSlowQueries()
      }
    } catch (error) {
      this.logger.warn('Failed to get database stats', error as Error)
      return {
        totalQueries: 0,
        averageResponseTime: 0,
        slowQueries: 0,
        errorRate: 0,
        connectionCount: 0,
        topSlowQueries: []
      }
    }
  }

  getRecentQueries(limit = 100): QueryMetrics[] {
    return this.queryLog.slice(-limit)
  }

  getSlowQueries(): QueryMetrics[] {
    return this.queryLog.filter(q => q.isSlowQuery)
  }

  getTopSlowQueries(limit = 10): QueryMetrics[] {
    return this.queryLog
      .filter(q => q.isSlowQuery)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit)
  }

  getQueriesByModel(model: string): QueryMetrics[] {
    return this.queryLog.filter(q => q.model.toLowerCase() === model.toLowerCase())
  }

  async getQueryPerformanceTrends(days = 7): Promise<any[]> {
    try {
      const trends = []
      for (let i = 0; i < days; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateKey = date.toISOString().split('T')[0]
        const metricsKey = `db_metrics:${dateKey}`

        const [totalQueries, totalDuration, slowQueries] = await Promise.all([
          redis.get(`${metricsKey}:total_queries`) || 0,
          redis.get(`${metricsKey}:total_duration`) || 0,
          redis.get(`${metricsKey}:slow_queries`) || 0
        ])

        trends.push({
          date: dateKey,
          totalQueries,
          averageResponseTime: totalQueries > 0 ? totalDuration / totalQueries : 0,
          slowQueries,
          slowQueryPercentage: totalQueries > 0 ? (slowQueries / totalQueries) * 100 : 0
        })
      }

      return trends.reverse() // Most recent first
    } catch (error) {
      this.logger.warn('Failed to get performance trends', error as Error)
      return []
    }
  }
}

// Export singleton instance
export const databaseMonitor = DatabaseMonitor.getInstance()

// Export monitored Prisma client
export const monitoredPrisma = DatabaseMonitor.createMonitoredPrismaClient()