import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { enrollUserInCourse, getUserEnrollments } from "@/lib/payment"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const enrollments = await getUserEnrollments(session.user.id)

    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error getting enrollments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if the course is free or if the user has already paid
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    if (course.price > 0) {
      return NextResponse.json(
        { error: "Payment required for this course" },
        { status: 400 }
      )
    }

    const enrollment = await enrollUserInCourse(session.user.id, courseId)

    if (!enrollment) {
      return NextResponse.json(
        { error: "Failed to enroll in course" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      enrollment
    })
  } catch (error) {
    console.error("Error enrolling in course:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}