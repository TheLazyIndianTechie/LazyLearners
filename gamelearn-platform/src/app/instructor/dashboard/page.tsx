"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { SiteLayout } from "@/components/layout/site-layout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Plus,
  BookOpen,
  Users,
  Eye,
  Edit,
  MoreHorizontal,
  TrendingUp,
  Star,
  Clock,
  DollarSign
} from "lucide-react"

interface Course {
  id: string
  title: string
  description: string
  thumbnail: string | null
  price: number
  published: boolean
  enrollmentCount: number
  rating: number
  reviewCount: number
  createdAt: Date
  updatedAt: Date
  modules: Array<any>
  revenue?: number
}

export default function InstructorDashboard() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstructorCourses = async () => {
    try {
      if (!user?.id) return

      const response = await fetch(`/api/courses?instructorId=${user?.id}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('Failed to fetch instructor courses:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Remove loading check since Clerk handles loading state
    if (!isSignedIn) {
      router.push("/auth/signin")
      return
    }
    const userRole = (user?.publicMetadata?.role as string) || 'STUDENT'
    if (userRole !== "INSTRUCTOR" && userRole !== "ADMIN") {
      router.push("/")
      return
    }

    fetchInstructorCourses()
  }, [isSignedIn, router])

  if (!isSignedIn) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const userRole = (user?.publicMetadata?.role as string) || 'STUDENT'
  if (!isSignedIn || (userRole !== "INSTRUCTOR" && userRole !== "ADMIN")) {
    return null
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading courses...</p>
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const totalRevenue = courses.reduce((sum, course) => sum + (course.revenue || course.price * course.enrollmentCount), 0)
  const totalEnrollments = courses.reduce((sum, course) => sum + course.enrollmentCount, 0)
  const publishedCourses = courses.filter(course => course.published).length

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <SiteLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your courses and track your teaching performance
            </p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEnrollments.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +5% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{publishedCourses}</div>
              <p className="text-xs text-muted-foreground">
                {courses.length - publishedCourses} in draft
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg. Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {courses.filter(c => c.rating > 0).length > 0
                  ? (courses.reduce((sum, c) => sum + c.rating, 0) / courses.filter(c => c.rating > 0).length).toFixed(1)
                  : "0.0"
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Across all courses
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest course updates and student interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm">New enrollment in "Complete Unity Game Development Course"</span>
                <Badge variant="secondary" className="ml-auto text-xs">2 hours ago</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm">Course "Advanced C# for Game Development" updated</span>
                <Badge variant="secondary" className="ml-auto text-xs">1 day ago</Badge>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="text-sm">New 5-star review received</span>
                <Badge variant="secondary" className="ml-auto text-xs">2 days ago</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Courses</h2>
            <Button variant="outline" asChild>
              <Link href="/instructor/courses">
                View All Courses
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="aspect-video bg-gray-100 relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2">
                    <Badge
                      variant={course.status === "published" ? "default" : "secondary"}
                    >
                      {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 bg-white/80">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{course.description}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Students:</span>
                        <div className="font-medium">{course.enrollmentCount.toLocaleString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Revenue:</span>
                        <div className="font-medium">{formatCurrency(course.revenue)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Rating:</span>
                        <div className="font-medium flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {course.rating > 0 ? course.rating.toFixed(1) : "N/A"}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <div className="font-medium">{formatDuration(course.duration)}</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild className="flex-1">
                        <Link href={`/instructor/courses/${course.id}/edit`}>
                          <Edit className="w-3 h-3 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild className="flex-1">
                        <Link href={`/courses/${course.id}`}>
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and helpful resources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Plus className="w-6 h-6" />
                <span>Create New Course</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <TrendingUp className="w-6 h-6" />
                <span>View Analytics</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
                <Users className="w-6 h-6" />
                <span>Manage Students</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  )
}