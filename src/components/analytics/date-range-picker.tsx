"use client"

import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useAnalyticsDateRange } from "@/contexts/analytics-context"

type PresetKey = "7d" | "30d" | "90d" | "ytd" | "custom"

interface PresetDefinition {
  key: PresetKey
  label: string
  description: string
  compute: () => { start: Date; end: Date; preset: PresetKey }
}

const PRESETS: PresetDefinition[] = [
  {
    key: "7d",
    label: "Last 7 days",
    description: "Insights from the past week",
    compute: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 6)
      return { start, end, preset: "7d" }
    },
  },
  {
    key: "30d",
    label: "Last 30 days",
    description: "Rolling monthly performance",
    compute: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 29)
      return { start, end, preset: "30d" }
    },
  },
  {
    key: "90d",
    label: "Last 90 days",
    description: "Quarter-to-date trends",
    compute: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(end.getDate() - 89)
      return { start, end, preset: "90d" }
    },
  },
  {
    key: "ytd",
    label: "Year to date",
    description: "From January 1 to today",
    compute: () => {
      const end = new Date()
      const start = new Date(end.getFullYear(), 0, 1)
      return { start, end, preset: "ytd" }
    },
  },
]

function asDateInputValue(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function parseDateInput(value: string): Date | undefined {
  if (!value) return undefined
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return undefined
  return parsed
}

function formatRange(start: Date, end: Date): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  })

  return `${formatter.format(start)} – ${formatter.format(end)}`
}

export interface AnalyticsDateRangePickerProps {
  className?: string
  heading?: string
  description?: string
}

export function AnalyticsDateRangePicker({
  className,
  heading = "Date range",
  description = "Select a time period to hydrate analytics throughout the dashboard.",
}: AnalyticsDateRangePickerProps) {
  const { dateRange, setDateRange } = useAnalyticsDateRange()

  const [customStart, setCustomStart] = useState(asDateInputValue(dateRange.start))
  const [customEnd, setCustomEnd] = useState(asDateInputValue(dateRange.end))
  const [error, setError] = useState<string | null>(null)

  const activePreset = useMemo<PresetKey>(() => {
    if (dateRange.preset && dateRange.preset !== "custom") {
      return dateRange.preset
    }
    return "custom"
  }, [dateRange.preset])

  useEffect(() => {
    setCustomStart(asDateInputValue(dateRange.start))
    setCustomEnd(asDateInputValue(dateRange.end))
  }, [dateRange.start, dateRange.end])

  const handlePresetClick = (preset: PresetDefinition) => {
    const { start, end, preset: presetKey } = preset.compute()
    setError(null)
    setCustomStart(asDateInputValue(start))
    setCustomEnd(asDateInputValue(end))
    setDateRange({ start, end, preset: presetKey })
  }

  const applyCustomRange = () => {
    const parsedStart = parseDateInput(customStart)
    const parsedEnd = parseDateInput(customEnd)

    if (!parsedStart || !parsedEnd) {
      setError("Please provide both start and end dates.")
      return
    }

    if (parsedStart > parsedEnd) {
      setError("Start date must be before the end date.")
      return
    }

    setError(null)
    setDateRange({ start: parsedStart, end: parsedEnd, preset: "custom" })
  }

  return (
    <section className={cn("rounded-lg border bg-card p-4 shadow-sm", className)}>
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">{heading}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <Badge variant="outline" className="w-fit whitespace-nowrap text-xs font-medium">
          {formatRange(dateRange.start, dateRange.end)}
        </Badge>
      </div>

      <Separator className="my-4" />

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {PRESETS.map((preset) => {
          const isActive = activePreset === preset.key
          return (
            <Button
              key={preset.key}
              type="button"
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="h-auto justify-start gap-2 text-left"
              onClick={() => handlePresetClick(preset)}
            >
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.description}</span>
              </span>
            </Button>
          )
        })}
      </div>

      <Separator className="my-4" />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1">
          <label htmlFor="analytics-custom-start" className="text-xs font-medium uppercase text-muted-foreground">
            Start date
          </label>
          <Input
            id="analytics-custom-start"
            type="date"
            value={customStart}
            onChange={(event) => setCustomStart(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="analytics-custom-end" className="text-xs font-medium uppercase text-muted-foreground">
            End date
          </label>
          <Input
            id="analytics-custom-end"
            type="date"
            value={customEnd}
            onChange={(event) => setCustomEnd(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Adjust the custom range and click apply to override preset selections.
        </p>
      )}

      <div className="mt-4 flex justify-end">
        <Button type="button" size="sm" onClick={applyCustomRange}>
          Apply custom range
        </Button>
      </div>
    </section>
  )
}

export default AnalyticsDateRangePicker
