"use client"

import { AnalyticsShell } from "@/components/analytics/analytics-shell"

export default function EmbeddedAnalyticsPage() {
  // Example configuration - in production, this would come from a config file or API
  const posthogInsights = [
    {
      id: "user-engagement-trends",
      title: "User Engagement Trends",
      description: "Track user activity patterns and engagement metrics over time.",
    },
    {
      id: "course-completion-funnel",
      title: "Course Completion Funnel",
      description: "Analyze drop-off points and completion rates across courses.",
    },
  ]

  const metabaseDashboards = [
    {
      id: 1,
      title: "Revenue Analytics Dashboard",
      description: "Comprehensive revenue metrics and financial performance indicators.",
    },
    {
      id: 2,
      title: "Student Demographics",
      description: "Demographic breakdown and enrollment patterns.",
    },
  ]

  const metabaseQuestions = [
    {
      id: 1,
      title: "Top Performing Courses",
      description: "Courses ranked by enrollment and completion rates.",
    },
    {
      id: 2,
      title: "Monthly Active Users",
      description: "User activity trends by month.",
    },
  ]

  return (
    <AnalyticsShell
      title="Embedded Analytics Dashboard"
      description="Unified analytics experience with PostHog and Metabase integrations."
      posthogInsights={posthogInsights}
      metabaseDashboards={metabaseDashboards}
      metabaseQuestions={metabaseQuestions}
    />
  )
}