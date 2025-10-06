import { NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized. Instructor account required." },
      { status: 401 }
    )
  }

  try {
    const courses = await prisma.course.findMany({
      where: {
        instructorId: userId,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        updatedAt: true,
        modules: {
          select: {
            lessons: {
              select: {
                _count: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 100,
    })

    const mapped = courses.map((course) => {
      const lessonCount = course.modules.reduce((total, module) => {
        return total + module.lessons.length
      }, 0)

      return {
        id: course.id,
        title: course.title,
        slug: course.slug ?? undefined,
        published: course.status === "PUBLISHED",
        enrollmentCount: course._count.enrollments,
        lessonCount,
        lastUpdatedAt: course.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({
      courses: mapped,
      meta: {
        count: mapped.length,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[analytics.courses] failed to load courses", error)

    return NextResponse.json(
      {
        message: "Unable to load instructor courses for analytics.",
      },
      { status: 500 }
    )
  }
}
