import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"

const querySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  preset: z.string().optional(),
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  courseIds: z
    .union([
      z.array(z.string().min(1)),
      z.string().min(1),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .transform((value) => {
      if (!value) return undefined
      return Array.isArray(value) ? value : [value]
    }),
})

interface EngagementMetrics {
  totalActiveUsers: number
  avgSessionDuration: number
  totalVideoViews: number
  totalQuizCompletions: number
  engagementRate: number
  completionRate: number
}

interface EngagementTrend {
  date: string
  activeUsers: number
  sessionDuration: number
  videoViews: number
  quizCompletions: number
}

interface EngagementResponse {
  metrics: EngagementMetrics
  trends: EngagementTrend[]
  generatedAt: string
}

class EngagementAnalyticsService {
  constructor(private readonly client = prisma) {}

  async getEngagementAnalytics(params: {
    instructorId: string
    courseIds?: string[]
    startDate?: string
    endDate?: string
    includeArchived?: boolean
  }): Promise<EngagementResponse> {
    const { instructorId, courseIds, startDate, endDate, includeArchived } = params

    // Get courses for this instructor
    const courses = await this.client.course.findMany({
      where: {
        instructorId,
        ...(includeArchived ? {} : { status: { not: "ARCHIVED" } }),
        ...(courseIds && courseIds.length ? { id: { in: courseIds } } : {}),
      },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })

    const courseIdsList = courses.map(c => c.id)

    // Calculate date range
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const end = endDate ? new Date(endDate) : new Date()

    // Mock engagement metrics - in production, this would aggregate from PostHog or analytics events
    // For now, we'll use enrollment data as a proxy for engagement
    const totalEnrollments = courses.reduce((acc, course) => acc + course._count.enrollments, 0)

    // Generate mock trends data for the last 30 days
    const trends: EngagementTrend[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Mock data with some variation
      const baseMultiplier = Math.sin(i / 5) * 0.3 + 0.7 // Creates wave pattern
      trends.push({
        date: dateStr,
        activeUsers: Math.floor(totalEnrollments * baseMultiplier * 0.1),
        sessionDuration: Math.floor(1800 + Math.random() * 1200), // 30-60 minutes
        videoViews: Math.floor(totalEnrollments * baseMultiplier * 0.05),
        quizCompletions: Math.floor(totalEnrollments * baseMultiplier * 0.02),
      })
    }

    // Calculate aggregate metrics
    const avgActiveUsers = trends.reduce((acc, t) => acc + t.activeUsers, 0) / trends.length
    const avgSessionDuration = trends.reduce((acc, t) => acc + t.sessionDuration, 0) / trends.length
    const totalVideoViews = trends.reduce((acc, t) => acc + t.videoViews, 0)
    const totalQuizCompletions = trends.reduce((acc, t) => acc + t.quizCompletions, 0)

    const metrics: EngagementMetrics = {
      totalActiveUsers: Math.floor(avgActiveUsers),
      avgSessionDuration: Math.floor(avgSessionDuration),
      totalVideoViews,
      totalQuizCompletions,
      engagementRate: totalEnrollments > 0 ? Math.min((avgActiveUsers / totalEnrollments) * 100, 100) : 0,
      completionRate: totalEnrollments > 0 ? Math.min((totalQuizCompletions / totalEnrollments) * 100, 100) : 0,
    }

    return {
      metrics,
      trends,
      generatedAt: new Date().toISOString(),
    }
  }
}

const service = new EngagementAnalyticsService()

export async function GET(request: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const rawCourseIds = url.searchParams.getAll("courseIds[]")

    const parsed = querySchema.safeParse({
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
      preset: url.searchParams.get("preset") ?? undefined,
      includeArchived: url.searchParams.get("includeArchived") ?? undefined,
      courseIds: rawCourseIds.length ? rawCourseIds : url.searchParams.get("courseIds") ?? undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid query parameters",
          issues: parsed.error.issues,
        },
        { status: 400 },
      )
    }

    const {
      courseIds,
      includeArchived,
      startDate,
      endDate,
    } = parsed.data

    const analytics = await service.getEngagementAnalytics({
      instructorId: userId,
      courseIds,
      startDate,
      endDate,
      includeArchived,
    })

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[analytics.engagement] Failed to compute engagement analytics", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request payload",
          issues: error.issues,
        },
        { status: 400 },
      )
    }

    return NextResponse.json(
      {
        message: "Unable to compute engagement analytics",
      },
      { status: 500 },
    )
  }
}