"use client"

import { useState } from "react"
import { AnalyticsLayout } from "@/components/analytics/analytics-layout"
import { CourseSelector } from "@/components/analytics/course-selector"
import { AnalyticsDateRangePicker } from "@/components/analytics/date-range-picker"
import { PosthogEmbed } from "@/components/analytics/posthog-embed"
import { MetabaseEmbed } from "@/components/analytics/metabase-embed"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw, Settings } from "lucide-react"
import { useAnalytics } from "@/contexts/analytics-context"

interface AnalyticsShellProps {
  title?: string
  description?: string
  posthogInsights?: Array<{
    id: string
    title: string
    description?: string
  }>
  metabaseDashboards?: Array<{
    id: number
    title: string
    description?: string
  }>
  metabaseQuestions?: Array<{
    id: number
    title: string
    description?: string
  }>
}

export function AnalyticsShell({
  title = "Analytics Dashboard",
  description = "Comprehensive analytics with unified filtering across all data sources.",
  posthogInsights = [],
  metabaseDashboards = [],
  metabaseQuestions = [],
}: AnalyticsShellProps) {
  const { selectedCourseIds, dateRange, includeArchived } = useAnalytics()
  const [activeTab, setActiveTab] = useState("overview")

  const filters = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <AnalyticsDateRangePicker className="w-full md:w-auto" />
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <Settings className="h-4 w-4" />
            Filters
          </Button>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
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

  const hasPosthogContent = posthogInsights.length > 0
  const hasMetabaseContent = metabaseDashboards.length > 0 || metabaseQuestions.length > 0

  return (
    <AnalyticsLayout
      title={title}
      description={description}
      filters={filters}
      breadcrumbs={[
        { label: "Instructor", href: "/instructor" },
        { label: "Analytics", href: "/instructor/analytics" },
        { label: "Embedded Dashboard" },
      ]}
    >
      <CourseSelector />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posthog" disabled={!hasPosthogContent}>
            PostHog Insights
          </TabsTrigger>
          <TabsTrigger value="metabase" disabled={!hasMetabaseContent}>
            Metabase Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analytics Overview</CardTitle>
              <p className="text-sm text-muted-foreground">
                Unified dashboard with shared filters across all analytics sources.
                Select courses and date ranges above to filter all embedded content.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Current Filters</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Courses: {selectedCourseIds.length || 'All'}</div>
                    <div>Date Range: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}</div>
                    <div>Include Archived: {includeArchived ? 'Yes' : 'No'}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">PostHog Insights</h4>
                  <div className="text-sm text-muted-foreground">
                    {posthogInsights.length} insight{posthogInsights.length !== 1 ? 's' : ''} available
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium">Metabase Reports</h4>
                  <div className="text-sm text-muted-foreground">
                    {metabaseDashboards.length + metabaseQuestions.length} report{metabaseDashboards.length + metabaseQuestions.length !== 1 ? 's' : ''} available
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posthog" className="space-y-6">
          {posthogInsights.length === 0 ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No PostHog Insights Configured</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure PostHog insights in the analytics configuration.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {posthogInsights.map((insight) => (
                <PosthogEmbed
                  key={insight.id}
                  insightId={insight.id}
                  title={insight.title}
                  description={insight.description}
                  height={500}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="metabase" className="space-y-6">
          {(metabaseDashboards.length === 0 && metabaseQuestions.length === 0) ? (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-medium">No Metabase Reports Configured</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure Metabase dashboards and questions in the analytics configuration.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {metabaseDashboards.map((dashboard) => (
                <MetabaseEmbed
                  key={`dashboard-${dashboard.id}`}
                  dashboardId={dashboard.id}
                  title={dashboard.title}
                  description={dashboard.description}
                  height={500}
                />
              ))}
              {metabaseQuestions.map((question) => (
                <MetabaseEmbed
                  key={`question-${question.id}`}
                  questionId={question.id}
                  dashboardId={0} // Not used when questionId is provided
                  title={question.title}
                  description={question.description}
                  height={500}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AnalyticsLayout>
  )
}