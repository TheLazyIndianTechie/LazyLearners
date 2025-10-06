"use client"

import { useState } from "react"
import { useGlobalFilters } from "@/contexts/analytics-context"
import { useGlobalFilterSync } from "@/hooks/use-global-filter-sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Filter, RotateCcw, Settings } from "lucide-react"
import { CourseSelector } from "./course-selector"
import { AnalyticsDateRangePicker } from "./date-range-picker"

interface GlobalFilterControlsProps {
  className?: string
  showAdvanced?: boolean
  compact?: boolean
}

export function GlobalFilterControls({
  className,
  showAdvanced = false,
  compact = false,
}: GlobalFilterControlsProps) {
  const { globalFilters, setGlobalFilters } = useGlobalFilters()
  const { resetFilters } = useGlobalFilterSync()
  const [isExpanded, setIsExpanded] = useState(!compact)

  const activeFiltersCount = [
    globalFilters.courseIds.length > 0,
    globalFilters.includeArchived,
    globalFilters.comparison.enabled,
    Object.keys(globalFilters.customFilters).length > 0,
  ].filter(Boolean).length

  const handleReset = () => {
    resetFilters()
  }

  if (compact && !isExpanded) {
    return (
      <Card className={cn("border-muted-foreground/30 shadow-none", className)}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Global Filters</span>
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {activeFiltersCount} active
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="gap-1"
            >
              <Settings className="h-4 w-4" />
              Configure
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-muted-foreground/30 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Global Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure filters that apply to all analytics dashboards
          </p>
        </div>
        <div className="flex items-center gap-2">
          {compact && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(false)}
              className="gap-1"
            >
              Collapse
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Course Selection */}
        <div className="space-y-3">
          <CourseSelector
            mode="multi"
            showSelectedSummary={true}
            className="border-0 shadow-none bg-muted/30"
          />
        </div>

        <Separator />

        {/* Date Range */}
        <div className="space-y-3">
          <AnalyticsDateRangePicker
            heading="Date Range"
            description="Select the time period for all analytics"
            className="border-0 shadow-none bg-muted/30"
          />
        </div>

        <Separator />

        {/* Include Archived Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <label className="text-sm font-medium">Include Archived Courses</label>
            <p className="text-xs text-muted-foreground">
              Include data from archived or unpublished courses
            </p>
          </div>
          <Button
            variant={globalFilters.includeArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setGlobalFilters({ includeArchived: !globalFilters.includeArchived })}
          >
            {globalFilters.includeArchived ? "Included" : "Excluded"}
          </Button>
        </div>

        {showAdvanced && (
          <>
            <Separator />

            {/* Comparison Mode */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Comparison Mode</label>
                  <p className="text-xs text-muted-foreground">
                    Compare performance across different courses
                  </p>
                </div>
                <Button
                  variant={globalFilters.comparison.enabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGlobalFilters({
                    comparison: {
                      ...globalFilters.comparison,
                      enabled: !globalFilters.comparison.enabled
                    }
                  })}
                >
                  {globalFilters.comparison.enabled ? "Enabled" : "Disabled"}
                </Button>
              </div>

              {globalFilters.comparison.enabled && (
                <div className="pl-4 border-l-2 border-muted space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Baseline Course
                    </label>
                    <select
                      className="w-full px-3 py-2 text-sm border rounded-md bg-background"
                      value={globalFilters.comparison.baselineCourseId || ""}
                      onChange={(e) => setGlobalFilters({
                        comparison: {
                          ...globalFilters.comparison,
                          baselineCourseId: e.target.value || undefined
                        }
                      })}
                    >
                      <option value="">Select baseline course...</option>
                      {globalFilters.courseIds.map(courseId => (
                        <option key={courseId} value={courseId}>
                          Course {courseId}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium uppercase text-muted-foreground">
                      Comparison Courses
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {globalFilters.courseIds
                        .filter(id => id !== globalFilters.comparison.baselineCourseId)
                        .map(courseId => (
                          <Badge
                            key={courseId}
                            variant={globalFilters.comparison.comparisonCourseIds.includes(courseId) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const current = globalFilters.comparison.comparisonCourseIds
                              const updated = current.includes(courseId)
                                ? current.filter(id => id !== courseId)
                                : [...current, courseId]
                              setGlobalFilters({
                                comparison: {
                                  ...globalFilters.comparison,
                                  comparisonCourseIds: updated
                                }
                              })
                            }}
                          >
                            Course {courseId}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default GlobalFilterControls