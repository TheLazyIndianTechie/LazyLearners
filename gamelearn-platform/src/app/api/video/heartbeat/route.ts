import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { auth } from "@clerk/nextjs/server"

import {
  videoStreaming,
  processVideoHeartbeat,
  trackVideoEvent
} from "@/lib/video/streaming"
import { z } from "zod"

// Validation schema for heartbeat data
const heartbeatSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  currentPosition: z.number().min(0, 'Current position must be non-negative'),
  bufferHealth: z.number().min(0).max(100, 'Buffer health must be between 0-100'),
  quality: z.enum(['240p', '360p', '480p', '720p', '1080p']),
  playbackRate: z.number().min(0.25).max(2.0).default(1.0),
  volume: z.number().min(0).max(1).default(1.0),
  isPlaying: z.boolean(),
  isFullscreen: z.boolean().default(false),
  networkInfo: z.object({
    effectiveType: z.string().optional(),
    downlink: z.number().optional(),
    rtt: z.number().optional(),
    saveData: z.boolean().optional()
  }).optional(),
  playerState: z.object({
    bufferedRanges: z.array(z.object({
      start: z.number(),
      end: z.number()
    })).optional(),
    playedRanges: z.array(z.object({
      start: z.number(),
      end: z.number()
    })).optional(),
    seekableRanges: z.array(z.object({
      start: z.number(),
      end: z.number()
    })).optional()
  }).optional()
})

// POST - Process video heartbeat
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_heartbeat')

  try {
    requestLogger.logRequest(request)

    // 1. Authentication check
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

    // 2. Parse and validate request body
    const body = await request.json()
    const validationResult = heartbeatSchema.safeParse(body)

    if (!validationResult.success) {
      requestLogger.warn("Invalid heartbeat data", {
        validationErrors: validationResult.error.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid heartbeat data",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const heartbeatData = validationResult.data

    // 3. Verify session ownership
    const streamingSession = await videoStreaming.getSession?.(heartbeatData.sessionId)
    if (!streamingSession) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Session not found" }
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

    // 4. Process heartbeat
    const heartbeatResult = await processVideoHeartbeat(
      heartbeatData.sessionId,
      heartbeatData.currentPosition,
      heartbeatData.bufferHealth,
      heartbeatData.quality
    )

    // 5. Track additional analytics if playing
    if (heartbeatData.isPlaying) {
      await trackVideoEvent(
        heartbeatData.sessionId,
        'heartbeat',
        heartbeatData.currentPosition,
        {
          quality: heartbeatData.quality,
          bufferHealth: heartbeatData.bufferHealth,
          playbackRate: heartbeatData.playbackRate,
          volume: heartbeatData.volume,
          isFullscreen: heartbeatData.isFullscreen,
          networkInfo: heartbeatData.networkInfo,
          playerState: heartbeatData.playerState
        }
      )
    }

    // 6. Prepare response with recommendations
    const response = {
      success: true,
      data: {
        status: heartbeatResult.status,
        sessionId: heartbeatData.sessionId,
        serverTime: Date.now(),
        recommendations: {
          quality: heartbeatResult.recommendedQuality,
          messages: heartbeatResult.messages || []
        },
        analytics: {
          watchTime: streamingSession.watchTime,
          completionPercentage: streamingSession.completionPercentage
        }
      }
    }

    // 7. Add quality adaptation recommendations
    if (heartbeatResult.recommendedQuality && heartbeatResult.recommendedQuality !== heartbeatData.quality) {
      response.data.recommendations.messages?.push(
        `Quality change recommended: ${heartbeatData.quality} → ${heartbeatResult.recommendedQuality}`
      )
    }

    // 8. Add buffer health warnings
    if (heartbeatData.bufferHealth < 10) {
      response.data.recommendations.messages?.push('Low buffer detected. Consider reducing quality.')
    } else if (heartbeatData.bufferHealth > 30 && heartbeatData.quality !== '1080p') {
      response.data.recommendations.messages?.push('Good buffer health. Quality can be increased.')
    }

    // 9. Network-based recommendations
    if (heartbeatData.networkInfo?.effectiveType === 'slow-2g' || heartbeatData.networkInfo?.effectiveType === '2g') {
      response.data.recommendations.messages?.push('Slow network detected. Consider using 240p quality.')
    }

    requestLogger.debug("Video heartbeat processed", {
      sessionId: heartbeatData.sessionId,
      position: heartbeatData.currentPosition,
      quality: heartbeatData.quality,
      bufferHealth: heartbeatData.bufferHealth,
      status: heartbeatResult.status
    })

    endTimer()
    return NextResponse.json(response, { status: 200 })

  } catch (error) {
    requestLogger.error("Video heartbeat processing failed", error as Error, {
      operation: 'video_heartbeat'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to process heartbeat" }
      },
      { status: 500 }
    )
  }
}

// GET - Get heartbeat status and session info
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_heartbeat_status')

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

    // Get session info
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

    if (streamingSession.userId !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Access denied" }
        },
        { status: 403 }
      )
    }

    // Calculate session metrics
    const sessionAge = Date.now() - streamingSession.startTime
    const timeSinceLastActivity = Date.now() - streamingSession.lastActivity
    const isActive = timeSinceLastActivity < 60000 // Active if updated within last minute

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId,
          status: isActive ? 'active' : 'inactive',
          sessionAge,
          timeSinceLastActivity,
          currentPosition: streamingSession.currentPosition,
          quality: streamingSession.quality,
          playbackSpeed: streamingSession.playbackSpeed,
          volume: streamingSession.volume,
          isFullscreen: streamingSession.isFullscreen,
          watchTime: streamingSession.watchTime,
          completionPercentage: streamingSession.completionPercentage,
          eventCount: streamingSession.events.length,
          recentEvents: streamingSession.events.slice(-5) // Last 5 events
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Video heartbeat status request failed", error as Error, {
      operation: 'video_heartbeat_status'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to get heartbeat status" }
      },
      { status: 500 }
    )
  }
}