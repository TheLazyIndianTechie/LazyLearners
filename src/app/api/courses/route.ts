import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Input validation schema
const createCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  thumbnail: z.string().url().optional(),
  price: z.number().min(0),
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
  ]),
  engine: z.enum(['UNITY', 'UNREAL', 'GODOT', 'CUSTOM']).optional(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  duration: z.number().min(1),
  requirements: z.array(z.string()).optional(),
  objectives: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
})

// GET /api/courses - List all courses or user's courses with pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const published = searchParams.get('published')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}

    if (instructorId) {
      where.instructorId = instructorId
    }

    if (published !== null) {
      where.published = published === 'true'
    }

    if (category && category !== 'all') {
      where.category = category.toUpperCase()
    }

    if (difficulty && difficulty !== 'all') {
      where.difficulty = difficulty.toUpperCase()
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Get total count for pagination
    const totalCourses = await prisma.course.count({ where })

    // Optimized query without N+1 issues
    const courses = await prisma.course.findMany({
      where,
      include: {
        instructor: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          }
        },
        // Include normalized relationships
        requirements: {
          orderBy: { order: 'asc' }
        },
        objectives: {
          orderBy: { order: 'asc' }
        },
        tags: true,
        // Only get count of modules and lessons, not full data
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    })

    // Get aggregated ratings efficiently using raw query
    const courseIds = courses.map(course => course.id)
    const ratings = await prisma.review.groupBy({
      by: ['courseId'],
      where: {
        courseId: {
          in: courseIds
        }
      },
      _avg: {
        rating: true
      }
    })

    // Create ratings lookup map
    const ratingsMap = new Map(
      ratings.map(r => [r.courseId, r._avg.rating || 0])
    )

    // Get lesson counts efficiently by course using a simpler approach
    const lessonCountsMap = new Map<string, number>()

    // Aggregate lesson counts by course using the modules
    const modulesWithLessonCounts = await prisma.module.findMany({
      where: {
        courseId: {
          in: courseIds
        }
      },
      select: {
        courseId: true,
        _count: {
          select: {
            lessons: true
          }
        }
      }
    })

    // Aggregate lesson counts by course
    modulesWithLessonCounts.forEach(module => {
      const currentCount = lessonCountsMap.get(module.courseId) || 0
      lessonCountsMap.set(module.courseId, currentCount + module._count.lessons)
    })

    // Format response with optimized data
    const formattedCourses = courses.map(course => {
      return {
        ...course,
        requirements: course.requirements.map(r => r.requirement),
        objectives: course.objectives.map(o => o.objective),
        tags: course.tags.map(t => t.tag),
        rating: ratingsMap.get(course.id) || 0,
        reviewCount: course._count.reviews,
        enrollmentCount: course._count.enrollments,
        moduleCount: course._count.modules,
        lessonCount: lessonCountsMap.get(course.id) || 0,
      }
    })

    // Calculate pagination info
    const totalPages = Math.ceil(totalCourses / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1

    return NextResponse.json({
      courses: formattedCourses,
      pagination: {
        page,
        limit,
        totalCourses,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    })
  } catch (error) {
    console.error('Failed to fetch courses:', error)
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    )
  }
}

// POST /api/courses - Create a new course
export async function POST(request: NextRequest) {
  try {
    // Get current user from Clerk
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user exists and is instructor or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || (user.role !== 'INSTRUCTOR' && user.role !== 'ADMIN')) {
      return NextResponse.json(
        { error: 'Only instructors can create courses' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const validatedData = createCourseSchema.parse(body)

    // Extract arrays for separate creation
    const { requirements: reqArray, objectives: objArray, tags: tagArray, ...courseData } = validatedData

    const course = await prisma.course.create({
      data: {
        ...courseData,
        instructorId: userId,
        // Create related records
        requirements: reqArray ? {
          create: reqArray.map((req, index) => ({
            requirement: req,
            order: index
          }))
        } : undefined,
        objectives: objArray ? {
          create: objArray.map((obj, index) => ({
            objective: obj,
            order: index
          }))
        } : undefined,
        tags: tagArray ? {
          create: tagArray.map(tag => ({
            tag: tag
          }))
        } : undefined,
      },
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
        modules: true,
      }
    })

    const formattedCourse = {
      ...course,
      requirements: course.requirements.map(r => r.requirement),
      objectives: course.objectives.map(o => o.objective),
      tags: course.tags.map(t => t.tag),
    }

    return NextResponse.json(
      { course: formattedCourse },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Failed to create course:', error)
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    )
  }
}