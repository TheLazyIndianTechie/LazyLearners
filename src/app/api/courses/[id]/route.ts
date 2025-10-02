import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Input validation schema for updates
const updateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0).optional(),
  published: z.boolean().optional(),
  category: z.enum([
    'GAME_PROGRAMMING',
    'GAME_DESIGN',
    'GAME_ART',
    'GAME_AUDIO',
    'UNITY_DEVELOPMENT',
    'UNREAL_DEVELOPMENT',
    'GODOT_DEVELOPMENT',
    'MOBILE_GAMES',
    'INDIE_DEVELOPMENT',
    'VR_AR_DEVELOPMENT'
  ]).optional(),
  engine: z.enum(['UNITY', 'UNREAL', 'GODOT', 'CUSTOM']).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  duration: z.number().min(1).optional(),
  requirements: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/courses/[id] - Get specific course with optimized queries
export async function GET(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const { searchParams } = new URL(request.url)
    const includeReviews = searchParams.get('includeReviews') === 'true'
    const includeLessons = searchParams.get('includeLessons') === 'true'

    // Get course with basic info and counts
    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            bio: true,
          }
        },
        requirements: {
          orderBy: { order: 'asc' }
        },
        objectives: {
          orderBy: { order: 'asc' }
        },
        tags: true,
        // Get modules with or without lessons based on query param
        modules: includeLessons ? {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        } : {
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            duration: true,
            _count: {
              select: {
                lessons: true
              }
            }
          },
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      }
    })

    if (!course) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    // Get aggregated rating efficiently
    const ratingResult = await prisma.review.aggregate({
      where: { courseId: id },
      _avg: { rating: true }
    })

    const avgRating = ratingResult._avg.rating || 0

    // Get reviews only if requested (for course detail page)
    let reviews = null
    if (includeReviews) {
      const reviewsLimit = Math.min(10, parseInt(searchParams.get('reviewsLimit') || '5'))
      reviews = await prisma.review.findMany({
        where: { courseId: id },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: reviewsLimit
      })
    }

    const formattedCourse = {
      ...course,
      requirements: course.requirements.map(r => r.requirement),
      objectives: course.objectives.map(o => o.objective),
      tags: course.tags.map(t => t.tag),
      rating: avgRating,
      reviewCount: course._count.reviews,
      enrollmentCount: course._count.enrollments,
      reviews,
      // Add total lesson count across all modules
      totalLessons: course.modules.reduce((sum, module) => sum + module._count.lessons, 0)
    }

    return NextResponse.json({ success: true, data: formattedCourse })
  } catch (error) {
    console.error('Failed to fetch course:', error)
    return NextResponse.json(
      { error: 'Failed to fetch course' },
      { status: 500 }
    )
  }
}

// PUT /api/courses/[id] - Update course
export async function PUT(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user owns the course or is admin
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        instructor: {
          select: { id: true, role: true }
        }
      }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (existingCourse.instructorId !== userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only edit your own courses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = updateCourseSchema.parse(body)

    // Extract arrays for separate handling
    const { requirements: reqArray, objectives: objArray, tags: tagArray, ...courseData } = validatedData

    const updateData: any = {
      ...courseData,
    }

    // Handle nested updates for normalized fields
    if (reqArray !== undefined) {
      updateData.requirements = {
        deleteMany: {},
        create: reqArray.map((req, index) => ({
          requirement: req,
          order: index
        }))
      }
    }
    if (objArray !== undefined) {
      updateData.objectives = {
        deleteMany: {},
        create: objArray.map((obj, index) => ({
          objective: obj,
          order: index
        }))
      }
    }
    if (tagArray !== undefined) {
      updateData.tags = {
        deleteMany: {},
        create: tagArray.map(tag => ({
          tag: tag
        }))
      }
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        requirements: {
          orderBy: { order: 'asc' }
        },
        objectives: {
          orderBy: { order: 'asc' }
        },
        tags: true,
        _count: {
          select: {
            modules: true
          }
        }
      }
    })

    const formattedCourse = {
      ...course,
      requirements: course.requirements.map(r => r.requirement),
      objectives: course.objectives.map(o => o.objective),
      tags: course.tags.map(t => t.tag),
    }

    return NextResponse.json({ course: formattedCourse })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to update course:', error)
    return NextResponse.json(
      { error: 'Failed to update course' },
      { status: 500 }
    )
  }
}

// DELETE /api/courses/[id] - Delete course
export async function DELETE(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user owns the course or is admin
    const existingCourse = await prisma.course.findUnique({
      where: { id },
      select: { instructorId: true }
    })

    if (!existingCourse) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (existingCourse.instructorId !== userId && user?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'You can only delete your own courses' },
        { status: 403 }
      )
    }

    // Check if course has enrollments
    const enrollmentCount = await prisma.enrollment.count({
      where: { courseId: id }
    })

    if (enrollmentCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete course with active enrollments' },
        { status: 400 }
      )
    }

    await prisma.course.delete({
      where: { id }
    })

    return NextResponse.json(
      { message: 'Course deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Failed to delete course:', error)
    return NextResponse.json(
      { error: 'Failed to delete course' },
      { status: 500 }
    )
  }
}