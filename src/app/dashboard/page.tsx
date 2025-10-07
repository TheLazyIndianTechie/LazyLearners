"use client"

import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { SiteLayout } from "@/components/layout/site-layout"
import { EnhancedCourseCard } from "@/components/course/enhanced-course-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDashboard } from "@/hooks/use-dashboard"
import { useAnalytics } from "@/hooks/use-analytics"
import { useStreak } from "@/hooks/use-streak"
import {
  BookOpen,
  Clock,
  Trophy,
  Target,
  TrendingUp,
  Calendar,
  PlayCircle,
  CheckCircle,
  Star,
  Award,
  BarChart3,
  PieChart,
  Activity,
  ArrowRight,
  Zap,
  Users,
  MessageSquare,
  Download
} from "lucide-react"
import { StreakVisualization } from "@/components/progress/streak-visualization"
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
  Legend
} from 'recharts'

// Chart colors
const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']

export default function DashboardPage() {
  const { isSignedIn, user } = useUser()
  const router = useRouter()
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError, refetch } = useDashboard()
  const { data: analyticsData, loading: analyticsLoading } = useAnalytics()
  const { data: streakData, loading: streakLoading } = useStreak()
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    if (!isSignedIn) {
      router.push("/auth/signin")
      return
    }
  }, [isSignedIn, router])

  if (dashboardLoading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (!isSignedIn) {
    return null
  }

  if (dashboardError) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="text-center">
            <p className="text-red-600">Error loading dashboard: {dashboardError}</p>
            <Button onClick={refetch} className="mt-4">
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

  // Use real analytics data or fall back to empty arrays
  const weeklyProgress = analyticsData?.weeklyProgress || []
  const courseDistribution = analyticsData?.courseDistribution.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length]
  })) || []

  const recentLessons = [
    {
      id: '1',
      title: 'Unity Interface Tour',
      course: 'Complete Unity Game Development',
      completedAt: '2 hours ago',
      type: 'VIDEO',
      duration: 15
    },
    {
      id: '2',
      title: 'Creating Your First Script',
      course: 'Unity C# Fundamentals',
      completedAt: '1 day ago',
      type: 'INTERACTIVE',
      duration: 25
    },
    {
      id: '3',
      title: 'Game Design Principles Quiz',
      course: 'Game Design Fundamentals',
      completedAt: '2 days ago',
      type: 'QUIZ',
      duration: 10
    }
  ]

  const upcomingDeadlines = [
    {
      id: '1',
      title: '2D Platformer Project',
      course: 'Complete Unity Game Development',
      dueDate: 'Tomorrow',
      type: 'PROJECT'
    },
    {
      id: '2',
      title: 'Character Controller Assignment',
      course: 'Unreal Engine 5 Mastery',
      dueDate: 'In 3 days',
      type: 'PROJECT'
    }
  ]

  const achievements = [
    {
      id: '1',
      title: 'First Steps',
      description: 'Completed your first lesson',
      icon: '🎯',
      earnedAt: '3 days ago'
    },
    {
      id: '2',
      title: 'Code Warrior',
      description: 'Wrote your first script',
      icon: '⚔️',
      earnedAt: '2 days ago'
    },
    {
      id: '3',
      title: 'Quiz Master',
      description: 'Scored 100% on a quiz',
      icon: '🧠',
      earnedAt: '1 day ago'
    }
  ]

  return (
    <SiteLayout>
      <div className="container py-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Welcome back, {user?.firstName || user?.fullName?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-xl text-muted-foreground mt-2">
              Continue your game development journey
            </p>
          </div>

          {/* Main Stats - WCAG 2.1 AA compliant colors */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Enrolled Courses</p>
                    <p className="text-3xl font-bold text-blue-950">{stats.totalCourses}</p>
                    <p className="text-xs text-blue-800 mt-1">Active learning paths</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-blue-700" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-900">Overall Progress</p>
                    <p className="text-3xl font-bold text-green-950">{overallProgress}%</p>
                    <Progress value={overallProgress} className="h-2 mt-2 bg-green-200">
                      <div
                        className="h-full bg-gradient-to-r from-green-600 to-green-700 rounded-full"
                        style={{ width: `${overallProgress}%` }}
                      />
                    </Progress>
                  </div>
                  <Target className="h-8 w-8 text-green-700" />
                </div>
              </CardContent>
            </Card>

             <Card className="border-2 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
               <CardContent className="p-6">
                 <div className="flex items-center justify-between">
                   <div>
                     <p className="text-sm font-medium text-purple-900">Learning Streak</p>
                     <p className="text-3xl font-bold text-purple-950">
                       {streakLoading ? '...' : `${streakData?.currentStreak || 0} days`}
                     </p>
                     <p className="text-xs text-purple-800 mt-1">
                       {streakData?.currentStreak && streakData.currentStreak > 0 ? 'Keep it going! 🔥' : 'Start your streak today!'}
                     </p>
                   </div>
                   <Zap className="h-8 w-8 text-purple-700" />
                 </div>
               </CardContent>
             </Card>

            <Card className="border-2 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-900">Time Spent</p>
                    <p className="text-3xl font-bold text-orange-950">{Math.floor(stats.totalTimeSpent / 60)}h</p>
                    <p className="text-xs text-orange-800 mt-1">This month</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-700" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4">
            <TabsTrigger value="overview" className="min-h-[44px]">Overview</TabsTrigger>
            <TabsTrigger value="progress" className="min-h-[44px]">Progress</TabsTrigger>
            <TabsTrigger value="courses" className="min-h-[44px]">My Courses</TabsTrigger>
            <TabsTrigger value="achievements" className="min-h-[44px]">Achievements</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Continue Learning */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <PlayCircle className="h-5 w-5 text-blue-500" />
                      Continue Learning
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={() => router.push("/courses")} className="min-h-[44px]">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {enrolledCourses.slice(0, 3).map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer min-h-[44px]"
                      onClick={() => router.push(`/courses/${course.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          router.push(`/courses/${course.id}`)
                        }
                      }}
                    >
                      <img
                        src={course.thumbnail || '/placeholder-course.jpg'}
                        alt={course.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{course.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={course.progress} className="h-2 flex-1" />
                          <span className="text-sm text-muted-foreground">{course.progress}%</span>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {recentLessons.map((lesson) => (
                    <div key={lesson.id} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <p className="text-xs text-muted-foreground">{lesson.course}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">{lesson.completedAt}</Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Deadlines */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-500" />
                    Upcoming Deadlines
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingDeadlines.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No upcoming deadlines</p>
                  ) : (
                    upcomingDeadlines.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          <p className="text-sm text-muted-foreground">{item.course}</p>
                        </div>
                        <Badge variant="outline" className="text-orange-600">
                          {item.dueDate}
                        </Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 min-h-[44px]"
                      onClick={() => router.push("/portfolio")}
                    >
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-lg">🎮</span>
                      </div>
                      <span className="text-sm">Portfolio</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 min-h-[44px]"
                      onClick={() => router.push("/community")}
                    >
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-sm">Community</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 min-h-[44px]"
                    >
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <span className="text-sm">Certificates</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-center gap-2 min-h-[44px]"
                      onClick={() => router.push("/courses")}
                    >
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <span className="text-sm">Explore</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            {/* Analytics Stats Row */}
            {analyticsData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">This Week</p>
                        <p className="text-2xl font-bold">{analyticsData.stats.totalMinutesThisWeek} min</p>
                      </div>
                      <Clock className="h-8 w-8 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Lessons Completed</p>
                        <p className="text-2xl font-bold">{analyticsData.stats.totalLessonsThisWeek}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">{analyticsData.stats.completionRate}%</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Daily Average</p>
                        <p className="text-2xl font-bold">{analyticsData.stats.averageDailyMinutes} min</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-orange-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Learning Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Weekly Learning Activity
                  </CardTitle>
                  <CardDescription>Your learning minutes this week</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : weeklyProgress.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>No activity data yet. Start learning to see your progress!</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyProgress}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis
                          dataKey="day"
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12 }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px'
                          }}
                          labelFormatter={(label) => `${label}`}
                          formatter={(value: number, name: string) => [
                            value,
                            name === 'minutes' ? 'Minutes' : 'Lessons'
                          ]}
                        />
                        <Bar
                          dataKey="minutes"
                          fill="#3b82f6"
                          radius={[4, 4, 0, 0]}
                          animationDuration={500}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>

              {/* Course Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-green-500" />
                    Course Categories
                  </CardTitle>
                  <CardDescription>Your learning focus areas</CardDescription>
                </CardHeader>
                <CardContent>
                  {analyticsLoading ? (
                    <div className="h-[200px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : courseDistribution.length === 0 ? (
                    <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                      <p>Enroll in courses to see distribution</p>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <RechartsPieChart>
                        <Pie
                          data={courseDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          animationDuration={500}
                        >
                          {courseDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'white',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            padding: '12px'
                          }}
                          formatter={(value: number) => [`${value}%`, 'Progress']}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          iconType="circle"
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Detailed Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress Details</CardTitle>
                <CardDescription>Track your progress across all enrolled courses</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {enrolledCourses.map((course) => (
                  <div key={course.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{course.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {course.completedLessons} of {course.totalLessons} lessons completed
                        </p>
                      </div>
                      <Badge variant="outline">{course.progress}%</Badge>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Learning Streak Visualization */}
            <StreakVisualization
              streakData={streakData}
              loading={streakLoading}
            />
          </TabsContent>

          {/* My Courses Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">My Courses</h2>
              <Button variant="outline" onClick={() => router.push("/courses")} className="min-h-[44px]">
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

            {enrolledCourses.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
                  <p className="text-muted-foreground mb-6">
                    Start your game development journey by enrolling in your first course.
                  </p>
                  <Button onClick={() => router.push("/courses")} className="min-h-[44px]">
                    Explore Courses
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement) => (
                <Card key={achievement.id} className="border-2 border-dashed border-yellow-300 bg-yellow-50">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-4">{achievement.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                    <Badge variant="secondary">{achievement.earnedAt}</Badge>
                  </CardContent>
                </Card>
              ))}

              {/* Locked Achievement Example */}
              <Card className="border-2 border-dashed border-gray-300 bg-gray-50 opacity-60">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="font-semibold text-lg mb-2">Game Master</h3>
                  <p className="text-sm text-muted-foreground mb-2">Complete 5 courses</p>
                  <Badge variant="outline">Locked</Badge>
                </CardContent>
              </Card>

              <Card className="border-2 border-dashed border-gray-300 bg-gray-50 opacity-60">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="font-semibold text-lg mb-2">Speed Learner</h3>
                  <p className="text-sm text-muted-foreground mb-2">Complete a course in 1 week</p>
                  <Badge variant="outline">Locked</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SiteLayout>
  )
}