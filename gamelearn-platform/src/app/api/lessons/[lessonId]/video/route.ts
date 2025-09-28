import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const assignVideoSchema = z.object({
  videoJobId: z.string().min(1),
  videoUrl: z.string().url().optional(),
})

// POST - Assign a processed video to a lesson
export async function POST(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = params
    const body = await req.json()
    const validatedData = assignVideoSchema.parse(body)

    // Get the lesson and verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Check if user is the instructor of this course
    if (lesson.module.course.instructorId !== userId) {
      return NextResponse.json(
        { error: "Only the course instructor can assign videos to lessons" },
        { status: 403 }
      )
    }

    // Verify the video job exists and belongs to this user
    const { getVideoJob } = await import("@/lib/video/processing")
    const videoJob = await getVideoJob(validatedData.videoJobId)

    if (!videoJob || videoJob.userId !== userId) {
      return NextResponse.json(
        { error: "Video job not found or access denied" },
        { status: 404 }
      )
    }

    if (videoJob.status !== "completed") {
      return NextResponse.json(
        { error: "Video processing is not yet complete" },
        { status: 400 }
      )
    }

    // Update the lesson with the video information
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        type: "VIDEO", // Ensure lesson type is set to VIDEO
        videoUrl: validatedData.videoUrl || videoJob.outputUrl,
        content: JSON.stringify({
          videoJobId: validatedData.videoJobId,
          videoQualities: videoJob.qualities,
          videoDuration: videoJob.duration,
          processingCompletedAt: videoJob.completedAt,
        }),
        duration: Math.ceil((videoJob.duration || 0) / 60), // Convert seconds to minutes
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        lesson: updatedLesson,
        videoJob: {
          id: videoJob.id,
          status: videoJob.status,
          qualities: videoJob.qualities,
          duration: videoJob.duration,
          outputUrl: videoJob.outputUrl,
        },
      },
      message: "Video successfully assigned to lesson",
    })
  } catch (error) {
    console.error("Failed to assign video to lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to assign video to lesson" },
      { status: 500 }
    )
  }
}

// GET - Get video information for a lesson
export async function GET(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = params

    // Get the lesson and verify access
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { userId },
                },
              },
            },
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    const course = lesson.module.course
    const isInstructor = course.instructorId === userId
    const isEnrolled = course.enrollments.length > 0

    if (!isInstructor && !isEnrolled) {
      return NextResponse.json(
        { error: "Access denied. You must be enrolled in this course or be the instructor." },
        { status: 403 }
      )
    }

    if (lesson.type !== "VIDEO" || !lesson.videoUrl) {
      return NextResponse.json(
        { error: "This lesson does not have an associated video" },
        { status: 404 }
      )
    }

    // Parse lesson content to get video information
    let videoInfo = {}
    try {
      if (lesson.content) {
        videoInfo = JSON.parse(lesson.content)
      }
    } catch (error) {
      console.warn("Failed to parse lesson content as JSON:", error)
    }

    return NextResponse.json({
      success: true,
      data: {
        lessonId: lesson.id,
        videoUrl: lesson.videoUrl,
        duration: lesson.duration,
        videoInfo,
        canAccess: true,
        isInstructor,
      },
    })
  } catch (error) {
    console.error("Failed to get lesson video info:", error)
    return NextResponse.json(
      { error: "Failed to get video information" },
      { status: 500 }
    )
  }
}

// DELETE - Remove video from lesson
export async function DELETE(
  req: NextRequest,
  { params }: { params: { lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId } = params

    // Get the lesson and verify ownership
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    // Check if user is the instructor of this course
    if (lesson.module.course.instructorId !== userId) {
      return NextResponse.json(
        { error: "Only the course instructor can remove videos from lessons" },
        { status: 403 }
      )
    }

    // Update the lesson to remove video information
    const updatedLesson = await prisma.lesson.update({
      where: { id: lessonId },
      data: {
        videoUrl: null,
        content: lesson.type === "VIDEO" ? null : lesson.content, // Keep content for non-video lessons
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedLesson,
      message: "Video removed from lesson successfully",
    })
  } catch (error) {
    console.error("Failed to remove video from lesson:", error)
    return NextResponse.json(
      { error: "Failed to remove video from lesson" },
      { status: 500 }
    )
  }
}