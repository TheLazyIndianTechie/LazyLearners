import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"

const createModuleSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
})

const reorderModulesSchema = z.object({
  moduleOrders: z.array(z.object({
    id: z.string().cuid(),
    order: z.number().int().min(1)
  })).min(1)
})

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id

    // Check if user is the instructor of this course
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        instructorId: userId,
      },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
            },
          },
        },
      },
    })

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 })
    }

    return NextResponse.json({ modules: course.modules })
  } catch (error) {
    console.error("Failed to fetch modules:", error)
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    )
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id
    const body = await req.json()
    const validatedData = createModuleSchema.parse(body)

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

    // Get the next order number
    const lastModule = await prisma.module.findFirst({
      where: { courseId },
      orderBy: { order: "desc" },
    })

    const module = await prisma.module.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        courseId,
        order: (lastModule?.order || 0) + 1,
      },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({ module })
  } catch (error) {
    console.error("Failed to create module:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to create module" },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const courseId = params.id
    const body = await req.json()
    const validatedData = reorderModulesSchema.parse(body)

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

    // Verify all modules belong to this course
    const moduleIds = validatedData.moduleOrders.map(m => m.id)
    const existingModules = await prisma.module.findMany({
      where: {
        id: { in: moduleIds },
        courseId: courseId,
      },
    })

    if (existingModules.length !== moduleIds.length) {
      return NextResponse.json(
        { error: "One or more modules not found in this course" },
        { status: 400 }
      )
    }

    // Update the order of each module in a transaction
    const updates = validatedData.moduleOrders.map(({ id, order }) =>
      prisma.module.update({
        where: { id },
        data: { order },
      })
    )

    await prisma.$transaction(updates)

    // Return updated modules
    const updatedModules = await prisma.module.findMany({
      where: { courseId },
      orderBy: { order: "asc" },
      include: {
        lessons: {
          orderBy: { order: "asc" },
        },
      },
    })

    return NextResponse.json({
      success: true,
      modules: updatedModules
    })
  } catch (error) {
    console.error("Failed to reorder modules:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 }
    )
  }
}