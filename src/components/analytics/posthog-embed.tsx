"use client"

import { useEffect, useMemo, useState } from "react"
import { useAnalytics } from "@/contexts/analytics-context"
import { usePosthogEmbed } from "@/hooks/use-analytics-data"
import { useEmbedCache } from "@/hooks/use-embed-cache"
import { useGlobalFilterSync } from "@/hooks/use-global-filter-sync"
import { filterSyncService } from "@/lib/analytics/filter-sync"
import { useUser } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PosthogEmbedProps {
  insightId?: string
  dashboardId?: string
  title: string
  description?: string
  className?: string
  height?: number
  showExport?: boolean
  additionalFilters?: Record<string, unknown>
}

export function PosthogEmbed({
  insightId,
  dashboardId,
  title,
  description,
  className,
  height = 600,
  showExport = true,
  additionalFilters = {},
}: PosthogEmbedProps) {
  const { user } = useUser()
  const { getCachedEmbed, setCachedEmbed } = useEmbedCache()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [cachedData, setCachedData] = useState<any>(null)
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({})

  // Use global filter sync
  const { getPlatformFilters } = useGlobalFilterSync({
    onFiltersChanged: (platform, filters) => {
      if (platform === 'posthog') {
        setCurrentFilters(filters)
      }
    },
  })

  // Get filters from global filter system and merge with additional filters
  const filters = useMemo(() => {
    const globalFilters = getPlatformFilters('posthog')

    // Add instructor filter for scoped analytics
    if (user?.id) {
      globalFilters.instructor_id = user.id
    }

    // Merge with additional filters
    Object.assign(globalFilters, additionalFilters)

    return globalFilters
  }, [getPlatformFilters, user?.id, additionalFilters])

  const cacheKey = useMemo(() => ({
    type: 'posthog' as const,
    resourceId: insightId || dashboardId || '',
    filters,
  }), [insightId, dashboardId, filters])

  const embedOptions = useMemo(() => ({
    insightId,
    dashboardId,
    filters,
    refresh: isRefreshing,
  }), [insightId, dashboardId, filters, isRefreshing])

  const { getEmbed, isLoading, data, error } = usePosthogEmbed("/api/analytics/posthog/embed")

  // Check cache first, then fetch if needed
  useEffect(() => {
    if (Object.keys(filters).length === 0) return

    const cached = getCachedEmbed(cacheKey)
    if (cached && !isRefreshing) {
      setCachedData(cached)
      return
    }

    getEmbed(embedOptions).then((result) => {
      if (result) {
        setCachedEmbed(cacheKey, result)
        setCachedData(result)
      }
    })
  }, [filters, getEmbed, embedOptions, cacheKey, getCachedEmbed, setCachedEmbed, isRefreshing])

  // Update cached data when fresh data arrives
  useEffect(() => {
    if (data) {
      setCachedEmbed(cacheKey, data)
      setCachedData(data)
    }
  }, [data, cacheKey, setCachedEmbed])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await getEmbed({ ...embedOptions, refresh: true })
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    const resourceId = insightId || dashboardId
    if (!resourceId) return

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'posthog',
          resourceId,
          format,
          filters,
          async: true,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start export')
      }

      const result = await response.json()
      const jobId = result.jobId

      // Poll for completion
      const pollExport = async () => {
        const statusResponse = await fetch(`/api/analytics/export?jobId=${jobId}`)
        const statusData = await statusResponse.json()

        if (statusData.success && statusData.job.status === 'completed' && statusData.job.downloadUrl) {
          window.open(statusData.job.downloadUrl, '_blank')
        } else if (statusData.job.status === 'failed') {
          console.error('Export failed:', statusData.job.error)
        } else {
          // Continue polling
          setTimeout(pollExport, 1000)
        }
      }

      pollExport()
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {showExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
                disabled={!data?.url}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={!data?.url}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                PDF
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading || isRefreshing}
            className="gap-1"
          >
            <RefreshCw className={cn("h-4 w-4", (isLoading || isRefreshing) && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {error && (
          <Alert variant="destructive" className="m-4 rounded-none border-0 border-b">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load analytics: {error.message}
            </AlertDescription>
          </Alert>
        )}
        {isLoading && !data && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}
        {(cachedData?.url || data?.url) && (
          <iframe
            src={cachedData?.url || data?.url}
            width="100%"
            height={height}
            frameBorder="0"
            className="w-full"
            title={title}
          />
        )}
      </CardContent>
    </Card>
  )
}