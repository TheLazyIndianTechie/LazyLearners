import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getCourseProgress } from "@/lib/progress"

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { courseId } = params

    if (!courseId) {
      return NextResponse.json(
        { error: "Course ID is required" },
        { status: 400 }
      )
    }

    // Check if user is enrolled in the course
    const { prisma } = await import("@/lib/prisma")
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to view progress" },
        { status: 403 }
      )
    }

    const courseProgress = await getCourseProgress(userId, courseId)

    if (!courseProgress) {
      return NextResponse.json(
        { error: "Course not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: courseProgress,
    })
  } catch (error) {
    console.error("Error fetching course progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch course progress" },
      { status: 500 }
    )
  }
}