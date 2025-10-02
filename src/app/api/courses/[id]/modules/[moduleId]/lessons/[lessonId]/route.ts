import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateLessonSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.enum(["VIDEO", "INTERACTIVE", "QUIZ", "PROJECT", "READING"]).optional(),
  content: z.string().optional(),
  duration: z.number().min(0).optional(),
  videoUrl: z.string().optional(),
  description: z.string().max(2000).optional(),
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string; lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId, lessonId } = params

    // Check if user is the instructor of this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: userId,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const lesson = await prisma.lesson.findFirst({
      where: {
        id: lessonId,
        moduleId,
        module: {
          courseId,
        },
      },
    })

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 })
    }

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("Failed to fetch lesson:", error)
    return NextResponse.json(
      { error: "Failed to fetch lesson" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string; lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId, lessonId } = params
    const body = await req.json()
    const validatedData = updateLessonSchema.parse(body)

    // Check if user is the instructor of this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: userId,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    const lesson = await prisma.lesson.update({
      where: {
        id: lessonId,
        moduleId,
        module: {
          courseId,
        },
      },
      data: validatedData,
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("Failed to update lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to update lesson" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string; lessonId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId, lessonId } = params

    // Check if user is the instructor of this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: userId,
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    // Delete the lesson
    await prisma.lesson.delete({
      where: {
        id: lessonId,
        moduleId,
        module: {
          courseId,
        },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete lesson:", error)
    return NextResponse.json(
      { error: "Failed to delete lesson" },
      { status: 500 }
    )
  }
}