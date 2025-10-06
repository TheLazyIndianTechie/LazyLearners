"use client"

import { useCallback, useEffect, useRef } from "react"
import { GlobalFilterState, DateRange, ComparisonConfig } from "@/contexts/analytics-context"
import { serializeFilters, deserializeFilters } from "./filter-sync"

export interface URLStateConfig {
  debounceMs?: number
  maxHistorySize?: number
}

class URLStateManager {
  private config: Required<URLStateConfig>
  private debounceTimer: NodeJS.Timeout | null = null
  private history: string[] = []
  private currentIndex = -1

  constructor(config: URLStateConfig = {}) {
    this.config = {
      debounceMs: 300,
      maxHistorySize: 10,
      ...config,
    }
  }

  // Serialize global filters to URL parameters
  serializeToURL(filters: GlobalFilterState): URLSearchParams {
    const params = new URLSearchParams()

    // Serialize course IDs
    if (filters.courseIds.length > 0) {
      params.set('courseIds', filters.courseIds.join(','))
    }

    // Serialize date range
    if (filters.dateRange.start && filters.dateRange.end) {
      params.set('dateFrom', filters.dateRange.start.toISOString().split('T')[0])
      params.set('dateTo', filters.dateRange.end.toISOString().split('T')[0])
      if (filters.dateRange.preset) {
        params.set('datePreset', filters.dateRange.preset)
      }
    }

    // Serialize archived filter
    if (filters.includeArchived) {
      params.set('includeArchived', 'true')
    }

    // Serialize comparison config
    if (filters.comparison.enabled) {
      params.set('comparisonEnabled', 'true')
      if (filters.comparison.baselineCourseId) {
        params.set('baselineCourseId', filters.comparison.baselineCourseId)
      }
      if (filters.comparison.comparisonCourseIds.length > 0) {
        params.set('comparisonCourseIds', filters.comparison.comparisonCourseIds.join(','))
      }
    }

    // Serialize custom filters
    if (Object.keys(filters.customFilters).length > 0) {
      params.set('customFilters', serializeFilters(filters.customFilters))
    }

    return params
  }

  // Deserialize URL parameters to global filters
  deserializeFromURL(searchParams: URLSearchParams): Partial<GlobalFilterState> {
    const filters: Partial<GlobalFilterState> = {}

    // Deserialize course IDs
    const courseIdsParam = searchParams.get('courseIds')
    if (courseIdsParam) {
      filters.courseIds = courseIdsParam.split(',').filter(Boolean)
    }

    // Deserialize date range
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const datePreset = searchParams.get('datePreset')

    if (dateFrom && dateTo) {
      const start = new Date(dateFrom)
      const end = new Date(dateTo)
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filters.dateRange = {
          start,
          end,
          preset: (datePreset as any) || 'custom',
        }
      }
    }

    // Deserialize archived filter
    const includeArchived = searchParams.get('includeArchived')
    if (includeArchived === 'true') {
      filters.includeArchived = true
    }

    // Deserialize comparison config
    const comparisonEnabled = searchParams.get('comparisonEnabled')
    if (comparisonEnabled === 'true') {
      const baselineCourseId = searchParams.get('baselineCourseId')
      const comparisonCourseIdsParam = searchParams.get('comparisonCourseIds')

      filters.comparison = {
        enabled: true,
        baselineCourseId: baselineCourseId || undefined,
        comparisonCourseIds: comparisonCourseIdsParam ? comparisonCourseIdsParam.split(',').filter(Boolean) : [],
      }
    }

    // Deserialize custom filters
    const customFiltersParam = searchParams.get('customFilters')
    if (customFiltersParam) {
      filters.customFilters = deserializeFilters(customFiltersParam)
    }

    return filters
  }

  // Update URL with current filters (debounced)
  updateURL(filters: GlobalFilterState, replace: boolean = false): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }

    this.debounceTimer = setTimeout(() => {
      const params = this.serializeToURL(filters)
      const url = new URL(window.location.href)

      // Clear existing analytics params
      url.searchParams.delete('courseIds')
      url.searchParams.delete('dateFrom')
      url.searchParams.delete('dateTo')
      url.searchParams.delete('datePreset')
      url.searchParams.delete('includeArchived')
      url.searchParams.delete('comparisonEnabled')
      url.searchParams.delete('baselineCourseId')
      url.searchParams.delete('comparisonCourseIds')
      url.searchParams.delete('customFilters')

      // Set new params
      params.forEach((value, key) => {
        url.searchParams.set(key, value)
      })

      const newUrl = url.toString()

      if (replace) {
        window.history.replaceState(null, '', newUrl)
      } else {
        window.history.pushState(null, '', newUrl)
        this.addToHistory(newUrl)
      }
    }, this.config.debounceMs)
  }

  // Load filters from current URL
  loadFromURL(): Partial<GlobalFilterState> {
    if (typeof window === 'undefined') return {}

    const url = new URL(window.location.href)
    return this.deserializeFromURL(url.searchParams)
  }

  // Clear all filter parameters from URL
  clearURL(): void {
    if (typeof window === 'undefined') return

    const url = new URL(window.location.href)
    url.searchParams.delete('courseIds')
    url.searchParams.delete('dateFrom')
    url.searchParams.delete('dateTo')
    url.searchParams.delete('datePreset')
    url.searchParams.delete('includeArchived')
    url.searchParams.delete('comparisonEnabled')
    url.searchParams.delete('baselineCourseId')
    url.searchParams.delete('comparisonCourseIds')
    url.searchParams.delete('customFilters')

    window.history.replaceState(null, '', url.toString())
  }

  private addToHistory(url: string): void {
    // Remove any future history if we're not at the end
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1)
    }

    // Add new URL to history
    this.history.push(url)
    this.currentIndex = this.history.length - 1

    // Limit history size
    if (this.history.length > this.config.maxHistorySize) {
      this.history.shift()
      this.currentIndex--
    }
  }

  // Navigation methods for undo/redo functionality
  canGoBack(): boolean {
    return this.currentIndex > 0
  }

  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1
  }

  goBack(): void {
    if (this.canGoBack()) {
      this.currentIndex--
      const url = this.history[this.currentIndex]
      window.history.replaceState(null, '', url)
    }
  }

  goForward(): void {
    if (this.canGoForward()) {
      this.currentIndex++
      const url = this.history[this.currentIndex]
      window.history.replaceState(null, '', url)
    }
  }
}

// Create singleton instance
export const urlStateManager = new URLStateManager()

// React hook for URL state management
export function useURLStateManager() {
  const managerRef = useRef(urlStateManager)

  const updateURL = useCallback((filters: GlobalFilterState, replace: boolean = false) => {
    managerRef.current.updateURL(filters, replace)
  }, [])

  const loadFromURL = useCallback(() => {
    return managerRef.current.loadFromURL()
  }, [])

  const clearURL = useCallback(() => {
    managerRef.current.clearURL()
  }, [])

  const canGoBack = useCallback(() => {
    return managerRef.current.canGoBack()
  }, [])

  const canGoForward = useCallback(() => {
    return managerRef.current.canGoForward()
  }, [])

  const goBack = useCallback(() => {
    managerRef.current.goBack()
  }, [])

  const goForward = useCallback(() => {
    managerRef.current.goForward()
  }, [])

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      // This will trigger a re-render and the component using this hook
      // should reload filters from URL
      window.dispatchEvent(new CustomEvent('urlStateChanged'))
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  return {
    updateURL,
    loadFromURL,
    clearURL,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  }
}