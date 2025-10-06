"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Users, Play, Clock, TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { AnalyticsApiClient } from "@/lib/analytics/client"
import { PosthogInsightEmbed } from "./posthog-embed"
import { useAnalytics } from "@/contexts/analytics-context"
import { VideoExportButton } from "@/components/analytics/export-button"

interface VideoAnalyticsDashboardProps {
  courseId?: string
  videoId?: string
  className?: string
}



export function VideoAnalyticsDashboard({
  courseId,
  videoId,
  className
}: VideoAnalyticsDashboardProps) {
  const { selectedCourseIds, dateRange } = useAnalytics()
  const [selectedVideo, setSelectedVideo] = useState(videoId || "")

  const analyticsClient = useMemo(() => new AnalyticsApiClient(), [])

  // Build filters for video analytics
  const videoFilters = useMemo(() => {
    const filters: Record<string, unknown> = {}

    // Add date range filters
    if (dateRange.start && dateRange.end) {
      filters.date_from = dateRange.start.toISOString().split('T')[0]
      filters.date_to = dateRange.end.toISOString().split('T')[0]
    }

    // Initialize properties object
    filters.properties = {}

    // Add course filters
    if (selectedCourseIds.length > 0) {
      filters.properties = {
        ...filters.properties,
        course_ids: selectedCourseIds
      }
    }

    // Add specific course/video filters
    if (courseId || selectedVideo) {
      filters.properties = {
        ...filters.properties,
        ...(courseId && { course_id: courseId }),
        ...(selectedVideo && { video_id: selectedVideo })
      }
    }

    return filters
  }, [selectedCourseIds, dateRange, courseId, selectedVideo])



  return (
    <div className={className}>
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {selectedCourseIds.length > 0 && (
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All videos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All videos</SelectItem>
                <SelectItem value="unity-basics">Unity Basics Tutorial</SelectItem>
                <SelectItem value="csharp-fundamentals">C# Fundamentals</SelectItem>
                <SelectItem value="physics-demo">Physics Demo</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>


      </div>

      {/* Key Video Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <PosthogInsightEmbed
          insightId="video_completion_rate"
          title="Video Completion Rate"
          description="Track completion rates over time"
          height={120}
          showExport={false}
          additionalFilters={videoFilters}
        />
        <PosthogInsightEmbed
          insightId="video_average_watch_time"
          title="Average Watch Time"
          description="Average time spent watching videos"
          height={120}
          showExport={false}
          additionalFilters={videoFilters}
        />
        <PosthogInsightEmbed
          insightId="video_engagement_metrics"
          title="Video Engagement"
          description="Started, completed, paused, and seeked events"
          height={120}
          showExport={false}
          additionalFilters={videoFilters}
        />
        <PosthogInsightEmbed
          insightId="video_drop_off_points"
          title="Drop-off Points"
          description="Where viewers tend to stop watching"
          height={120}
          showExport={false}
          additionalFilters={videoFilters}
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="retention" className="space-y-4">
        <TabsList>
          <TabsTrigger value="retention">Retention Analysis</TabsTrigger>
          <TabsTrigger value="heatmap">Watch Heatmap</TabsTrigger>
          <TabsTrigger value="engagement">Engagement Metrics</TabsTrigger>
          <TabsTrigger value="quality">Quality & Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="retention" className="space-y-4">
          <PosthogInsightEmbed
            insightId="video_retention_analysis"
            title="Video Retention Analysis"
            description="Track how many viewers continue watching at different points in the video"
            height={400}
            additionalFilters={videoFilters}
          />
          <PosthogInsightEmbed
            insightId="video_drop_off_points"
            title="Drop-off Points Analysis"
            description="Detailed breakdown of where viewers tend to stop watching"
            height={300}
            additionalFilters={videoFilters}
          />
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <PosthogInsightEmbed
            insightId="video_watch_heatmap"
            title="Watch Time Heatmap"
            description="Visualize when your audience is most active throughout the week"
            height={400}
            additionalFilters={videoFilters}
          />
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <PosthogInsightEmbed
            insightId="video_engagement_metrics"
            title="Engagement Metrics"
            description="Detailed breakdown of user interactions and engagement patterns"
            height={400}
            additionalFilters={videoFilters}
          />
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PosthogInsightEmbed
              insightId="video_quality_distribution"
              title="Quality Distribution"
              description="Video quality preferences of your audience"
              height={300}
              additionalFilters={videoFilters}
            />
            <PosthogInsightEmbed
              insightId="video_device_distribution"
              title="Device Distribution"
              description="How viewers access your content"
              height={300}
              additionalFilters={videoFilters}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}