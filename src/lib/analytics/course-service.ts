import type {
  AnalyticsMeta,
  AnalyticsQuery,
  CoursePerformanceMetric,
  CoursePerformanceResponse,
  CoursePerformanceTimeseriesPoint,
} from "./client";

export interface CoursePerformanceParams extends AnalyticsQuery {
  instructorId: string;
  baselineCourseId?: string;
  comparisonCourseIds?: string[];
}

export interface CourseSnapshot {
  courseId: string;
  courseTitle: string;
  enrollments: number;
  completions: number;
  activeLearners?: number;
  averageProgress?: number;
  revenueCents?: number;
  previousPeriod?: {
    enrollments?: number;
    completions?: number;
    revenueCents?: number;
  };
}

export interface CourseDailyRecord {
  courseId: string;
  date: string;
  enrollments: number;
  completions: number;
  activeLearners: number;
  revenueCents?: number;
}

export interface CourseAnalyticsRepository {
  fetchCourseSnapshots(
    params: CoursePerformanceParams,
  ): Promise<CourseSnapshot[]>;
  fetchCourseDailyRecords(
    params: CoursePerformanceParams,
  ): Promise<CourseDailyRecord[]>;
}

export interface CoursePerformanceAggregation
  extends CoursePerformanceResponse {}

const DEFAULT_WINDOW_DAYS = 30;

export class CourseAnalyticsService {
  constructor(private readonly repository: CourseAnalyticsRepository) {}

  async getCoursePerformance(
    params: CoursePerformanceParams,
  ): Promise<CoursePerformanceAggregation> {
    const window = resolveWindow(params);
    const snapshots = await this.repository.fetchCourseSnapshots({
      ...params,
      startDate: window.start.toISOString(),
      endDate: window.end.toISOString(),
    });

    const dailyRecords = await this.repository.fetchCourseDailyRecords({
      ...params,
      startDate: window.start.toISOString(),
      endDate: window.end.toISOString(),
    });

    const metrics = buildMetrics(snapshots);
    const timeseries = buildTimeseries(dailyRecords, params);
    const meta = buildMeta(window, params, dailyRecords.length, metrics.length);

    return {
      metrics,
      timeseries,
      meta,
    };
  }
}

export function createCourseAnalyticsService(
  repository: CourseAnalyticsRepository,
) {
  return new CourseAnalyticsService(repository);
}

function buildMetrics(snapshots: CourseSnapshot[]): CoursePerformanceMetric[] {
  return snapshots.map((snapshot) => {
    const safeEnrollments = Math.max(snapshot.enrollments, 0);
    const safeCompletions = Math.max(snapshot.completions, 0);
    const completionRate =
      safeEnrollments > 0
        ? Number(((safeCompletions / safeEnrollments) * 100).toFixed(2))
        : 0;

    const activeLearners =
      snapshot.activeLearners !== undefined
        ? Math.max(snapshot.activeLearners, 0)
        : Math.max(safeEnrollments - safeCompletions, 0);

    const revenue =
      snapshot.revenueCents !== undefined
        ? Number((snapshot.revenueCents / 100).toFixed(2))
        : undefined;

    const revenueTrendPct = snapshot.previousPeriod?.revenueCents
      ? calculateTrendPercentage(
          snapshot.revenueCents ?? 0,
          snapshot.previousPeriod.revenueCents,
        )
      : undefined;

    const enrollmentTrendPct = snapshot.previousPeriod?.enrollments
      ? calculateTrendPercentage(
          snapshot.enrollments,
          snapshot.previousPeriod.enrollments,
        )
      : undefined;

    const averageProgress =
      snapshot.averageProgress !== undefined
        ? Number(snapshot.averageProgress.toFixed(2))
        : safeEnrollments > 0
          ? Number(((safeCompletions / safeEnrollments) * 100).toFixed(2))
          : 0;

    return {
      courseId: snapshot.courseId,
      courseTitle: snapshot.courseTitle,
      totalEnrollments: safeEnrollments,
      totalCompletions: safeCompletions,
      completionRate,
      activeLearners,
      averageProgress,
      revenue,
      revenueTrendPct,
      enrollmentTrendPct,
    };
  });
}

function buildTimeseries(
  records: CourseDailyRecord[],
  params: CoursePerformanceParams,
): CoursePerformanceTimeseriesPoint[] {
  if (records.length === 0) {
    return [];
  }

  const bucketMap = new Map<string, CoursePerformanceTimeseriesPoint>();

  records.forEach((record) => {
    if (
      params.courseIds &&
      params.courseIds.length > 0 &&
      !params.courseIds.includes(record.courseId)
    ) {
      return;
    }

    const key = toDateKey(record.date);
    const existing = bucketMap.get(key);

    if (existing) {
      existing.enrollments += record.enrollments;
      existing.completions += record.completions;
      existing.activeLearners += record.activeLearners;
      if (record.revenueCents !== undefined) {
        existing.revenue = Number(
          ((existing.revenue ?? 0) + record.revenueCents / 100).toFixed(2),
        );
      }
      return;
    }

    bucketMap.set(key, {
      date: key,
      enrollments: record.enrollments,
      completions: record.completions,
      activeLearners: record.activeLearners,
      revenue:
        record.revenueCents !== undefined
          ? Number((record.revenueCents / 100).toFixed(2))
          : undefined,
    });
  });

  return Array.from(bucketMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );
}

function buildMeta(
  window: { start: Date; end: Date },
  params: CoursePerformanceParams,
  sampleSize: number,
  courseCount: number,
): AnalyticsMeta {
  return {
    generatedAt: new Date().toISOString(),
    window: {
      start: window.start.toISOString(),
      end: window.end.toISOString(),
      preset: params.preset,
    },
    sampleSize,
    baselineCourseId: params.baselineCourseId,
    comparisonCourseIds: params.comparisonCourseIds,
    warnings: buildWarnings(sampleSize, courseCount),
  };
}

function buildWarnings(
  sampleSize: number,
  courseCount: number,
): string[] | undefined {
  const warnings: string[] = [];

  if (courseCount === 0) {
    warnings.push("No courses matched the current filter criteria.");
  }

  if (sampleSize === 0) {
    warnings.push("No activity recorded during the selected date range.");
  }

  return warnings.length > 0 ? warnings : undefined;
}

function resolveWindow(params: AnalyticsQuery): { start: Date; end: Date } {
  const end = params.endDate ? new Date(params.endDate) : new Date();
  const start = params.startDate ? new Date(params.startDate) : new Date(end);

  if (!params.startDate) {
    start.setDate(end.getDate() - DEFAULT_WINDOW_DAYS);
  }

  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function calculateTrendPercentage(
  current: number,
  previous: number | undefined,
): number {
  if (!previous || previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Number((((current - previous) / previous) * 100).toFixed(2));
}

function toDateKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toISOString().split("T")[0];
}
