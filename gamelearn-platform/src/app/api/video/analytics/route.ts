import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  videoStreaming,
  trackVideoEvent,
  getVideoAnalytics
} from "@/lib/video/streaming"
import { z } from "zod"

// Validation schemas
const trackEventSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  eventType: z.enum([
    'play', 'pause', 'seek', 'ended', 'error', 'quality_change',
    'buffer_start', 'buffer_end', 'fullscreen_enter', 'fullscreen_exit',
    'volume_change', 'speed_change', 'subtitle_change', 'chapter_change'
  ]),
  position: z.number().min(0, 'Position must be non-negative'),
  metadata: z.record(z.any()).optional()
})

const analyticsQuerySchema = z.object({
  videoId: z.string().optional(),
  courseId: z.string().uuid().optional(),
  timeRange: z.coerce.number().min(1).max(365).default(7), // days
  aggregation: z.enum(['hourly', 'daily', 'weekly']).default('daily'),
  metrics: z.array(z.enum([
    'views', 'watch_time', 'completion_rate', 'quality_distribution',
    'device_distribution', 'drop_off_points', 'engagement_heatmap'
  ])).default(['views', 'watch_time', 'completion_rate']),
  includeEvents: z.boolean().default(false)
})

// POST - Track video analytics event
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_analytics_track')

  try {
    requestLogger.logRequest(request)

    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = trackEventSchema.safeParse(body)

    if (!validationResult.success) {
      requestLogger.warn("Invalid analytics event data", {
        validationErrors: validationResult.error.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid event data",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { sessionId, eventType, position, metadata } = validationResult.data

    // 3. Verify session ownership
    const streamingSession = await videoStreaming.getSession?.(sessionId)
    if (!streamingSession) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Session not found" }
        },
        { status: 404 }
      )
    }

    if (streamingSession.userId !== session.user.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied" }
        },
        { status: 403 }
      )
    }

    // 4. Enhanced metadata with context
    const enhancedMetadata = {
      ...metadata,
      userId: session.user.id,
      videoId: streamingSession.videoId,
      courseId: streamingSession.courseId,
      userAgent: request.headers.get('user-agent'),
      timestamp: Date.now(),
      sessionAge: Date.now() - streamingSession.startTime
    }

    // 5. Track the event
    await trackVideoEvent(sessionId, eventType, position, enhancedMetadata)

    // 6. Handle special events
    const response = await handleSpecialAnalyticsEvents(
      eventType,
      position,
      enhancedMetadata,
      streamingSession
    )

    requestLogger.info("Video analytics event tracked", {
      sessionId,
      eventType,
      position,
      videoId: streamingSession.videoId,
      userId: session.user.id
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Event tracked successfully",
          sessionId,
          eventType,
          position,
          ...response
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video analytics tracking failed", error as Error, {
      operation: 'video_analytics_track'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to track analytics event" }
      },
      { status: 500 }
    )
  }
}

