import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { updateLessonProgress, getLessonProgress, getCourseProgress } from "@/lib/progress"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { lessonId, progress, timeSpent } = await request.json()

    if (!lessonId || progress === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate progress is a number between 0 and 100
    if (typeof progress !== 'number' || progress < 0 || progress > 100) {
      return NextResponse.json({ error: "Progress must be a number between 0 and 100" }, { status: 400 })
    }

    // Validate timeSpent is a non-negative number
    const validTimeSpent = timeSpent ?? 0
    if (typeof validTimeSpent !== 'number' || validTimeSpent < 0) {
      return NextResponse.json({ error: "Time spent must be a non-negative number" }, { status: 400 })
    }

    const updatedProgress = await updateLessonProgress(
      session.user.id,
      lessonId,
      progress,
      validTimeSpent
    )

    return NextResponse.json(updatedProgress)
  } catch (error) {
    console.error("Error updating progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    if (lessonId) {
      const progress = await getLessonProgress(session.user.id, lessonId)
      return NextResponse.json(progress)
    }

    if (courseId) {
      const progress = await getCourseProgress(session.user.id, courseId)
      return NextResponse.json(progress)
    }

    return NextResponse.json({ error: "Missing lessonId or courseId" }, { status: 400 })
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}