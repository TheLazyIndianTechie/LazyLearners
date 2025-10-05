import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createVideoSession } from "@/lib/video/streaming"
import { logSecurityEvent } from "@/lib/security/monitoring"
import { createRequestLogger } from "@/lib/logger"

interface RouteContext {
  params: { courseId: string; lessonId: string }
}

/**
 * GET /api/courses/[courseId]/lessons/[lessonId]/stream
 *
 * Stream video content for a specific lesson with enrollment and license validation
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('lesson_video_stream')

  try {
    const { courseId, lessonId } = params
    requestLogger.info("Streaming lesson video", { courseId, lessonId })

    // 1. Authentication check
    const { userId } = await auth()
    if (!userId) {
      requestLogger.warn("Unauthorized lesson video access attempt")
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'lesson_video_stream',
          courseId,
          lessonId,
        },
        undefined,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // 2. Verify lesson exists and has video
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              select: {
                id: true,
                title: true,
                price: true,
                published: true
              }
            }
          }
        }
      }
    })

    if (!lesson) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Lesson not found" }
        },
        { status: 404 }
      )
    }

    if (!lesson.videoUrl) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "This lesson does not have video content" }
        },
        { status: 404 }
      )
    }

    // 3. Verify lesson belongs to specified course
    if (lesson.module.course.id !== courseId) {
      requestLogger.warn("Lesson does not belong to specified course", {
        lessonId,
        expectedCourseId: courseId,
        actualCourseId: lesson.module.course.id
      })
      return NextResponse.json(
        {
          success: false,
          error: { message: "Lesson not found in this course" }
        },
        { status: 404 }
      )
    }

    // 4. Verify course is published (or user is instructor)
    if (!lesson.module.course.published) {
      const course = await prisma.course.findFirst({
        where: {
          id: courseId,
          instructorId: userId
        }
      })

      if (!course) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Course is not published" }
          },
          { status: 403 }
        )
      }
    }

    // 5. Check user enrollment and license validation
    const hasAccess = await verifyLessonAccess(userId, courseId, lesson.module.course.price)

    if (!hasAccess) {
      requestLogger.warn("User attempted to access lesson without enrollment", {
        userId,
        courseId,
        lessonId
      })

      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'lesson_video',
          courseId,
          lessonId,
          action: 'access_denied_no_enrollment'
        },
        userId
      )

      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Access denied. Please enroll in this course to access lesson videos.",
            requiresEnrollment: true,
            courseId
          }
        },
        { status: 403 }
      )
    }

    // 6. Get or create video progress record
    let videoProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    })

    if (!videoProgress) {
      videoProgress = await prisma.videoProgress.create({
        data: {
          userId,
          lessonId,
          watchTime: 0,
          completionPercentage: 0,
          lastPosition: 0,
          resumePosition: 0,
          sessionsCount: 0,
          playbackSpeed: 1.0
        }
      })
    }

    // 7. Extract query parameters
    const { searchParams } = new URL(request.url)
    const quality = searchParams.get('quality') || videoProgress.qualityPreference || 'auto'

    // 8. Create streaming session using existing video streaming infrastructure
    const deviceInfo = {
      userAgent: request.headers.get('user-agent') || 'unknown',
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      referer: request.headers.get('referer') || 'unknown'
    }

    const streamingManifest = await createVideoSession(
      lessonId,
      userId,
      courseId,
      deviceInfo
    )

    // 9. Update video progress session count
    await prisma.videoProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      data: {
        sessionsCount: { increment: 1 }
      }
    })

    // 10. Log successful access
    requestLogger.info("Lesson video stream accessed successfully", {
      userId,
      courseId,
      lessonId,
      sessionId: streamingManifest.sessionId,
      resumePosition: videoProgress.resumePosition
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          sessionId: streamingManifest.sessionId,
          streamUrl: streamingManifest.streamUrl || `${streamingManifest.baseUrl}/playlist.m3u8`,
          manifestUrl: streamingManifest.baseUrl,
          format: streamingManifest.format,
          qualities: streamingManifest.qualities,
          duration: streamingManifest.duration || (lesson.videoDuration || 0),
          thumbnails: streamingManifest.thumbnails,
          currentQuality: quality,
          accessToken: streamingManifest.accessToken,
          // Lesson-specific metadata
          lesson: {
            id: lesson.id,
            title: lesson.title,
            type: lesson.type,
            order: lesson.order
          },
          // Progress data for resume functionality
          progress: {
            resumePosition: videoProgress.resumePosition,
            lastPosition: videoProgress.lastPosition,
            completionPercentage: videoProgress.completionPercentage,
            watchTime: videoProgress.watchTime,
            playbackSpeed: videoProgress.playbackSpeed,
            qualityPreference: videoProgress.qualityPreference
          },
          playerConfig: {
            autoplay: false,
            controls: true,
            responsive: true,
            fluid: true,
            defaultQuality: quality === 'auto' ? '720p' : quality,
            enableQualitySelector: true,
            enableSubtitles: true,
            enableFullscreen: true,
            startTime: videoProgress.resumePosition
          }
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Lesson video streaming failed", error as Error)
    endTimer()

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to stream lesson video" }
      },
      { status: 500 }
    )
  }
}

/**
 * Helper function to verify user has access to lesson content
 */
async function verifyLessonAccess(
  userId: string,
  courseId: string,
  coursePrice: number
): Promise<boolean> {
  try {
    // For free courses, just check enrollment
    if (coursePrice === 0) {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          courseId
        }
      })
      return !!enrollment
    }

    // For paid courses, check active license key
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

    // If license exists, enrollment should exist too
    if (licenseKey) {
      return true
    }

    return false
  } catch (error) {
    console.error('Error verifying lesson access:', error)
    return false
  }
}
