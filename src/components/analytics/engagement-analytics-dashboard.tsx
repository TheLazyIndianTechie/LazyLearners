"use client"

import { useMemo } from "react"
import { AnalyticsLayout } from "@/components/analytics/analytics-layout"
import { CourseSelector } from "@/components/analytics/course-selector"
import { AnalyticsDateRangePicker } from "@/components/analytics/date-range-picker"
import { PosthogInsightEmbed } from "@/components/analytics/posthog-embed"
import { KPICard, KPICardGrid } from "@/components/analytics/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, TrendingUp, Users, Clock, PlayCircle, BookOpen } from "lucide-react"
import { useAnalytics } from "@/contexts/analytics-context"
import { useAnalyticsData } from "@/hooks/use-analytics-data"
import { useUser } from "@clerk/nextjs"
import { useSessionTracking } from "@/hooks/use-session-tracking"

interface EngagementMetrics {
  totalActiveUsers: number
  avgSessionDuration: number
  totalVideoViews: number
  totalQuizCompletions: number
  engagementRate: number
  completionRate: number
}

export function EngagementAnalyticsDashboard() {
  const { user } = useUser()
  const analyticsState = useAnalytics()
  const {
    selectedCourseIds,
    dateRange,
    includeArchived,
  } = analyticsState

  const instructorId = user?.id

  // Track user sessions
  useSessionTracking({
    enabled: !!instructorId,
    trackPageViews: true,
    trackActivity: true,
  })

  const query = useMemo(
    () => ({
      courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      preset: dateRange.preset,
      includeArchived,
    }),
    [
      selectedCourseIds,
      dateRange.start,
      dateRange.end,
      dateRange.preset,
      includeArchived,
    ],
  )

  const { data: engagementData, isLoading, error, mutate } = useAnalyticsData<{
    metrics: EngagementMetrics
    trends: Array<{
      date: string
      activeUsers: number
      sessionDuration: number
      videoViews: number
      quizCompletions: number
    }>
  }>("/api/analytics/engagement", query)

  const metrics = engagementData?.metrics ?? {
    totalActiveUsers: 0,
    avgSessionDuration: 0,
    totalVideoViews: 0,
    totalQuizCompletions: 0,
    engagementRate: 0,
    completionRate: 0,
  }

  const filters = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <AnalyticsDateRangePicker className="w-full md:w-auto" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => mutate()}
            disabled={isLoading}
            className="gap-1"
          >
            <RefreshCw className={isLoading ? "animate-spin" : ""} className="h-4 w-4" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {engagementData?.generatedAt && (
            <span>
              Generated {new Date(engagementData.generatedAt).toLocaleTimeString()}
            </span>
          )}
          <Badge variant="outline" className="text-xs">
            {selectedCourseIds.length} course{selectedCourseIds.length !== 1 ? 's' : ''} selected
          </Badge>
          <Badge variant="outline" className="text-xs">
            {includeArchived ? 'Including archived' : 'Active only'}
          </Badge>
        </div>
      </div>
    </div>
  )

  return (
    <AnalyticsLayout
      title="Engagement Analytics Dashboard"
      description="Comprehensive learner engagement metrics and behavioral insights powered by PostHog analytics."
      filters={filters}
      breadcrumbs={[
        { label: "Instructor", href: "/instructor" },
        { label: "Analytics", href: "/instructor/analytics" },
        { label: "Engagement" },
      ]}
    >
      <CourseSelector />

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}

      {/* Key Engagement Metrics */}
      <KPICardGrid>
        <KPICard
          title="Active Learners"
          value={metrics.totalActiveUsers}
          description="Total active users in selected period"
          icon={<Users className="h-4 w-4" />}
        />
        <KPICard
          title="Avg. Session Duration"
          value={metrics.avgSessionDuration}
          format="duration"
          description="Average time spent per session"
          icon={<Clock className="h-4 w-4" />}
        />
        <KPICard
          title="Video Views"
          value={metrics.totalVideoViews}
          description="Total video content views"
          icon={<PlayCircle className="h-4 w-4" />}
        />
        <KPICard
          title="Quiz Completions"
          value={metrics.totalQuizCompletions}
          description="Total quiz assessments completed"
          icon={<BookOpen className="h-4 w-4" />}
        />
        <KPICard
          title="Engagement Rate"
          value={metrics.engagementRate}
          format="percentage"
          description="Percentage of engaged learners"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <KPICard
          title="Completion Rate"
          value={metrics.completionRate}
          format="percentage"
          description="Course completion success rate"
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </KPICardGrid>

      {/* User Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            User Activity Trends
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Daily, weekly, and monthly active user patterns over time.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PosthogInsightEmbed
              insightId="dau_trend"
              title="Daily Active Users"
              description="Track daily active learners over time"
              height={300}
            />
            <PosthogInsightEmbed
              insightId="wau_trend"
              title="Weekly Active Users"
              description="Track weekly active learners over time"
              height={300}
            />
          </div>
          <PosthogInsightEmbed
            insightId="mau_trend"
            title="Monthly Active Users"
            description="Track monthly active learners over time"
            height={300}
          />
        </CardContent>
      </Card>

      {/* Learning Engagement Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Learning Engagement Metrics
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Detailed breakdown of learner interactions with course content and assessments.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <PosthogInsightEmbed
              insightId="session_duration"
              title="Session Duration Trends"
              description="Average time spent per learning session over time"
              height={300}
            />
            <PosthogInsightEmbed
              insightId="video_watch_time"
              title="Video Engagement"
              description="Average video watch time and completion rates"
              height={300}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PosthogInsightEmbed
              insightId="quiz_completion_rate"
              title="Quiz Performance"
              description="Quiz completion and pass rates over time"
              height={300}
            />
            <PosthogInsightEmbed
              insightId="course_engagement_by_category"
              title="Course Engagement by Category"
              description="Compare engagement across different course categories"
              height={300}
            />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <PosthogInsightEmbed
              insightId="user_retention"
              title="User Retention Analysis"
              description="Track how well learners stay engaged over time"
              height={300}
            />
            <PosthogInsightEmbed
              insightId="content_interaction_heatmap"
              title="Content Interaction Patterns"
              description="When learners are most active throughout the day"
              height={300}
            />
          </div>
        </CardContent>
      </Card>

      {/* Learning Funnels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Learning Progression Funnels
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Conversion funnels showing learner progression through courses and drop-off analysis.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <PosthogInsightEmbed
            insightId="enrollment_funnel"
            title="Enrollment Funnel"
            description="From course discovery to enrollment conversion"
            height={400}
          />
          <PosthogInsightEmbed
            insightId="learning_progression_funnel"
            title="Learning Progression Funnel"
            description="From enrollment to course completion journey"
            height={400}
          />
        </CardContent>
      </Card>

      {/* Instructor-specific Insights */}
      {instructorId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Instructor-Specific Analytics
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Analytics specific to your courses and learners.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <PosthogInsightEmbed
                insightId="course_engagement_by_category"
                title="Your Course Performance by Category"
                description="Compare engagement across your course categories"
                height={300}
              />
              <PosthogInsightEmbed
                insightId="quiz_completion_rate"
                title="Your Quiz Performance"
                description="Quiz completion and pass rates for your courses"
                height={300}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </AnalyticsLayout>
  )
}