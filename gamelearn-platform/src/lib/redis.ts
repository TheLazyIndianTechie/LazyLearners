import { createClient, RedisClientType } from 'redis'
import { redisConfig as envRedisConfig, isTest } from '@/lib/config/env'

// Redis client configuration using environment config
const redisConfig = {
  url: envRedisConfig.url || (envRedisConfig.host ?
    `redis://${envRedisConfig.host}:${envRedisConfig.port || 6379}` :
    'redis://localhost:6379'
  ),
  password: envRedisConfig.password,
  database: envRedisConfig.db,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 20) {
        console.error('Redis: Too many reconnection attempts, giving up')
        return new Error('Too many retries')
      }
      return Math.min(retries * 50, 2000) // Exponential backoff up to 2 seconds
    },
    connectTimeout: envRedisConfig.connectTimeout,
    commandTimeout: envRedisConfig.commandTimeout,
  },
}

class RedisService {
  private client: RedisClientType | null = null
  private isConnected = false
  private connectionPromise: Promise<void> | null = null

  constructor() {
    // Don't connect immediately in test environment
    if (!isTest) {
      this.connect()
    }
  }

  async connect(): Promise<void> {
    if (this.connectionPromise) {
      return this.connectionPromise
    }

    if (this.isConnected && this.client) {
      return
    }

    this.connectionPromise = this.doConnect()
    return this.connectionPromise
  }

  private async doConnect(): Promise<void> {
    try {
      console.log('Redis: Attempting to connect...')
      this.client = createClient(redisConfig)

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err)
        this.isConnected = false
      })

      this.client.on('connect', () => {
        console.log('Redis: Connected to server')
      })

      this.client.on('ready', () => {
        console.log('Redis: Ready to accept commands')
        this.isConnected = true
      })

      this.client.on('end', () => {
        console.log('Redis: Connection ended')
        this.isConnected = false
      })

      this.client.on('reconnecting', () => {
        console.log('Redis: Reconnecting...')
        this.isConnected = false
      })

      await this.client.connect()
      this.isConnected = true
      this.connectionPromise = null
    } catch (error) {
      console.error('Redis: Failed to connect:', error)
      this.isConnected = false
      this.connectionPromise = null
      throw error
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.isConnected = false
      this.connectionPromise = null
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      if (!this.isConnected || !this.client) {
        return false
      }
      const pong = await this.client.ping()
      return pong === 'PONG'
    } catch (error) {
      console.error('Redis health check failed:', error)
      return false
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds = 3600): Promise<void> {
    await this.ensureConnected()
    const key = `session:${sessionId}`
    await this.client!.setEx(key, ttlSeconds, JSON.stringify(data))
  }

  async getSession(sessionId: string): Promise<any | null> {
    await this.ensureConnected()
    const key = `session:${sessionId}`
    const data = await this.client!.get(key)
    return data ? JSON.parse(data) : null
  }

  async deleteSession(sessionId: string): Promise<void> {
    await this.ensureConnected()
    const key = `session:${sessionId}`
    await this.client!.del(key)
  }

  async refreshSession(sessionId: string, ttlSeconds = 3600): Promise<boolean> {
    await this.ensureConnected()
    const key = `session:${sessionId}`
    const result = await this.client!.expire(key, ttlSeconds)
    return result === 1
  }

  // Caching
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    await this.ensureConnected()
    const serializedValue = JSON.stringify(value)

    if (ttlSeconds) {
      await this.client!.setEx(key, ttlSeconds, serializedValue)
    } else {
      await this.client!.set(key, serializedValue)
    }
  }

  async get(key: string): Promise<any | null> {
    await this.ensureConnected()
    const data = await this.client!.get(key)
    return data ? JSON.parse(data) : null
  }

  async del(key: string): Promise<void> {
    await this.ensureConnected()
    await this.client!.del(key)
  }

  async exists(key: string): Promise<boolean> {
    await this.ensureConnected()
    const result = await this.client!.exists(key)
    return result === 1
  }

  // Rate limiting
  async incrementKey(key: string, ttlSeconds: number): Promise<number> {
    await this.ensureConnected()
    const multi = this.client!.multi()
    multi.incr(key)
    multi.expire(key, ttlSeconds)
    const results = await multi.exec()
    return results?.[0] as number || 0
  }

  async getRateLimit(key: string): Promise<{ count: number; ttl: number }> {
    await this.ensureConnected()
    const multi = this.client!.multi()
    multi.get(key)
    multi.ttl(key)
    const results = await multi.exec()

    const count = parseInt(results?.[0] as string || '0')
    const ttl = results?.[1] as number || 0

    return { count, ttl }
  }

  // List operations for collaboration
  async addToList(key: string, value: any): Promise<void> {
    await this.ensureConnected()
    await this.client!.lPush(key, JSON.stringify(value))
  }

  async getListRange(key: string, start = 0, end = -1): Promise<any[]> {
    await this.ensureConnected()
    const items = await this.client!.lRange(key, start, end)
    return items.map(item => JSON.parse(item))
  }

  async removeFromList(key: string, value: any): Promise<void> {
    await this.ensureConnected()
    await this.client!.lRem(key, 1, JSON.stringify(value))
  }

  // Hash operations for user data
  async setHash(key: string, field: string, value: any): Promise<void> {
    await this.ensureConnected()
    await this.client!.hSet(key, field, JSON.stringify(value))
  }

  async getHash(key: string, field: string): Promise<any | null> {
    await this.ensureConnected()
    const data = await this.client!.hGet(key, field)
    return data ? JSON.parse(data) : null
  }

  async getAllHash(key: string): Promise<Record<string, any>> {
    await this.ensureConnected()
    const data = await this.client!.hGetAll(key)
    const result: Record<string, any> = {}

    for (const [field, value] of Object.entries(data)) {
      result[field] = JSON.parse(value)
    }

    return result
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<void> {
    await this.ensureConnected()
    await this.client!.publish(channel, JSON.stringify(message))
  }

  // Cleanup and maintenance
  async clearPattern(pattern: string): Promise<number> {
    await this.ensureConnected()
    const keys = await this.client!.keys(pattern)
    if (keys.length > 0) {
      return await this.client!.del(keys)
    }
    return 0
  }

  // Statistics
  async getStats(): Promise<{
    memory: string
    connectedClients: number
    totalCommandsProcessed: string
    keyspace: Record<string, any>
  }> {
    await this.ensureConnected()
    const info = await this.client!.info()
    const lines = info.split('\r\n')

    const stats = {
      memory: '',
      connectedClients: 0,
      totalCommandsProcessed: '',
      keyspace: {}
    }

    for (const line of lines) {
      if (line.startsWith('used_memory_human:')) {
        stats.memory = line.split(':')[1]
      } else if (line.startsWith('connected_clients:')) {
        stats.connectedClients = parseInt(line.split(':')[1])
      } else if (line.startsWith('total_commands_processed:')) {
        stats.totalCommandsProcessed = line.split(':')[1]
      } else if (line.startsWith('db0:')) {
        const keyspaceData = line.split(':')[1]
        const matches = keyspaceData.match(/keys=(\d+),expires=(\d+)/)
        if (matches) {
          stats.keyspace = {
            keys: parseInt(matches[1]),
            expires: parseInt(matches[2])
          }
        }
      }
    }

    return stats
  }

  private async ensureConnected(): Promise<void> {
    if (!this.isConnected || !this.client) {
      await this.connect()
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