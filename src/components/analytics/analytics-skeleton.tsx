"use client"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsSkeletonProps {
  kpiCount?: number
  chartSections?: number
  showFilters?: boolean
  className?: string
}

function KPISkeletonRow({ count }: { count: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`kpi-skeleton-${index}`}
          className="rounded-lg border bg-card p-4 shadow-sm"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-4 h-8 w-32" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-6 h-64 w-full rounded-md" />
    </div>
  )
}

function FiltersSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card/40 p-4 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-10 w-40 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  )
}

export function AnalyticsSkeleton({
  kpiCount = 4,
  chartSections = 3,
  showFilters = true,
  className,
}: AnalyticsSkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="space-y-3">
        <Skeleton className="h-4 w-52" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-4 w-96" />
      </div>

      {showFilters && <FiltersSkeleton />}

      <KPISkeletonRow count={kpiCount} />

      <div className="flex flex-col gap-6">
        {Array.from({ length: chartSections }).map((_, index) => (
          <ChartSkeleton key={`chart-skeleton-${index}`} />
        ))}
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-10 w-28 rounded-md" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={`table-skeleton-${index}`} className="space-y-3 rounded-md border p-4">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsSkeleton
