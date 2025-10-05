"use client"

import { useState, useEffect } from "react"
import { EnhancedCourseCard } from "./enhanced-course-card"
import { Button } from "@/components/ui/button"
import { Course } from "@/lib/types"
import { Sparkles, Loader2, ChevronRight } from "lucide-react"
import Link from "next/link"

interface RecommendationsSectionProps {
  title?: string
  limit?: number
  courseId?: string // For related course recommendations
  className?: string
}

export function RecommendationsSection({
  title = "Recommended For You",
  limit = 8,
  courseId,
  className = "",
}: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPersonalized, setIsPersonalized] = useState(false)

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          ...(courseId && { courseId }),
        })

        const response = await fetch(`/api/courses/recommendations?${params}`)
        const data = await response.json()

        if (response.ok) {
          setRecommendations(data.recommendations || [])
          setIsPersonalized(data.personalized || false)
        }
      } catch (error) {
        console.error("Failed to fetch recommendations:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRecommendations()
  }, [limit, courseId])

  if (isLoading) {
    return (
      <section className={`py-12 ${className}`}>
        <div className="container">
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </div>
      </section>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <section className={`py-12 ${className}`}>
      <div className="container">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {isPersonalized && (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-coral-400/20 to-cyan-400/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-coral-400" />
              </div>
            )}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
              {isPersonalized && (
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your learning journey
                </p>
              )}
            </div>
          </div>
          <Button variant="ghost" className="group" asChild>
            <Link href="/courses">
              View All
              <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {recommendations.map((course) => (
            <div key={course.id} className="relative">
              <EnhancedCourseCard course={course} />
              {course.recommendationReasons && course.recommendationReasons.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {course.recommendationReasons.map((reason: string, index: number) => (
                    <span
                      key={index}
                      className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
