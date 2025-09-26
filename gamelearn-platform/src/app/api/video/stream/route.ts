import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import {
  videoStreaming,
  createVideoSession,
  updateVideoSession,
  endVideoSession,
  STREAMING_CONFIG
} from "@/lib/video/streaming"
import { logSecurityEvent } from "@/lib/security/monitoring"
import { z } from "zod"

// Validation schemas
const createSessionSchema = z.object({
  videoId: z.string().min(1, 'Video ID is required'),
  courseId: z.string().optional(), // Allow flexible courseId format (UUID or slug)
  deviceInfo: z.object({
    userAgent: z.string().optional(),
    platform: z.string().optional(),
    browser: z.string().optional(),
    screenResolution: z.string().optional()
  }).optional()
})

const updateSessionSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  currentPosition: z.number().min(0).optional(),
  quality: z.enum(['240p', '360p', '480p', '720p', '1080p']).optional(),
  playbackSpeed: z.number().min(0.25).max(2.0).optional(),
  volume: z.number().min(0).max(1).optional(),
  isFullscreen: z.boolean().optional()
})

const deviceInfoSchema = z.object({
  userAgent: z.string(),
  platform: z.string(),
  browser: z.string(),
  screenResolution: z.string(),
  connection: z.object({
    effectiveType: z.string().optional(),
    downlink: z.number().optional(),
    rtt: z.number().optional()
  }).optional()
})

// GET - Stream video content or get streaming manifest
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_stream_get')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Getting video streaming content")

    // 1. Authentication check
    const { userId } = auth()

    if (!userId) {
      requestLogger.warn("Unauthorized video streaming attempt")
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'video_streaming',
          method: request.method,
          url: request.url
        },
        undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-correlation-id') || undefined
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // 2. Get parameters from URL
    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    const courseId = searchParams.get('courseId')
    const sessionId = searchParams.get('sessionId')
    const quality = searchParams.get('quality') || 'auto'
    const format = searchParams.get('format') || 'hls'

    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Video ID is required" }
        },
        { status: 400 }
      )
    }

    // 3. Verify video exists and user has access
    const videoExists = await verifyVideoExists(videoId)
    if (!videoExists) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Video not found" }
        },
        { status: 404 }
      )
    }

    // 4. Check if user has access to the video/course
    const hasAccess = await verifyUserVideoAccess(userId, videoId, courseId)
    if (!hasAccess) {
      requestLogger.warn("User attempted to access restricted video", {
        userId,
        videoId,
        courseId
      })

      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'video_content',
          videoId,
          courseId,
          action: 'stream_access_denied'
        },
        userId
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied. You need to enroll in this course." }
        },
        { status: 403 }
      )
    }

    // 5. Get or create streaming session if needed
    let streamingManifest
    if (sessionId) {
      // Use existing session
      const existingSession = await videoStreaming.getSession?.(sessionId)
      if (existingSession && existingSession.userId === userId) {
        streamingManifest = await videoStreaming.getManifest?.(sessionId, { quality, format })
      }
    }

    // If no valid session, create a new one
    if (!streamingManifest) {
      const deviceInfo = {
        userAgent: request.headers.get('user-agent') || 'unknown',
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        referer: request.headers.get('referer') || 'unknown'
      }

      streamingManifest = await createVideoSession(
        videoId,
        userId,
        courseId,
        deviceInfo
      )
    }

    // 6. Log streaming access
    requestLogger.info("Video streaming content accessed", {
      sessionId: streamingManifest.sessionId,
      userId,
      videoId,
      courseId,
      quality,
      format
    })

    // 7. Track analytics
    await trackStreamingAnalytics('stream_accessed', {
      sessionId: streamingManifest.sessionId,
      userId,
      videoId,
      courseId,
      quality,
      format
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: streamingManifest.sessionId,
          manifestUrl: streamingManifest.baseUrl,
          streamUrl: streamingManifest.streamUrl || `${streamingManifest.baseUrl}/playlist.m3u8`,
          format: streamingManifest.format,
          qualities: streamingManifest.qualities,
          duration: streamingManifest.duration,
          thumbnails: streamingManifest.thumbnails,
          currentQuality: quality,
          accessToken: streamingManifest.accessToken,
          restrictions: streamingManifest.restrictions,
          watermark: streamingManifest.watermark,
          analytics: streamingManifest.analytics,
          playerConfig: {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            defaultQuality: quality === 'auto' ? STREAMING_CONFIG.abr.defaultQuality : quality,
            enableQualitySelector: true,
            enableSubtitles: true,
            enableFullscreen: !streamingManifest.restrictions.seekingDisabled
          }
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + STREAMING_CONFIG.security.tokenExpiry * 1000).toISOString()
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video streaming access failed", error as Error, {
      operation: 'video_stream_get'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to access video streaming" }
      },
      { status: 500 }
    )
  }
}

