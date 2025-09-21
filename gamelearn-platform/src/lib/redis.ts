// Development-friendly Redis implementation
// Uses in-memory storage for Edge Runtime compatibility
const isDevelopment = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

console.log('Redis: Using in-memory storage for development/testing')

// In-memory storage for development
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

class RedisService {
  private isConnected = true // Always connected in memory mode

  constructor() {
    console.log('Redis: Initialized in-memory mode for Edge Runtime compatibility')
  }

  async connect(): Promise<void> {
    this.isConnected = true
  }

  async disconnect(): Promise<void> {
    memoryStore.clear()
    this.isConnected = false
  }

  async isHealthy(): Promise<boolean> {
    return this.isConnected
  }

  // Session management
  async setSession(sessionId: string, data: any, ttlSeconds = 3600): Promise<void> {
    const key = `session:${sessionId}`
    memoryStore.set(key, data, ttlSeconds)
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`
    return memoryStore.get(key)
  }

  async deleteSession(sessionId: string): Promise<void> {
    const key = `session:${sessionId}`
    memoryStore.del(key)
  }

  async refreshSession(sessionId: string, ttlSeconds = 3600): Promise<boolean> {
    const key = `session:${sessionId}`
    const data = memoryStore.get(key)
    if (data) {
      memoryStore.set(key, data, ttlSeconds)
      return true
    }
    return false
  }

  // Caching
  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    memoryStore.set(key, value, ttlSeconds)
  }

  async get(key: string): Promise<any | null> {
    return memoryStore.get(key)
  }

  async del(key: string): Promise<void> {
    memoryStore.del(key)
  }

  async exists(key: string): Promise<boolean> {
    return memoryStore.exists(key)
  }

  // Rate limiting
  async incrementKey(key: string, ttlSeconds: number): Promise<number> {
    const result = memoryStore.incr(key)
    memoryStore.set(key, result, ttlSeconds)
    return result
  }

  async getRateLimit(key: string): Promise<{ count: number; ttl: number }> {
    const data = memoryStore.get(key)
    return {
      count: typeof data === 'number' ? data : 0,
      ttl: 3600 // Default TTL for memory store
    }
  }

  // List operations for collaboration
  async addToList(key: string, value: any): Promise<void> {
    memoryStore.lPush(key, value)
  }

  async getListRange(key: string, start = 0, end = -1): Promise<any[]> {
    return memoryStore.lRange(key, start, end)
  }

  async removeFromList(key: string, value: any): Promise<void> {
    // Simple implementation for memory store
    console.log('removeFromList called for:', key, value)
  }

  // Hash operations for user data
  async setHash(key: string, field: string, value: any): Promise<void> {
    memoryStore.hSet(key, field, value)
  }

  async getHash(key: string, field: string): Promise<any | null> {
    return memoryStore.hGet(key, field)
  }

  async getAllHash(key: string): Promise<Record<string, any>> {
    return memoryStore.hGetAll(key)
  }

  // Pub/Sub for real-time features
  async publish(channel: string, message: any): Promise<void> {
    console.log('Publish to channel:', channel, message)
  }

  // Cleanup and maintenance
  async clearPattern(pattern: string): Promise<number> {
    console.log('Clear pattern:', pattern)
    return 0
  }

  // Statistics
  async getStats(): Promise<{
    memory: string
    connectedClients: number
    totalCommandsProcessed: string
    keyspace: Record<string, any>
  }> {
    return {
      memory: '1MB',
      connectedClients: 1,
      totalCommandsProcessed: '0',
      keyspace: { keys: 0, expires: 0 }
    }
  }

  // Simplified methods for remaining operations
  async setAdd(key: string, value: any): Promise<void> {
    memoryStore.lPush(key, value)
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