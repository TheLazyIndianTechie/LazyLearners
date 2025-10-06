import type { AnalyticsMeta, AnalyticsQuery } from "./client";

export interface RevenueMetrics {
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  arpu: number; // Average Revenue Per User
  aov: number; // Average Order Value
  refundRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
}

export interface RevenueTimeseriesPoint {
  date: string;
  grossRevenue: number;
  netRevenue: number;
  refunds: number;
  transactions: number;
  arpu: number;
  aov: number;
}

export interface RevenueAnalyticsResponse {
  metrics: RevenueMetrics;
  timeseries: RevenueTimeseriesPoint[];
  meta: AnalyticsMeta;
}

export interface RevenueAnalyticsParams extends AnalyticsQuery {
  instructorId: string;
  groupBy?: 'day' | 'week' | 'month';
}

export interface RevenueAnalyticsRepository {
  fetchRevenueMetrics(
    params: RevenueAnalyticsParams,
  ): Promise<RevenueMetrics>;
  fetchRevenueTimeseries(
    params: RevenueAnalyticsParams,
  ): Promise<RevenueTimeseriesPoint[]>;
}

export class RevenueAnalyticsService {
  constructor(private readonly repository: RevenueAnalyticsRepository) {}

  async getRevenueAnalytics(
    params: RevenueAnalyticsParams,
  ): Promise<RevenueAnalyticsResponse> {
    const window = resolveWindow(params);
    const metrics = await this.repository.fetchRevenueMetrics({
      ...params,
      startDate: window.start.toISOString(),
      endDate: window.end.toISOString(),
    });

    const timeseries = await this.repository.fetchRevenueTimeseries({
      ...params,
      startDate: window.start.toISOString(),
      endDate: window.end.toISOString(),
    });

    const meta = buildMeta(window, params, timeseries.length);

    return {
      metrics,
      timeseries,
      meta,
    };
  }
}

export function createRevenueAnalyticsService(
  repository: RevenueAnalyticsRepository,
) {
  return new RevenueAnalyticsService(repository);
}

function resolveWindow(params: AnalyticsQuery): { start: Date; end: Date } {
  const end = params.endDate ? new Date(params.endDate) : new Date();
  const start = params.startDate ? new Date(params.startDate) : new Date(end);

  if (!params.startDate) {
    start.setDate(end.getDate() - 30); // Default to 30 days
  }

  if (start > end) {
    return { start: end, end: start };
  }

  return { start, end };
}

function buildMeta(
  window: { start: Date; end: Date },
  params: RevenueAnalyticsParams,
  sampleSize: number,
): AnalyticsMeta {
  return {
    generatedAt: new Date().toISOString(),
    window: {
      start: window.start.toISOString(),
      end: window.end.toISOString(),
      preset: params.preset,
    },
    sampleSize,
  };
}