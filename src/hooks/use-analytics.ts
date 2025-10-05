"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export interface WeeklyProgressData {
  day: string
  date: string
  minutes: number
  lessons: number
}

export interface CourseDistribution {
  name: string
  value: number
  count: number
}

export interface EngineDistribution {
  name: string
  value: number
  percentage: number
}

export interface SkillProgression {
  category: string
  beginner: number
  intermediate: number
  advanced: number
  total: number
}

export interface LearningVelocity {
  week: string
  lessons: number
  weekStart: string
  weekEnd: string
}

export interface AnalyticsStats {
  totalMinutesThisWeek: number
  totalLessonsThisWeek: number
  completionRate: number
  averageDailyMinutes: number
}

export interface AnalyticsData {
  weeklyProgress: WeeklyProgressData[]
  courseDistribution: CourseDistribution[]
  engineDistribution: EngineDistribution[]
  skillProgression: SkillProgression[]
  learningVelocity: LearningVelocity[]
  stats: AnalyticsStats
}

export function useAnalytics() {
  const { isSignedIn, user } = useUser()
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      if (!isSignedIn || !user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch("/api/dashboard/analytics")

        if (!response.ok) {
          throw new Error("Failed to fetch analytics data")
        }

        const analyticsData = await response.json()
        setData(analyticsData)
      } catch (err) {
        console.error("Analytics fetch error:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch analytics data")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [isSignedIn, user?.id])

  const refetch = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch("/api/dashboard/analytics")

      if (!response.ok) {
        throw new Error("Failed to fetch analytics data")
      }

      const analyticsData = await response.json()
      setData(analyticsData)
      setError(null)
    } catch (err) {
      console.error("Analytics refetch error:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch analytics data")
    } finally {
      setLoading(false)
    }
  }

  return {
    data,
    loading,
    error,
    refetch
  }
}
