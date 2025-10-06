"use client"

import { PosthogEmbed } from "./posthog-embed"

interface PosthogInsightEmbedProps {
  insightId: string
  title: string
  description?: string
  className?: string
  height?: number
  showExport?: boolean
}

export function PosthogInsightEmbed({
  insightId,
  title,
  description,
  className,
  height = 400,
  showExport = true,
}: PosthogInsightEmbedProps) {
  return (
    <PosthogEmbed
      insightId={insightId}
      title={title}
      description={description}
      className={className}
      height={height}
      showExport={showExport}
    />
  )
}