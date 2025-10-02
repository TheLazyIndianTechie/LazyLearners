import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { enrollUserInCourse, getUserEnrollments } from "@/lib/payment"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get("courseId")

    if (courseId) {
      // Check specific course enrollment
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId: userId,
          courseId: courseId
        }
      })

      return NextResponse.json({ enrollment })
    }

    // Get all user enrollments
    const enrollments = await getUserEnrollments(userId)
    return NextResponse.json({ enrollments })
  } catch (error) {
    console.error("Error getting enrollments:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { courseId } = await request.json()

    if (!courseId) {
      return NextResponse.json({ error: "Course ID is required" }, { status: 400 })
    }

    // Check if the course exists and get pricing info
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true }
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // For paid courses, check if user has a valid license key
    if (course.price > 0) {
      const licenseKey = await prisma.licenseKey.findFirst({
        where: {
          userId: userId,
          courseId: courseId,
          status: 'ACTIVE'
        }
      })

      if (!licenseKey) {
        return NextResponse.json(
          { error: "Valid license key required for this paid course. Please purchase the course first." },
          { status: 403 }
        )
      }
    }

    const enrollment = await enrollUserInCourse(userId, courseId)

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