import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { getUserEnrolledCourses } from "@/lib/progress"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const enrolledCourses = await getUserEnrolledCourses(userId)

    const dashboardData = {
      enrolledCourses,
      stats: {
        totalCourses: enrolledCourses.length,
        completedCourses: enrolledCourses.filter(course => course.progress >= 100).length,
        averageProgress: enrolledCourses.length > 0
          ? Math.round(enrolledCourses.reduce((sum, course) => sum + course.progress, 0) / enrolledCourses.length)
          : 0,
        totalTimeSpent: enrolledCourses.reduce((sum, course) => {
          return sum + (course.modules?.flatMap(m => m.lessons).reduce((lessonSum, lesson) => {
            return lessonSum + (lesson.progress?.[0]?.timeSpent || 0)
          }, 0) || 0)
        }, 0)
      }
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}