import { prisma } from "@/lib/prisma"

export interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  completionPercentage: number
  timeSpent: number
  completed: boolean
  lastAccessed: Date
}

export interface CourseProgress {
  courseId: string
  userId: string
  totalLessons: number
  completedLessons: number
  completionPercentage: number
  timeSpent: number
  lastAccessed?: Date
  certificateEligible: boolean
}

export async function updateLessonProgress(
  userId: string,
  courseId: string,
  lessonId: string,
  completionPercentage: number,
  timeSpent: number = 0
) {
  try {
    const existingProgress = await prisma.progress.findUnique({
      where: {
        userId_courseId_lessonId: {
          userId,
          courseId,
          lessonId,
        },
      },
    })

    const isCompleted = completionPercentage >= 90

    if (existingProgress) {
      return await prisma.progress.update({
        where: { id: existingProgress.id },
        data: {
          completionPercentage: Math.max(existingProgress.completionPercentage, completionPercentage),
          timeSpent: existingProgress.timeSpent + timeSpent,
          completed: isCompleted || existingProgress.completed,
          lastAccessed: new Date(),
        },
      })
    } else {
      return await prisma.progress.create({
        data: {
          userId,
          courseId,
          lessonId,
          completionPercentage,
          timeSpent,
          completed: isCompleted,
          lastAccessed: new Date(),
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
  courseId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  try {
    const progress = await prisma.progress.findUnique({
      where: {
        userId_courseId_lessonId: {
          userId,
          courseId,
          lessonId,
        },
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
          orderBy: { order: "asc" },
          include: {
            lessons: {
              orderBy: { order: "asc" },
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
        completionPercentage: 0,
        timeSpent: 0,
        certificateEligible: false,
      }
    }

    const completedLessons = allLessons.filter(lesson =>
      lesson.progress.some(p => p.completed)
    ).length

    const totalProgress = allLessons.reduce((sum, lesson) => {
      const lessonProgress = lesson.progress[0]
      return sum + (lessonProgress?.completionPercentage || 0)
    }, 0)

    const totalTimeSpent = allLessons.reduce((sum, lesson) => {
      const lessonProgress = lesson.progress[0]
      return sum + (lessonProgress?.timeSpent || 0)
    }, 0)

    const averageProgress = totalProgress / totalLessons
    const lastAccessed = allLessons
      .flatMap(lesson => lesson.progress)
      .sort((a, b) => new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime())[0]?.lastAccessed

    // Certificate eligibility: 80% of lessons completed
    const certificateEligible = (completedLessons / totalLessons) >= 0.8

    return {
      courseId,
      userId,
      totalLessons,
      completedLessons,
      completionPercentage: Math.round(averageProgress),
      timeSpent: totalTimeSpent,
      lastAccessed,
      certificateEligible,
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
              orderBy: { order: "asc" },
              include: {
                lessons: {
                  orderBy: { order: "asc" },
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
        return sum + (lessonProgress?.completionPercentage || 0)
      }, 0)

      const averageProgress = totalLessons > 0 ? totalProgress / totalLessons : 0
      const certificateEligible = totalLessons > 0 && (completedLessons / totalLessons) >= 0.8

      return {
        ...course,
        enrollment,
        progress: Math.round(averageProgress),
        completedLessons,
        totalLessons,
        certificateEligible,
      }
    })
  } catch (error) {
    console.error("Error fetching enrolled courses:", error)
    return []
  }
}

export async function markLessonCompleted(userId: string, courseId: string, lessonId: string) {
  return await updateLessonProgress(userId, courseId, lessonId, 100)
}

// Certificate generation functionality
export async function generateCertificate(userId: string, courseId: string) {
  try {
    // Check if user has completed enough of the course (80% threshold)
    const courseProgress = await getCourseProgress(userId, courseId)

    if (!courseProgress || !courseProgress.certificateEligible) {
      throw new Error("Course completion requirements not met for certificate generation")
    }

    // Check if certificate already exists
    const existingCertificate = await prisma.certification.findFirst({
      where: {
        userId,
        name: `Course Completion: ${courseId}`,
      },
    })

    if (existingCertificate) {
      return existingCertificate
    }

    // Get course and user details for certificate
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { instructor: true },
    })

    if (!course) {
      throw new Error("Course not found")
    }

    // Generate unique credential ID
    const credentialId = `CERT-${courseId.slice(0, 8)}-${userId.slice(0, 8)}-${Date.now()}`

    const certificate = await prisma.certification.create({
      data: {
        userId,
        name: `Course Completion: ${course.title}`,
        description: `Certificate of completion for ${course.title} in ${course.category} category`,
        issuer: "GameLearn Platform",
        credentialId,
        badgeUrl: `/api/certificates/${credentialId}/badge`,
        verificationUrl: `/api/certificates/${credentialId}/verify`,
        issuedAt: new Date(),
        // Certificates for game development courses don't expire
        expiresAt: null,
      },
    })

    // Update enrollment status to completed
    await prisma.enrollment.updateMany({
      where: {
        userId,
        courseId,
      },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    })

    return certificate
  } catch (error) {
    console.error("Error generating certificate:", error)
    throw error
  }
}

export async function getUserCertificates(userId: string) {
  try {
    return await prisma.certification.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
    })
  } catch (error) {
    console.error("Error fetching user certificates:", error)
    return []
  }
}

export async function verifyCertificate(credentialId: string) {
  try {
    const certificate = await prisma.certification.findUnique({
      where: { credentialId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    if (!certificate) {
      return null
    }

    // Check if certificate has expired
    if (certificate.expiresAt && new Date() > certificate.expiresAt) {
      return { ...certificate, expired: true }
    }

    return { ...certificate, expired: false }
  } catch (error) {
    console.error("Error verifying certificate:", error)
    return null
  }
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