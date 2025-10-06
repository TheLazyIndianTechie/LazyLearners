"use client"

import { useCallback, useEffect, useRef } from "react"

interface CachedEmbed {
  url: string
  token: string
  expiresAt: string
  cachedAt: number
}

interface EmbedCacheKey {
  type: 'posthog' | 'metabase'
  resourceId: string
  filters: Record<string, unknown>
}

class EmbedCache {
  private cache = new Map<string, CachedEmbed>()
  private readonly TTL = 5 * 60 * 1000 // 5 minutes

  private getKey(key: EmbedCacheKey): string {
    return `${key.type}:${key.resourceId}:${JSON.stringify(key.filters)}`
  }

  get(key: EmbedCacheKey): CachedEmbed | null {
    const cacheKey = this.getKey(key)
    const cached = this.cache.get(cacheKey)

    if (!cached) return null

    // Check if expired
    const now = Date.now()
    const expiresAt = new Date(cached.expiresAt).getTime()

    if (now > expiresAt - 60000) { // Expire 1 minute early
      this.cache.delete(cacheKey)
      return null
    }

    return cached
  }

  set(key: EmbedCacheKey, embed: CachedEmbed): void {
    const cacheKey = this.getKey(key)
    this.cache.set(cacheKey, {
      ...embed,
      cachedAt: Date.now(),
    })

    // Clean up expired entries periodically
    if (this.cache.size > 50) {
      this.cleanup()
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, cached] of this.cache.entries()) {
      const expiresAt = new Date(cached.expiresAt).getTime()
      if (now > expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  clear(): void {
    this.cache.clear()
  }
}

const globalCache = new EmbedCache()

export function useEmbedCache() {
  const cacheRef = useRef(globalCache)

  const getCachedEmbed = useCallback((key: EmbedCacheKey) => {
    return cacheRef.current.get(key)
  }, [])

  const setCachedEmbed = useCallback((key: EmbedCacheKey, embed: CachedEmbed) => {
    cacheRef.current.set(key, embed)
  }, [])

  const clearCache = useCallback(() => {
    cacheRef.current.clear()
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear global cache on unmount, just let it persist
    }
  }, [])

  return {
    getCachedEmbed,
    setCachedEmbed,
    clearCache,
  }
}