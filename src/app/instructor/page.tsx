"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { SiteLayout } from "@/components/layout/site-layout"
import { RoleGuard } from "@/components/auth/role-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, BookOpen, Users, DollarSign, Star, TrendingUp, Edit, Trash2, Eye } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Course {
  id: string
  title: string
  description: string
  thumbnail?: string
  price: number
  published: boolean
  category: string
  difficulty: string
  duration: number
  rating: number
  reviewCount: number
  enrollmentCount: number
  createdAt: string
  updatedAt: string
}

interface DashboardStats {
  totalCourses: number
  totalStudents: number
  totalRevenue: number
  avgRating: number
}

export default function InstructorDashboard() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Removed loading check - Clerk handles loading state

    if (!isSignedIn) {
      router.push("/auth/signin")
      return
    }

    // Check if user is instructor or admin
    if (user?.publicMetadata?.role !== "INSTRUCTOR" && user?.publicMetadata?.role !== "ADMIN") {
      toast.error("Access denied. Only instructors can access this page.")
      router.push("/")
      return
    }

    fetchInstructorData()
  }, [isSignedIn, router])

  const fetchInstructorData = async () => {
    try {
      setLoading(true)

      // Fetch instructor's courses
      const coursesResponse = await fetch(
        `/api/courses?instructorId=${user?.id}`,
        { method: 'GET' }
      )

      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses')
      }

      const coursesData = await coursesResponse.json()
      setCourses(coursesData.courses)

      // Calculate stats
      const totalCourses = coursesData.courses.length
      const totalStudents = coursesData.courses.reduce((sum: number, course: Course) => sum + course.enrollmentCount, 0)
      const totalRevenue = coursesData.courses.reduce((sum: number, course: Course) => sum + (course.price * course.enrollmentCount), 0)
      const avgRating = coursesData.courses.length > 0
        ? coursesData.courses.reduce((sum: number, course: Course) => sum + course.rating, 0) / coursesData.courses.length
        : 0

      setStats({
        totalCourses,
        totalStudents,
        totalRevenue,
        avgRating
      })

    } catch (error) {
      console.error('Failed to fetch instructor data:', error)
      toast.error("Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete course')
      }

      toast.success("Course deleted successfully")
      fetchInstructorData() // Refresh the data
    } catch (error: any) {
      console.error('Failed to delete course:', error)
      toast.error(error.message || "Failed to delete course")
    }
  }

  const togglePublishStatus = async (courseId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ published: !currentStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update course status')
      }

      toast.success(`Course ${!currentStatus ? 'published' : 'unpublished'} successfully`)
      fetchInstructorData() // Refresh the data
    } catch (error) {
      console.error('Failed to update course status:', error)
      toast.error("Failed to update course status")
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return (
    <RoleGuard requiredRole="INSTRUCTOR">
      <SiteLayout>
      <div className="container py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your courses and track your teaching success
            </p>
          </div>
          <Button asChild>
            <Link href="/instructor/courses/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Course
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Courses Management */}
        <Tabs defaultValue="courses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-4">
            {courses.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Start creating your first course to begin teaching students.
                  </p>
                  <Button asChild>
                    <Link href="/instructor/courses/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Course
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                  <Card key={course.id} className="group relative">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={course.published ? "default" : "secondary"}>
                              {course.published ? "Published" : "Draft"}
                            </Badge>
                            <Badge variant="outline">{course.difficulty}</Badge>
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/courses/${course.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/instructor/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteCourse(course.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="line-clamp-3 mb-4">
                        {course.description}
                      </CardDescription>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">${course.price}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Students:</span>
                          <span className="font-medium">{course.enrollmentCount}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Rating:</span>
                          <span className="font-medium">{course.rating.toFixed(1)} ({course.reviewCount})</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant={course.published ? "outline" : "default"}
                          onClick={() => togglePublishStatus(course.id, course.published)}
                          className="flex-1"
                        >
                          {course.published ? "Unpublish" : "Publish"}
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <Link href={`/instructor/courses/${course.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Analytics</CardTitle>
                <CardDescription>
                  Track your teaching performance and course metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Analytics dashboard coming soon...
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      </SiteLayout>
    </RoleGuard>
  )
}