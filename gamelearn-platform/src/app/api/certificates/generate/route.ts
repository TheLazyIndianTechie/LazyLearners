import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { generateCertificate } from "@/lib/progress"
import { z } from "zod"

const generateCertificateSchema = z.object({
  courseId: z.string().cuid(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId } = generateCertificateSchema.parse(body)

    const certificate = await generateCertificate(userId, courseId)

    return NextResponse.json({
      success: true,
      data: certificate,
      message: "Certificate generated successfully",
    })
  } catch (error) {
    console.error("Error generating certificate:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes("requirements not met")) {
        return NextResponse.json(
          { error: "Course completion requirements not met for certificate generation" },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to generate certificate" },
      { status: 500 }
    )
  }
}