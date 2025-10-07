"use client"

import { useState, useEffect } from 'react'

interface StreakData {
  currentStreak: number
  longestStreak: number
  lastLearningDate: string | null
  calendarData: Array<{
    date: string
    count: number
    level: number
  }>
  milestones: Array<{
    days: number
    name: string
    achieved: boolean
  }>
}

export function useStreak() {
  const [data, setData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStreakData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/progress/streak')
      const result = await response.json()

      if (response.ok) {
        setData(result)
        setError(null)
      } else {
        setError(result.error || 'Failed to fetch streak data')
      }
    } catch (err) {
      setError('Failed to fetch streak data')
      console.error('Streak fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreakData()
  }, [])

  return { data, loading, error, refetch: fetchStreakData }
}