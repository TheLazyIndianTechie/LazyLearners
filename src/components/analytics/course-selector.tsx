"use client"

import { useEffect, useMemo, useState } from "react"
import { useAnalyticsSelection, useGlobalFilters } from "@/contexts/analytics-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { ChevronsUpDown, MinusCircle, Search, Users } from "lucide-react"

type CourseSelectionMode = "single" | "multi"

interface CourseSummary {
  id: string
  title: string
  slug?: string
  enrollmentCount: number
  published: boolean
  lastUpdatedAt?: string
}

interface CourseSelectorProps {
  className?: string
  disableModeToggle?: boolean
  mode?: CourseSelectionMode
  onModeChange?: (mode: CourseSelectionMode) => void
  title?: string
  description?: string
  showSelectedSummary?: boolean
}

export function CourseSelector({
  className,
  disableModeToggle = false,
  mode,
  onModeChange,
  title = "Courses",
  description = "Select courses to analyze, compare, and filter insights.",
  showSelectedSummary = true,
}: CourseSelectorProps) {
  const {
    selectedCourseIds,
    setSelectedCourseIds,
    selectionMode,
    setSelectionMode,
  } = useAnalyticsSelection()
  const { globalFilters, setGlobalFilters } = useGlobalFilters()

  const [courses, setCourses] = useState<CourseSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const effectiveMode = mode ?? selectionMode

  // Sync selected course IDs with global filters
  useEffect(() => {
    if (globalFilters.courseIds !== selectedCourseIds) {
      setSelectedCourseIds(globalFilters.courseIds)
    }
  }, [globalFilters.courseIds, selectedCourseIds, setSelectedCourseIds])

  useEffect(() => {
    let isMounted = true

    async function loadCourses() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch("/api/analytics/courses")
        if (!response.ok) {
          throw new Error(`Failed to load courses: ${response.status}`)
        }

        const data = await response.json()
        if (!isMounted) return

        setCourses(data.courses ?? [])
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : "Unable to load courses")
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCourses()

    return () => {
      isMounted = false
    }
  }, [])

  const filteredCourses = useMemo(() => {
    if (!search) return courses
    const normalized = search.toLowerCase().trim()

    return courses.filter((course) =>
      course.title.toLowerCase().includes(normalized) ||
      course.slug?.toLowerCase().includes(normalized),
    )
  }, [courses, search])

  const selectedCourses = useMemo(
    () => courses.filter((course) => selectedCourseIds.includes(course.id)),
    [courses, selectedCourseIds],
  )

  const handleToggle = (courseId: string) => {
    let newCourseIds: string[]

    if (effectiveMode === "single") {
      newCourseIds = [courseId]
    } else {
      if (selectedCourseIds.includes(courseId)) {
        newCourseIds = selectedCourseIds.filter((id) => id !== courseId)
      } else {
        newCourseIds = [...selectedCourseIds, courseId]
      }
    }

    setSelectedCourseIds(newCourseIds)
    setGlobalFilters({ courseIds: newCourseIds })
  }

  const handleClearSelection = () => {
    setSelectedCourseIds([])
    setGlobalFilters({ courseIds: [] })
  }

  const handleModeChange = (nextMode: CourseSelectionMode) => {
    if (disableModeToggle) return

    if (onModeChange) {
      onModeChange(nextMode)
    } else {
      setSelectionMode(nextMode)
    }

    if (nextMode === "single" && selectedCourseIds.length > 1) {
      const [first] = selectedCourseIds
      const newCourseIds = first ? [first] : []
      setSelectedCourseIds(newCourseIds)
      setGlobalFilters({ courseIds: newCourseIds })
    }
  }

  return (
    <Card className={cn("border-muted-foreground/30 shadow-none", className)}>
      <CardHeader className="flex flex-col gap-2 space-y-0 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {!disableModeToggle && (
          <ModeToggle
            value={effectiveMode}
            onChange={handleModeChange}
            disabled={disableModeToggle}
          />
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by course name or slug"
              className="pl-8"
            />
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed((prev) => !prev)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            {isCollapsed ? "Expand" : "Collapse"}
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>

        {!isCollapsed && (
          <>
            <Separator />
            <div className="rounded-lg border bg-muted/30">
              <ScrollArea className="max-h-[320px]">
                <div className="divide-y">
                  {loading && (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={`skeleton-${index}`} className="flex items-center gap-3">
                          <Skeleton className="h-5 w-5 rounded" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-48" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                          <Skeleton className="h-4 w-12" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!loading && error && (
                    <div className="space-y-2 p-4 text-sm">
                      <p className="font-medium text-destructive">Unable to load courses</p>
                      <p className="text-muted-foreground">{error}</p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setError(null)
                            setLoading(true)
                            // trigger useEffect by resetting courses
                            setCourses([])
                          }}
                        >
                          Retry
                        </Button>
                      </div>
                    </div>
                  )}

                  {!loading && !error && filteredCourses.length === 0 && (
                    <div className="p-4 text-sm text-muted-foreground">
                      No courses match “{search}”.
                    </div>
                  )}

                  {!loading && !error && filteredCourses.map((course) => {
                    const isChecked = selectedCourseIds.includes(course.id)
                    const isDisabled = effectiveMode === "single" && !isChecked && selectedCourseIds.length >= 1

                    return (
                      <button
                        key={course.id}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                          isChecked && "bg-muted/70",
                        )}
                        onClick={() => !isDisabled && handleToggle(course.id)}
                        disabled={isDisabled}
                      >
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => handleToggle(course.id)}
                          disabled={isDisabled}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium leading-none text-foreground">
                              {course.title}
                            </span>
                            <Badge
                              variant={course.published ? "default" : "secondary"}
                              className="shrink-0"
                            >
                              {course.published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {course.enrollmentCount.toLocaleString()} students
                            </span>
                            {course.lastUpdatedAt && (
                              <span>
                                Updated {new Date(course.lastUpdatedAt).toLocaleDateString()}
                              </span>
                            )}
                            {course.slug && (
                              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                                {course.slug}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            </div>
          </>
        )}

        {showSelectedSummary && (
          <SelectionSummary
            courses={selectedCourses}
            onClear={handleClearSelection}
            allowClear={selectedCourseIds.length > 0}
            mode={effectiveMode}
          />
        )}
      </CardContent>
    </Card>
  )
}

interface ModeToggleProps {
  value: CourseSelectionMode
  onChange: (mode: CourseSelectionMode) => void
  disabled?: boolean
}

function ModeToggle({ value, onChange, disabled }: ModeToggleProps) {
  return (
    <div className="flex items-center gap-3 rounded-full border bg-muted/40 px-2 py-1 text-xs">
      <Label
        htmlFor="course-selector-mode"
        className="text-muted-foreground"
      >
        Mode
      </Label>
      <div className="flex items-center rounded-full bg-background p-1 shadow-inner">
        <Button
          type="button"
          size="sm"
          variant={value === "single" ? "default" : "ghost"}
          className="h-7 rounded-full px-3 text-xs"
          onClick={() => onChange("single")}
          disabled={disabled}
        >
          Single
        </Button>
        <Button
          type="button"
          size="sm"
          variant={value === "multi" ? "default" : "ghost"}
          className="h-7 rounded-full px-3 text-xs"
          onClick={() => onChange("multi")}
          disabled={disabled}
        >
          Multiple
        </Button>
      </div>
    </div>
  )
}

interface SelectionSummaryProps {
  courses: CourseSummary[]
  onClear: () => void
  allowClear: boolean
  mode: CourseSelectionMode
}

function SelectionSummary({ courses, onClear, allowClear, mode }: SelectionSummaryProps) {
  if (courses.length === 0) {
    return (
      <div className="flex items-center justify-between rounded-md border border-dashed bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
        <span>No courses selected</span>
        {mode === "multi" && (
          <span>Select one or more courses to compare</span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-muted-foreground">
        <span>{mode === "multi" ? "Selected Courses" : "Active Course"}</span>
        {allowClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
          >
            <MinusCircle className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {courses.map((course) => (
          <Badge key={course.id} variant="secondary" className="text-xs">
            {course.title}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default CourseSelector
