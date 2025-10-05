import { useState, useEffect } from 'react'

export interface Recommendation {
  id: string
  title: string
  description: string
  thumbnail: string | null
  price: number
  category: string
  difficulty: string
  duration: number
  engine: string | null
  instructor: {
    id: string
    name: string | null
    email: string
    avatar: string | null
  }
  rating: number
  reviewCount: number
  enrollmentCount: number
  tags: string[]
  recommendationScore: number
  recommendationReasons: string[]
}

interface UseRecommendationsReturn {
  recommendations: Recommendation[]
  loading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

export function useRecommendations(limit: number = 6): UseRecommendationsReturn {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchRecommendations = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/courses/recommendations?limit=${limit}`)

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [limit])

  return {
    recommendations,
    loading,
    error,
    refetch: fetchRecommendations
  }
}
