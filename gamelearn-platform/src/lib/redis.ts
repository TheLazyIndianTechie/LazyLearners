import Redis from 'ioredis'

const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Redis configuration
const getRedisConfig = () => {
  // If REDIS_URL is provided, use it
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL, {
      connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
      commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }

  // Use individual Redis settings
  return new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0'),
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000'),
    commandTimeout: parseInt(process.env.REDIS_COMMAND_TIMEOUT || '5000'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
}

// Fallback in-memory store for development/testing when Redis is unavailable
class MemoryStore {
  private store = new Map<string, { value: any; expiry?: number }>()
  private listStore = new Map<string, any[]>()
  private hashStore = new Map<string, Map<string, any>>()

  set(key: string, value: any, ttlSeconds?: number) {
    const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined
    this.store.set(key, { value, expiry })
  }

  get(key: string): any | null {
    const item = this.store.get(key)
    if (!item) return null

    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  del(key: string) {
    this.store.delete(key)
  }

  exists(key: string): boolean {
    return this.store.has(key)
  }

  incr(key: string): number {
    const current = this.get(key) || 0
    const newValue = (typeof current === 'number' ? current : 0) + 1
    this.set(key, newValue)
    return newValue
  }

  lPush(key: string, value: any) {
    if (!this.listStore.has(key)) {
      this.listStore.set(key, [])
    }
    this.listStore.get(key)!.unshift(value)
  }

  lRange(key: string, start: number, end: number): any[] {
    const list = this.listStore.get(key) || []
    if (end === -1) end = list.length - 1
    return list.slice(start, end + 1)
  }

  hSet(key: string, field: string, value: any) {
    if (!this.hashStore.has(key)) {
      this.hashStore.set(key, new Map())
    }
    this.hashStore.get(key)!.set(field, value)
  }

  hGet(key: string, field: string): any | null {
    return this.hashStore.get(key)?.get(field) || null
  }

  hGetAll(key: string): Record<string, any> {
    const hash = this.hashStore.get(key)
    if (!hash) return {}

    const result: Record<string, any> = {}
    for (const [field, value] of hash) {
      result[field] = value
    }
    return result
  }

  clear() {
    this.store.clear()
    this.listStore.clear()
    this.hashStore.clear()
  }
}

const memoryStore = new MemoryStore()
let redisClient: Redis | null = null
let useMemoryFallback = false

// Initialize Redis connection
try {
  redisClient = getRedisConfig()
  console.log('Redis: Initialized with production client')
} catch (error) {
  console.warn('Redis: Failed to initialize, using memory fallback:', error)
  useMemoryFallback = true
}

class RedisService {
  private isConnected = false

  constructor() {
    this.connect()
  }

  async connect(): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      console.log('Redis: Using memory fallback')
      this.isConnected = true
      return
    }

    try {
      await redisClient.connect()
      this.isConnected = true
      console.log('Redis: Connected successfully')

      // Set up error handlers
      redisClient.on('error', (error) => {
        console.error('Redis connection error:', error)
        useMemoryFallback = true
        this.isConnected = false
      })

      redisClient.on('connect', () => {
        console.log('Redis: Reconnected')
        useMemoryFallback = false
        this.isConnected = true
      })
    } catch (error) {
      console.warn('Redis: Connection failed, using memory fallback:', error)
      useMemoryFallback = true
      this.isConnected = true // Still "connected" via memory
    }
  }

  async disconnect(): Promise<void> {
    if (redisClient && !useMemoryFallback) {
      try {
        await redisClient.disconnect()
      } catch (error) {
        console.error('Redis: Error during disconnect:', error)
      }
    }
    memoryStore.clear()
    this.isConnected = false
  }

  async isHealthy(): Promise<boolean> {
    if (useMemoryFallback) {
      return true // Memory fallback is always "healthy"
    }

    if (!redisClient || !this.isConnected) {
      return false
    }

    try {
      await redisClient.ping()
      return true
    } catch (error) {
      console.warn('Redis health check failed:', error)
      useMemoryFallback = true
      return true // Switch to memory fallback
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds = 3600): Promise<void> {
    const key = `session:${sessionId}`

    if (useMemoryFallback || !redisClient) {
      memoryStore.set(key, data, ttlSeconds)
      return
    }

    try {
      const serializedData = JSON.stringify(data)
      await redisClient.setex(key, ttlSeconds, serializedData)
    } catch (error) {
      console.warn('Redis setSession failed, using memory fallback:', error)
      memoryStore.set(key, data, ttlSeconds)
    }
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`

    if (useMemoryFallback || !redisClient) {
      return memoryStore.get(key)
    }

    try {
      const data = await redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Redis getSession failed, using memory fallback:', error)
      return memoryStore.get(key)
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`

    if (useMemoryFallback || !redisClient) {
      memoryStore.del(key)
      return
    }

    try {
      await redisClient.del(key)
    } catch (error) {
      console.warn('Redis deleteSession failed, using memory fallback:', error)
      memoryStore.del(key)
    }
  }

  async refreshSession(sessionId: string, ttlSeconds = 3600): Promise<boolean> {
    const key = `session:${sessionId}`

    if (useMemoryFallback || !redisClient) {
      const data = memoryStore.get(key)
      if (data) {
        memoryStore.set(key, data, ttlSeconds)
        return true
      }
      return false
    }

    try {
      const result = await redisClient.expire(key, ttlSeconds)
      return result === 1
    } catch (error) {
      console.warn('Redis refreshSession failed, using memory fallback:', error)
      const data = memoryStore.get(key)
      if (data) {
        memoryStore.set(key, data, ttlSeconds)
        return true
      }
      return false
    }
  }

  // Caching
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryStore.set(key, value, ttlSeconds)
      return
    }

    try {
      const serializedValue = JSON.stringify(value)
      if (ttlSeconds) {
        await redisClient.setex(key, ttlSeconds, serializedValue)
      } else {
        await redisClient.set(key, serializedValue)
      }
    } catch (error) {
      console.warn('Redis set failed, using memory fallback:', error)
      memoryStore.set(key, value, ttlSeconds)
    }
  }

  async get(key: string): Promise<any | null> {
    if (useMemoryFallback || !redisClient) {
      return memoryStore.get(key)
    }

    try {
      const data = await redisClient.get(key)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Redis get failed, using memory fallback:', error)
      return memoryStore.get(key)
    }
  }

  async del(key: string): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryStore.del(key)
      return
    }

    try {
      await redisClient.del(key)
    } catch (error) {
      console.warn('Redis del failed, using memory fallback:', error)
      memoryStore.del(key)
    }
  }

  async exists(key: string): Promise<boolean> {
    if (useMemoryFallback || !redisClient) {
      return memoryStore.exists(key)
    }

    try {
      const result = await redisClient.exists(key)
      return result === 1
    } catch (error) {
      console.warn('Redis exists failed, using memory fallback:', error)
      return memoryStore.exists(key)
    }
  }

  // Rate limiting
  async incrementKey(key: string, ttlSeconds: number): Promise<number> {
    if (useMemoryFallback || !redisClient) {
      const result = memoryStore.incr(key)
      memoryStore.set(key, result, ttlSeconds)
      return result
    }

    try {
      const pipeline = redisClient.pipeline()
      pipeline.incr(key)
      pipeline.expire(key, ttlSeconds)
      const results = await pipeline.exec()
      return results?.[0]?.[1] as number || 1
    } catch (error) {
      console.warn('Redis incrementKey failed, using memory fallback:', error)
      const result = memoryStore.incr(key)
      memoryStore.set(key, result, ttlSeconds)
      return result
    }
  }

  async getRateLimit(key: string): Promise<{ count: number; ttl: number }> {
    if (useMemoryFallback || !redisClient) {
      const data = memoryStore.get(key)
      return {
        count: typeof data === 'number' ? data : 0,
        ttl: 3600 // Default TTL for memory store
      }
    }

    try {
      const pipeline = redisClient.pipeline()
      pipeline.get(key)
      pipeline.ttl(key)
      const results = await pipeline.exec()

      const count = parseInt(results?.[0]?.[1] as string || '0')
      const ttl = results?.[1]?.[1] as number || -1

      return { count, ttl }
    } catch (error) {
      console.warn('Redis getRateLimit failed, using memory fallback:', error)
      const data = memoryStore.get(key)
      return {
        count: typeof data === 'number' ? data : 0,
        ttl: 3600
      }
    }
  }

  // List operations for collaboration
  async addToList(key: string, value: any): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryStore.lPush(key, value)
      return
    }

    try {
      const serializedValue = JSON.stringify(value)
      await redisClient.lpush(key, serializedValue)
    } catch (error) {
      console.warn('Redis addToList failed, using memory fallback:', error)
      memoryStore.lPush(key, value)
    }
  }

  async getListRange(key: string, start = 0, end = -1): Promise<any[]> {
    if (useMemoryFallback || !redisClient) {
      return memoryStore.lRange(key, start, end)
    }

    try {
      const results = await redisClient.lrange(key, start, end)
      return results.map(item => JSON.parse(item))
    } catch (error) {
      console.warn('Redis getListRange failed, using memory fallback:', error)
      return memoryStore.lRange(key, start, end)
    }
  }

  async removeFromList(key: string, value: any): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      // Simple implementation for memory store
      console.log('removeFromList called for:', key, value)
      return
    }

    try {
      const serializedValue = JSON.stringify(value)
      await redisClient.lrem(key, 0, serializedValue)
    } catch (error) {
      console.warn('Redis removeFromList failed:', error)
    }
  }

  // Hash operations for user data
  async setHash(key: string, field: string, value: any): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryStore.hSet(key, field, value)
      return
    }

    try {
      const serializedValue = JSON.stringify(value)
      await redisClient.hset(key, field, serializedValue)
    } catch (error) {
      console.warn('Redis setHash failed, using memory fallback:', error)
      memoryStore.hSet(key, field, value)
    }
  }

  async getHash(key: string, field: string): Promise<any | null> {
    if (useMemoryFallback || !redisClient) {
      return memoryStore.hGet(key, field)
    }

    try {
      const data = await redisClient.hget(key, field)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.warn('Redis getHash failed, using memory fallback:', error)
      return memoryStore.hGet(key, field)
    }
  }

  async getAllHash(key: string): Promise<Record<string, any>> {
    if (useMemoryFallback || !redisClient) {
      return memoryStore.hGetAll(key)
    }

    try {
      const data = await redisClient.hgetall(key)
      const result: Record<string, any> = {}
      for (const [field, value] of Object.entries(data)) {
        result[field] = JSON.parse(value)
      }
      return result
    } catch (error) {
      console.warn('Redis getAllHash failed, using memory fallback:', error)
      return memoryStore.hGetAll(key)
    }
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      console.log('Publish to channel (memory fallback):', channel, message)
      return
    }

    try {
      const serializedMessage = JSON.stringify(message)
      await redisClient.publish(channel, serializedMessage)
    } catch (error) {
      console.warn('Redis publish failed:', error)
    }
  }

  // Cleanup and maintenance
  async clearPattern(pattern: string): Promise<number> {
    if (useMemoryFallback || !redisClient) {
      console.log('Clear pattern (memory fallback):', pattern)
      return 0
    }

    try {
      const keys = await redisClient.keys(pattern)
      if (keys.length > 0) {
        await redisClient.del(...keys)
        return keys.length
      }
      return 0
    } catch (error) {
      console.warn('Redis clearPattern failed:', error)
      return 0
    }
  }

  // Statistics
  async getStats(): Promise<{
    memory: string
    connectedClients: number
    totalCommandsProcessed: string
    keyspace: Record<string, any>
    usingFallback: boolean
  }> {
    if (useMemoryFallback || !redisClient) {
      return {
        memory: '1MB (Memory Fallback)',
        connectedClients: 1,
        totalCommandsProcessed: '0',
        keyspace: { keys: 0, expires: 0 },
        usingFallback: true
      }
    }

    try {
      const info = await redisClient.info('memory')
      const stats = await redisClient.info('stats')
      const keyspace = await redisClient.info('keyspace')

      return {
        memory: this.extractInfoValue(info, 'used_memory_human') || '0MB',
        connectedClients: parseInt(this.extractInfoValue(stats, 'connected_clients') || '0'),
        totalCommandsProcessed: this.extractInfoValue(stats, 'total_commands_processed') || '0',
        keyspace: this.parseKeyspaceInfo(keyspace),
        usingFallback: false
      }
    } catch (error) {
      console.warn('Redis getStats failed:', error)
      return {
        memory: '0MB',
        connectedClients: 0,
        totalCommandsProcessed: '0',
        keyspace: { keys: 0, expires: 0 },
        usingFallback: true
      }
    }
  }

  private extractInfoValue(info: string, key: string): string | null {
    const lines = info.split('\r\n')
    for (const line of lines) {
      if (line.startsWith(key + ':')) {
        return line.split(':')[1]
      }
    }
    return null
  }

  private parseKeyspaceInfo(keyspace: string): Record<string, any> {
    const result: Record<string, any> = { keys: 0, expires: 0 }
    const lines = keyspace.split('\r\n')
    for (const line of lines) {
      if (line.startsWith('db')) {
        const match = line.match(/keys=(\d+),expires=(\d+)/)
        if (match) {
          result.keys += parseInt(match[1])
          result.expires += parseInt(match[2])
        }
      }
    }
    return result
  }

  // Simplified methods for remaining operations
  async setAdd(key: string, value: any): Promise<void> {
    if (useMemoryFallback || !redisClient) {
      memoryStore.lPush(key, value)
      return
    }

    try {
      const serializedValue = JSON.stringify(value)
      await redisClient.sadd(key, serializedValue)
    } catch (error) {
      console.warn('Redis setAdd failed, using memory fallback:', error)
      memoryStore.lPush(key, value)
    }
  }
}

// Create and export a singleton instance
export const redis = new RedisService()

// Helper functions for common patterns
export async function cached<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlSeconds = 300
): Promise<T> {
  try {
    // Try to get from cache first
    const cached = await redis.get(key)
    if (cached !== null) {
      return cached
    }

    // If not in cache, fetch data
    const data = await fetchFn()

    // Store in cache
    await redis.set(key, data, ttlSeconds)

    return data
  } catch (error) {
    console.error(`Cache error for key ${key}:`, error)
    // If Redis fails, fallback to direct fetch
    return await fetchFn()
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    await redis.clearPattern(pattern)
  } catch (error) {
    console.error(`Cache invalidation error for pattern ${pattern}:`, error)
  }
}