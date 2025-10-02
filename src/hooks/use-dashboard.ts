"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"

export interface DashboardStats {
  totalCourses: number
  completedCourses: number
  averageProgress: number
  totalTimeSpent: number
}

export interface EnrolledCourse {
  id: string
  title: string
  description: string
  thumbnail: string
  instructor: {
    name: string
    avatar: string
  }
  category: string
  engine: string
  difficulty: string
  duration: number
  price: number
  rating: number
  reviewCount: number
  tags: string[]
  progress: number
  completedLessons: number
  totalLessons: number
}

export interface DashboardData {
  enrolledCourses: EnrolledCourse[]
  stats: DashboardStats
}

export function useDashboard() {
  const { isSignedIn, user } = useUser()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isSignedIn || !user?.id) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const response = await fetch("/api/dashboard")

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data")
        }

        const dashboardData = await response.json()
        setData(dashboardData)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [isSignedIn, user?.id])

  const refetch = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      const response = await fetch("/api/dashboard")

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const dashboardData = await response.json()
      setData(dashboardData)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch dashboard data")
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