"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { EnhancedCourseCard } from "@/components/course/enhanced-course-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Course } from "@/lib/types"
import { useDashboard } from "@/hooks/use-dashboard"


export default function DashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useDashboard()

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
  }, [session, status, router])

  if (status === "loading" || dashboardLoading) {
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

  if (!session) {
    return null
  }

  if (dashboardError) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="text-center">
            <p className="text-red-600">Error loading dashboard: {dashboardError}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </div>
        </div>
      </SiteLayout>
    )
  }

  const enrolledCourses = dashboardData?.enrolledCourses || []
  const stats = dashboardData?.stats || { totalCourses: 0, completedCourses: 0, averageProgress: 0, totalTimeSpent: 0 }
  const overallProgress = stats.averageProgress

  return (
    <SiteLayout>
      <div className="container py-8 space-y-8">
        {/* Welcome Section */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {session.user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Continue your game development journey
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-blue-700">Enrolled Courses</CardTitle>
                <div className="text-3xl font-bold text-blue-900">{stats.totalCourses}</div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-blue-600">Keep learning! 🚀</p>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-green-700">Overall Progress</CardTitle>
                <div className="text-3xl font-bold text-green-900">{overallProgress}%</div>
              </CardHeader>
              <CardContent>
                <Progress value={overallProgress} className="h-2 bg-green-200">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                    style={{ width: `${overallProgress}%` }}
                  />
                </Progress>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-purple-700">Learning Streak</CardTitle>
                <div className="text-3xl font-bold text-purple-900">7 days</div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-purple-600">Amazing consistency! 🔥</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Continue Learning Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Continue Learning</h2>
            <Button variant="outline" onClick={() => router.push("/courses")}>
              Browse All Courses
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((course) => (
              <EnhancedCourseCard
                key={course.id}
                course={course}
                showProgress={true}
                progress={course.progress}
              />
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => router.push("/portfolio")}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                  <span className="text-2xl">🎮</span>
                </div>
                <h3 className="font-semibold">View Portfolio</h3>
                <p className="text-sm text-muted-foreground">Showcase your games</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => router.push("/community")}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="font-semibold">Join Community</h3>
                <p className="text-sm text-muted-foreground">Connect with developers</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all group">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                  <span className="text-2xl">🏆</span>
                </div>
                <h3 className="font-semibold">View Certificates</h3>
                <p className="text-sm text-muted-foreground">Track achievements</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-lg transition-all group" onClick={() => router.push("/courses")}>
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-yellow-200 transition-colors">
                  <span className="text-2xl">📚</span>
                </div>
                <h3 className="font-semibold">Explore Courses</h3>
                <p className="text-sm text-muted-foreground">Discover new skills</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Recent Activity</h2>
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Completed "Unity Interface Tour" lesson</span>
                  <Badge variant="secondary" className="ml-auto">2 hours ago</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Started "Unreal Engine 5 Blueprint Mastery" course</span>
                  <Badge variant="secondary" className="ml-auto">1 day ago</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Earned "Unity Fundamentals" certificate</span>
                  <Badge variant="secondary" className="ml-auto">3 days ago</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SiteLayout>
  )
}