import { z } from 'zod'

// Environment schemas for different categories
const databaseSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DATABASE_POOL_SIZE: z.coerce.number().min(1).max(100).default(10),
  DATABASE_TIMEOUT: z.coerce.number().min(1000).max(30000).default(10000),
})

const redisSchema = z.object({
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().min(1).max(65535).optional(),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().min(0).max(15).default(0),
  REDIS_CONNECT_TIMEOUT: z.coerce.number().min(1000).max(30000).default(10000),
  REDIS_COMMAND_TIMEOUT: z.coerce.number().min(1000).max(30000).default(5000),
})

const authSchema = z.object({
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('Invalid NEXTAUTH_URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').optional(),
  SESSION_TIMEOUT: z.coerce.number().min(300).max(86400).default(3600), // 5min to 24hrs
})

const oauthSchema = z.object({
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
})

const paymentSchema = z.object({
  STRIPE_SECRET_KEY: z.string().startsWith('sk_', 'Invalid Stripe secret key format').optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_', 'Invalid Stripe publishable key format').optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_', 'Invalid Stripe webhook secret format').optional(),
  PAYPAL_CLIENT_ID: z.string().optional(),
  PAYPAL_CLIENT_SECRET: z.string().optional(),
  PAYPAL_WEBHOOK_ID: z.string().optional(),
})

const storageSchema = z.object({
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
})

const emailSchema = z.object({
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().min(1).max(65535).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM: z.string().email('Invalid SMTP_FROM email').optional(),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
})

const monitoringSchema = z.object({
  SENTRY_DSN: z.string().url('Invalid Sentry DSN').optional(),
  DATADOG_API_KEY: z.string().optional(),
  NEW_RELIC_LICENSE_KEY: z.string().optional(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).default('info'),
  ENABLE_METRICS: z.coerce.boolean().default(false),
})

const securitySchema = z.object({
  ENCRYPTION_KEY: z.string().min(32, 'ENCRYPTION_KEY must be at least 32 characters').optional(),
  RATE_LIMIT_ENABLED: z.coerce.boolean().default(true),
  RATE_LIMIT_WINDOW: z.coerce.number().min(60).max(3600).default(900), // 1min to 1hr
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().min(10).max(10000).default(100),
  CORS_ORIGINS: z.string().optional(),
  TRUSTED_PROXIES: z.string().optional(),
})

const appSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().min(1000).max(65535).default(3000),
  APP_NAME: z.string().default('GameLearn Platform by LazyGameDevs'),
  APP_VERSION: z.string().default('1.0.0'),
  APP_URL: z.string().url('Invalid APP_URL'),
  API_BASE_URL: z.string().url('Invalid API_BASE_URL').optional(),
  CDN_URL: z.string().url('Invalid CDN_URL').optional(),
  COMPANY_NAME: z.string().default('LazyGameDevs'),
  COMPANY_EMAIL: z.string().email().default('hello@lazygamedevs.com'),
  SUPPORT_EMAIL: z.string().email().default('support@lazygamedevs.com'),
  COMPANY_URL: z.string().url().default('https://lazygamedevs.com'),
})

const featureFlagsSchema = z.object({
  ENABLE_COLLABORATION: z.coerce.boolean().default(true),
  ENABLE_WEBSOCKETS: z.coerce.boolean().default(true),
  ENABLE_CACHING: z.coerce.boolean().default(true),
  ENABLE_ANALYTICS: z.coerce.boolean().default(false),
  ENABLE_PAYMENTS: z.coerce.boolean().default(false),
  ENABLE_EMAIL: z.coerce.boolean().default(false),
  MAINTENANCE_MODE: z.coerce.boolean().default(false),
})

// Combined environment schema
const envSchema = z.object({
  ...databaseSchema.shape,
  ...redisSchema.shape,
  ...authSchema.shape,
  ...oauthSchema.shape,
  ...paymentSchema.shape,
  ...storageSchema.shape,
  ...emailSchema.shape,
  ...monitoringSchema.shape,
  ...securitySchema.shape,
  ...appSchema.shape,
  ...featureFlagsSchema.shape,
})

// Validation functions
function validateRequiredForProduction(env: any): void {
  const errors: string[] = []

  if (env.NODE_ENV === 'production') {
    // Required for production
    const requiredVars = [
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'JWT_SECRET',
      'NEXTAUTH_URL',
      'APP_URL'
    ]

    for (const varName of requiredVars) {
      if (!env[varName]) {
        errors.push(`${varName} is required in production`)
      }
    }

    // Redis should be available in production
    if (!env.REDIS_URL && !env.REDIS_HOST) {
      errors.push('Redis configuration (REDIS_URL or REDIS_HOST) is required in production')
    }

    // Encryption key for sensitive data
    if (!env.ENCRYPTION_KEY) {
      errors.push('ENCRYPTION_KEY is required in production for data encryption')
    }

    // Monitoring should be enabled in production
    if (!env.SENTRY_DSN && !env.DATADOG_API_KEY) {
      console.warn('⚠️  Warning: No monitoring service configured for production')
    }
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`)
  }
}

function validateFeatureDependencies(env: any): void {
  const errors: string[] = []

  // Payment features require payment provider configuration
  if (env.ENABLE_PAYMENTS) {
    if (!env.STRIPE_SECRET_KEY && !env.PAYPAL_CLIENT_ID) {
      errors.push('ENABLE_PAYMENTS requires either Stripe or PayPal configuration')
    }
  }

  // Email features require email provider configuration
  if (env.ENABLE_EMAIL) {
    if (!env.SMTP_HOST && !env.SENDGRID_API_KEY && !env.RESEND_API_KEY) {
      errors.push('ENABLE_EMAIL requires email provider configuration (SMTP, SendGrid, or Resend)')
    }
  }

  // Caching features require Redis
  if (env.ENABLE_CACHING && !env.REDIS_URL && !env.REDIS_HOST) {
    errors.push('ENABLE_CACHING requires Redis configuration')
  }

  // WebSockets require Redis for scaling
  if (env.ENABLE_WEBSOCKETS && env.NODE_ENV === 'production' && !env.REDIS_URL && !env.REDIS_HOST) {
    console.warn('⚠️  Warning: WebSockets in production should use Redis for proper scaling')
  }

  if (errors.length > 0) {
    throw new Error(`Feature dependency validation failed:\n${errors.join('\n')}`)
  }
}

// Parse and validate environment variables
function parseEnvironment(): z.infer<typeof envSchema> {
  try {
    // Parse basic schema
    const parsed = envSchema.parse(process.env)

    // Additional validations
    validateRequiredForProduction(parsed)
    validateFeatureDependencies(parsed)

    return parsed
  } catch (error) {
    if (error instanceof z.ZodError && error.errors) {
      const errorMessages = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join('\n')

      throw new Error(`Environment configuration validation failed:\n${errorMessages}`)
    }

    // Handle other types of errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Environment configuration error: ${errorMessage}`)
  }
}

