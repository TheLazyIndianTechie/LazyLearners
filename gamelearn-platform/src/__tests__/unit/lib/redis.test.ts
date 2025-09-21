/**
 * Unit tests for Redis service
 * Tests both MemoryStore and RedisService classes
 */

import { jest } from '@jest/globals'

// Mock the dependencies
jest.mock('@/lib/logger', () => ({
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}))

// Set test environment
process.env.NODE_ENV = 'test'

describe('Redis Service', () => {
  // We need to dynamically import to ensure mocks are in place
  let redis: any
  let RedisService: any
  let MemoryStore: any
  let cached: any
  let invalidateCache: any

  beforeAll(async () => {
    // Clear module cache to ensure fresh import
    jest.resetModules()

    // Import the module under test
    const redisModule = await import('@/lib/redis')
    redis = redisModule.redis
    cached = redisModule.cached
    invalidateCache = redisModule.invalidateCache
  })

  beforeEach(async () => {
    // Clear the store before each test
    await redis.disconnect()
    await redis.connect()
  })

  describe('MemoryStore', () => {
    describe('basic operations', () => {
      test('should set and get a value', async () => {
        await redis.set('test-key', 'test-value')
        const value = await redis.get('test-key')
        expect(value).toBe('test-value')
      })

      test('should return null for non-existent key', async () => {
        const value = await redis.get('non-existent-key')
        expect(value).toBe(null)
      })

      test('should delete a key', async () => {
        await redis.set('test-key', 'test-value')
        await redis.del('test-key')
        const value = await redis.get('test-key')
        expect(value).toBe(null)
      })

      test('should check if key exists', async () => {
        await redis.set('test-key', 'test-value')
        const exists = await redis.exists('test-key')
        expect(exists).toBe(true)

        const notExists = await redis.exists('non-existent-key')
        expect(notExists).toBe(false)
      })
    })

    describe('TTL (Time To Live)', () => {
      test('should expire keys after TTL', async () => {
        await redis.set('expiring-key', 'value', 1) // 1 second TTL

        // Value should be available immediately
        let value = await redis.get('expiring-key')
        expect(value).toBe('value')

        // Wait for expiration
        await new Promise(resolve => setTimeout(resolve, 1100))

        // Value should be expired
        value = await redis.get('expiring-key')
        expect(value).toBe(null)
      })

      test('should not expire keys without TTL', async () => {
        await redis.set('persistent-key', 'value')

        // Wait longer than any reasonable TTL
        await new Promise(resolve => setTimeout(resolve, 100))

        const value = await redis.get('persistent-key')
        expect(value).toBe('value')
      })
    })

    describe('counter operations', () => {
      test('should increment a counter', async () => {
        const result1 = await redis.incrementKey('counter', 60)
        expect(result1).toBe(1)

        const result2 = await redis.incrementKey('counter', 60)
        expect(result2).toBe(2)
      })

      test('should get rate limit info', async () => {
        await redis.incrementKey('rate-limit', 60)
        await redis.incrementKey('rate-limit', 60)

        const rateLimit = await redis.getRateLimit('rate-limit')
        expect(rateLimit.count).toBe(2)
        expect(typeof rateLimit.ttl).toBe('number')
      })
    })

    describe('list operations', () => {
      test('should add items to list', async () => {
        await redis.addToList('test-list', 'item1')
        await redis.addToList('test-list', 'item2')

        const items = await redis.getListRange('test-list')
        expect(items).toEqual(['item2', 'item1']) // LPUSH adds to front
      })

      test('should get list range', async () => {
        await redis.addToList('test-list', 'item1')
        await redis.addToList('test-list', 'item2')
        await redis.addToList('test-list', 'item3')

        const items = await redis.getListRange('test-list', 0, 1)
        expect(items).toEqual(['item3', 'item2'])
      })

      test('should handle empty list', async () => {
        const items = await redis.getListRange('empty-list')
        expect(items).toEqual([])
      })
    })

    describe('hash operations', () => {
      test('should set and get hash fields', async () => {
        await redis.setHash('user:123', 'name', 'John Doe')
        await redis.setHash('user:123', 'email', 'john@example.com')

        const name = await redis.getHash('user:123', 'name')
        const email = await redis.getHash('user:123', 'email')

        expect(name).toBe('John Doe')
        expect(email).toBe('john@example.com')
      })

      test('should get all hash fields', async () => {
        await redis.setHash('user:456', 'name', 'Jane Doe')
        await redis.setHash('user:456', 'email', 'jane@example.com')
        await redis.setHash('user:456', 'role', 'admin')

        const userData = await redis.getAllHash('user:456')
        expect(userData).toEqual({
          name: 'Jane Doe',
          email: 'jane@example.com',
          role: 'admin',
        })
      })

      test('should return null for non-existent hash field', async () => {
        const value = await redis.getHash('user:999', 'name')
        expect(value).toBe(null)
      })

      test('should return empty object for non-existent hash', async () => {
        const userData = await redis.getAllHash('user:999')
        expect(userData).toEqual({})
      })
    })
  })

  describe('RedisService', () => {
    describe('connection management', () => {
      test('should connect successfully', async () => {
        await redis.connect()
        const isHealthy = await redis.isHealthy()
        expect(isHealthy).toBe(true)
      })

      test('should disconnect and clear data', async () => {
        await redis.set('test-key', 'test-value')
        await redis.disconnect()

        const isHealthy = await redis.isHealthy()
        expect(isHealthy).toBe(false)
      })
    })

    describe('session management', () => {
      test('should set and get session data', async () => {
        const sessionData = {
          userId: 'user123',
          role: 'instructor',
          loginTime: Date.now(),
        }

        await redis.setSession('session123', sessionData, 3600)
        const retrievedData = await redis.getSession('session123')

        expect(retrievedData).toEqual(sessionData)
      })

      test('should delete session', async () => {
        await redis.setSession('session456', { userId: 'user456' })
        await redis.deleteSession('session456')

        const data = await redis.getSession('session456')
        expect(data).toBe(null)
      })

      test('should refresh session TTL', async () => {
        await redis.setSession('session789', { userId: 'user789' }, 1)

        // Refresh before expiration
        const refreshed = await redis.refreshSession('session789', 3600)
        expect(refreshed).toBe(true)

        // Wait longer than original TTL
        await new Promise(resolve => setTimeout(resolve, 1100))

        // Session should still exist due to refresh
        const data = await redis.getSession('session789')
        expect(data).toEqual({ userId: 'user789' })
      })

      test('should fail to refresh non-existent session', async () => {
        const refreshed = await redis.refreshSession('non-existent-session', 3600)
        expect(refreshed).toBe(false)
      })
    })

    describe('statistics', () => {
      test('should return stats', async () => {
        const stats = await redis.getStats()

        expect(stats).toHaveProperty('memory')
        expect(stats).toHaveProperty('connectedClients')
        expect(stats).toHaveProperty('totalCommandsProcessed')
        expect(stats).toHaveProperty('keyspace')

        expect(typeof stats.memory).toBe('string')
        expect(typeof stats.connectedClients).toBe('number')
      })
    })

    describe('complex data types', () => {
      test('should handle JSON serialization/deserialization', async () => {
        const complexData = {
          user: {
            id: '123',
            profile: {
              name: 'John Doe',
              preferences: ['dark-mode', 'notifications'],
            },
          },
          metadata: {
            lastLogin: new Date().toISOString(),
            loginCount: 42,
          },
        }

        await redis.set('complex-data', complexData)
        const retrievedData = await redis.get('complex-data')

        expect(retrievedData).toEqual(complexData)
      })

      test('should handle arrays', async () => {
        const arrayData = [1, 2, 3, { nested: 'object' }, 'string']

        await redis.set('array-data', arrayData)
        const retrievedData = await redis.get('array-data')

        expect(retrievedData).toEqual(arrayData)
      })
    })
  })

  describe('cached function', () => {
    test('should cache function results', async () => {
      const mockFn = jest.fn().mockResolvedValue('expensive-result')

      // First call should execute function
      const result1 = await cached('cache-key', mockFn, 60)
      expect(result1).toBe('expensive-result')
      expect(mockFn).toHaveBeenCalledTimes(1)

      // Second call should return cached result
      const result2 = await cached('cache-key', mockFn, 60)
      expect(result2).toBe('expensive-result')
      expect(mockFn).toHaveBeenCalledTimes(1) // Not called again
    })

    test('should refetch on cache miss', async () => {
      const mockFn = jest.fn()
        .mockResolvedValueOnce('result1')
        .mockResolvedValueOnce('result2')

      const result1 = await cached('cache-key-2', mockFn, 1) // 1 second TTL
      expect(result1).toBe('result1')

      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 1100))

      const result2 = await cached('cache-key-2', mockFn, 1)
      expect(result2).toBe('result2')
      expect(mockFn).toHaveBeenCalledTimes(2)
    })

    test('should fallback to function on cache error', async () => {
      const mockFn = jest.fn().mockResolvedValue('fallback-result')

      // Disconnect to simulate cache error
      await redis.disconnect()

      const result = await cached('error-key', mockFn, 60)
      expect(result).toBe('fallback-result')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('error handling', () => {
    test('should handle errors gracefully in cache operations', async () => {
      // These shouldn't throw errors even with disconnected Redis
      await redis.disconnect()

      await expect(redis.set('key', 'value')).resolves.not.toThrow()
      await expect(redis.get('key')).resolves.not.toThrow()
      await expect(redis.del('key')).resolves.not.toThrow()
    })

    test('should handle invalidateCache errors', async () => {
      await redis.disconnect()

      // Should not throw error
      await expect(invalidateCache('pattern:*')).resolves.not.toThrow()
    })
  })

  describe('memory cleanup', () => {
    test('should clean up expired keys on access', async () => {
      await redis.set('expiring-key-1', 'value1', 1)
      await redis.set('expiring-key-2', 'value2', 1)

      // Keys should exist initially
      expect(await redis.exists('expiring-key-1')).toBe(true)
      expect(await redis.exists('expiring-key-2')).toBe(true)

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100))

      // Accessing expired key should clean it up
      expect(await redis.get('expiring-key-1')).toBe(null)
      expect(await redis.exists('expiring-key-1')).toBe(false)
    })

    test('should clear all data on disconnect', async () => {
      await redis.set('key1', 'value1')
      await redis.set('key2', 'value2')
      await redis.setHash('hash1', 'field1', 'value1')
      await redis.addToList('list1', 'item1')

      await redis.disconnect()
      await redis.connect()

      // All data should be cleared
      expect(await redis.get('key1')).toBe(null)
      expect(await redis.get('key2')).toBe(null)
      expect(await redis.getHash('hash1', 'field1')).toBe(null)
      expect(await redis.getListRange('list1')).toEqual([])
    })
  })

  describe('edge cases', () => {
    test('should handle null and undefined values', async () => {
      await redis.set('null-key', null)
      await redis.set('undefined-key', undefined)

      expect(await redis.get('null-key')).toBe(null)
      expect(await redis.get('undefined-key')).toBe(undefined)
    })

    test('should handle empty strings and objects', async () => {
      await redis.set('empty-string', '')
      await redis.set('empty-object', {})
      await redis.set('empty-array', [])

      expect(await redis.get('empty-string')).toBe('')
      expect(await redis.get('empty-object')).toEqual({})
      expect(await redis.get('empty-array')).toEqual([])
    })

    test('should handle large numbers', async () => {
      const largeNumber = Number.MAX_SAFE_INTEGER
      await redis.set('large-number', largeNumber)

      expect(await redis.get('large-number')).toBe(largeNumber)
    })

    test('should handle boolean values', async () => {
      await redis.set('true-value', true)
      await redis.set('false-value', false)

      expect(await redis.get('true-value')).toBe(true)
      expect(await redis.get('false-value')).toBe(false)
    })
  })
})