// POST - Create new video streaming session
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_stream_create')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Creating video streaming session")

    // 1. Authentication check (allow test access for development)
    const { userId: clerkUserId } = auth()
    let userId = clerkUserId

    // For testing purposes, allow access with a mock user ID
    if (!userId && (process.env.NODE_ENV === 'development' || process.env.ENABLE_VIDEO_TEST === 'true')) {
      userId = 'test-user-123'
      requestLogger.info("Using test user for video streaming testing")
    } else if (!clerkUserId) {
      requestLogger.warn("Unauthorized video streaming attempt")
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'video_streaming',
          method: request.method,
          url: request.url
        },
        undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-correlation-id') || undefined
      )

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
    const validationResult = createSessionSchema.safeParse(body)

    if (!validationResult.success) {
      requestLogger.warn("Invalid session creation parameters", {
        validationErrors: validationResult.error.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid request parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { videoId, courseId, deviceInfo } = validationResult.data

    // 3. Verify video exists and user has access
    const videoExists = await verifyVideoExists(videoId)
    if (!videoExists) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Video not found" }
        },
        { status: 404 }
      )
    }

    // 4. Check if user has access to the video/course
    const hasAccess = await verifyUserVideoAccess(userId, videoId, courseId)
    if (!hasAccess) {
      requestLogger.warn("User attempted to access restricted video", {
        userId,
        videoId,
        courseId
      })

      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'video_content',
          videoId,
          courseId,
          action: 'stream_access_denied'
        },
        userId
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied. You need to enroll in this course." }
        },
        { status: 403 }
      )
    }

    // 5. Extract additional device info from headers
    const enhancedDeviceInfo = {
      ...deviceInfo,
      userAgent: deviceInfo?.userAgent || request.headers.get('user-agent') || 'unknown',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer') || 'unknown'
    }

    // 6. Create streaming session
    const streamingManifest = await createVideoSession(
      videoId,
      userId,
      courseId,
      enhancedDeviceInfo
    )

    // 7. Log streaming session creation
    requestLogger.info("Video streaming session created successfully", {
      sessionId: streamingManifest.sessionId,
      userId,
      videoId,
      courseId,
      format: streamingManifest.format,
      qualityCount: streamingManifest.qualities.length
    })

    // 8. Track analytics
    await trackStreamingAnalytics('session_created', {
      sessionId: streamingManifest.sessionId,
      userId,
      videoId,
      courseId,
      deviceInfo: enhancedDeviceInfo
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: streamingManifest.sessionId,
          manifestUrl: streamingManifest.baseUrl,
          format: streamingManifest.format,
          qualities: streamingManifest.qualities,
          duration: streamingManifest.duration,
          thumbnails: streamingManifest.thumbnails,
          accessToken: streamingManifest.accessToken,
          restrictions: streamingManifest.restrictions,
          watermark: streamingManifest.watermark,
          analytics: streamingManifest.analytics,
          playerConfig: {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            defaultQuality: STREAMING_CONFIG.abr.defaultQuality,
            enableQualitySelector: true,
            enableSubtitles: true,
            enableFullscreen: !streamingManifest.restrictions.seekingDisabled
          }
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString(),
          expiresAt: new Date(Date.now() + STREAMING_CONFIG.security.tokenExpiry * 1000).toISOString()
        }
      },
      { status: 201 }
    )

  } catch (error) {
    requestLogger.error("Video streaming session creation failed", error as Error, {
      operation: 'video_stream_create'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to create video streaming session" }
      },
      { status: 500 }
    )
  }
}

