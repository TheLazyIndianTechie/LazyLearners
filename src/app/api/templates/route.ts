import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// POST /api/templates - Create a new template
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { type, name, category, data } = body

    if (!type || !name || !category || !data) {
      return NextResponse.json(
        { error: "Missing required fields: type, name, category, data" },
        { status: 400 }
      )
    }

    if (!["module", "lesson"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid type. Must be 'module' or 'lesson'" },
        { status: 400 }
      )
    }

    // Create template in database
    const template = await prisma.template.create({
      data: {
        type,
        name,
        category,
        data,
        createdBy: userId,
        isPublic: false, // Private by default
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (error) {
    console.error("Failed to create template:", error)
    return NextResponse.json(
      { error: "Failed to create template" },
      { status: 500 }
    )
  }
}

// GET /api/templates - List all templates
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const category = searchParams.get("category")

    // Build query
    const where: any = {
      OR: [
        { createdBy: userId }, // User's own templates
        { isPublic: true }, // Public templates
      ],
    }

    if (type) {
      where.type = type
    }

    if (category) {
      where.category = category
    }

    const templates = await prisma.template.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json({ templates })
  } catch (error) {
    console.error("Failed to fetch templates:", error)
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    )
  }
}
