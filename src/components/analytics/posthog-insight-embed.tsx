"use client"

import { useMemo } from "react"
import { PosthogEmbed } from "./posthog-embed"
import { POSTHOG_INSIGHTS } from "@/lib/analytics/posthog-config"

interface PosthogInsightEmbedProps {
  insightId: string
  title: string
  description?: string
  className?: string
  height?: number
  showExport?: boolean
  additionalFilters?: Record<string, unknown>
}

export function PosthogInsightEmbed({
  insightId,
  title,
  description,
  className,
  height = 400,
  showExport = true,
  additionalFilters: propAdditionalFilters,
}: PosthogInsightEmbedProps) {
  // Get insight-level filters and merge with prop filters
  const additionalFilters = useMemo(() => {
    const insight = POSTHOG_INSIGHTS[insightId]
    const insightFilters = insight?.filters || {}
    return { ...insightFilters, ...propAdditionalFilters }
  }, [insightId, propAdditionalFilters])

  return (
    <PosthogEmbed
      insightId={insightId}
      title={title}
      description={description}
      className={className}
      height={height}
      showExport={showExport}
      additionalFilters={additionalFilters}
    />
  )
}