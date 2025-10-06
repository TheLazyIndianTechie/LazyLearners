import { NextResponse, type NextRequest } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { z } from "zod"

import { prisma } from "@/lib/prisma"
import {
  createCourseAnalyticsService,
  type CourseAnalyticsRepository,
  type CoursePerformanceParams,
  type CourseSnapshot,
  type CourseDailyRecord,
} from "@/lib/analytics/course-service"

const querySchema = z.object({
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  preset: z.string().optional(),
  includeArchived: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true"),
  realtime: z
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
  baselineCourseId: z.string().min(1).optional(),
  comparisonCourseIds: z
    .union([
      z.array(z.string().min(1)),
      z.string().min(1),
      z.undefined(),
      z.null(),
    ])
    .optional()
    .transform((value) => {
      if (!value) return []
      return Array.isArray(value) ? value : [value]
    }),
})

class PrismaCourseAnalyticsRepository implements CourseAnalyticsRepository {
  constructor(private readonly client = prisma) {}

  async fetchCourseSnapshots(params: CoursePerformanceParams): Promise<CourseSnapshot[]> {
    // TODO: Replace placeholder implementation with real aggregation queries.
    // This stub keeps the endpoint functional until full analytics aggregation
    // is implemented.
    if (!params.instructorId) {
      return []
    }

    const courses = await this.client.course.findMany({
      where: {
        instructorId: params.instructorId,
        ...(params.includeArchived ? {} : { status: { not: "ARCHIVED" } }),
        ...(params.courseIds && params.courseIds.length
          ? { id: { in: params.courseIds } }
          : {}),
      },
      select: {
        id: true,
        title: true,
        updatedAt: true,
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return courses.map((course) => ({
      courseId: course.id,
      courseTitle: course.title,
      enrollments: course._count.enrollments,
      completions: 0,
      activeLearners: course._count.enrollments,
      averageProgress: 0,
      revenueCents: 0,
      previousPeriod: {
        enrollments: 0,
        completions: 0,
        revenueCents: 0,
      },
    }))
  }

  async fetchCourseDailyRecords(params: CoursePerformanceParams): Promise<CourseDailyRecord[]> {
    // TODO: Replace placeholder implementation with time-series aggregations.
    if (!params.instructorId) {
      return []
    }

    const courseIds =
      params.courseIds && params.courseIds.length
        ? params.courseIds
        : await this.client.course
            .findMany({
              where: {
                instructorId: params.instructorId,
                ...(params.includeArchived ? {} : { status: { not: "ARCHIVED" } }),
              },
              select: { id: true },
            })
            .then((all) => all.map((course) => course.id))

    const today = new Date()
    return courseIds.map((courseId) => ({
      courseId,
      date: today.toISOString().split("T")[0],
      enrollments: 0,
      completions: 0,
      activeLearners: 0,
      revenueCents: 0,
    }))
  }
}

const repository = new PrismaCourseAnalyticsRepository()
const service = createCourseAnalyticsService(repository)

export async function GET(request: NextRequest) {
  const { userId } = auth()

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const rawCourseIds = url.searchParams.getAll("courseIds[]")
    const rawComparisonCourseIds = url.searchParams.getAll("comparisonCourseIds[]")

    const parsed = querySchema.safeParse({
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
      preset: url.searchParams.get("preset") ?? undefined,
      includeArchived: url.searchParams.get("includeArchived") ?? undefined,
      realtime: url.searchParams.get("realtime") ?? undefined,
      baselineCourseId: url.searchParams.get("baselineCourseId") ?? undefined,
      courseIds: rawCourseIds.length ? rawCourseIds : url.searchParams.get("courseIds") ?? undefined,
      comparisonCourseIds: rawComparisonCourseIds.length
        ? rawComparisonCourseIds
        : url.searchParams.get("comparisonCourseIds") ?? undefined,
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
      comparisonCourseIds,
      baselineCourseId,
      includeArchived,
      preset,
      startDate,
      endDate,
      realtime,
    } = parsed.data

    const params: CoursePerformanceParams = {
      instructorId: userId,
      courseIds,
      comparisonCourseIds,
      baselineCourseId,
      includeArchived,
      preset,
      startDate,
      endDate,
      realtime,
    }

    const analytics = await service.getCoursePerformance(params)

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("[analytics.performance] Failed to compute analytics", error)

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
        message: "Unable to compute course performance analytics",
      },
      { status: 500 },
    )
  }
}
