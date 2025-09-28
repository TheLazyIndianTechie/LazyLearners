import { env, generateConfigReport, isProduction, isDevelopment } from './env'
import { logger } from '@/lib/logger'

// Environment validation and startup checks
export class EnvironmentValidator {
  private static instance: EnvironmentValidator
  private validated = false

  private constructor() {}

  static getInstance(): EnvironmentValidator {
    if (!EnvironmentValidator.instance) {
      EnvironmentValidator.instance = new EnvironmentValidator()
    }
    return EnvironmentValidator.instance
  }

  // Main validation function to be called at startup
  async validate(): Promise<void> {
    if (this.validated) {
      return
    }

    logger.info('Starting environment validation...')

    try {
      // Generate configuration report
      const report = generateConfigReport()

      // Log configuration status
      logger.info('Environment configuration loaded', {
        environment: report.environment,
        enabledFeatures: Object.entries(report.features)
          .filter(([_, enabled]) => enabled)
          .map(([name]) => name),
        availableServices: Object.entries(report.services)
          .filter(([_, available]) => available)
          .map(([name]) => name)
      })

      // Log warnings
      if (report.warnings.length > 0) {
        report.warnings.forEach(warning => {
          logger.warn(`Configuration warning: ${warning}`)
        })
      }

      // Validate service connections
      await this.validateServiceConnections()

      // Check for security best practices
      this.validateSecuritySettings()

      // Validate production readiness
      if (isProduction) {
        this.validateProductionReadiness()
      }

      this.validated = true
      logger.info('Environment validation completed successfully')

    } catch (error) {
      logger.fatal('Environment validation failed', error as Error)
      throw error
    }
  }

  // Validate that critical services are accessible
  private async validateServiceConnections(): Promise<void> {
    const checks: Promise<void>[] = []

    // Database connection check
    checks.push(this.validateDatabaseConnection())

    // Redis connection check (if configured)
    if (env.REDIS_URL || env.REDIS_HOST) {
      checks.push(this.validateRedisConnection())
    }

    // External service checks (if configured)
    if (env.STRIPE_SECRET_KEY) {
      checks.push(this.validateStripeConnection())
    }

    try {
      await Promise.all(checks)
      logger.info('All configured services are accessible')
    } catch (error) {
      logger.error('Service connection validation failed', error as Error)
      throw error
    }
  }

