"use client";

import { useMemo } from "react";
import {
  AnalyticsLayout,
  AnalyticsSection,
} from "@/components/analytics/analytics-layout";
import { KPICard, KPICardGrid } from "@/components/analytics/kpi-card";
import AnalyticsSkeleton from "@/components/analytics/analytics-skeleton";
import CourseSelector from "@/components/analytics/course-selector";
import AnalyticsDateRangePicker from "@/components/analytics/date-range-picker";
import { Button } from "@/components/ui/button";
import {
  useAnalytics,
  useAnalyticsRealTime,
} from "@/contexts/analytics-context";
import { useAnalyticsData } from "@/hooks/use-analytics-data";
import type {
  CoursePerformanceMetric,
  CoursePerformanceTimeseriesPoint,
  CoursePerformanceResponse,
} from "@/lib/analytics/client";
import { PosthogInsightEmbed } from "@/components/analytics/posthog-embed";
import { POSTHOG_INSIGHTS } from "@/lib/analytics/posthog-config";
import { VideoAnalyticsDashboard } from "@/components/analytics/video-analytics-dashboard";
import { useUser } from "@clerk/nextjs";
import { useSessionTracking } from "@/hooks/use-session-tracking";
import {
  Area,
  AreaChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarClock, RefreshCw } from "lucide-react";

type PerformanceData = CoursePerformanceResponse;

function RealTimeToggle() {
  const { realTime, toggleRealTime } = useAnalyticsRealTime();

  return (
    <Button
      variant={realTime.enabled ? "outline" : "ghost"}
      size="sm"
      className="gap-1"
      onClick={() => toggleRealTime()}
    >
      <RefreshCw className="h-4 w-4" />
      {realTime.enabled ? "Pause live data" : "Enable live data"}
    </Button>
  );
}

