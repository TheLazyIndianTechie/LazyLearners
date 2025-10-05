"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { SiteLayout } from "@/components/layout/site-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Heart, ShoppingCart, Star, Clock, Users, X } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useWishlist } from "@/hooks/use-wishlist"
import { toast } from "sonner"

interface WishlistCourse {
  id: string
  courseId: string
  course: {
    id: string
    title: string
    description: string
    thumbnail: string | null
    price: number
    category: string
    difficulty: string
    duration: number
    instructor: {
      name: string | null
      avatar: string | null
    }
    _count: {
      enrollments: number
      reviews: number
    }
  }
}

export default function WishlistPage() {
  const { isSignedIn, user } = useUser()
  const { wishlist, removeFromWishlist } = useWishlist()
  const [wishlistCourses, setWishlistCourses] = useState<WishlistCourse[]>([])
  const [loading, setLoading] = useState(true)
  const [ratings, setRatings] = useState<Record<string, number>>({})

  useEffect(() => {
    if (!isSignedIn) return

    const fetchWishlistCourses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/wishlist')

        if (!response.ok) {
          throw new Error('Failed to fetch wishlist')
        }

        const data = await response.json()
        setWishlistCourses(data.wishlist || [])

        // Fetch ratings for each course
        const ratingsMap: Record<string, number> = {}
        for (const item of data.wishlist || []) {
          const reviewsResponse = await fetch(`/api/courses/${item.courseId}/reviews`)
          if (reviewsResponse.ok) {
            const reviewsData = await reviewsResponse.json()
            const avgRating = reviewsData.reviews.length > 0
              ? reviewsData.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviewsData.reviews.length
              : 0
            ratingsMap[item.courseId] = avgRating
          }
        }
        setRatings(ratingsMap)
      } catch (error) {
        console.error('Error fetching wishlist:', error)
        toast.error('Failed to load wishlist')
      } finally {
        setLoading(false)
      }
    }

    fetchWishlistCourses()
  }, [isSignedIn, wishlist.length])

  const handleRemove = async (courseId: string) => {
    try {
      await removeFromWishlist(courseId)
      setWishlistCourses(prev => prev.filter(item => item.courseId !== courseId))
    } catch (error) {
      // Error already handled by hook
    }
  }

  if (!isSignedIn) {
    return (
      <SiteLayout>
        <div className="container max-w-4xl py-8">
          <Card>
            <CardContent className="pt-6 text-center">
              <Heart className="h-16 w-16 mx-auto text-muted-foreground/20 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Sign in to view your wishlist</h3>
              <p className="text-muted-foreground mb-4">
                Save your favorite courses and access them anytime
              </p>
              <Button asChild>
                <Link href="/sign-in">Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <div className="container max-w-6xl py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Heart className="h-8 w-8 text-red-500" />
            My Wishlist
          </h1>
          <p className="text-muted-foreground mt-2">
            Courses you've saved for later
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <Skeleton className="h-40 w-60 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <Skeleton className="h-8 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && wishlistCourses.length === 0 && (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Heart className="h-24 w-24 mx-auto text-muted-foreground/20 mb-6" />
              <h3 className="text-2xl font-semibold mb-3">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Start adding courses you're interested in to keep track of them and purchase when you're ready
              </p>
              <Button asChild size="lg">
                <Link href="/courses">Browse Courses</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Wishlist Items */}
        {!loading && wishlistCourses.length > 0 && (
          <div className="space-y-4">
            {wishlistCourses.map((item) => (
              <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Thumbnail */}
                    <Link
                      href={`/courses/${item.course.id}`}
                      className="relative h-40 w-full md:w-60 flex-shrink-0 overflow-hidden rounded-lg bg-muted"
                    >
                      {item.course.thumbnail ? (
                        <Image
                          src={item.course.thumbnail}
                          alt={item.course.title}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                          <span className="text-4xl font-bold text-muted-foreground/20">
                            {item.course.title.charAt(0)}
                          </span>
                        </div>
                      )}
                      {item.course.price === 0 && (
                        <Badge className="absolute top-2 right-2 bg-green-600">
                          Free
                        </Badge>
                      )}
                    </Link>

                    {/* Course Info */}
                    <div className="flex-1 flex flex-col">
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <Link href={`/courses/${item.course.id}`}>
                            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                              {item.course.title}
                            </h3>
                          </Link>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemove(item.courseId)}
                            title="Remove from wishlist"
                          >
                            <X className="h-5 w-5" />
                          </Button>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {item.course.description}
                        </p>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {ratings[item.courseId] > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">{ratings[item.courseId].toFixed(1)}</span>
                              <span>({item.course._count.reviews})</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{item.course._count.enrollments} enrolled</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{Math.floor(item.course.duration / 60)}h</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {item.course.difficulty}
                          </Badge>
                          <Badge variant="outline">
                            {item.course.category.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-2xl font-bold text-primary">
                          {item.course.price === 0 ? 'Free' : `$${item.course.price.toFixed(2)}`}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" asChild>
                            <Link href={`/courses/${item.course.id}`}>
                              View Course
                            </Link>
                          </Button>
                          <Button asChild>
                            <Link href={`/courses/${item.course.id}`}>
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {item.course.price === 0 ? 'Enroll Now' : 'Buy Now'}
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}
