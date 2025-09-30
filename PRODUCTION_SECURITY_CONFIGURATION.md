# Production Security Configuration Guide

Comprehensive security configuration guide for the LazyGameDevs GameLearn Platform production deployment.

## Table of Contents

1. [Security Overview](#security-overview)
2. [CORS Configuration](#cors-configuration)
3. [Rate Limiting](#rate-limiting)
4. [Webhook Security](#webhook-security)
5. [API Security](#api-security)
6. [Database Security](#database-security)
7. [Environment Security](#environment-security)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Security Headers](#security-headers)
10. [Monitoring and Alerting](#monitoring-and-alerting)

## Security Overview

### Security Principles

1. **Defense in Depth**: Multiple layers of security controls
2. **Least Privilege**: Minimal necessary permissions
3. **Zero Trust**: Verify everything, trust nothing
4. **Fail Secure**: Default to deny access
5. **Audit Everything**: Comprehensive logging

### Security Architecture

```mermaid
graph TB
    A[User] -->|HTTPS| B[Vercel Edge]
    B -->|Rate Limit| C[Next.js App]
    C -->|Auth Check| D[Clerk]
    C -->|Payment| E[Dodo Payments]
    C -->|Data| F[PostgreSQL]
    D -->|Webhook| C
    E -->|Webhook| C
    F -->|Encrypted| G[Data at Rest]
```

### Threat Model

**Threats Addressed**:
- ✅ Unauthorized access
- ✅ Payment fraud
- ✅ Data breaches
- ✅ DDoS attacks
- ✅ CSRF attacks
- ✅ XSS attacks
- ✅ SQL injection
- ✅ Man-in-the-middle attacks

## CORS Configuration

### Production CORS Settings

```typescript
// next.config.js - Production CORS Configuration
const securityHeaders = [
  {
    key: 'Access-Control-Allow-Origin',
    value: process.env.CORS_ORIGINS || 'https://lazygamedevs.com'
  },
  {
    key: 'Access-Control-Allow-Methods',
    value: 'GET, POST, PUT, DELETE, OPTIONS'
  },
  {
    key: 'Access-Control-Allow-Headers',
    value: 'Content-Type, Authorization, X-Requested-With'
  },
  {
    key: 'Access-Control-Allow-Credentials',
    value: 'true'
  },
  {
    key: 'Access-Control-Max-Age',
    value: '86400' // 24 hours
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: securityHeaders
      }
    ]
  }
}
```

### Environment-Specific CORS

```env
# Development
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"

# Staging
CORS_ORIGINS="https://staging.lazygamedevs.com,https://www.staging.lazygamedevs.com"

# Production
CORS_ORIGINS="https://lazygamedevs.com,https://www.lazygamedevs.com,https://accounts.lazygamedevs.com"
```

### CORS Middleware

```typescript
// lib/middleware/cors.ts
import { NextRequest, NextResponse } from 'next/server'

export function corsMiddleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || []

  // Check if origin is allowed
  if (origin && !allowedOrigins.includes(origin)) {
    return NextResponse.json(
      { error: 'CORS policy violation' },
      { status: 403 }
    )
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      }
    })
  }

  return null
}
```

**Security Checklist**:
- [ ] Only production domains in CORS_ORIGINS
- [ ] No wildcard (*) origins in production
- [ ] Credentials properly configured
- [ ] Preflight requests handled
- [ ] Methods restricted to necessary ones

## Rate Limiting

### Rate Limiting Strategy

```typescript
// lib/rate-limit.ts - Production Rate Limiting
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!
})

interface RateLimitConfig {
  interval: number  // Time window in seconds
  limit: number     // Maximum requests in window
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // API endpoints
  'api:default': { interval: 60, limit: 60 },        // 60 req/min
  'api:auth': { interval: 300, limit: 5 },           // 5 req/5min
  'api:payment': { interval: 3600, limit: 10 },      // 10 req/hour
  'api:webhook': { interval: 60, limit: 100 },       // 100 req/min

  // Public pages
  'page:default': { interval: 60, limit: 100 },      // 100 req/min
  'page:courses': { interval: 60, limit: 200 }       // 200 req/min
}

export async function rateLimit(
  identifier: string,
  endpoint: string = 'default'
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const config = rateLimitConfigs[`api:${endpoint}`] || rateLimitConfigs['api:default']
  const key = `ratelimit:${endpoint}:${identifier}`

  // Increment counter
  const count = await redis.incr(key)

  // Set expiry on first request
  if (count === 1) {
    await redis.expire(key, config.interval)
  }

  // Get TTL for reset time
  const ttl = await redis.ttl(key)
  const resetAt = new Date(Date.now() + ttl * 1000)

  return {
    allowed: count <= config.limit,
    remaining: Math.max(0, config.limit - count),
    resetAt
  }
}

// Middleware helper
export async function checkRateLimit(
  request: NextRequest,
  endpoint: string = 'default'
): Promise<NextResponse | null> {
  const ip = request.headers.get('x-forwarded-for') ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const result = await rateLimit(ip, endpoint)

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        resetAt: result.resetAt.toISOString()
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(rateLimitConfigs[`api:${endpoint}`]?.limit || 60),
          'X-RateLimit-Remaining': String(result.remaining),
          'X-RateLimit-Reset': result.resetAt.toISOString(),
          'Retry-After': String(Math.ceil((result.resetAt.getTime() - Date.now()) / 1000))
        }
      }
    )
  }

  return null
}
```

### API Route Protection

```typescript
// app/api/payments/checkout/route.ts
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Check rate limit
  const rateLimitResponse = await checkRateLimit(request, 'payment')
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Process payment
  // ...
}
```

### Rate Limiting Configuration

```env
# Rate Limiting Settings
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900              # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100        # Max requests per window

# Redis for rate limiting
UPSTASH_REDIS_REST_URL="https://your-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
```

**Security Checklist**:
- [ ] Rate limiting enabled in production
- [ ] Redis configured and connected
- [ ] Different limits for different endpoints
- [ ] Payment endpoints heavily restricted
- [ ] Rate limit headers returned
- [ ] Monitoring for rate limit violations

## Webhook Security

### Webhook Signature Verification

```typescript
// lib/webhooks/verify.ts - Webhook Security
import crypto from 'crypto'

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  try {
    // Generate expected signature
    const expectedSignature = crypto
      .createHmac(algorithm, secret)
      .update(payload, 'utf8')
      .digest('hex')

    // Extract signature from header (remove algorithm prefix if present)
    const receivedSignature = signature.replace(`${algorithm}=`, '')

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(receivedSignature, 'hex')
    )
  } catch (error) {
    console.error('Webhook signature verification error:', error)
    return false
  }
}

// Timestamp verification for replay attack prevention
export function verifyWebhookTimestamp(
  timestamp: string,
  maxAgeSeconds: number = 300 // 5 minutes
): boolean {
  const webhookTime = new Date(timestamp).getTime()
  const currentTime = Date.now()
  const age = (currentTime - webhookTime) / 1000

  return age >= 0 && age <= maxAgeSeconds
}
```

### Clerk Webhook Security

```typescript
// app/api/webhooks/clerk/route.ts
import { Webhook } from 'svix'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  // Verify webhook secret is configured
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    console.error('CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Get signature headers
  const headerPayload = headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')

  // Verify all headers present
  if (!svix_id || !svix_timestamp || !svix_signature) {
    console.error('Missing svix headers')
    return NextResponse.json(
      { error: 'Missing webhook headers' },
      { status: 400 }
    )
  }

  // Get raw body
  const payload = await request.text()

  // Create webhook verifier
  const wh = new Webhook(WEBHOOK_SECRET)

  let event
  try {
    // Verify signature
    event = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature
    })
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Process verified webhook
  await handleClerkWebhook(event)

  return NextResponse.json({ received: true })
}
```

### Dodo Webhook Security

```typescript
// app/api/webhooks/dodo/route.ts
import { verifyWebhookSignature, verifyWebhookTimestamp } from '@/lib/webhooks/verify'

export async function POST(request: NextRequest) {
  // Verify webhook secret configured
  const WEBHOOK_SECRET = process.env.DODO_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'Server configuration error' },
      { status: 500 }
    )
  }

  // Get signature header
  const signature = request.headers.get('x-dodo-signature') ||
                    request.headers.get('dodo-signature')

  if (!signature) {
    console.error('Missing signature header')
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  // Get timestamp header (if provided)
  const timestamp = request.headers.get('x-dodo-timestamp')

  // Get raw body
  const payload = await request.text()

  // Verify signature
  const isValidSignature = verifyWebhookSignature(
    payload,
    signature,
    WEBHOOK_SECRET,
    'sha256'
  )

  if (!isValidSignature) {
    console.error('Invalid webhook signature')
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Verify timestamp (if provided)
  if (timestamp && !verifyWebhookTimestamp(timestamp)) {
    console.error('Webhook timestamp too old')
    return NextResponse.json(
      { error: 'Request too old' },
      { status: 400 }
    )
  }

  // Parse and process webhook
  const event = JSON.parse(payload)
  await handleDodoWebhook(event)

  return NextResponse.json({ received: true })
}
```

**Security Checklist**:
- [ ] Webhook secrets configured
- [ ] Signature verification enabled
- [ ] Timestamp verification enabled
- [ ] Replay attack prevention
- [ ] Error logging comprehensive
- [ ] Webhook endpoints public in middleware
- [ ] Rate limiting on webhook endpoints

## API Security

### API Authentication

```typescript
// lib/middleware/auth.ts - API Authentication
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'

export async function requireAuth(request: NextRequest) {
  const { userId, sessionId } = auth()

  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  return { userId, sessionId }
}

export async function requireRole(
  request: NextRequest,
  requiredRole: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  // Get user role from database
  const user = await prisma.user.findUnique({
    where: { clerkUserId: authResult.userId },
    select: { role: true }
  })

  if (!user || user.role !== requiredRole) {
    return NextResponse.json(
      { error: 'Forbidden' },
      { status: 403 }
    )
  }

  return authResult
}
```

### Input Validation

```typescript
// lib/validation/api.ts - Input Validation
import { z } from 'zod'

// Payment validation
export const paymentSchema = z.object({
  courseId: z.string().uuid(),
  amount: z.number().positive().max(100000),
  currency: z.enum(['INR', 'USD']),
  userId: z.string().min(1)
})

// Course creation validation
export const courseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  price: z.number().positive().max(100000),
  thumbnail: z.string().url().optional(),
  instructorId: z.string().uuid()
})

// Generic validation middleware
export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>
): Promise<{ data: T } | NextResponse> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    )
  }
}
```

### SQL Injection Prevention

```typescript
// Always use Prisma parameterized queries
// ✅ SAFE - Parameterized query
const user = await prisma.user.findUnique({
  where: { email: userEmail }
})

// ❌ UNSAFE - Never use raw SQL with user input
// const users = await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userEmail}`

// ✅ SAFE - If raw SQL needed, use parameterized queries
const users = await prisma.$queryRaw`
  SELECT * FROM users
  WHERE email = ${userEmail}
  AND status = 'active'
`
```

**Security Checklist**:
- [ ] All API routes require authentication
- [ ] Role-based access control implemented
- [ ] Input validation on all endpoints
- [ ] Parameterized database queries
- [ ] No user input in raw SQL
- [ ] Error messages don't leak info

## Database Security

### Connection Security

```env
# Production database connection with SSL
DATABASE_URL="postgresql://user:pass@host:5432/db?sslmode=require&sslrootcert=/path/to/ca.pem"

# Connection pool settings
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000
DATABASE_MAX_LIFETIME=1800000  # 30 minutes
```

### Prisma Security Configuration

```typescript
// lib/prisma.ts - Secure Prisma Configuration
import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development'
      ? ['query', 'error', 'warn']
      : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })
}

// Prevent connection leaks
const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
```

### Row-Level Security

```typescript
// Implement row-level security in queries
async function getUserCourses(userId: string) {
  // Only return courses owned by user
  return await prisma.course.findMany({
    where: {
      instructorId: userId,
      // Additional security checks
      deleted: false,
      published: true
    },
    // Never return sensitive fields
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      // password fields excluded
      // apiKeys excluded
    }
  })
}
```

**Security Checklist**:
- [ ] SSL/TLS enabled for database
- [ ] Connection pool configured
- [ ] Row-level security implemented
- [ ] Sensitive fields excluded from queries
- [ ] Database credentials secured
- [ ] Regular backups configured

## Environment Security

### Secret Management

```bash
# Generate secure secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET
openssl rand -hex 32     # For webhook secrets
openssl rand -base64 32  # For ENCRYPTION_KEY

# Verify no secrets in git history
git log -p | grep -E '(API_KEY|SECRET|PASSWORD)' || echo "Clean"

# Check .gitignore
cat .gitignore | grep -E '\.env' || echo "Add .env* to .gitignore"
```

### Environment Variable Validation

```typescript
// lib/config/env.ts - Environment Validation
import { z } from 'zod'

const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']),
  APP_URL: z.string().url(),

  // Database
  DATABASE_URL: z.string().min(1),

  // Authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  CLERK_SECRET_KEY: z.string().startsWith('sk_'),
  CLERK_WEBHOOK_SECRET: z.string().startsWith('whsec_'),

  // Payments
  DODO_API_KEY: z.string().min(1),
  DODO_WEBHOOK_SECRET: z.string().min(1),
  DODO_ENVIRONMENT: z.enum(['test', 'live']),

  // Security
  ENCRYPTION_KEY: z.string().min(32),
  CORS_ORIGINS: z.string().min(1)
})

// Validate on application startup
try {
  envSchema.parse(process.env)
  console.log('✅ Environment variables validated')
} catch (error) {
  console.error('❌ Environment validation failed:', error)
  process.exit(1)
}
```

**Security Checklist**:
- [ ] All secrets in environment variables
- [ ] No secrets in version control
- [ ] .env* files in .gitignore
- [ ] Environment validation on startup
- [ ] Production uses live credentials
- [ ] Secret rotation procedure documented

## SSL/TLS Configuration

### Vercel SSL Configuration

Vercel automatically provides SSL certificates. No additional configuration needed.

**Verification**:
```bash
# Check SSL certificate
openssl s_client -connect lazygamedevs.com:443 -servername lazygamedevs.com

# Verify SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=lazygamedevs.com
```

### Force HTTPS

```typescript
// middleware.ts - Force HTTPS
export function middleware(request: NextRequest) {
  // Check if request is HTTPS
  const protocol = request.headers.get('x-forwarded-proto')

  if (protocol !== 'https' && process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }

  return NextResponse.next()
}
```

**Security Checklist**:
- [ ] SSL certificate valid
- [ ] HTTPS enforced
- [ ] HTTP redirects to HTTPS
- [ ] HSTS header configured
- [ ] SSL Labs grade A or A+

## Security Headers

### Comprehensive Security Headers

```typescript
// next.config.js - Security Headers
const securityHeaders = [
  // Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  // Prevent MIME type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  // Enable XSS protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  // Referrer policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  // Permissions policy
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()'
  },
  // Strict Transport Security
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains'
  },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.clerk.com https://*.dodopayments.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://api.clerk.com https://api.dodopayments.com;
      frame-src 'self' https://checkout.dodopayments.com;
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders
      }
    ]
  }
}
```

**Security Checklist**:
- [ ] All security headers configured
- [ ] CSP properly configured
- [ ] External sources whitelisted
- [ ] HSTS enabled with long max-age
- [ ] No unsafe-eval except where necessary
- [ ] Headers validated with security tools

## Monitoring and Alerting

### Security Event Logging

```typescript
// lib/security/audit-log.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'UNAUTHORIZED_ACCESS' | 'PAYMENT_FRAUD' | 'RATE_LIMIT' | 'WEBHOOK_FAILURE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  userId?: string
  ipAddress?: string
  details: Record<string, any>
}