function PerformanceTimeseries({
  data,
}: {
  data: CoursePerformanceTimeseriesPoint[];
}) {
  if (!data.length) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        No activity recorded during the selected date range.
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <AreaChart data={data}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="enrollments"
            stroke="#2563eb"
            fill="#93c5fd"
            name="Enrollments"
          />
          <Area
            type="monotone"
            dataKey="completions"
            stroke="#16a34a"
            fill="#86efac"
            name="Completions"
          />
          <Area
            type="monotone"
            dataKey="activeLearners"
            stroke="#f97316"
            fill="#fed7aa"
            name="Active Learners"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PerformanceTable({ metrics }: { metrics: CoursePerformanceMetric[] }) {
  if (!metrics.length) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 text-sm text-muted-foreground">
        No courses match the current filters.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="min-w-full divide-y divide-border bg-card text-sm">
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-left font-medium">Course</th>
            <th className="px-4 py-3 text-right font-medium">Enrollments</th>
            <th className="px-4 py-3 text-right font-medium">Completions</th>
            <th className="px-4 py-3 text-right font-medium">Completion %</th>
            <th className="px-4 py-3 text-right font-medium">Active</th>
            <th className="px-4 py-3 text-right font-medium">Revenue</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {metrics.map((metric) => (
            <tr key={metric.courseId} className="hover:bg-muted/30">
              <td className="px-4 py-3 font-medium text-foreground">
                {metric.courseTitle}
              </td>
              <td className="px-4 py-3 text-right">
                {metric.totalEnrollments.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {metric.totalCompletions.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {metric.completionRate.toFixed(1)}%
              </td>
              <td className="px-4 py-3 text-right">
                {metric.activeLearners.toLocaleString()}
              </td>
              <td className="px-4 py-3 text-right">
                {metric.revenue?.toLocaleString("en-US", {
                  style: "currency",
                  currency: "USD",
                }) ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function kpiTrendColor(value?: number) {
  if (value === undefined) return undefined;
  if (value === 0) return "text-muted-foreground";
  return value > 0
    ? "text-green-600 dark:text-green-500"
    : "text-red-600 dark:text-red-500";
}

export default function InstructorAnalyticsPage() {
  const { user } = useUser();
  const analyticsState = useAnalytics();
  const {
    selectedCourseIds,
    dateRange,
    includeArchived,
    comparison,
    realTime,
  } = analyticsState;

  const instructorId = user?.id;

  // Track user sessions
  useSessionTracking({
    enabled: !!instructorId,
    trackPageViews: true,
    trackActivity: true,
  });

  const query = useMemo(
    () => ({
      courseIds: selectedCourseIds.length ? selectedCourseIds : undefined,
      startDate: dateRange.start.toISOString(),
      endDate: dateRange.end.toISOString(),
      preset: dateRange.preset,
      includeArchived,
      realtime: realTime.enabled,
      baselineCourseId: comparison.baselineCourseId,
      comparisonCourseIds: comparison.comparisonCourseIds,
    }),
    [
      selectedCourseIds,
      dateRange.start,
      dateRange.end,
      dateRange.preset,
      includeArchived,
      comparison.baselineCourseId,
      comparison.comparisonCourseIds,
      realTime.enabled,
    ],
  );

  const { data, isLoading, error, mutate } = useAnalyticsData<PerformanceData>(
    "/api/analytics/performance",
    query,
  );

  const metrics = data?.metrics ?? [];
  const timeseries = data?.timeseries ?? [];

  const totalEnrollments = metrics.reduce(
    (acc, metric) => acc + metric.totalEnrollments,
    0,
  );
  const totalCompletions = metrics.reduce(
    (acc, metric) => acc + metric.totalCompletions,
    0,
  );
  const totalRevenue = metrics.reduce(
    (acc, metric) => acc + (metric.revenue ?? 0),
    0,
  );
  const avgCompletionRate =
    metrics.length > 0
      ? metrics.reduce((acc, metric) => acc + metric.completionRate, 0) /
        metrics.length
      : 0;

  const filters = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <AnalyticsDateRangePicker className="w-full md:w-auto" />
          <RealTimeToggle />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {data?.meta?.generatedAt && (
            <span>
              Generated {new Date(data.meta.generatedAt).toLocaleTimeString()}
            </span>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => mutate()}
            className="gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <AnalyticsLayout
      title="Course Performance Analytics"
      description="Track enrollments, completions, revenue, and active learner trends across your courses."
      filters={filters}
      breadcrumbs={[
        { label: "Instructor", href: "/instructor" },
        { label: "Analytics" },
      ]}
    >
      <CourseSelector />
      {isLoading && !data && <AnalyticsSkeleton />}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700">
          {error.message}
        </div>
      )}
      {data && (
        <>
          <KPICardGrid>
            <KPICard
              title="Total Enrollments"
              value={totalEnrollments}
              description="Across selected courses"
              trend={{
                value:
                  metrics.find(
                    (metric) => metric.enrollmentTrendPct !== undefined,
                  )?.enrollmentTrendPct ?? 0,
              }}
            />
            <KPICard
              title="Total Completions"
              value={totalCompletions}
              description="Learners who completed"
            />
            <KPICard
              title="Avg. Completion Rate"
              value={avgCompletionRate}
              format="percentage"
              description="Average across courses"
            />
            <KPICard
              title="Total Revenue"
              value={totalRevenue}
              format="currency"
              description="Estimated gross revenue"
            />
          </KPICardGrid>

          <AnalyticsSection
            title="Learner Activity Over Time"
            description="Monitor enrollments, completions, and active learners by day."
          >
            <PerformanceTimeseries data={timeseries} />
          </AnalyticsSection>

          <AnalyticsSection
            title="Course Performance Breakdown"
            description="Compare course-level KPIs to identify top performers."
          >
            <PerformanceTable metrics={metrics} />
          </AnalyticsSection>

          {/* PostHog Analytics Insights */}
          <AnalyticsSection
            title="User Engagement Analytics"
            description="Detailed learner behavior insights powered by PostHog."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <PosthogInsightEmbed
                insightId="dau_trend"
                title="Daily Active Users"
                description="Track daily active learners over time"
                height={300}
              />
              <PosthogInsightEmbed
                insightId="session_duration"
                title="Session Duration"
                description="Average time spent per learning session"
                height={300}
              />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            title="Learning Funnels"
            description="Conversion funnels showing learner progression through courses."
          >
            <div className="grid gap-6">
              <PosthogInsightEmbed
                insightId="enrollment_funnel"
                title="Enrollment Funnel"
                description="From course discovery to enrollment"
                height={400}
              />
              <PosthogInsightEmbed
                insightId="learning_progression_funnel"
                title="Learning Progression Funnel"
                description="From enrollment to course completion"
                height={400}
              />
            </div>
          </AnalyticsSection>

          <AnalyticsSection
            title="Content Engagement"
            description="How learners interact with different types of content."
          >
            <div className="grid gap-6 md:grid-cols-2">
              <PosthogInsightEmbed
                insightId="video_watch_time"
                title="Video Engagement"
                description="Average video watch time and completion rates"
                height={300}
              />
              <PosthogInsightEmbed
                insightId="quiz_completion_rate"
                title="Quiz Performance"
                description="Quiz completion and pass rates"
                height={300}
              />
            </div>
           </AnalyticsSection>

           <AnalyticsSection
             title="Video Analytics Dashboard"
             description="Detailed video playback analytics with retention analysis, heatmaps, and engagement metrics."
           >
             <VideoAnalyticsDashboard />
           </AnalyticsSection>

           {/* Instructor-specific insights */}
          {instructorId && (
            <AnalyticsSection
              title="Instructor Analytics"
              description="Analytics specific to your courses and learners."
            >
              <div className="grid gap-6">
                <PosthogInsightEmbed
                  insightId="course_engagement_by_category"
                  title="Course Performance by Category"
                  description="Compare engagement across different course categories"
                  height={400}
                />
              </div>
            </AnalyticsSection>
          )}

          {data.meta?.warnings?.length ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <ul className="list-disc space-y-1 pl-5">
                {data.meta.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      )}
    </AnalyticsLayout>
  );
}
