"use client"

import { createContext, useContext, useMemo, useState, useCallback } from "react"

type CourseSelectionMode = "single" | "multi"

export interface DateRange {
  start: Date
  end: Date
  preset?: "7d" | "30d" | "90d" | "ytd" | "custom"
}

export interface ComparisonConfig {
  enabled: boolean
  baselineCourseId?: string
  comparisonCourseIds: string[]
}

export interface RealTimeConfig {
  enabled: boolean
  intervalSeconds: number
  lastUpdated?: Date
}

export interface AnalyticsState {
  selectedCourseIds: string[]
  selectionMode: CourseSelectionMode
  dateRange: DateRange
  comparison: ComparisonConfig
  realTime: RealTimeConfig
  includeArchived: boolean
  setSelectedCourseIds: (ids: string[]) => void
  setSelectionMode: (mode: CourseSelectionMode) => void
  setDateRange: (range: DateRange) => void
  setComparison: (config: Partial<ComparisonConfig>) => void
  toggleRealTime: (enabled?: boolean) => void
  setRealTimeInterval: (seconds: number) => void
  markRealTimeRefreshed: () => void
  setIncludeArchived: (include: boolean) => void
  reset: () => void
}

const defaultDateRange: DateRange = (() => {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  return { start, end, preset: "30d" }
})()

const defaultComparison: ComparisonConfig = {
  enabled: false,
  baselineCourseId: undefined,
  comparisonCourseIds: [],
}

const defaultRealTime: RealTimeConfig = {
  enabled: false,
  intervalSeconds: 60,
  lastUpdated: undefined,
}

const defaultState: AnalyticsState = {
  selectedCourseIds: [],
  selectionMode: "multi",
  dateRange: defaultDateRange,
  comparison: defaultComparison,
  realTime: defaultRealTime,
  includeArchived: false,
  setSelectedCourseIds: () => undefined,
  setSelectionMode: () => undefined,
  setDateRange: () => undefined,
  setComparison: () => undefined,
  toggleRealTime: () => undefined,
  setRealTimeInterval: () => undefined,
  markRealTimeRefreshed: () => undefined,
  setIncludeArchived: () => undefined,
  reset: () => undefined,
}

const AnalyticsContext = createContext<AnalyticsState>(defaultState)

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([])
  const [selectionMode, setSelectionMode] = useState<CourseSelectionMode>("multi")
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)
  const [comparison, setComparisonState] = useState<ComparisonConfig>(defaultComparison)
  const [realTime, setRealTime] = useState<RealTimeConfig>(defaultRealTime)
  const [includeArchived, setIncludeArchived] = useState(false)

  const setComparison = useCallback((config: Partial<ComparisonConfig>) => {
    setComparisonState((prev) => {
      const merged: ComparisonConfig = {
        ...prev,
        ...config,
      }

      if (!merged.enabled) {
        merged.baselineCourseId = undefined
        merged.comparisonCourseIds = []
      }

      if (
        merged.baselineCourseId &&
        merged.comparisonCourseIds.includes(merged.baselineCourseId)
      ) {
        merged.comparisonCourseIds = merged.comparisonCourseIds.filter(
          (id) => id !== merged.baselineCourseId
        )
      }

      return merged
    })
  }, [])

  const toggleRealTime = useCallback((enabled?: boolean) => {
    setRealTime((prev) => {
      const isEnabled = enabled ?? !prev.enabled
      return {
        ...prev,
        enabled: isEnabled,
        lastUpdated: isEnabled ? prev.lastUpdated : undefined,
      }
    })
  }, [])

  const setRealTimeInterval = useCallback((seconds: number) => {
    setRealTime((prev) => ({
      ...prev,
      intervalSeconds: Math.max(15, seconds),
    }))
  }, [])

  const markRealTimeRefreshed = useCallback(() => {
    setRealTime((prev) => ({
      ...prev,
      lastUpdated: new Date(),
    }))
  }, [])

  const reset = useCallback(() => {
    setSelectedCourseIds([])
    setSelectionMode("multi")
    setDateRange(defaultDateRange)
    setComparisonState(defaultComparison)
    setRealTime(defaultRealTime)
    setIncludeArchived(false)
  }, [])

  const value = useMemo<AnalyticsState>(
    () => ({
      selectedCourseIds,
      selectionMode,
      dateRange,
      comparison,
      realTime,
      includeArchived,
      setSelectedCourseIds,
      setSelectionMode,
      setDateRange,
      setComparison,
      toggleRealTime,
      setRealTimeInterval,
      markRealTimeRefreshed,
      setIncludeArchived,
      reset,
    }),
    [
      selectedCourseIds,
      selectionMode,
      dateRange,
      comparison,
      realTime,
      includeArchived,
      setComparison,
      toggleRealTime,
      setRealTimeInterval,
      markRealTimeRefreshed,
      reset,
    ],
  )

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext)
  if (!context) {
    throw new Error("useAnalytics must be used within an AnalyticsProvider")
  }
  return context
}

export function useAnalyticsSelection() {
  const { selectedCourseIds, setSelectedCourseIds, selectionMode, setSelectionMode } = useAnalytics()
  return {
    selectedCourseIds,
    setSelectedCourseIds,
    selectionMode,
    setSelectionMode,
  }
}

export function useAnalyticsDateRange() {
  const { dateRange, setDateRange } = useAnalytics()
  return { dateRange, setDateRange }
}

export function useAnalyticsComparison() {
  const { comparison, setComparison } = useAnalytics()
  return { comparison, setComparison }
}

export function useAnalyticsRealTime() {
  const { realTime, toggleRealTime, setRealTimeInterval, markRealTimeRefreshed } = useAnalytics()
  return { realTime, toggleRealTime, setRealTimeInterval, markRealTimeRefreshed }
}

export function useAnalyticsFilters() {
  const { includeArchived, setIncludeArchived, reset } = useAnalytics()
  return { includeArchived, setIncludeArchived, reset }
}
