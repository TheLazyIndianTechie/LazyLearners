import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { getUserCertificates } from "@/lib/progress"

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const certificates = await getUserCertificates(userId)

    return NextResponse.json({
      success: true,
      data: certificates,
    })
  } catch (error) {
    console.error("Error fetching user certificates:", error)
    return NextResponse.json(
      { error: "Failed to fetch certificates" },
      { status: 500 }
    )
  }
}