// GET - Get video analytics data
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_analytics_get')

  try {
    requestLogger.logRequest(request)

    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // 2. Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validationResult = analyticsQuerySchema.safeParse({
      videoId: searchParams.get('videoId'),
      courseId: searchParams.get('courseId'),
      timeRange: searchParams.get('timeRange'),
      aggregation: searchParams.get('aggregation'),
      metrics: searchParams.get('metrics')?.split(','),
      includeEvents: searchParams.get('includeEvents')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid query parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { videoId, courseId, timeRange, aggregation, metrics, includeEvents } = validationResult.data

    // 3. Verify access permissions
    if (videoId && !await verifyVideoAnalyticsAccess(session.user.id, session.user.role, videoId)) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied. You don't have permission to view these analytics." }
        },
        { status: 403 }
      )
    }

    // 4. Get analytics data based on request
    let analyticsData: any = {}

    if (videoId) {
      // Get specific video analytics
      analyticsData = await getVideoAnalytics(videoId, timeRange)
    } else if (courseId) {
      // Get course-level analytics
      analyticsData = await getCourseAnalytics(courseId, timeRange, session.user.id)
    } else {
      // Get user's videos analytics (for instructors)
      analyticsData = await getUserVideosAnalytics(session.user.id, timeRange)
    }

    // 5. Filter metrics if specified
    if (metrics.length > 0) {
      const filteredData: any = {}
      metrics.forEach(metric => {
        if (analyticsData[metric] !== undefined) {
          filteredData[metric] = analyticsData[metric]
        }
      })
      analyticsData = { ...filteredData, metadata: analyticsData.metadata }
    }

    // 6. Add comparison data (previous period)
    const comparisonData = await getComparisonAnalytics(
      videoId,
      courseId,
      session.user.id,
      timeRange,
      aggregation
    )

    requestLogger.info("Video analytics retrieved", {
      videoId,
      courseId,
      userId: session.user.id,
      timeRange,
      metrics,
      dataPoints: Object.keys(analyticsData).length
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          analytics: analyticsData,
          comparison: comparisonData,
          metadata: {
            timeRange,
            aggregation,
            requestedMetrics: metrics,
            includeEvents,
            generatedAt: new Date().toISOString(),
            period: {
              start: new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString(),
              end: new Date().toISOString()
            }
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video analytics retrieval failed", error as Error, {
      operation: 'video_analytics_get'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to retrieve analytics data" }
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function handleSpecialAnalyticsEvents(
  eventType: string,
  position: number,
  metadata: any,
  session: any
): Promise<any> {
  const response: any = {}

  switch (eventType) {
    case 'ended':
      // Mark video as completed if watched >90%
      if (session.completionPercentage >= 90) {
        response.videoCompleted = true
        response.completionTime = Date.now()

        // In production, this would update course progress
        await markVideoAsCompleted(session.userId, session.videoId, session.courseId)
      }
      break

    case 'error':
      // Log error for debugging
      response.errorLogged = true
      await logVideoError(session.videoId, metadata.error, session.userId)
      break

    case 'quality_change':
      // Track quality changes for optimization
      response.qualityChangeTracked = true
      await trackQualityChange(session.videoId, metadata.from, metadata.to, metadata.reason)
      break

    case 'seek':
      // Track seeking behavior for engagement analysis
      if (metadata.seekDirection === 'forward' && metadata.seekDistance > 30) {
        response.skipDetected = true
        await trackSkipBehavior(session.videoId, position, metadata.seekDistance)
      }
      break

    case 'buffer_start':
      // Track buffering issues
      response.bufferIssueTracked = true
      await trackBufferingIssue(session.videoId, position, metadata.bufferHealth)
      break
  }

  return response
}

async function verifyVideoAnalyticsAccess(
  userId: string,
  userRole: string,
  videoId: string
): Promise<boolean> {
  try {
    // Admins can see all analytics
    if (userRole === 'ADMIN') {
      return true
    }

    // Instructors can see analytics for their own videos
    if (userRole === 'INSTRUCTOR') {
      return await isVideoOwner(userId, videoId)
    }

    // Students can see basic analytics for enrolled courses
    if (userRole === 'student') {
      return await isUserEnrolledInVideo(userId, videoId)
    }

    return false
  } catch (error) {
    console.warn('Failed to verify analytics access:', error)
    return false
  }
}

async function getCourseAnalytics(courseId: string, timeRange: number, userId: string): Promise<any> {
  // In production, this would aggregate analytics for all videos in a course
  return {
    courseId,
    totalVideos: 12,
    totalViews: 450,
    averageWatchTime: 420, // seconds
    completionRate: 0.72,
    studentProgress: {
      completed: 8,
      inProgress: 3,
      notStarted: 1
    },
    engagementTrends: [
      { date: '2024-01-01', views: 45, watchTime: 1800 },
      { date: '2024-01-02', views: 52, watchTime: 2100 }
    ]
  }
}

async function getUserVideosAnalytics(userId: string, timeRange: number): Promise<any> {
  // In production, this would get analytics for all videos owned by the user
  return {
    userId,
    totalVideos: 5,
    totalViews: 1250,
    totalWatchTime: 15600, // seconds
    averageEngagement: 0.78,
    topPerformingVideos: [
      { videoId: 'video1', title: 'Unity Basics', views: 450, engagement: 0.85 },
      { videoId: 'video2', title: 'C# for Games', views: 380, engagement: 0.82 }
    ],
    recentTrends: [
      { date: '2024-01-01', views: 125, watchTime: 3200 },
      { date: '2024-01-02', views: 135, watchTime: 3400 }
    ]
  }
}

async function getComparisonAnalytics(
  videoId?: string,
  courseId?: string,
  userId?: string,
  timeRange?: number,
  aggregation?: string
): Promise<any> {
  // In production, this would get comparison data for the previous period
  return {
    previousPeriod: {
      views: 120,
      watchTime: 3600,
      completionRate: 0.68
    },
    changes: {
      views: '+15%',
      watchTime: '+8%',
      completionRate: '+12%'
    }
  }
}

async function markVideoAsCompleted(userId: string, videoId: string, courseId?: string): Promise<void> {
  try {
    // In production, this would update the database
    const { redis } = await import('@/lib/redis')
    await redis.setAdd(`completed_videos:${userId}`, videoId)

    if (courseId) {
      await redis.setAdd(`course_progress:${userId}:${courseId}`, videoId)
    }

    console.log('Video marked as completed:', { userId, videoId, courseId })
  } catch (error) {
    console.warn('Failed to mark video as completed:', error)
  }
}

async function logVideoError(videoId: string, error: any, userId: string): Promise<void> {
  try {
    const { redis } = await import('@/lib/redis')
    const errorLog = {
      videoId,
      error,
      userId,
      timestamp: Date.now()
    }

    await redis.set(
      `video_error:${videoId}:${Date.now()}`,
      errorLog,
      60 * 60 * 24 * 7 // 7 days TTL
    )

    console.log('Video error logged:', errorLog)
  } catch (error) {
    console.warn('Failed to log video error:', error)
  }
}

async function trackQualityChange(videoId: string, from: string, to: string, reason: string): Promise<void> {
  try {
    const { redis } = await import('@/lib/redis')
    const qualityChangeKey = `quality_changes:${videoId}:${new Date().toISOString().split('T')[0]}`

    await redis.incrementKey(`${qualityChangeKey}:${from}_to_${to}`, 60 * 60 * 24)
    await redis.incrementKey(`${qualityChangeKey}:reason:${reason}`, 60 * 60 * 24)
  } catch (error) {
    console.warn('Failed to track quality change:', error)
  }
}

async function trackSkipBehavior(videoId: string, position: number, skipDistance: number): Promise<void> {
  try {
    const { redis } = await import('@/lib/redis')
    const skipKey = `skip_behavior:${videoId}:${Math.floor(position / 30) * 30}` // 30-second buckets

    await redis.incrementKey(skipKey, 60 * 60 * 24 * 30) // 30 days TTL
  } catch (error) {
    console.warn('Failed to track skip behavior:', error)
  }
}

async function trackBufferingIssue(videoId: string, position: number, bufferHealth: number): Promise<void> {
  try {
    const { redis } = await import('@/lib/redis')
    const bufferKey = `buffer_issues:${videoId}:${new Date().toISOString().split('T')[0]}`

    await redis.incrementKey(bufferKey, 60 * 60 * 24)
  } catch (error) {
    console.warn('Failed to track buffering issue:', error)
  }
}

async function isVideoOwner(userId: string, videoId: string): Promise<boolean> {
  // In production, this would check if the user owns the video
  return true // Placeholder
}

async function isUserEnrolledInVideo(userId: string, videoId: string): Promise<boolean> {
  // In production, this would check if the user is enrolled in the course containing the video
  return true // Placeholder
}