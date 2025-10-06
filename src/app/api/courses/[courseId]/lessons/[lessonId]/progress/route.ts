import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { createRequestLogger } from "@/lib/logger"
import { z } from "zod"
import { AnalyticsTracker } from "@/lib/analytics/events"

interface RouteContext {
  params: { courseId: string; lessonId: string }
}

const updateProgressSchema = z.object({
  watchTime: z.number().min(0).optional(),
  completionPercentage: z.number().min(0).max(100).optional(),
  lastPosition: z.number().min(0).optional(),
  resumePosition: z.number().min(0).optional(),
  qualityPreference: z.string().optional(),
  playbackSpeed: z.number().min(0.25).max(2.0).optional()
})

/**
 * GET /api/courses/[courseId]/lessons/[lessonId]/progress
 *
 * Fetch user's video progress for a specific lesson
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const requestLogger = createRequestLogger(request)

  try {
    const { courseId, lessonId } = params

    // Authentication check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // Verify lesson exists and belongs to course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          select: { courseId: true }
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

    if (lesson.module.courseId !== courseId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Lesson not found in this course" }
        },
        { status: 404 }
      )
    }

    // Get or create video progress
    let videoProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    })

    if (!videoProgress) {
      // Create initial progress record
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

    return NextResponse.json(
      {
        success: true,
        data: {
          progress: {
            watchTime: videoProgress.watchTime,
            completionPercentage: videoProgress.completionPercentage,
            lastPosition: videoProgress.lastPosition,
            resumePosition: videoProgress.resumePosition,
            qualityPreference: videoProgress.qualityPreference,
            playbackSpeed: videoProgress.playbackSpeed,
            sessionsCount: videoProgress.sessionsCount,
            lastWatchedAt: videoProgress.updatedAt
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Failed to fetch lesson progress", error as Error)

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to fetch lesson progress" }
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/courses/[courseId]/lessons/[lessonId]/progress
 *
 * Update user's video progress for a specific lesson
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const requestLogger = createRequestLogger(request)

  try {
    const { courseId, lessonId } = params

    // Authentication check
    const { userId } = await auth()
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
    const validationResult = updateProgressSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid progress update parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    // Verify lesson exists and belongs to course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                instructor: true,
              },
            },
          },
        },
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

    if (lesson.module.courseId !== courseId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Lesson not found in this course" }
        },
        { status: 404 }
      )
    }

    const updates = validationResult.data

    // Get existing progress for comparison
    const existingProgress = await prisma.videoProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      }
    })

    // Update or create video progress
    const videoProgress = await prisma.videoProgress.upsert({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      update: {
        ...updates,
        updatedAt: new Date()
      },
      create: {
        userId,
        lessonId,
        watchTime: updates.watchTime || 0,
        completionPercentage: updates.completionPercentage || 0,
        lastPosition: updates.lastPosition || 0,
        resumePosition: updates.resumePosition || 0,
        qualityPreference: updates.qualityPreference,
        playbackSpeed: updates.playbackSpeed || 1.0,
        sessionsCount: 0
      }
    })

    // Track video checkpoint analytics
    if (updates.completionPercentage !== undefined || updates.watchTime !== undefined) {
      const wasCompleted = existingProgress ? existingProgress.completionPercentage >= 90 : false;
      const isNowCompleted = videoProgress.completionPercentage >= 90;

      AnalyticsTracker.trackVideoCheckpoint({
        userId,
        courseId,
        courseTitle: lesson.module.course.title,
        lessonId,
        lessonTitle: lesson.title,
        moduleId: lesson.moduleId,
        videoDuration: lesson.videoDuration || 0,
        currentPosition: videoProgress.lastPosition,
        completionPercentage: videoProgress.completionPercentage,
        quality: videoProgress.qualityPreference || undefined,
        playbackSpeed: videoProgress.playbackSpeed,
        instructorId: lesson.module.course.instructorId,
      });

      // Track video completed if it just reached completion
      if (!wasCompleted && isNowCompleted) {
        AnalyticsTracker.trackVideoCompleted({
          userId,
          courseId,
          courseTitle: lesson.module.course.title,
          lessonId,
          lessonTitle: lesson.title,
          moduleId: lesson.moduleId,
          videoDuration: lesson.videoDuration || 0,
          currentPosition: videoProgress.lastPosition,
          completionPercentage: videoProgress.completionPercentage,
          quality: videoProgress.qualityPreference || undefined,
          playbackSpeed: videoProgress.playbackSpeed,
          instructorId: lesson.module.course.instructorId,
          timeSpent: videoProgress.watchTime,
        });
      }
    }

    // If lesson is marked as completed (>90% watched), update overall progress
    if (videoProgress.completionPercentage >= 90) {
      // Check if lesson progress record exists
      const lessonProgress = await prisma.progress.findUnique({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        }
      })

      if (!lessonProgress || lessonProgress.status !== 'COMPLETED') {
        // Mark lesson as completed
        await prisma.progress.upsert({
          where: {
            userId_lessonId: {
              userId,
              lessonId
            }
          },
          update: {
            status: 'COMPLETED',
            completedAt: new Date()
          },
          create: {
            userId,
            lessonId,
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })

        requestLogger.info("Lesson marked as completed", {
          userId,
          courseId,
          lessonId,
          completionPercentage: videoProgress.completionPercentage
        })
      }
    } else if (videoProgress.completionPercentage > 0) {
      // Mark lesson as in progress if not already completed
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId,
            lessonId
          }
        },
        update: {
          status: 'IN_PROGRESS'
        },
        create: {
          userId,
          lessonId,
          status: 'IN_PROGRESS'
        }
      })
    }

    requestLogger.debug("Lesson progress updated", {
      userId,
      lessonId,
      completionPercentage: videoProgress.completionPercentage,
      watchTime: videoProgress.watchTime
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          progress: {
            watchTime: videoProgress.watchTime,
            completionPercentage: videoProgress.completionPercentage,
            lastPosition: videoProgress.lastPosition,
            resumePosition: videoProgress.resumePosition,
            qualityPreference: videoProgress.qualityPreference,
            playbackSpeed: videoProgress.playbackSpeed,
            sessionsCount: videoProgress.sessionsCount,
            lastWatchedAt: videoProgress.updatedAt
          }
        }
      },
      { status: 200 }
    )

  } catch (error) {
    requestLogger.error("Failed to update lesson progress", error as Error)

    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to update lesson progress" }
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/courses/[courseId]/lessons/[lessonId]/progress
 *
 * Alias for PUT - create or update progress
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  return PUT(request, context)
}
