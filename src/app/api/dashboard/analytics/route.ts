import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import prisma from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        enrollments: {
          include: {
            course: {
              include: {
                modules: {
                  include: {
                    lessons: true
                  }
                }
              }
            }
          }
        },
        progress: {
          include: {
            lesson: {
              include: {
                module: true
              }
            }
          },
          orderBy: {
            lastAccessedAt: 'desc'
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Calculate weekly learning activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const weeklyActivity = await prisma.userProgress.groupBy({
      by: ['lastAccessedAt'],
      where: {
        userId: user.id,
        lastAccessedAt: {
          gte: sevenDaysAgo
        }
      },
      _sum: {
        timeSpent: true
      },
      _count: {
        id: true
      }
    })

    // Transform weekly activity into day-by-day format
    const weeklyProgress = []
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const activityByDay = new Map<string, { minutes: number; lessons: number }>()

    // Initialize all days with 0
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toDateString()
      activityByDay.set(dayKey, { minutes: 0, lessons: 0 })
    }

    // Fill in actual activity
    weeklyActivity.forEach((activity) => {
      const dayKey = new Date(activity.lastAccessedAt).toDateString()
      const existing = activityByDay.get(dayKey) || { minutes: 0, lessons: 0 }
      activityByDay.set(dayKey, {
        minutes: existing.minutes + Math.round((activity._sum.timeSpent || 0) / 60),
        lessons: existing.lessons + activity._count.id
      })
    })

    // Convert to array format
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayKey = date.toDateString()
      const data = activityByDay.get(dayKey) || { minutes: 0, lessons: 0 }
      weeklyProgress.push({
        day: days[date.getDay()],
        date: date.toISOString().split('T')[0],
        minutes: data.minutes,
        lessons: data.lessons
      })
    }

    // Calculate course distribution by category/engine
    const coursesByCategory = new Map<string, number>()
    const coursesByEngine = new Map<string, number>()

    user.enrollments.forEach((enrollment) => {
      const course = enrollment.course

      // Count by category
      const category = course.category || 'other'
      coursesByCategory.set(category, (coursesByCategory.get(category) || 0) + 1)

      // Count by engine
      const engine = course.engine || 'custom'
      coursesByEngine.set(engine, (coursesByEngine.get(engine) || 0) + 1)
    })

    // Calculate total lessons completed
    const completedLessons = user.progress.filter(p => p.isCompleted).length
    const totalLessons = user.enrollments.reduce((total, enrollment) => {
      return total + enrollment.course.modules.reduce((moduleTotal, module) => {
        return moduleTotal + module.lessons.length
      }, 0)
    }, 0)

    // Course distribution for pie chart
    const courseDistribution = Array.from(coursesByCategory.entries()).map(([name, value]) => {
      const percentage = totalLessons > 0 ? Math.round((value / user.enrollments.length) * 100) : 0
      return {
        name: name.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        value: percentage,
        count: value
      }
    })

    // Engine distribution
    const engineDistribution = Array.from(coursesByEngine.entries()).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      percentage: user.enrollments.length > 0
        ? Math.round((value / user.enrollments.length) * 100)
        : 0
    }))

    // Calculate skill progression (based on completed courses in each category)
    const skillProgression = await prisma.enrollment.groupBy({
      by: ['courseId'],
      where: {
        userId: user.id,
        progress: {
          gte: 100
        }
      },
      _count: {
        id: true
      }
    })

    // Get courses for skill categorization
    const completedCourseIds = skillProgression.map(s => s.courseId)
    const completedCourses = await prisma.course.findMany({
      where: {
        id: {
          in: completedCourseIds
        }
      },
      select: {
        category: true,
        difficulty: true
      }
    })

    // Group by category and difficulty
    const skillsByCategory = new Map<string, { beginner: number; intermediate: number; advanced: number }>()

    completedCourses.forEach((course) => {
      const category = course.category || 'other'
      const difficulty = course.difficulty || 'beginner'

      if (!skillsByCategory.has(category)) {
        skillsByCategory.set(category, { beginner: 0, intermediate: 0, advanced: 0 })
      }

      const skills = skillsByCategory.get(category)!
      skills[difficulty as keyof typeof skills]++
    })

    const skillProgressionData = Array.from(skillsByCategory.entries()).map(([category, skills]) => ({
      category: category.split('-').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' '),
      beginner: skills.beginner,
      intermediate: skills.intermediate,
      advanced: skills.advanced,
      total: skills.beginner + skills.intermediate + skills.advanced
    }))

    // Learning velocity (lessons per week over last 4 weeks)
    const fourWeeksAgo = new Date()
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)

    const monthlyProgress = await prisma.userProgress.groupBy({
      by: ['lastAccessedAt'],
      where: {
        userId: user.id,
        lastAccessedAt: {
          gte: fourWeeksAgo
        },
        isCompleted: true
      },
      _count: {
        id: true
      }
    })

    // Group by week
    const weeklyVelocity = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - (i * 7 + 7))
      const weekEnd = new Date()
      weekEnd.setDate(weekEnd.getDate() - (i * 7))

      const lessonsThisWeek = monthlyProgress.filter((progress) => {
        const date = new Date(progress.lastAccessedAt)
        return date >= weekStart && date < weekEnd
      }).reduce((sum, p) => sum + p._count.id, 0)

      weeklyVelocity.push({
        week: `Week ${4 - i}`,
        lessons: lessonsThisWeek,
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0]
      })
    }

    return NextResponse.json({
      weeklyProgress,
      courseDistribution,
      engineDistribution,
      skillProgression: skillProgressionData,
      learningVelocity: weeklyVelocity,
      stats: {
        totalMinutesThisWeek: weeklyProgress.reduce((sum, day) => sum + day.minutes, 0),
        totalLessonsThisWeek: weeklyProgress.reduce((sum, day) => sum + day.lessons, 0),
        completionRate: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        averageDailyMinutes: Math.round(
          weeklyProgress.reduce((sum, day) => sum + day.minutes, 0) / 7
        )
      }
    })
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics data" },
      { status: 500 }
    )
  }
}