// PUT - Update video streaming session
export async function PUT(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_stream_update')

  try {
    // Authentication check
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateSessionSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid session update parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { sessionId, ...updates } = validationResult.data

    // Verify session exists and belongs to user
    const streamingSession = await videoStreaming.getSession?.(sessionId)
    if (!streamingSession) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Streaming session not found" }
        },
        { status: 404 }
      )
    }

    if (streamingSession.userId !== userId) {
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'video_session',
          sessionId,
          attemptedUserId: userId,
          actualUserId: streamingSession.userId
        },
        userId
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied" }
        },
        { status: 403 }
      )
    }

    // Update session
    await updateVideoSession(sessionId, updates)

    requestLogger.debug("Video streaming session updated", {
      sessionId,
      userId: userId,
      updates: Object.keys(updates)
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Session updated successfully",
          sessionId,
          updates: Object.keys(updates)
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video streaming session update failed", error as Error, {
      operation: 'video_stream_update'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to update streaming session" }
      },
      { status: 500 }
    )
  }
}

// DELETE - End video streaming session
export async function DELETE(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_stream_end')

  try {
    // Authentication check
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Session ID is required" }
        },
        { status: 400 }
      )
    }

    // Verify session exists and belongs to user
    const streamingSession = await videoStreaming.getSession?.(sessionId)
    if (!streamingSession) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Streaming session not found" }
        },
        { status: 404 }
      )
    }

    if (streamingSession.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied" }
        },
        { status: 403 }
      )
    }

    // End session
    await endVideoSession(sessionId)

    // Track analytics
    await trackStreamingAnalytics('session_ended', {
      sessionId,
      userId: userId,
      videoId: streamingSession.videoId,
      courseId: streamingSession.courseId,
      duration: Date.now() - streamingSession.startTime,
      watchTime: streamingSession.watchTime,
      completionPercentage: streamingSession.completionPercentage
    })

    requestLogger.info("Video streaming session ended", {
      sessionId,
      userId: userId,
      watchTime: streamingSession.watchTime,
      completionPercentage: streamingSession.completionPercentage
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Streaming session ended successfully",
          sessionId,
          watchTime: streamingSession.watchTime,
          completionPercentage: streamingSession.completionPercentage
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video streaming session end failed", error as Error, {
      operation: 'video_stream_end'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to end streaming session" }
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function verifyVideoExists(videoId: string): Promise<boolean> {
  try {
    // For testing purposes, allow sample videos
    const testVideoIds = [
      'sample-unity-tutorial',
      'sample-csharp-tutorial',
      'sample-physics-tutorial'
    ]

    if (testVideoIds.includes(videoId)) {
      return true
    }

    // In production, this would check the database for video existence
    const { redis } = await import('@/lib/redis')
    const videoManifest = await redis.get(`video_manifest:${videoId}`)
    return !!videoManifest
  } catch (error) {
    console.warn('Failed to verify video existence:', error)
    // Allow access for testing in development
    return process.env.NODE_ENV === 'development'
  }
}

async function verifyUserVideoAccess(
  userId: string,
  videoId: string,
  courseId?: string
): Promise<boolean> {
  try {
    // If courseId is provided directly, check license for that course
    if (courseId) {
      const licenseKey = await prisma.licenseKey.findFirst({
        where: {
          userId,
          courseId,
          status: 'ACTIVE',
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } }
          ]
        }
      })
      return !!licenseKey
    }

    // If no courseId provided, find the course through the lesson
    // videoId should correspond to lessonId
    const lesson = await prisma.lesson.findUnique({
      where: { id: videoId },
      include: {
        module: {
          include: {
            course: true
          }
        }
      }
    })

    if (!lesson?.module?.course) {
      return false
    }

    // Check if user has active license for the course
    const licenseKey = await prisma.licenseKey.findFirst({
      where: {
        userId,
        courseId: lesson.module.course.id,
        status: 'ACTIVE',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ]
      }
    })

    return !!licenseKey
  } catch (error) {
    console.warn('Failed to verify user video access:', error)
    return false
  }
}

async function trackStreamingAnalytics(
  event: string,
  data: Record<string, any>
): Promise<void> {
  try {
    // In production, this would send analytics to services like:
    // - Google Analytics
    // - Mixpanel
    // - Custom analytics service
    // - Video analytics platforms

    const { redis } = await import('@/lib/redis')
    const analyticsKey = `video_analytics:${data.videoId}:${new Date().toISOString().split('T')[0]}`

    // Increment event counter
    await redis.incrementKey(`${analyticsKey}:${event}`, 60 * 60 * 24) // 24 hours TTL

    // Store detailed event data
    await redis.setAdd(
      `${analyticsKey}:events`,
      JSON.stringify({
        event,
        timestamp: Date.now(),
        ...data
      })
    )

    console.log('Video analytics tracked:', { event, videoId: data.videoId })
  } catch (error) {
    console.warn('Failed to track streaming analytics:', error)
  }
}