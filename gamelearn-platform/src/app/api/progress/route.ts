import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateLessonProgress, getLessonProgress, getCourseProgress } from "@/lib/progress"
import { progressUpdateSchema, uuidSchema } from "@/lib/validations/common"
import { ZodError } from "zod"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unauthorized" }
        },
        { status: 401 }
      )
    }

    const body = await request.json()

    // Validate input using Zod schema
    const validatedData = progressUpdateSchema.parse(body)
    const { lessonId, progress, timeSpent } = validatedData

    const updatedProgress = await updateLessonProgress(
      session.user.id,
      lessonId,
      progress,
      timeSpent
    )

    return NextResponse.json({
      success: true,
      data: updatedProgress,
      meta: {
        correlationId: request.headers.get("x-correlation-id") || undefined,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    console.error("Error updating progress:", error)
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" }
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unauthorized" }
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    if (lessonId) {
      // Validate lessonId format
      const validatedLessonId = uuidSchema.parse(lessonId)
      const progress = await getLessonProgress(session.user.id, validatedLessonId)
      return NextResponse.json({
        success: true,
        data: progress,
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      })
    }

    if (courseId) {
      // Validate courseId format
      const validatedCourseId = uuidSchema.parse(courseId)
      const progress = await getCourseProgress(session.user.id, validatedCourseId)
      return NextResponse.json({
        success: true,
        data: progress,
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      })
    }

    return NextResponse.json(
      {
        success: false,
        error: { message: "Missing lessonId or courseId parameter" }
      },
      { status: 400 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid ID format",
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    console.error("Error fetching progress:", error)
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" }
      },
      { status: 500 }
    )
  }
}