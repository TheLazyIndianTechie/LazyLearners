import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'both' // 'featured', 'trending', or 'both'
    const limit = parseInt(searchParams.get('limit') || '8')

    const response: any = {}

    // Fetch featured courses
    if (type === 'featured' || type === 'both') {
      const featured = await prisma.course.findMany({
        where: {
          published: true,
          isFeatured: true,
        },
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
        take: limit,
        orderBy: [
          { viewCount: 'desc' }, // Most viewed featured courses first
          { createdAt: 'desc' },
        ],
      })

      const featuredWithRatings = await Promise.all(
        featured.map(async (course) => {
          const reviews = await prisma.review.findMany({
            where: { courseId: course.id },
            select: { rating: true },
          })

          const avgRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0

          return {
            ...course,
            rating: avgRating,
            reviewCount: reviews.length,
            enrollmentCount: course._count.enrollments,
            tags: course.tags.map((t) => t.tag),
          }
        })
      )

      response.featured = featuredWithRatings
    }

    // Fetch trending courses
    if (type === 'trending' || type === 'both') {
      // Get courses with recent enrollment activity
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const allCourses = await prisma.course.findMany({
        where: {
          published: true,
        },
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
          enrollments: {
            where: {
              enrolledAt: {
                gte: thirtyDaysAgo,
              },
            },
          },
          _count: {
            select: {
              enrollments: true,
              reviews: true,
            },
          },
        },
      })

      const coursesWithTrendingScore = await Promise.all(
        allCourses.map(async (course) => {
          const reviews = await prisma.review.findMany({
            where: { courseId: course.id },
            select: { rating: true },
          })

          const avgRating =
            reviews.length > 0
              ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
              : 0

          // Calculate trending score
          const recentEnrollments = course.enrollments.length
          const totalEnrollments = course._count.enrollments
          const enrollmentGrowth =
            totalEnrollments > 0 ? recentEnrollments / totalEnrollments : 0

          // Weight formula:
          // - Recent enrollments (50%)
          // - View count growth (30%)
          // - Rating (20%)
          const trendingScore =
            recentEnrollments * 50 +
            course.viewCount * 0.3 +
            avgRating * 20

          return {
            ...course,
            enrollments: undefined, // Remove full enrollments data
            rating: avgRating,
            reviewCount: reviews.length,
            enrollmentCount: course._count.enrollments,
            recentEnrollments,
            trendingScore,
            tags: course.tags.map((t) => t.tag),
          }
        })
      )

      // Sort by trending score and take top N
      const trending = coursesWithTrendingScore
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit)

      response.trending = trending
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Featured/Trending error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured/trending courses' },
      { status: 500 }
    )
  }
}
