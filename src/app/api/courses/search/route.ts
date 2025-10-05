import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import Fuse from 'fuse.js'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q') || ''
    const category = searchParams.get('category')
    const difficulty = searchParams.get('difficulty')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const minRating = searchParams.get('minRating')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '12')

    // Fetch all published courses with related data
    const courses = await prisma.course.findMany({
      where: {
        published: true,
        ...(category && category !== 'all' && { category }),
        ...(difficulty && difficulty !== 'all' && { difficulty }),
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
    })

    // Calculate average rating for each course
    const coursesWithRatings = await Promise.all(
      courses.map(async (course) => {
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
          tags: course.tags.map((t) => t.tag), // Convert to string array for Fuse.js
        }
      })
    )

    // Apply price and rating filters
    let filteredCourses = coursesWithRatings.filter((course) => {
      if (minPrice && course.price < parseFloat(minPrice)) return false
      if (maxPrice && course.price > parseFloat(maxPrice)) return false
      if (minRating && course.rating < parseFloat(minRating)) return false
      return true
    })

    // If there's a search query, use Fuse.js for fuzzy search
    if (query && query.trim() !== '') {
      const fuse = new Fuse(filteredCourses, {
        keys: [
          {
            name: 'title',
            weight: 3, // Title is most important
          },
          {
            name: 'description',
            weight: 2,
          },
          {
            name: 'instructor.name',
            weight: 1.5,
          },
          {
            name: 'tags',
            weight: 1,
          },
          {
            name: 'category',
            weight: 0.5,
          },
        ],
        includeScore: true,
        threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
        ignoreLocation: true,
        useExtendedSearch: true,
      })

      const searchResults = fuse.search(query)
      filteredCourses = searchResults.map((result) => result.item)
    }

    // Pagination
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedCourses = filteredCourses.slice(startIndex, endIndex)

    return NextResponse.json({
      courses: paginatedCourses,
      pagination: {
        page,
        limit,
        total: filteredCourses.length,
        totalPages: Math.ceil(filteredCourses.length / limit),
      },
    })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Failed to search courses' },
      { status: 500 }
    )
  }
}
