import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createLessonSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["VIDEO", "INTERACTIVE", "QUIZ", "PROJECT", "READING"]),
  content: z.string().default(""),
  duration: z.number().min(0).default(0),
  videoUrl: z.string().optional(),
  description: z.string().max(2000).optional(),
})

const reorderLessonsSchema = z.object({
  lessonOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(1)
  })).min(1)
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId } = params

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

    const lessons = await prisma.lesson.findMany({
      where: {
        moduleId,
        module: {
          courseId,
        },
      },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({ lessons })
  } catch (error) {
    console.error("Failed to fetch lessons:", error)
    return NextResponse.json(
      { error: "Failed to fetch lessons" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId } = params
    const body = await req.json()
    const validatedData = createLessonSchema.parse(body)

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

    // Verify the module exists and belongs to this course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
      },
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Get the next order number
    const lastLesson = await prisma.lesson.findFirst({
      where: { moduleId },
      orderBy: { order: "desc" },
    })

    const lesson = await prisma.lesson.create({
      data: {
        title: validatedData.title,
        type: validatedData.type,
        content: validatedData.content,
        duration: validatedData.duration,
        videoUrl: validatedData.videoUrl,
        description: validatedData.description,
        moduleId,
        order: (lastLesson?.order || 0) + 1,
      },
    })

    return NextResponse.json({ lesson })
  } catch (error) {
    console.error("Failed to create lesson:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create lesson" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: courseId, moduleId } = params
    const body = await req.json()
    const validatedData = reorderLessonsSchema.parse(body)

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

    // Verify the module exists and belongs to this course
    const module = await prisma.module.findFirst({
      where: {
        id: moduleId,
        courseId,
      },
    })

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    // Verify all lessons belong to this module
    const lessonIds = validatedData.lessonOrders.map(l => l.id)
    const existingLessons = await prisma.lesson.findMany({
      where: {
        id: { in: lessonIds },
        moduleId: moduleId,
      },
    })

    if (existingLessons.length !== lessonIds.length) {
      return NextResponse.json(
        { error: "One or more lessons not found in this module" },
        { status: 400 }
      )
    }

    // Update the order of each lesson in a transaction
    const updates = validatedData.lessonOrders.map(({ id, order }) =>
      prisma.lesson.update({
        where: { id },
        data: { order },
      })
    )

    await prisma.$transaction(updates)

    // Return updated lessons
    const updatedLessons = await prisma.lesson.findMany({
      where: { moduleId },
      orderBy: { order: "asc" },
    })

    return NextResponse.json({
      success: true,
      lessons: updatedLessons
    })
  } catch (error) {
    console.error("Failed to reorder lessons:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to reorder lessons" },
      { status: 500 }
    )
  }
}