"use client"

import { useEffect, useMemo, useState } from "react"
import { useAnalytics } from "@/contexts/analytics-context"
import { useEmbedCache } from "@/hooks/use-embed-cache"
import { useGlobalFilterSync } from "@/hooks/use-global-filter-sync"
import { filterSyncService } from "@/lib/analytics/filter-sync"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, RefreshCw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetabaseEmbedProps {
  dashboardId: number
  questionId?: number
  title: string
  description?: string
  className?: string
  height?: number
  showExport?: boolean
}

interface MetabaseEmbedResponse {
  url: string
  iframeUrl: string
  expiresAt: string
}

export function MetabaseEmbed({
  dashboardId,
  questionId,
  title,
  description,
  className,
  height = 600,
  showExport = true,
}: MetabaseEmbedProps) {
  const { getCachedEmbed, setCachedEmbed } = useEmbedCache()
  const [embedData, setEmbedData] = useState<MetabaseEmbedResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentFilters, setCurrentFilters] = useState<Record<string, unknown>>({})

  // Use global filter sync
  const { getPlatformFilters } = useGlobalFilterSync({
    onFiltersChanged: (platform, filters) => {
      if (platform === 'metabase') {
        setCurrentFilters(filters)
      }
    },
  })

  // Get filters from global filter system
  const filters = useMemo(() => {
    return getPlatformFilters('metabase')
  }, [getPlatformFilters])

  const cacheKey = useMemo(() => ({
    type: 'metabase' as const,
    resourceId: dashboardId.toString(),
    filters,
  }), [dashboardId, filters])

  // Fetch embed token
  const fetchEmbed = async (refresh = false) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/analytics/metabase/embed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardId,
          questionId,
          filters,
          parameters: filters, // Metabase uses parameters for filtering
          refresh,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get embed token: ${response.status}`)
      }

      const data = await response.json()
      const embedResult = data.data
      setEmbedData(embedResult)
      setCachedEmbed(cacheKey, embedResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load embed")
    } finally {
      setIsLoading(false)
    }
  }

  // Check cache first, then fetch if needed
  useEffect(() => {
    const cached = getCachedEmbed(cacheKey)
    if (cached && !isRefreshing) {
      setEmbedData(cached)
      return
    }

    fetchEmbed()
  }, [filters, cacheKey, getCachedEmbed, setCachedEmbed, isRefreshing])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchEmbed(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'metabase',
          resourceId: dashboardId.toString(),
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
                disabled={!embedData?.url}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={!embedData?.url}
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
               {error.includes("not configured") ? (
                 <div>
                   <p className="font-medium">Metabase Integration Not Configured</p>
                   <p className="text-sm mt-1">
                     Advanced analytics dashboards require Metabase setup. Contact your administrator to enable this feature.
                   </p>
                 </div>
               ) : (
                 `Failed to load analytics: ${error}`
               )}
             </AlertDescription>
           </Alert>
         )}
        {isLoading && !embedData && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="space-y-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        )}
        {embedData?.url && (
          <iframe
            src={embedData.url}
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

export default MetabaseEmbed