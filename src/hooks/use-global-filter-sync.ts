"use client"

import { useCallback, useEffect, useRef } from "react"
import { useGlobalFilters } from "@/contexts/analytics-context"
import { filterSyncService, AnalyticsPlatform } from "@/lib/analytics/filter-sync"
import { useURLStateManager } from "@/lib/analytics/url-state"

interface FilterSyncCallbacks {
  onFiltersChanged?: (platform: AnalyticsPlatform, filters: Record<string, unknown>) => void
  onGlobalFiltersChanged?: (filters: any) => void
}

export function useGlobalFilterSync(callbacks?: FilterSyncCallbacks) {
  const { globalFilters, setGlobalFilters } = useGlobalFilters()
  const { updateURL, loadFromURL } = useURLStateManager()
  const callbacksRef = useRef(callbacks)
  const isInitializedRef = useRef(false)

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = callbacks
  }, [callbacks])

  // Initialize filters from URL on mount
  useEffect(() => {
    if (!isInitializedRef.current) {
      const urlFilters = loadFromURL()
      if (Object.keys(urlFilters).length > 0) {
        setGlobalFilters(urlFilters)
      }
      isInitializedRef.current = true
    }
  }, [loadFromURL, setGlobalFilters])

  // Sync filters to URL when global filters change
  useEffect(() => {
    if (isInitializedRef.current) {
      updateURL(globalFilters, true) // Use replace to avoid history pollution
    }
  }, [globalFilters, updateURL])

  // Notify all registered platforms when filters change
  useEffect(() => {
    if (!isInitializedRef.current) return

    const platforms = filterSyncService.getAllPlatforms()

    platforms.forEach(platform => {
      const mappedFilters = filterSyncService.getMappedFilters(platform, globalFilters)
      callbacksRef.current?.onFiltersChanged?.(platform, mappedFilters)
    })

    callbacksRef.current?.onGlobalFiltersChanged?.(globalFilters)
  }, [globalFilters])

  // Function to update global filters and sync to all platforms
  const updateGlobalFilters = useCallback((filters: Partial<any>) => {
    setGlobalFilters(filters)
  }, [setGlobalFilters])

  // Function to get mapped filters for a specific platform
  const getPlatformFilters = useCallback((platform: AnalyticsPlatform) => {
    return filterSyncService.getMappedFilters(platform, globalFilters)
  }, [globalFilters])

  // Function to sync filters manually to all platforms
  const syncToAllPlatforms = useCallback(() => {
    const platforms = filterSyncService.getAllPlatforms()

    platforms.forEach(platform => {
      const mappedFilters = filterSyncService.getMappedFilters(platform, globalFilters)
      callbacksRef.current?.onFiltersChanged?.(platform, mappedFilters)
    })
  }, [globalFilters])

  // Function to reset all filters
  const resetFilters = useCallback(() => {
    setGlobalFilters({
      courseIds: [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        end: new Date(),
        preset: '30d',
      },
      includeArchived: false,
      comparison: {
        enabled: false,
        baselineCourseId: undefined,
        comparisonCourseIds: [],
      },
      customFilters: {},
    })
  }, [setGlobalFilters])

  return {
    globalFilters,
    updateGlobalFilters,
    getPlatformFilters,
    syncToAllPlatforms,
    resetFilters,
  }
}