  private async validateDatabaseConnection(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { prisma } = await import('@/lib/prisma')
      await prisma.$queryRaw`SELECT 1`
      logger.debug('Database connection validated')
    } catch (error) {
      throw new Error(`Database connection failed: ${(error as Error).message}`)
    }
  }

  private async validateRedisConnection(): Promise<void> {
    try {
      // Import dynamically to avoid circular dependencies
      const { redis } = await import('@/lib/redis')
      const isHealthy = await redis.isHealthy()

      if (!isHealthy) {
        throw new Error('Redis ping failed')
      }

      logger.debug('Redis connection validated')
    } catch (error) {
      // Redis is optional in development but should warn
      if (isDevelopment) {
        logger.warn(`Redis connection failed (optional in development): ${(error as Error).message}`)
      } else {
        throw new Error(`Redis connection failed: ${(error as Error).message}`)
      }
    }
  }

  private async validateStripeConnection(): Promise<void> {
    try {
      // Basic validation - check if key format is correct
      if (!env.STRIPE_SECRET_KEY?.startsWith('sk_')) {
        throw new Error('Invalid Stripe secret key format')
      }

      logger.debug('Stripe configuration validated')
    } catch (error) {
      throw new Error(`Stripe validation failed: ${(error as Error).message}`)
    }
  }

  // Check security configuration
  private validateSecuritySettings(): void {
    const securityIssues: string[] = []

    // Check Clerk secret format
    const hasValidClerkSecret = typeof env.CLERK_SECRET_KEY === 'string' && env.CLERK_SECRET_KEY.startsWith('sk_') && env.CLERK_SECRET_KEY.length > 20
    if (!hasValidClerkSecret) {
      securityIssues.push('CLERK_SECRET_KEY should start with "sk_" and be longer than 20 characters')
    }

    // Check Clerk publishable key format
    const hasValidClerkPublishableKey = typeof env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === 'string' && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.startsWith('pk_') && env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.length > 20
    if (!hasValidClerkPublishableKey) {
      securityIssues.push('NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY should start with "pk_" and be longer than 20 characters')
    }

    // Check if encryption key is set for sensitive data
    if (isProduction && !env.ENCRYPTION_KEY) {
      securityIssues.push('ENCRYPTION_KEY should be set in production for data encryption')
    }

    // Check CORS configuration in production
    if (isProduction && !env.CORS_ORIGINS) {
      securityIssues.push('CORS_ORIGINS should be explicitly configured in production')
    }

    // Check if HTTPS is enforced
    if (isProduction && !env.APP_URL?.startsWith('https://')) {
      securityIssues.push('APP_URL should use HTTPS in production')
    }

    if (securityIssues.length > 0) {
      securityIssues.forEach(issue => {
        logger.warn(`Security warning: ${issue}`)
      })
    }
  }

  // Production-specific validations
  private validateProductionReadiness(): void {
    const productionIssues: string[] = []

    // Check monitoring
    if (!env.SENTRY_DSN && !env.DATADOG_API_KEY && !env.NEW_RELIC_LICENSE_KEY) {
      productionIssues.push('No error monitoring service configured (Sentry, DataDog, or New Relic recommended)')
    }

    // Check caching
    if (!env.REDIS_URL && !env.REDIS_HOST) {
      productionIssues.push('Redis caching not configured (recommended for production performance)')
    }

    // Check log level
    if (env.LOG_LEVEL === 'debug') {
      productionIssues.push('LOG_LEVEL is set to debug (consider info or warn for production)')
    }

    // Check email configuration if email features are enabled
    if (env.ENABLE_EMAIL && !env.SMTP_HOST && !env.SENDGRID_API_KEY && !env.RESEND_API_KEY) {
      productionIssues.push('Email features enabled but no email service configured')
    }

    if (productionIssues.length > 0) {
      productionIssues.forEach(issue => {
        logger.warn(`Production readiness: ${issue}`)
      })
    }
  }

  // Get validation status
  isValidated(): boolean {
    return this.validated
  }

  // Force re-validation (useful for testing)
  reset(): void {
    this.validated = false
  }

  // Get current configuration summary
  getConfigSummary(): Record<string, any> {
    return {
      environment: env.NODE_ENV,
      nodeVersion: process.version,
      platform: process.platform,
      features: {
        caching: env.ENABLE_CACHING,
        payments: env.ENABLE_PAYMENTS,
        email: env.ENABLE_EMAIL,
        analytics: env.ENABLE_ANALYTICS,
        collaboration: env.ENABLE_COLLABORATION,
        websockets: env.ENABLE_WEBSOCKETS,
      },
      services: {
        database: !!env.DATABASE_URL,
        redis: !!(env.REDIS_URL || env.REDIS_HOST),
        auth: !!env.CLERK_SECRET_KEY,
        monitoring: !!(env.SENTRY_DSN || env.DATADOG_API_KEY),
      },
      security: {
        rateLimiting: env.RATE_LIMIT_ENABLED,
        encryption: !!env.ENCRYPTION_KEY,
        cors: !!env.CORS_ORIGINS,
      }
    }
  }
}

// Export singleton instance
export const environmentValidator = EnvironmentValidator.getInstance()

// Startup validation function
export async function validateEnvironmentOnStartup(): Promise<void> {
  await environmentValidator.validate()
}

// Helper to check if environment is properly configured
export function isEnvironmentReady(): boolean {
  return environmentValidator.isValidated()
}

// Configuration health check for monitoring
export async function getEnvironmentHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  checks: Record<string, { status: 'pass' | 'fail' | 'warn'; message?: string }>
  summary: Record<string, any>
}> {
  const checks: Record<string, { status: 'pass' | 'fail' | 'warn'; message?: string }> = {}

  // Database check
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1`
    checks.database = { status: 'pass' }
  } catch (error) {
    checks.database = { status: 'fail', message: (error as Error).message }
  }

  // Redis check (if configured)
  if (env.REDIS_URL || env.REDIS_HOST) {
    try {
      const { redis } = await import('@/lib/redis')
      const isHealthy = await redis.isHealthy()
      checks.redis = { status: isHealthy ? 'pass' : 'fail' }
    } catch (error) {
      checks.redis = { status: 'fail', message: (error as Error).message }
    }
  } else {
    checks.redis = { status: 'warn', message: 'Redis not configured' }
  }

  // Environment validation
  checks.environment = {
    status: environmentValidator.isValidated() ? 'pass' : 'fail',
    message: environmentValidator.isValidated() ? undefined : 'Environment not validated'
  }

  // Determine overall status
  const failedChecks = Object.values(checks).filter(check => check.status === 'fail')
  const warnChecks = Object.values(checks).filter(check => check.status === 'warn')

  let status: 'healthy' | 'degraded' | 'unhealthy'
  if (failedChecks.length > 0) {
    status = 'unhealthy'
  } else if (warnChecks.length > 0) {
    status = 'degraded'
  } else {
    status = 'healthy'
  }

  return {
    status,
    checks,
    summary: environmentValidator.getConfigSummary()
  }
}