// Export validated environment configuration
export const env = parseEnvironment()

// Type-safe environment configuration object
export type Environment = typeof env

// Environment-specific configurations
export const isDevelopment = env.NODE_ENV === 'development'
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'
export const isStaging = env.NODE_ENV === 'staging'

// Database configuration
export const dbConfig = {
  url: env.DATABASE_URL,
  pool: {
    min: 2,
    max: env.DATABASE_POOL_SIZE,
  },
  acquireConnectionTimeout: env.DATABASE_TIMEOUT,
}

// Redis configuration
export const redisConfig = {
  url: env.REDIS_URL,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  connectTimeout: env.REDIS_CONNECT_TIMEOUT,
  commandTimeout: env.REDIS_COMMAND_TIMEOUT,
}

// Auth configuration
export const authConfig = {
  secret: env.NEXTAUTH_SECRET,
  url: env.NEXTAUTH_URL,
  sessionTimeout: env.SESSION_TIMEOUT,
  providers: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
    github: {
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET,
    },
    microsoft: {
      clientId: env.MICROSOFT_CLIENT_ID,
      clientSecret: env.MICROSOFT_CLIENT_SECRET,
    },
  },
}

// Payment configuration
export const paymentConfig = {
  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    publishableKey: env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
  paypal: {
    clientId: env.PAYPAL_CLIENT_ID,
    clientSecret: env.PAYPAL_CLIENT_SECRET,
    webhookId: env.PAYPAL_WEBHOOK_ID,
  },
}

// Storage configuration
export const storageConfig = {
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    bucket: env.AWS_S3_BUCKET,
  },
  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
  },
}

// Security configuration
export const securityConfig = {
  encryptionKey: env.ENCRYPTION_KEY,
  rateLimit: {
    enabled: env.RATE_LIMIT_ENABLED,
    windowMs: env.RATE_LIMIT_WINDOW * 1000,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  cors: {
    origins: env.CORS_ORIGINS?.split(',').map(s => s.trim()) || [],
  },
  trustedProxies: env.TRUSTED_PROXIES?.split(',').map(s => s.trim()) || [],
}

// Feature flags
export const features = {
  collaboration: env.ENABLE_COLLABORATION,
  websockets: env.ENABLE_WEBSOCKETS,
  caching: env.ENABLE_CACHING,
  analytics: env.ENABLE_ANALYTICS,
  payments: env.ENABLE_PAYMENTS,
  email: env.ENABLE_EMAIL,
  maintenanceMode: env.MAINTENANCE_MODE,
}

// Logging configuration
export const loggingConfig = {
  level: env.LOG_LEVEL,
  enableMetrics: env.ENABLE_METRICS,
  sentry: {
    dsn: env.SENTRY_DSN,
  },
  datadog: {
    apiKey: env.DATADOG_API_KEY,
  },
}

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof features): boolean {
  return features[feature] === true
}

// Helper function to get environment-specific configuration
export function getConfig<T>(
  development: T,
  production: T,
  test?: T,
  staging?: T
): T {
  switch (env.NODE_ENV) {
    case 'development':
      return development
    case 'production':
      return production
    case 'test':
      return test || development
    case 'staging':
      return staging || production
    default:
      return development
  }
}

// Configuration validation report
export function generateConfigReport(): {
  environment: string
  features: Record<string, boolean>
  services: Record<string, boolean>
  warnings: string[]
} {
  const warnings: string[] = []

  // Check for missing optional but recommended configs
  if (isProduction && !env.SENTRY_DSN && !env.DATADOG_API_KEY) {
    warnings.push('No error monitoring configured for production')
  }

  if (isProduction && !env.CDN_URL) {
    warnings.push('No CDN configured for production static assets')
  }

  if (!env.ENCRYPTION_KEY) {
    warnings.push('No encryption key configured for sensitive data')
  }

  return {
    environment: env.NODE_ENV,
    features,
    services: {
      database: !!env.DATABASE_URL,
      redis: !!(env.REDIS_URL || env.REDIS_HOST),
      auth: !!env.NEXTAUTH_SECRET,
      stripe: !!env.STRIPE_SECRET_KEY,
      paypal: !!env.PAYPAL_CLIENT_ID,
      email: !!(env.SMTP_HOST || env.SENDGRID_API_KEY || env.RESEND_API_KEY),
      storage: !!(env.AWS_ACCESS_KEY_ID || env.CLOUDINARY_CLOUD_NAME),
      monitoring: !!(env.SENTRY_DSN || env.DATADOG_API_KEY),
    },
    warnings
  }
}