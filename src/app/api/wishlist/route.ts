import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// GET /api/wishlist - Get user's wishlist
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const wishlistItems = await prisma.wishlist.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
            tags: {
              select: {
                tag: true,
              },
            },
            modules: {
              include: {
                lessons: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Calculate ratings for each course
    const coursesWithRatings = await Promise.all(
      wishlistItems.map(async (item) => {
        const reviews = await prisma.review.findMany({
          where: { courseId: item.course.id },
          select: { rating: true },
        })

        const avgRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

        return {
          id: item.id,
          addedAt: item.createdAt,
          course: {
            ...item.course,
            rating: avgRating,
            reviewCount: reviews.length,
            enrollmentCount: item.course._count.enrollments,
            tags: item.course.tags.map((t) => t.tag),
          },
        }
      })
    )

    return NextResponse.json({
      items: coursesWithRatings,
      total: coursesWithRatings.length,
    })
  } catch (error) {
    console.error('Get wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wishlist' },
      { status: 500 }
    )
  }
}

// POST /api/wishlist - Add course to wishlist
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { courseId } = body

    if (!courseId) {
      return NextResponse.json(
        { error: 'Course ID is required' },
        { status: 400 }
      )
    }

    // Check if course exists and is published
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, published: true },
    })

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    if (!course.published) {
      return NextResponse.json(
        { error: 'Cannot add unpublished course to wishlist' },
        { status: 400 }
      )
    }

    // Check if already in wishlist
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Course already in wishlist' },
        { status: 409 }
      )
    }

    // Check if already enrolled
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (enrollment) {
      return NextResponse.json(
        { error: 'Already enrolled in this course' },
        { status: 409 }
      )
    }

    // Add to wishlist
    const wishlistItem = await prisma.wishlist.create({
      data: {
        userId,
        courseId,
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            price: true,
          },
        },
      },
    })

    return NextResponse.json(
      {
        message: 'Course added to wishlist',
        item: wishlistItem,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Add to wishlist error:', error)
    return NextResponse.json(
      { error: 'Failed to add to wishlist' },
      { status: 500 }
    )
  }
}
