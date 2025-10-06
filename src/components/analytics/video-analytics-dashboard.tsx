"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CalendarDays, Users, Play, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { AnalyticsApiClient } from "@/lib/analytics/client"

interface VideoAnalyticsDashboardProps {
  courseId?: string
  videoId?: string
  className?: string
}

interface VideoMetrics {
  totalViews: number
  uniqueViewers: number
  totalWatchTime: number
  averageWatchTime: number
  completionRate: number
  dropOffRate: number
  engagementScore: number
  qualityDistribution: Record<string, number>
  deviceDistribution: Record<string, number>
  retentionData: Array<{
    position: number
    viewersRemaining: number
    dropOffRate: number
  }>
  heatmapData: Array<{
    timeBucket: string
    dayOfWeek: number
    viewCount: number
  }>
}

export function VideoAnalyticsDashboard({
  courseId,
  videoId,
  className
}: VideoAnalyticsDashboardProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("7d")
  const [selectedVideo, setSelectedVideo] = useState(videoId || "")
  const [embedUrls, setEmbedUrls] = useState<Record<string, string>>({})

  const analyticsClient = useMemo(() => new AnalyticsApiClient(), [])

  // Mock data for demonstration - in production this would come from your analytics API
  const mockMetrics: VideoMetrics = {
    totalViews: 1250,
    uniqueViewers: 890,
    totalWatchTime: 15600, // seconds
    averageWatchTime: 375, // seconds
    completionRate: 0.72,
    dropOffRate: 0.28,
    engagementScore: 7.8,
    qualityDistribution: {
      '240p': 45,
      '360p': 120,
      '480p': 280,
      '720p': 650,
      '1080p': 155
    },
    deviceDistribution: {
      desktop: 680,
      mobile: 420,
      tablet: 90
    },
    retentionData: [
      { position: 0, viewersRemaining: 1000, dropOffRate: 0 },
      { position: 60, viewersRemaining: 920, dropOffRate: 0.08 },
      { position: 180, viewersRemaining: 780, dropOffRate: 0.22 },
      { position: 300, viewersRemaining: 650, dropOffRate: 0.35 },
      { position: 600, viewersRemaining: 480, dropOffRate: 0.52 },
      { position: 900, viewersRemaining: 320, dropOffRate: 0.68 }
    ],
    heatmapData: [
      { timeBucket: "09:00", dayOfWeek: 1, viewCount: 45 },
      { timeBucket: "10:00", dayOfWeek: 1, viewCount: 67 },
      { timeBucket: "11:00", dayOfWeek: 1, viewCount: 89 },
      // ... more data
    ]
  }

  const loadEmbedUrl = async (type: 'retention' | 'heatmap' | 'engagement') => {
    try {
      const response = await analyticsClient.getPosthogInsightEmbed({
        insightId: getInsightId(type),
        filters: {
          properties: {
            ...(courseId && { course_id: courseId }),
            ...(selectedVideo && { video_id: selectedVideo })
          },
          date_from: getDateFrom(selectedTimeRange)
        }
      })

      setEmbedUrls(prev => ({
        ...prev,
        [type]: response.url
      }))
    } catch (error) {
      console.error(`Failed to load ${type} embed:`, error)
    }
  }

  const getInsightId = (type: string): string => {
    // These would be actual PostHog insight IDs from your PostHog project
    const insightIds = {
      retention: 'video_retention_analysis',
      heatmap: 'video_watch_heatmap',
      engagement: 'video_engagement_metrics'
    }
    return insightIds[type as keyof typeof insightIds] || ''
  }

  const getDateFrom = (timeRange: string): string => {
    const now = new Date()
    switch (timeRange) {
      case '7d': return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      default: return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`
  }

  return (
    <div className={className}>
      {/* Filters */}
      <div className="flex flex-col gap-4 mb-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          {courseId && (
            <Select value={selectedVideo} onValueChange={setSelectedVideo}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select video" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unity-basics">Unity Basics Tutorial</SelectItem>
                <SelectItem value="csharp-fundamentals">C# Fundamentals</SelectItem>
                <SelectItem value="physics-demo">Physics Demo</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmbedUrl('retention')}
          >
            Load Retention Data
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadEmbedUrl('heatmap')}
          >
            Load Heatmap
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {mockMetrics.uniqueViewers.toLocaleString()} unique viewers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Watch Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatTime(mockMetrics.averageWatchTime)}</div>
            <p className="text-xs text-muted-foreground">
              {formatTime(mockMetrics.totalWatchTime)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(mockMetrics.completionRate)}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentage(mockMetrics.dropOffRate)} drop-off rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Score</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockMetrics.engagementScore}/10</div>
            <p className="text-xs text-muted-foreground">
              Based on interactions
            </p>
          </CardContent>
        </Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Video Retention Analysis</CardTitle>
              <CardDescription>
                Track how many viewers continue watching at different points in the video
              </CardDescription>
            </CardHeader>
            <CardContent>
              {embedUrls.retention ? (
                <iframe
                  src={embedUrls.retention}
                  className="w-full h-96 border rounded"
                  title="Video Retention Analysis"
                />
              ) : (
                <div className="w-full h-96 border rounded flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Click "Load Retention Data" to view the analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Retention Table */}
          <Card>
            <CardHeader>
              <CardTitle>Drop-off Points</CardTitle>
              <CardDescription>Key moments where viewers tend to stop watching</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMetrics.retentionData.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Badge variant={point.dropOffRate > 0.5 ? "destructive" : point.dropOffRate > 0.3 ? "secondary" : "default"}>
                        {formatTime(point.position)}
                      </Badge>
                      <span className="text-sm">
                        {point.viewersRemaining} viewers remaining
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">
                        {formatPercentage(point.dropOffRate)} drop-off
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="heatmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Watch Time Heatmap</CardTitle>
              <CardDescription>
                Visualize when your audience is most active throughout the week
              </CardDescription>
            </CardHeader>
            <CardContent>
              {embedUrls.heatmap ? (
                <iframe
                  src={embedUrls.heatmap}
                  className="w-full h-96 border rounded"
                  title="Watch Time Heatmap"
                />
              ) : (
                <div className="w-full h-96 border rounded flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Click "Load Heatmap" to view the analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Metrics</CardTitle>
              <CardDescription>
                Detailed breakdown of user interactions and engagement patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              {embedUrls.engagement ? (
                <iframe
                  src={embedUrls.engagement}
                  className="w-full h-96 border rounded"
                  title="Engagement Metrics"
                />
              ) : (
                <div className="w-full h-96 border rounded flex items-center justify-center bg-muted/20">
                  <div className="text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Load engagement data to view detailed metrics</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Quality Distribution</CardTitle>
                <CardDescription>Video quality preferences of your audience</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockMetrics.qualityDistribution).map(([quality, count]) => (
                    <div key={quality} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{quality}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(mockMetrics.qualityDistribution))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Distribution</CardTitle>
                <CardDescription>How viewers access your content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(mockMetrics.deviceDistribution).map(([device, count]) => (
                    <div key={device} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{device}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-muted rounded-full h-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{
                              width: `${(count / Math.max(...Object.values(mockMetrics.deviceDistribution))) * 100}%`
                            }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}