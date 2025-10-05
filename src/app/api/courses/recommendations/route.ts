import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

// Types for learning pattern analysis
interface LearningPatterns {
  preferredCategories: string[]
  preferredDifficulties: string[]
  averageCompletionRate: number
  preferredInstructors: string[]
  skillGaps: string[]
  learningPace: 'slow' | 'medium' | 'fast'
  engagementScore: number
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '12')
    const courseId = searchParams.get('courseId') // For related course recommendations

    // Fetch user's enrollments if authenticated
    let userEnrollments: any[] = []
    let userBrowsingHistory: string[] = []

    if (userId) {
      userEnrollments = await prisma.enrollment.findMany({
        where: { userId },
        include: {
          course: {
            include: {
              instructor: true,
            },
          },
        },
      })

      // Analyze user learning patterns for better recommendations
      const learningPatterns = await analyzeLearningPatterns(userId)
      userBrowsingHistory = learningPatterns.preferredCategories
    }

    // Get all published courses
    const allCourses = await prisma.course.findMany({
      where: {
        published: true,
        ...(courseId && { NOT: { id: courseId } }), // Exclude current course if provided
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

    // Calculate ratings for each course
    const coursesWithRatings = await Promise.all(
      allCourses.map(async (course) => {
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

    // Score courses based on recommendation algorithm
    const scoredCourses = coursesWithRatings.map((course) => {
      let score = 0
      const reasons: string[] = []

      // 1. Same category as enrolled courses (weight: 3)
      const enrolledCategories = userEnrollments.map((e) => e.course.category)
      if (enrolledCategories.includes(course.category)) {
        score += 30
        reasons.push('Similar to courses you are taking')
      }

      // 2. Difficulty progression (weight: 2.5)
      const enrolledDifficulties = userEnrollments.map((e) => e.course.difficulty)
      if (enrolledDifficulties.includes('beginner') && course.difficulty === 'intermediate') {
        score += 25
        reasons.push('Next level difficulty')
      } else if (enrolledDifficulties.includes('intermediate') && course.difficulty === 'advanced') {
        score += 25
        reasons.push('Advanced level course')
      } else if (course.difficulty === 'beginner' && userEnrollments.length === 0) {
        score += 15
        reasons.push('Perfect for beginners')
      }

      // 3. Same instructor's other courses (weight: 2)
      const enrolledInstructors = userEnrollments.map((e) => e.course.instructor.id)
      if (enrolledInstructors.includes(course.instructor.id)) {
        score += 20
        reasons.push(`From ${course.instructor.name}`)
      }

      // 4. High rating and popularity (weight: 1.5)
      if (course.rating >= 4.5) {
        score += 15
        reasons.push('Highly rated')
      }
      if (course.enrollmentCount > 100) {
        score += 10
        reasons.push('Popular course')
      }

      // 5. If viewing a specific course, recommend similar ones (weight: 4)
      if (courseId) {
        const viewedCourse = allCourses.find((c) => c.id === courseId)
        if (viewedCourse) {
          if (course.category === viewedCourse.category) {
            score += 40
            reasons.push('Related to current course')
          }
          if (course.engine === viewedCourse.engine) {
            score += 20
            reasons.push('Same game engine')
          }
          if (course.instructor.id === viewedCourse.instructor.id) {
            score += 30
            reasons.push('From the same instructor')
          }
        }
      }

      // 6. Boost newer courses slightly (weight: 0.5)
      const courseAge = Date.now() - new Date(course.createdAt).getTime()
      const daysOld = courseAge / (1000 * 60 * 60 * 24)
      if (daysOld < 30) {
        score += 5
        reasons.push('New course')
      }

      // 7. Free courses get a small boost (weight: 0.5)
      if (course.price === 0) {
        score += 5
        reasons.push('Free course')
      }

      return {
        ...course,
        recommendationScore: score,
        recommendationReasons: reasons.slice(0, 2), // Top 2 reasons
      }
    })

    // Sort by recommendation score and take top N
    const recommendations = scoredCourses
      .sort((a, b) => b.recommendationScore - a.recommendationScore)
      .slice(0, limit)

    return NextResponse.json({
      recommendations,
      personalized: userId !== null,
    })
  } catch (error) {
    console.error('Recommendations error:', error)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

/**
 * Analyze user learning patterns for personalized recommendations
 */
async function analyzeLearningPatterns(userId: string): Promise<LearningPatterns> {
  try {
    // Get user's progress across all courses
    const userProgress = await prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            module: {
              include: {
                course: {
                  include: {
                    instructor: true
                  }
                }
              }
            }
          }
        }
      }
    })

    // Calculate completion rates
    const completedLessons = userProgress.filter(p => p.status === 'COMPLETED').length
    const totalLessons = userProgress.length
    const averageCompletionRate = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0

    // Identify preferred categories (most progress made)
    const categoryProgress = new Map<string, number>()
    userProgress.forEach(p => {
      const category = p.lesson.module.course.category
      categoryProgress.set(category, (categoryProgress.get(category) || 0) + 1)
    })
    const preferredCategories = Array.from(categoryProgress.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category)

    // Identify preferred difficulties
    const difficultyProgress = new Map<string, number>()
    userProgress.forEach(p => {
      const difficulty = p.lesson.module.course.difficulty
      difficultyProgress.set(difficulty, (difficultyProgress.get(difficulty) || 0) + 1)
    })
    const preferredDifficulties = Array.from(difficultyProgress.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([difficulty]) => difficulty)

    // Identify preferred instructors
    const instructorProgress = new Map<string, number>()
    userProgress.forEach(p => {
      const instructorId = p.lesson.module.course.instructor.id
      instructorProgress.set(instructorId, (instructorProgress.get(instructorId) || 0) + 1)
    })
    const preferredInstructors = Array.from(instructorProgress.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([instructorId]) => instructorId)

    // Detect skill gaps (enrolled but low completion)
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: true
      }
    })
    const skillGaps: string[] = []
    for (const enrollment of enrollments) {
      const courseProgress = userProgress.filter(
        p => p.lesson.module.course.id === enrollment.courseId
      )
      const courseCompletionRate = courseProgress.length > 0
        ? (courseProgress.filter(p => p.status === 'COMPLETED').length / courseProgress.length) * 100
        : 0

      if (courseCompletionRate < 30 && courseProgress.length > 0) {
        skillGaps.push(enrollment.course.category)
      }
    }

    // Calculate learning pace based on recent activity
    const recentProgress = userProgress
      .filter(p => {
        const daysSinceUpdate = (Date.now() - new Date(p.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
        return daysSinceUpdate <= 30
      })

    let learningPace: 'slow' | 'medium' | 'fast' = 'medium'
    if (recentProgress.length > 20) {
      learningPace = 'fast'
    } else if (recentProgress.length < 5) {
      learningPace = 'slow'
    }

    // Calculate engagement score (0-100)
    const engagementScore = Math.min(100,
      (averageCompletionRate * 0.4) +
      (recentProgress.length * 2) +
      (enrollments.length * 5)
    )

    return {
      preferredCategories,
      preferredDifficulties,
      averageCompletionRate,
      preferredInstructors,
      skillGaps: Array.from(new Set(skillGaps)),
      learningPace,
      engagementScore
    }
  } catch (error) {
    console.error('Error analyzing learning patterns:', error)
    return {
      preferredCategories: [],
      preferredDifficulties: [],
      averageCompletionRate: 0,
      preferredInstructors: [],
      skillGaps: [],
      learningPace: 'medium',
      engagementScore: 0
    }
  }
}
