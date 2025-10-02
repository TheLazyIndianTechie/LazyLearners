/**
 * Optimized database queries with Prisma includes
 * Prevents N+1 query problems by eagerly loading related data
 */

import { prisma } from './prisma'
import type { Prisma } from '@prisma/client'

// ============================================================================
// Course Queries
// ============================================================================

/**
 * Get course with all related data (modules, lessons, instructor, etc.)
 * Use this for course detail pages to avoid N+1 queries
 */
export async function getCourseWithRelations(courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
        },
      },
      modules: {
        include: {
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              quiz: true,
              resources: {
                orderBy: { order: 'asc' },
              },
            },
          },
        },
        orderBy: { order: 'asc' },
      },
      reviews: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      requirements: {
        orderBy: { order: 'asc' },
      },
      objectives: {
        orderBy: { order: 'asc' },
      },
      tags: true,
      _count: {
        select: {
          enrollments: true,
          reviews: true,
        },
      },
    },
  })
}

/**
 * Get courses for browsing with minimal relations
 * Optimized for listing pages
 */
export async function getCoursesForBrowsing(options: {
  published?: boolean
  category?: string
  difficulty?: string
  engine?: string
  skip?: number
  take?: number
}) {
  const { published = true, category, difficulty, engine, skip = 0, take = 20 } = options

  const where: Prisma.CourseWhereInput = {
    published,
    ...(category && { category: category as any }),
    ...(difficulty && { difficulty: difficulty as any }),
    ...(engine && { engine: engine as any }),
  }

  return prisma.course.findMany({
    where,
    include: {
      instructor: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      _count: {
        select: {
          enrollments: true,
          reviews: true,
          modules: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    skip,
    take,
  })
}

/**
 * Get instructor's courses with enrollment stats
 */
export async function getInstructorCourses(instructorId: string) {
  return prisma.course.findMany({
    where: { instructorId },
    include: {
      modules: {
        include: {
          _count: {
            select: { lessons: true },
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
    orderBy: { createdAt: 'desc' },
  })
}

// ============================================================================
// User Progress Queries
// ============================================================================

/**
 * Get user's progress for a course with all lesson details
 * Prevents N+1 when displaying course progress
 */
export async function getUserCourseProgress(userId: string, courseId: string) {
  return prisma.course.findUnique({
    where: { id: courseId },
    include: {
      modules: {
        include: {
          lessons: {
            include: {
              progress: {
                where: { userId },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { order: 'asc' },
      },
    },
  })
}

/**
 * Get all user enrollments with course details
 */
export async function getUserEnrollments(userId: string, status?: string) {
  const where: Prisma.EnrollmentWhereInput = {
    userId,
    ...(status && { status: status as any }),
  }

  return prisma.enrollment.findMany({
    where,
    include: {
      course: {
        include: {
          instructor: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          modules: {
            include: {
              lessons: {
                include: {
                  progress: {
                    where: { userId },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  })
}

// ============================================================================
// Payment and License Queries
// ============================================================================

/**
 * Get user's license keys with course details
 */
export async function getUserLicenseKeys(userId: string) {
  return prisma.licenseKey.findMany({
    where: { userId },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnail: true,
        },
      },
      payment: {
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Get payment with all related data
 */
export async function getPaymentWithDetails(paymentId: string) {
  return prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      course: {
        select: {
          id: true,
          title: true,
          price: true,
        },
      },
      licenseKey: true,
    },
  })
}

// ============================================================================
// Forum Queries
// ============================================================================

/**
 * Get forum posts with author and reply count
 * Optimized for forum listing
 */
export async function getForumPosts(options: {
  category?: string
  skip?: number
  take?: number
}) {
  const { category, skip = 0, take = 20 } = options

  const where: Prisma.ForumPostWhereInput = {
    ...(category && { category }),
  }

  return prisma.forumPost.findMany({
    where,
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      tags: true,
      _count: {
        select: { replies: true },
      },
    },
    orderBy: [
      { pinned: 'desc' },
      { createdAt: 'desc' },
    ],
    skip,
    take,
  })
}

/**
 * Get forum post with all replies and nested replies
 */
export async function getForumPostWithReplies(postId: string) {
  return prisma.forumPost.findUnique({
    where: { id: postId },
    include: {
      author: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
      tags: true,
      replies: {
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        where: { parentId: null }, // Only top-level replies
        orderBy: { createdAt: 'asc' },
      },
    },
  })
}

// ============================================================================
// Portfolio Queries
// ============================================================================

/**
 * Get user portfolio with all projects
 */
export async function getUserPortfolio(userId: string) {
  return prisma.portfolio.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          bio: true,
          skills: true,
        },
      },
      projects: {
        include: {
          tags: true,
          _count: {
            select: { submissions: true },
          },
        },
        where: { isPublic: true },
        orderBy: [
          { featured: 'desc' },
          { createdAt: 'desc' },
        ],
      },
    },
  })
}

/**
 * Get project with submissions
 */
export async function getProjectWithSubmissions(projectId: string) {
  return prisma.project.findUnique({
    where: { id: projectId },
    include: {
      portfolio: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      },
      tags: true,
      submissions: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
        orderBy: { submittedAt: 'desc' },
      },
    },
  })
}

// ============================================================================
// Dashboard Queries
// ============================================================================

/**
 * Get comprehensive dashboard data for a user
 * Single query to fetch all necessary data
 */
export async function getUserDashboardData(userId: string) {
  const [user, enrollments, progress, recentActivity] = await Promise.all([
    // User info
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        skills: true,
        certifications: {
          orderBy: { issuedAt: 'desc' },
          take: 5,
        },
      },
    }),

    // Active enrollments
    prisma.enrollment.findMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            duration: true,
          },
        },
      },
      take: 5,
    }),

    // Overall progress stats
    prisma.progress.groupBy({
      by: ['completed'],
      where: { userId },
      _count: true,
    }),

    // Recent activity
    prisma.progress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            module: {
              select: {
                course: {
                  select: {
                    id: true,
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { lastAccessed: 'desc' },
      take: 10,
    }),
  ])

  return {
    user,
    enrollments,
    progressStats: {
      completed: progress.find(p => p.completed)?._count ?? 0,
      inProgress: progress.find(p => !p.completed)?._count ?? 0,
    },
    recentActivity,
  }
}

// ============================================================================
// Quiz Queries
// ============================================================================

/**
 * Get quiz with lesson and course details
 */
export async function getQuizWithContext(quizId: string) {
  return prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      lesson: {
        include: {
          module: {
            include: {
              course: {
                select: {
                  id: true,
                  title: true,
                },
              },
            },
          },
        },
      },
      attempts: {
        where: { userId: 'CURRENT_USER_ID' }, // Replace with actual userId in implementation
        orderBy: { completedAt: 'desc' },
        take: 5,
      },
    },
  })
}

/**
 * Get user's quiz attempts with scores
 */
export async function getUserQuizAttempts(userId: string) {
  return prisma.quizAttempt.findMany({
    where: { userId },
    include: {
      quiz: {
        include: {
          lesson: {
            select: {
              title: true,
              module: {
                select: {
                  course: {
                    select: {
                      title: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { completedAt: 'desc' },
  })
}

// ============================================================================
// Analytics Queries
// ============================================================================

/**
 * Get instructor analytics
 */
export async function getInstructorAnalytics(instructorId: string) {
  const [courses, totalStudents, totalRevenue, recentReviews] = await Promise.all([
    // Course count
    prisma.course.count({
      where: { instructorId },
    }),

    // Total students across all courses
    prisma.enrollment.count({
      where: {
        course: { instructorId },
      },
    }),

    // Total revenue
    prisma.payment.aggregate({
      where: {
        course: { instructorId },
        status: 'SUCCEEDED',
      },
      _sum: {
        amount: true,
      },
    }),

    // Recent reviews
    prisma.review.findMany({
      where: {
        course: { instructorId },
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ])

  return {
    totalCourses: courses,
    totalStudents,
    totalRevenue: totalRevenue._sum.amount ?? 0,
    recentReviews,
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate course completion percentage for a user
 */
export async function calculateCourseCompletion(userId: string, courseId: string) {
  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({
      where: {
        module: {
          courseId,
        },
      },
    }),

    prisma.progress.count({
      where: {
        userId,
        courseId,
        completed: true,
      },
    }),
  ])

  return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
}
