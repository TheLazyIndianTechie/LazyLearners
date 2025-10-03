import { NextRequest } from 'next/server'
import { GET, HEAD } from '@/app/api/health/route'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    isHealthy: jest.fn(),
    getStats: jest.fn(),
  },
}))

jest.mock('@/lib/config/validate', () => ({
  getEnvironmentHealth: jest.fn(),
}))

jest.mock('@/lib/config/env', () => ({
  env: {
    APP_VERSION: '1.0.0',
    NODE_ENV: 'test',
    ENABLE_CACHING: true,
    ENABLE_PAYMENTS: true,
    ENABLE_EMAIL: false,
    ENABLE_ANALYTICS: true,
    ENABLE_COLLABORATION: false,
    ENABLE_WEBSOCKETS: false,
  },
}))

import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'
import { getEnvironmentHealth } from '@/lib/config/validate'

describe('Health API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/health', () => {
    it('should return healthy status when all checks pass', async () => {
      // Mock successful checks
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({
        memory: '1MB',
        connectedClients: 5,
        totalCommandsProcessed: '1000',
        keyspace: {},
      })
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: {
          services: {
            clerk: true,
            database: true,
          },
        },
      })

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
      expect(data.checks.database.status).toBe('pass')
      expect(data.checks.redis.status).toBe('pass')
      expect(data.checks.memory.status).toBe('pass')
      expect(data.version).toBe('1.0.0')
      expect(data.environment).toBe('test')
      expect(data.configuration.features.caching).toBe(true)
      expect(data.configuration.features.payments).toBe(true)
    })

    it('should return unhealthy status when database check fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database connection failed'))
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: { services: {} },
      })

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.checks.database.status).toBe('fail')
      expect(data.checks.database.error).toContain('Database connection failed')
    })

    it('should return unhealthy status when redis check fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(false)
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: { services: {} },
      })

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.checks.redis.status).toBe('fail')
    })

    it('should include correlation ID from request header', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: { services: {} },
      })

      const correlationId = 'test-correlation-id'
      const request = new NextRequest('http://localhost:3000/api/health', {
        headers: {
          'x-correlation-id': correlationId,
        },
      })
      const response = await GET(request)
      const data = await response.json()

      expect(data.correlationId).toBe(correlationId)
      expect(response.headers.get('X-Correlation-ID')).toBe(correlationId)
    })

    it('should include cache control headers', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: { services: {} },
      })

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)

      expect(response.headers.get('Cache-Control')).toBe('no-cache, no-store, must-revalidate')
      expect(response.headers.get('X-Health-Check')).toBe('true')
    })

    it('should include uptime and timestamp', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})
      ;(getEnvironmentHealth as jest.Mock).mockResolvedValue({
        checks: {
          environment: {
            status: 'pass',
          },
        },
        summary: { services: {} },
      })

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(typeof data.uptime).toBe('number')
      expect(data.uptime).toBeGreaterThan(0)
      expect(data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should handle complete health check system failure', async () => {
      ;(getEnvironmentHealth as jest.Mock).mockRejectedValue(new Error('System failure'))

      const request = new NextRequest('http://localhost:3000/api/health')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.status).toBe('unhealthy')
      expect(data.checks.database.status).toBe('fail')
      expect(data.checks.database.error).toBe('Health check system failure')
    })
  })

  describe('HEAD /api/health', () => {
    it('should return 200 when all checks pass', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'HEAD',
      })
      const response = await HEAD(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('X-Health-Status')).toBe('healthy')
    })

    it('should return 503 when database check fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Database error'))
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'HEAD',
      })
      const response = await HEAD(request)

      expect(response.status).toBe(503)
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy')
    })

    it('should return 503 when redis check fails', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(false)

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'HEAD',
      })
      const response = await HEAD(request)

      expect(response.status).toBe(503)
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy')
    })

    it('should include correlation ID from request header', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockResolvedValue([{ '?column?': 1 }])
      ;(redis.isHealthy as jest.Mock).mockResolvedValue(true)
      ;(redis.getStats as jest.Mock).mockResolvedValue({})

      const correlationId = 'test-head-correlation-id'
      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'HEAD',
        headers: {
          'x-correlation-id': correlationId,
        },
      })
      const response = await HEAD(request)

      expect(response.headers.get('X-Correlation-ID')).toBe(correlationId)
    })

    it('should handle complete failure gracefully', async () => {
      ;(prisma.$queryRaw as jest.Mock).mockRejectedValue(new Error('Complete failure'))
      ;(redis.isHealthy as jest.Mock).mockRejectedValue(new Error('Complete failure'))

      const request = new NextRequest('http://localhost:3000/api/health', {
        method: 'HEAD',
      })
      const response = await HEAD(request)

      expect(response.status).toBe(503)
      expect(response.headers.get('X-Health-Status')).toBe('unhealthy')
    })
  })
})
