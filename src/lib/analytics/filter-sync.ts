"use client"

import { GlobalFilterState, DateRange } from "@/contexts/analytics-context"

export type AnalyticsPlatform = 'metabase' | 'posthog' | 'mixpanel' | 'google-analytics'

export interface PlatformFilterMapping {
  platform: AnalyticsPlatform
  mapFilters: (filters: GlobalFilterState) => Record<string, unknown>
  mapDateRange?: (dateRange: DateRange) => Record<string, unknown>
  mapCourseIds?: (courseIds: string[]) => Record<string, unknown>
  mapCustomFilters?: (customFilters: Record<string, unknown>) => Record<string, unknown>
}

class FilterSynchronizationService {
  private mappings: Map<AnalyticsPlatform, PlatformFilterMapping> = new Map()

  registerMapping(mapping: PlatformFilterMapping): void {
    this.mappings.set(mapping.platform, mapping)
  }

  getMappedFilters(platform: AnalyticsPlatform, filters: GlobalFilterState): Record<string, unknown> {
    const mapping = this.mappings.get(platform)
    if (!mapping) {
      console.warn(`No filter mapping registered for platform: ${platform}`)
      return {}
    }

    return mapping.mapFilters(filters)
  }

  getPlatformMapping(platform: AnalyticsPlatform): PlatformFilterMapping | undefined {
    return this.mappings.get(platform)
  }

  getAllPlatforms(): AnalyticsPlatform[] {
    return Array.from(this.mappings.keys())
  }
}

// Create singleton instance
export const filterSyncService = new FilterSynchronizationService()

// Register default platform mappings
filterSyncService.registerMapping({
  platform: 'metabase',
  mapFilters: (filters: GlobalFilterState) => {
    const mapped: Record<string, unknown> = {}

    // Date range mapping for Metabase
    if (filters.dateRange.start && filters.dateRange.end) {
      mapped.date_from = filters.dateRange.start.toISOString().split('T')[0]
      mapped.date_to = filters.dateRange.end.toISOString().split('T')[0]
    }

    // Course IDs mapping
    if (filters.courseIds.length > 0) {
      mapped.course_ids = filters.courseIds
    }

    // Archived filter
    if (filters.includeArchived !== undefined) {
      mapped.include_archived = filters.includeArchived
    }

    // Custom filters
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      mapped[key] = value
    })

    return mapped
  },
})

filterSyncService.registerMapping({
  platform: 'posthog',
  mapFilters: (filters: GlobalFilterState) => {
    const mapped: Record<string, unknown> = {}

    // Date range mapping for PostHog
    if (filters.dateRange.start && filters.dateRange.end) {
      mapped.date_from = filters.dateRange.start.toISOString().split('T')[0]
      mapped.date_to = filters.dateRange.end.toISOString().split('T')[0]
    }

    // Course IDs mapping
    if (filters.courseIds.length > 0) {
      mapped.course_ids = filters.courseIds
    }

    // Archived filter
    if (filters.includeArchived !== undefined) {
      mapped.include_archived = filters.includeArchived
    }

    // Custom filters
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      mapped[key] = value
    })

    return mapped
  },
})

filterSyncService.registerMapping({
  platform: 'mixpanel',
  mapFilters: (filters: GlobalFilterState) => {
    const mapped: Record<string, unknown> = {}

    // Date range mapping for Mixpanel
    if (filters.dateRange.start && filters.dateRange.end) {
      mapped.from_date = filters.dateRange.start.toISOString().split('T')[0]
      mapped.to_date = filters.dateRange.end.toISOString().split('T')[0]
    }

    // Course IDs mapping
    if (filters.courseIds.length > 0) {
      mapped.course_ids = filters.courseIds
    }

    // Archived filter
    if (filters.includeArchived !== undefined) {
      mapped.include_archived = filters.includeArchived
    }

    // Custom filters
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      mapped[key] = value
    })

    return mapped
  },
})

filterSyncService.registerMapping({
  platform: 'google-analytics',
  mapFilters: (filters: GlobalFilterState) => {
    const mapped: Record<string, unknown> = {}

    // Date range mapping for Google Analytics
    if (filters.dateRange.start && filters.dateRange.end) {
      mapped.start_date = filters.dateRange.start.toISOString().split('T')[0]
      mapped.end_date = filters.dateRange.end.toISOString().split('T')[0]
    }

    // Course IDs mapping
    if (filters.courseIds.length > 0) {
      mapped.course_ids = filters.courseIds
    }

    // Archived filter
    if (filters.includeArchived !== undefined) {
      mapped.include_archived = filters.includeArchived
    }

    // Custom filters
    Object.entries(filters.customFilters).forEach(([key, value]) => {
      mapped[key] = value
    })

    return mapped
  },
})

// Utility functions for filter operations
export function mergeFilters(
  baseFilters: Record<string, unknown>,
  additionalFilters: Record<string, unknown>
): Record<string, unknown> {
  return { ...baseFilters, ...additionalFilters }
}

export function serializeFilters(filters: Record<string, unknown>): string {
  return JSON.stringify(filters, (key, value) => {
    // Handle Date objects
    if (value instanceof Date) {
      return value.toISOString()
    }
    return value
  })
}

export function deserializeFilters(serialized: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(serialized)
    // Convert ISO date strings back to Date objects
    Object.keys(parsed).forEach(key => {
      if (typeof parsed[key] === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(parsed[key])) {
        parsed[key] = new Date(parsed[key])
      }
    })
    return parsed
  } catch {
    return {}
  }
}

export function areFiltersEqual(
  filters1: Record<string, unknown>,
  filters2: Record<string, unknown>
): boolean {
  return serializeFilters(filters1) === serializeFilters(filters2)
}