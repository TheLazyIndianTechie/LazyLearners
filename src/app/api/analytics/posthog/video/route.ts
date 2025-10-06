import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { createPosthogEmbed } from "@/lib/analytics/posthog-embed"

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { message: "Authentication required" } },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { dashboardId, insightId, filters, courseId, videoId } = body

    // 3. Build PostHog filters for video analytics
    const posthogFilters = {
      ...filters,
      properties: {
        ...filters?.properties,
        ...(courseId && { course_id: courseId }),
        ...(videoId && { video_id: videoId })
      }
    }

    // 4. Create embed URL
    const embedResponse = await createPosthogEmbed({
      dashboardId,
      insightId,
      filters: posthogFilters
    })

    return NextResponse.json({
      success: true,
      data: embedResponse
    })

  } catch (error) {
    console.error("Failed to create PostHog video analytics embed:", error)
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to create analytics embed" }
      },
      { status: 500 }
    )
  }
}