export async function logSecurityEvent(event: SecurityEvent) {
  // Log to database
  await prisma.securityEvent.create({
    data: {
      type: event.type,
      severity: event.severity,
      userId: event.userId,
      ipAddress: event.ipAddress,
      details: event.details,
      timestamp: new Date()
    }
  })

  // Send critical alerts
  if (event.severity === 'CRITICAL') {
    await sendSecurityAlert(event)
  }

  // Log to monitoring service
  console.error('[SECURITY]', {
    type: event.type,
    severity: event.severity,
    details: event.details
  })
}

async function sendSecurityAlert(event: SecurityEvent) {
  // Send to Slack, email, or alerting service
  // Implementation depends on your monitoring setup
}
```

### Real-time Monitoring

```typescript
// app/api/security/status/route.ts
export async function GET() {
  const securityStatus = {
    timestamp: new Date().toISOString(),
    metrics: {
      failedLogins: await getFailedLoginCount(5), // Last 5 minutes
      rateLimitViolations: await getRateLimitViolations(5),
      webhookFailures: await getWebhookFailures(60), // Last hour
      suspiciousActivity: await getSuspiciousActivity(60)
    },
    alerts: await getActiveSecurityAlerts()
  }

  return Response.json(securityStatus)
}
```

**Security Checklist**:
- [ ] Security event logging enabled
- [ ] Critical alerts configured
- [ ] Monitoring dashboard setup
- [ ] Alert thresholds configured
- [ ] Incident response plan documented
- [ ] Regular security reviews scheduled

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0
**Maintained by**: LazyGameDevs Team

## Emergency Contacts

**Security Incidents**:
- Security Team: security@lazygamedevs.com
- Tech Lead: [Your Contact]
- Emergency: [Emergency Contact]

**Escalation Path**:
1. Security Team (immediate)
2. CTO (within 30 minutes)
3. CEO (within 1 hour for critical incidents)
