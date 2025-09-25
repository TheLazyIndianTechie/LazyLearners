"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@clerk/nextjs"

interface LessonProgress {
  id: string
  userId: string
  lessonId: string
  progress: number
  timeSpent: number
  completed: boolean
  completedAt?: Date
  lastWatched?: Date
}

interface CourseProgress {
  courseId: string
  userId: string
  totalLessons: number
  completedLessons: number
  progress: number
  timeSpent: number
  lastAccessed?: Date
}

export function useProgress(lessonId?: string, courseId?: string) {
  const { isSignedIn, user } = useUser()
  const [lessonProgress, setLessonProgress] = useState<LessonProgress | null>(null)
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLessonProgress = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/progress?lessonId=${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch lesson progress")
      }

      const data = await response.json()
      setLessonProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch progress")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const fetchCourseProgress = useCallback(async (id: string) => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch(`/api/progress?courseId=${id}`)

      if (!response.ok) {
        throw new Error("Failed to fetch course progress")
      }

      const data = await response.json()
      setCourseProgress(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch progress")
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  const updateProgress = useCallback(async (
    lessonId: string,
    progress: number,
    timeSpent: number = 0
  ) => {
    if (!user?.id) return

    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lessonId,
          progress,
          timeSpent,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update progress")
      }

      const updatedProgress = await response.json()
      setLessonProgress(updatedProgress)

      // Refresh course progress if we have a courseId
      if (courseId) {
        await fetchCourseProgress(courseId)
      }

      return updatedProgress
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update progress")
      throw err
    }
  }, [user?.id, courseId, fetchCourseProgress])

  const markCompleted = useCallback(async (lessonId: string) => {
    return await updateProgress(lessonId, 100)
  }, [updateProgress])

  useEffect(() => {
    if (lessonId && user?.id) {
      fetchLessonProgress(lessonId)
    }
  }, [lessonId, user?.id, fetchLessonProgress])

  useEffect(() => {
    if (courseId && user?.id) {
      fetchCourseProgress(courseId)
    }
  }, [courseId, user?.id, fetchCourseProgress])

  return {
    lessonProgress,
    courseProgress,
    loading,
    error,
    updateProgress,
    markCompleted,
    refetchLessonProgress: lessonId ? () => fetchLessonProgress(lessonId) : undefined,
    refetchCourseProgress: courseId ? () => fetchCourseProgress(courseId) : undefined,
  }
}