import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

import { prisma } from "@/lib/prisma"
import { z, ZodError } from "zod"

// Validation schema for progress updates
const progressUpdateSchema = z.object({
  courseId: z.string().cuid(),
  lessonId: z.string().cuid(),
  completionPercentage: z.number().min(0).max(100),
  completed: z.boolean().optional(),
  timeSpent: z.number().min(0).optional(),
})

const courseProgressSchema = z.object({
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
    const validatedData = progressUpdateSchema.parse(body)
    const { courseId, lessonId, completionPercentage, completed, timeSpent } = validatedData

    // Check if user is enrolled in the course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: userId,
        courseId: courseId
      }
    })

    if (!enrollment) {
      return NextResponse.json(
        { error: "You must be enrolled in this course to track progress" },
        { status: 403 }
      )
    }

    // Get existing progress to ensure we don't decrease completion
    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_courseId_lessonId: {
          userId: userId,
          courseId: courseId,
          lessonId: lessonId,
        }
      }
    })

    const finalCompletionPercentage = existingProgress
      ? Math.max(existingProgress.completionPercentage, completionPercentage)
      : completionPercentage

    // Create or update progress record
    const progressData = await prisma.progress.upsert({
      where: {
        userId_courseId_lessonId: {
          userId: userId,
          courseId: courseId,
          lessonId: lessonId,
        }
      },
      update: {
        completionPercentage: finalCompletionPercentage,
        completed: completed || finalCompletionPercentage >= 90,
        timeSpent: (existingProgress?.timeSpent || 0) + (timeSpent || 0),
        lastAccessed: new Date(),
      },
      create: {
        userId: userId,
        courseId: courseId,
        lessonId: lessonId,
        completionPercentage: finalCompletionPercentage,
        completed: completed || finalCompletionPercentage >= 90,
        timeSpent: timeSpent || 0,
        lastAccessed: new Date(),
      }
    })

    return NextResponse.json({
      success: true,
      data: progressData
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors
        },
        { status: 400 }
      )
    }

    console.error("Error updating progress:", error)
    return NextResponse.json(
      { error: "Failed to update progress" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const lessonId = searchParams.get("lessonId")
    const courseId = searchParams.get("courseId")

    if (lessonId && courseId) {
      // Get specific lesson progress
      const progress = await prisma.progress.findUnique({
        where: {
          userId_courseId_lessonId: {
            userId: userId,
            courseId: courseId,
            lessonId: lessonId,
          }
        }
      })

      return NextResponse.json({
        success: true,
        data: progress
      })
    }

    if (courseId) {
      // Get all progress for a course
      const progress = await prisma.progress.findMany({
        where: {
          userId: userId,
          courseId: courseId
        },
        include: {
          lesson: {
            select: {
              id: true,
              title: true,
              order: true
            }
          }
        },
        orderBy: [
          { lesson: { order: 'asc' } }
        ]
      })

      return NextResponse.json({
        success: true,
        data: progress
      })
    }

    return NextResponse.json(
      { error: "Missing courseId parameter" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error fetching progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    )
  }
}