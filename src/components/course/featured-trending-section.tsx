"use client"

import { useEffect, useState } from "react"
import { EnhancedCourseCard } from "@/components/course/enhanced-course-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, TrendingUp, Star } from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string | null
  price: number
  isPublished: boolean
  category: string
  engine: string | null
  difficulty: string
  duration: number
  createdAt: string
  updatedAt: string
  instructor: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  rating: number
  reviewCount: number
  enrollmentCount: number
  recentEnrollments?: number
  trendingScore?: number
}

interface FeaturedTrendingSectionProps {
  featuredLimit?: number
  trendingLimit?: number
  showTabs?: boolean
  className?: string
}

export function FeaturedTrendingSection({
  featuredLimit = 6,
  trendingLimit = 6,
  showTabs = true,
  className = "",
}: FeaturedTrendingSectionProps) {
  const [featured, setFeatured] = useState<Course[]>([])
  const [trending, setTrending] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCourses() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(
          `/api/courses/featured-trending?type=both&limit=${Math.max(featuredLimit, trendingLimit)}`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch courses')
        }

        const data = await response.json()
        setFeatured(data.featured || [])
        setTrending(data.trending || [])
      } catch (err) {
        console.error('Error fetching featured/trending courses:', err)
        setError('Unable to load courses')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCourses()
  }, [featuredLimit, trendingLimit])

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-16 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-16 ${className}`}>
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  if (featured.length === 0 && trending.length === 0) {
    return null
  }

  // Single section view (no tabs)
  if (!showTabs) {
    return (
      <div className={className}>
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
              <h2 className="text-2xl font-bold">Featured Courses</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.slice(0, featuredLimit).map((course) => (
                <EnhancedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}

        {trending.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-6 w-6 text-green-500" />
              <h2 className="text-2xl font-bold">Trending Now</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trending.slice(0, trendingLimit).map((course) => (
                <EnhancedCourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Tabbed view
  return (
    <div className={className}>
      <Tabs defaultValue="featured" className="w-full">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Featured
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {featured.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="trending" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Trending
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs">
              {trending.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="featured" className="mt-0">
          {featured.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Hand-picked courses by our expert instructors and community
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featured.slice(0, featuredLimit).map((course) => (
                  <EnhancedCourseCard key={course.id} course={course} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No featured courses available</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="trending" className="mt-0">
          {trending.length > 0 ? (
            <>
              <div className="text-center mb-8">
                <p className="text-muted-foreground">
                  Popular courses with recent enrollment growth
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trending.slice(0, trendingLimit).map((course) => (
                  <div key={course.id} className="relative">
                    <EnhancedCourseCard course={course} />
                    {course.recentEnrollments && course.recentEnrollments > 5 && (
                      <div className="absolute top-2 right-2 z-10 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <TrendingUp className="h-3 w-3" />
                        Hot
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No trending courses available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
