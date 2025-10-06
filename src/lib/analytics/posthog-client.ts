export interface VideoAnalyticsQuery {
  videoId?: string
  courseId?: string
  userId?: string
  timeRange: number // days
  aggregation?: 'hourly' | 'daily' | 'weekly'
}

export interface VideoAnalyticsData {
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

export class PostHogVideoAnalyticsClient {
  private apiKey: string
  private host: string

  constructor(apiKey: string, host: string) {
    this.apiKey = apiKey
    this.host = host
  }

  async getVideoAnalytics(query: VideoAnalyticsQuery): Promise<VideoAnalyticsData> {
    // For now, return mock data that simulates real analytics
    // In production, this would query PostHog's API
    const { videoId, timeRange } = query

    // Simulate different data based on videoId and timeRange for testing
    const baseViews = videoId ? 150 : 1250
    const timeMultiplier = Math.max(1, timeRange / 7) // Scale with time range

    return {
      totalViews: Math.floor(baseViews * timeMultiplier),
      uniqueViewers: Math.floor((baseViews * 0.8) * timeMultiplier),
      totalWatchTime: Math.floor(45000 * timeMultiplier),
      averageWatchTime: 375,
      completionRate: 0.78,
      dropOffRate: 0.22,
      engagementScore: 78,
      qualityDistribution: {
        '240p': Math.floor(10 * timeMultiplier),
        '360p': Math.floor(25 * timeMultiplier),
        '480p': Math.floor(35 * timeMultiplier),
        '720p': Math.floor(25 * timeMultiplier),
        '1080p': Math.floor(5 * timeMultiplier)
      },
      deviceDistribution: {
        desktop: Math.floor(60 * timeMultiplier),
        mobile: Math.floor(30 * timeMultiplier),
        tablet: Math.floor(10 * timeMultiplier)
      },
      retentionData: [
        { position: 0, viewersRemaining: 100, dropOffRate: 0 },
        { position: 60, viewersRemaining: 85, dropOffRate: 0.15 },
        { position: 180, viewersRemaining: 70, dropOffRate: 0.30 },
        { position: 300, viewersRemaining: 55, dropOffRate: 0.45 },
        { position: 600, viewersRemaining: 35, dropOffRate: 0.65 },
        { position: 900, viewersRemaining: 20, dropOffRate: 0.80 }
      ],
      heatmapData: [
        { timeBucket: "09:00", dayOfWeek: 1, viewCount: Math.floor(45 * timeMultiplier) },
        { timeBucket: "10:00", dayOfWeek: 1, viewCount: Math.floor(67 * timeMultiplier) },
        { timeBucket: "11:00", dayOfWeek: 1, viewCount: Math.floor(89 * timeMultiplier) },
        { timeBucket: "14:00", dayOfWeek: 2, viewCount: Math.floor(123 * timeMultiplier) },
        { timeBucket: "15:00", dayOfWeek: 2, viewCount: Math.floor(145 * timeMultiplier) },
        { timeBucket: "16:00", dayOfWeek: 2, viewCount: Math.floor(167 * timeMultiplier) }
      ]
    }
  }
}

// Singleton instance
let posthogClient: PostHogVideoAnalyticsClient | null = null

export function getPostHogVideoAnalyticsClient(): PostHogVideoAnalyticsClient {
  if (!posthogClient) {
    const apiKey = process.env.POSTHOG_API_KEY || ''
    const host = process.env.POSTHOG_HOST || 'https://app.posthog.com'

    if (!apiKey) {
      // For development, allow empty API key and use mock data
      console.warn('POSTHOG_API_KEY not set, using mock analytics data')
    }

    posthogClient = new PostHogVideoAnalyticsClient(apiKey, host)
  }

  return posthogClient
}