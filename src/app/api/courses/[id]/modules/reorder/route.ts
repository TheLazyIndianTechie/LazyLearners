import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/db"
import { z } from "zod"

const ReorderModulesSchema = z.object({
  modules: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
})

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is instructor
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user || user.role !== "INSTRUCTOR") {
      return NextResponse.json(
        { error: "Only instructors can reorder modules" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { modules } = ReorderModulesSchema.parse(body)

    // Update all module orders in a transaction
    await prisma.$transaction(
      modules.map((module) =>
        prisma.module.update({
          where: { id: module.id },
          data: { order: module.order },
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Failed to reorder modules:", error)
    return NextResponse.json(
      { error: "Failed to reorder modules" },
      { status: 500 }
    )
  }
}
