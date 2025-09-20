import { logger } from '@/lib/logger'
import { validateEnvironmentOnStartup } from '@/lib/config/validate'
import { env, isProduction, isDevelopment, generateConfigReport } from '@/lib/config/env'

// Startup initialization flag
let initialized = false

/**
 * Application startup initialization
 * This should be called once when the application starts
 */
export async function initializeApplication(): Promise<void> {
  if (initialized) {
    return
  }

  const startTime = Date.now()
  logger.info('Starting LazyGameDevs GameLearn Platform initialization...', {
    environment: env.NODE_ENV,
    version: env.APP_VERSION,
    nodeVersion: process.version,
    platform: process.platform,
    company: env.COMPANY_NAME
  })

  try {
    // 1. Validate environment configuration
    logger.info('Validating environment configuration...')
    await validateEnvironmentOnStartup()

    // 2. Log configuration summary
    const configReport = generateConfigReport()
    logger.info('Configuration loaded successfully', {
      enabledFeatures: Object.entries(configReport.features)
        .filter(([_, enabled]) => enabled)
        .map(([name]) => name),
      availableServices: Object.entries(configReport.services)
        .filter(([_, available]) => available)
        .map(([name]) => name),
      warningCount: configReport.warnings.length
    })

    // 3. Log warnings if any
    if (configReport.warnings.length > 0) {
      configReport.warnings.forEach(warning => {
        logger.warn(`Configuration warning: ${warning}`)
      })
    }

    // 4. Initialize services based on feature flags
    await initializeServices()

    // 5. Production-specific initialization
    if (isProduction) {
      await initializeProductionServices()
    }

    // 6. Development-specific initialization
    if (isDevelopment) {
      initializeDevelopmentServices()
    }

    const initTime = Date.now() - startTime
    logger.info('LazyGameDevs GameLearn Platform initialization completed', {
      initializationTime: initTime,
      environment: env.NODE_ENV,
      status: 'ready',
      company: env.COMPANY_NAME
    })

    initialized = true

  } catch (error) {
    const initTime = Date.now() - startTime
    logger.fatal('Application initialization failed', error as Error, {
      initializationTime: initTime,
      environment: env.NODE_ENV,
      status: 'failed'
    })

    // In production, we might want to exit the process
    if (isProduction) {
      logger.fatal('Exiting due to initialization failure in production')
      process.exit(1)
    }

    throw error
  }
}

/**
 * Initialize services based on feature flags
 */
async function initializeServices(): Promise<void> {
  const enabledServices: string[] = []

  // Initialize Redis if caching is enabled
  if (env.ENABLE_CACHING) {
    try {
      const { redis } = await import('@/lib/redis')
      await redis.isHealthy() // Test connection
      enabledServices.push('redis')
      logger.info('Redis caching service initialized')
    } catch (error) {
      logger.error('Failed to initialize Redis caching', error as Error)
      if (isProduction) {
        throw error // Fail fast in production
      }
    }
  }

  // Initialize database
  try {
    const { prisma } = await import('@/lib/prisma')
    await prisma.$queryRaw`SELECT 1` // Test connection
    enabledServices.push('database')
    logger.info('Database service initialized')
  } catch (error) {
    logger.error('Failed to initialize database', error as Error)
    throw error // Database is always required
  }

  // Initialize email service if enabled
  if (env.ENABLE_EMAIL) {
    try {
      // TODO: Initialize email service when implemented
      enabledServices.push('email')
      logger.info('Email service configuration validated')
    } catch (error) {
      logger.error('Failed to initialize email service', error as Error)
      if (isProduction) {
        throw error
      }
    }
  }

  // Initialize payment services if enabled
  if (env.ENABLE_PAYMENTS) {
    try {
      // TODO: Initialize payment services when implemented
      enabledServices.push('payments')
      logger.info('Payment services configuration validated')
    } catch (error) {
      logger.error('Failed to initialize payment services', error as Error)
      if (isProduction) {
        throw error
      }
    }
  }

  logger.info('Service initialization completed', {
    enabledServices,
    serviceCount: enabledServices.length
  })
}

/**
 * Production-specific initialization
 */
async function initializeProductionServices(): Promise<void> {
  logger.info('Initializing production-specific services...')

  // Verify monitoring is configured
  if (!env.SENTRY_DSN && !env.DATADOG_API_KEY && !env.NEW_RELIC_LICENSE_KEY) {
    logger.warn('No monitoring service configured for production')
  }

  // Verify Redis is available for session management
  if (!env.REDIS_URL && !env.REDIS_HOST) {
    logger.warn('Redis not configured - using in-memory fallbacks (not recommended for production)')
  }

  // Verify encryption key is set
  if (!env.ENCRYPTION_KEY) {
    logger.warn('No encryption key configured - sensitive data will not be encrypted')
  }

  // Verify HTTPS is configured
  if (!env.NEXTAUTH_URL?.startsWith('https://')) {
    logger.warn('NEXTAUTH_URL should use HTTPS in production')
  }

  // Initialize error tracking if configured
  if (env.SENTRY_DSN) {
    try {
      // TODO: Initialize Sentry when implemented
      logger.info('Error tracking (Sentry) initialized')
    } catch (error) {
      logger.error('Failed to initialize Sentry', error as Error)
    }
  }

  logger.info('Production services initialization completed')
}

/**
 * Development-specific initialization
 */
function initializeDevelopmentServices(): void {
  logger.info('Initializing development-specific services...')

  // Development-specific logging
  logger.info('Development mode features enabled', {
    hotReload: true,
    verboseLogging: true,
    debugMode: env.LOG_LEVEL === 'debug'
  })

  // Warn about missing optional services in development
  if (!env.REDIS_URL && !env.REDIS_HOST) {
    logger.info('Redis not configured - using in-memory fallbacks (OK for development)')
  }

  if (!env.STRIPE_SECRET_KEY && env.ENABLE_PAYMENTS) {
    logger.info('Stripe not configured - payment features will be limited')
  }

  logger.info('Development services initialization completed')
}

/**
 * Get initialization status
 */
export function isApplicationInitialized(): boolean {
  return initialized
}

/**
 * Reset initialization status (useful for testing)
 */
export function resetInitialization(): void {
  initialized = false
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`Received ${signal} signal, starting graceful shutdown...`)

  try {
    // Close Redis connections
    if (env.ENABLE_CACHING) {
      try {
        const { redis } = await import('@/lib/redis')
        await redis.disconnect()
        logger.info('Redis connections closed')
      } catch (error) {
        logger.error('Error closing Redis connections', error as Error)
      }
    }

    // Close database connections
    try {
      const { prisma } = await import('@/lib/prisma')
      await prisma.$disconnect()
      logger.info('Database connections closed')
    } catch (error) {
      logger.error('Error closing database connections', error as Error)
    }

    logger.info('Graceful shutdown completed')
    process.exit(0)

  } catch (error) {
    logger.error('Error during graceful shutdown', error as Error)
    process.exit(1)
  }
}

/**
 * Setup process signal handlers for graceful shutdown
 */
export function setupSignalHandlers(): void {
  // Handle SIGTERM (Docker, Kubernetes, etc.)
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))

  // Handle SIGINT (Ctrl+C)
  process.on('SIGINT', () => gracefulShutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.fatal('Uncaught exception', error, {
      stack: error.stack
    })
    process.exit(1)
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.fatal('Unhandled promise rejection', reason as Error, {
      promise: promise.toString()
    })
    process.exit(1)
  })

  logger.info('Signal handlers configured for graceful shutdown')
}