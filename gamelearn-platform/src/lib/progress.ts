"use client"

import { prisma } from "@/lib/prisma"

export interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  progress: number
  timeSpent: number
  completed: boolean
  completedAt?: Date
  lastWatched?: Date
}

export interface CourseProgress {
  courseId: string
  userId: string
  totalLessons: number
  completedLessons: number
  progress: number
  timeSpent: number
  lastAccessed?: Date
}

export async function updateLessonProgress(
  userId: string,
  lessonId: string,
  progress: number,
  timeSpent: number = 0
) {
  try {
    const existingProgress = await prisma.progress.findFirst({
      where: {
        userId,
        lessonId,
      },
    })

    const isCompleted = progress >= 90

    if (existingProgress) {
      return await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          progress: Math.max(existingProgress.progress, progress),
          timeSpent: existingProgress.timeSpent + timeSpent,
          completed: isCompleted || existingProgress.completed,
          completedAt: isCompleted && !existingProgress.completed ? new Date() : existingProgress.completedAt,
          lastWatched: new Date(),
        },
      })
    } else {
      return await prisma.progress.create({
        data: {
          userId,
          lessonId,
          progress,
          timeSpent,
          completed: isCompleted,
          completedAt: isCompleted ? new Date() : null,
          lastWatched: new Date(),
        },
      })
    }
  } catch (error) {
    console.error("Error updating lesson progress:", error)
    throw error
  }
}

export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  try {
    const progress = await prisma.progress.findFirst({
      where: {
        userId,
        lessonId,
      },
    })

    return progress
  } catch (error) {
    console.error("Error fetching lesson progress:", error)
    return null
  }
}

export async function getCourseProgress(
  userId: string,
  courseId: string
): Promise<CourseProgress | null> {
  try {
    const course = await prisma.course.findUnique({
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
            },
          },
        },
      },
    })

    if (!course) return null

    const allLessons = course.modules.flatMap(module => module.lessons)
    const totalLessons = allLessons.length

    if (totalLessons === 0) {
      return {
        courseId,
        userId,
        totalLessons: 0,
        completedLessons: 0,
        progress: 0,
        timeSpent: 0,
      }
    }

    const completedLessons = allLessons.filter(lesson =>
      lesson.progress.some(p => p.completed)
    ).length

    const totalProgress = allLessons.reduce((sum, lesson) => {
      const lessonProgress = lesson.progress[0]
      return sum + (lessonProgress?.progress || 0)
    }, 0)

    const totalTimeSpent = allLessons.reduce((sum, lesson) => {
      const lessonProgress = lesson.progress[0]
      return sum + (lessonProgress?.timeSpent || 0)
    }, 0)

    const averageProgress = totalProgress / totalLessons
    const lastAccessed = allLessons
      .flatMap(lesson => lesson.progress)
      .sort((a, b) => new Date(b.lastWatched || 0).getTime() - new Date(a.lastWatched || 0).getTime())[0]?.lastWatched

    return {
      courseId,
      userId,
      totalLessons,
      completedLessons,
      progress: Math.round(averageProgress),
      timeSpent: totalTimeSpent,
      lastAccessed,
    }
  } catch (error) {
    console.error("Error fetching course progress:", error)
    return null
  }
}

export async function getUserEnrolledCourses(userId: string) {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: true,
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
    })

    return enrollments.map(enrollment => {
      const course = enrollment.course
      const allLessons = course.modules.flatMap(module => module.lessons)
      const totalLessons = allLessons.length

      const completedLessons = allLessons.filter(lesson =>
        lesson.progress.some(p => p.completed)
      ).length

      const totalProgress = allLessons.reduce((sum, lesson) => {
        const lessonProgress = lesson.progress[0]
        return sum + (lessonProgress?.progress || 0)
      }, 0)

      const averageProgress = totalLessons > 0 ? totalProgress / totalLessons : 0

      return {
        ...course,
        enrollment,
        progress: Math.round(averageProgress),
        completedLessons,
        totalLessons,
      }
    })
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return []
  }
}

export async function markLessonCompleted(userId: string, lessonId: string) {
  return await updateLessonProgress(userId, lessonId, 100)
}

export async function getNextLesson(userId: string, courseId: string, currentLessonId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!course) return null

    const allLessons = course.modules.flatMap(module =>
      module.lessons.map(lesson => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
      }))
    )

    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId)

    if (currentIndex === -1 || currentIndex === allLessons.length - 1) {
      return null
    }

    return allLessons[currentIndex + 1]
  } catch (error) {
    console.error("Error finding next lesson:", error)
    return null
  }
}

export async function getPreviousLesson(userId: string, courseId: string, currentLessonId: string) {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    })

    if (!course) return null

    const allLessons = course.modules.flatMap(module =>
      module.lessons.map(lesson => ({
        ...lesson,
        moduleId: module.id,
        moduleTitle: module.title,
      }))
    )

    const currentIndex = allLessons.findIndex(lesson => lesson.id === currentLessonId)

    if (currentIndex <= 0) {
      return null
    }

    return allLessons[currentIndex - 1]
  } catch (error) {
    console.error("Error finding previous lesson:", error)
    return null
  }
}