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

// GET /api/courses - List all courses or user's courses
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const instructorId = searchParams.get('instructorId')
    const published = searchParams.get('published')
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')

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
        modules: {
          include: {
            lessons: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            reviews: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate ratings and format response
    const formattedCourses = courses.map(course => {
      const avgRating = course.reviews.length > 0
        ? course.reviews.reduce((sum, review) => sum + review.rating, 0) / course.reviews.length
        : 0

      return {
        ...course,
        requirements: course.requirements ? JSON.parse(course.requirements) : [],
        objectives: course.objectives ? JSON.parse(course.objectives) : [],
        tags: course.tags ? JSON.parse(course.tags) : [],
        rating: avgRating,
        reviewCount: course._count.reviews,
        enrollmentCount: course._count.enrollments,
      }
    })

    return NextResponse.json({ courses: formattedCourses })
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
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is instructor or admin
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

    const course = await prisma.course.create({
      data: {
        ...validatedData,
        instructorId: userId,
        requirements: validatedData.requirements ? JSON.stringify(validatedData.requirements) : null,
        objectives: validatedData.objectives ? JSON.stringify(validatedData.objectives) : null,
        tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
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
        modules: true,
      }
    })

    const formattedCourse = {
      ...course,
      requirements: course.requirements ? JSON.parse(course.requirements) : [],
      objectives: course.objectives ? JSON.parse(course.objectives) : [],
      tags: course.tags ? JSON.parse(course.tags) : [],
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