import { isDeepStrictEqual } from "util";

export type ISODateString = string;

export interface AnalyticsQuery {
  courseIds?: string[];
  startDate?: ISODateString;
  endDate?: ISODateString;
  preset?: "7d" | "30d" | "90d" | "365d" | "ytd" | "all" | string;
  includeArchived?: boolean;
  realtime?: boolean;
  [key: string]: unknown;
}

export interface AnalyticsMeta {
  generatedAt: ISODateString;
  window: {
    start: ISODateString;
    end: ISODateString;
    preset?: string;
  };
  sampleSize?: number;
  baselineCourseId?: string;
  comparisonCourseIds?: string[];
  warnings?: string[];
}

export interface CourseSummary {
  id: string;
  title: string;
  slug?: string;
  published: boolean;
  enrollmentCount: number;
  lastUpdatedAt?: ISODateString;
}

export interface CoursePerformanceMetric {
  courseId: string;
  courseTitle: string;
  totalEnrollments: number;
  totalCompletions: number;
  completionRate: number;
  activeLearners: number;
  averageProgress?: number;
  revenue?: number;
  revenueTrendPct?: number;
  enrollmentTrendPct?: number;
}

export interface CoursePerformanceTimeseriesPoint {
  date: ISODateString;
  enrollments: number;
  completions: number;
  activeLearners: number;
  revenue?: number;
}

export interface CoursePerformanceResponse {
  metrics: CoursePerformanceMetric[];
  timeseries: CoursePerformanceTimeseriesPoint[];
  meta: AnalyticsMeta;
}

export interface CourseLeaderboardEntry {
  courseId: string;
  courseTitle: string;
  metric: "enrollments" | "completions" | "revenue" | "engagement";
  value: number;
  delta?: number;
}

export interface CourseLeaderboardResponse {
  leaders: CourseLeaderboardEntry[];
  meta: AnalyticsMeta;
}

export interface PosthogEmbedOptions {
  insightId?: string;
  dashboardId?: string;
  filters?: Record<string, unknown>;
  refresh?: boolean;
}

export interface PosthogEmbedResponse {
  url: string;
  token: string;
  expiresAt: ISODateString;
}

export interface MetabaseEmbedOptions {
  dashboardId?: number;
  questionId?: number;
  filters?: Record<string, unknown>;
  parameters?: Record<string, unknown>;
  theme?: 'light' | 'dark' | 'transparent';
  bordered?: boolean;
  titled?: boolean;
}

export interface MetabaseEmbedResponse {
  url: string;
  iframeUrl: string;
  expiresAt: ISODateString;
}

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
  date: ISODateString;
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

export interface AnalyticsApiClientOptions {
  /**
   * Base API path. Defaults to `/api/analytics`.
   */
  baseUrl?: string;
  /**
   * Custom fetch implementation, useful for testing or SSR contexts.
   */
  fetcher?: typeof fetch;
  /**
   * Default headers sent with every request.
   */
  defaultHeaders?: HeadersInit;
}

export interface RequestOptions {
  signal?: AbortSignal;
  headers?: HeadersInit;
  query?: AnalyticsQuery;
  body?: unknown;
}

export class AnalyticsApiError extends Error {
  readonly status: number;
  readonly payload?: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "AnalyticsApiError";
    this.status = status;
    this.payload = payload;
  }
}

const DEFAULT_BASE_URL = "/api/analytics";

export class AnalyticsApiClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;
  private readonly defaultHeaders: HeadersInit;

  constructor(options: AnalyticsApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
    this.fetcher = options.fetcher ?? fetch.bind(globalThis);
    this.defaultHeaders = options.defaultHeaders ?? {
      "Content-Type": "application/json",
    };
  }

  /**
   * Fetch lightweight course summaries for selectors and quick stats.
   */
  async getCourseSummaries(options?: RequestOptions): Promise<CourseSummary[]> {
    const response = await this.request<CourseSummary[]>("/courses", {
      method: "GET",
      ...options,
    });
    return response;
  }

  /**
   * Fetch aggregated performance metrics for the instructor's courses.
   */
  async getCoursePerformance(
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<CoursePerformanceResponse> {
    return this.request<CoursePerformanceResponse>("/performance", {
      method: "GET",
      query,
      ...options,
    });
  }

  /**
   * Fetch leaderboard view for specified metric(s).
   */
  async getCourseLeaderboard(
    metric: "enrollments" | "completions" | "revenue" | "engagement",
    query: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<CourseLeaderboardResponse> {
    return this.request<CourseLeaderboardResponse>("/leaderboard", {
      method: "GET",
      query: { ...query, metric },
      ...options,
    });
  }

  async getPosthogInsightEmbed(
    embed: PosthogEmbedOptions,
    requestOptions?: RequestOptions,
  ): Promise<PosthogEmbedResponse> {
    return this.request<PosthogEmbedResponse>("/posthog/embed", {
      method: "POST",
      body: {
        insightId: embed.insightId,
        dashboardId: embed.dashboardId,
        filters: embed.filters,
        refresh: embed.refresh,
      },
      ...requestOptions,
    });
  }

  async getPosthogDashboardEmbed(
    dashboardId: string,
    requestOptions?: RequestOptions,
  ): Promise<PosthogEmbedResponse> {
    return this.getPosthogInsightEmbed({ dashboardId }, requestOptions);
  }

  async getMetabaseEmbed(
    embed: MetabaseEmbedOptions,
    requestOptions?: RequestOptions,
  ): Promise<MetabaseEmbedResponse> {
    return this.request<MetabaseEmbedResponse>("/metabase/embed", {
      method: "POST",
      body: {
        dashboardId: embed.dashboardId,
        questionId: embed.questionId,
        filters: embed.filters,
        parameters: embed.parameters,
        theme: embed.theme,
        bordered: embed.bordered,
        titled: embed.titled,
      },
      ...requestOptions,
    });
  }

  async getMetabaseDashboardEmbed(
    dashboardId: number,
    requestOptions?: RequestOptions,
  ): Promise<MetabaseEmbedResponse> {
    return this.getMetabaseEmbed({ dashboardId }, requestOptions);
  }

  async getMetabaseQuestionEmbed(
    questionId: number,
    requestOptions?: RequestOptions,
  ): Promise<MetabaseEmbedResponse> {
    return this.getMetabaseEmbed({ questionId }, requestOptions);
  }

  /**
   * Fetch revenue analytics for the instructor's courses.
   */
  async getRevenueAnalytics(
    query: AnalyticsQuery,
    requestOptions?: RequestOptions,
  ): Promise<RevenueAnalyticsResponse> {
    return this.request<RevenueAnalyticsResponse>("/revenue", {
      method: "GET",
      query,
      ...requestOptions,
    });
  }

  /**
   * Trigger a recomputation or cache refresh for a given analytics query.
   * Useful for generating on-demand exports or warming caches.
   */
  async refresh(
    path: string,
    query?: AnalyticsQuery,
    options?: RequestOptions,
  ): Promise<AnalyticsMeta> {
    return this.request<AnalyticsMeta>(path, {
      method: "POST",
      body: query,
      ...options,
    });
  }

  /**
   * Convenience helper for building fully-qualified URLs.
   */
  buildUrl(path: string, query?: AnalyticsQuery): string {
    const url = new URL(
      path,
      this.baseUrl.startsWith("http")
        ? this.baseUrl
        : `http://localhost${this.baseUrl}`,
    );
    const params = new URLSearchParams();

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          value.forEach((item) => params.append(`${key}[]`, String(item)));
          return;
        }
        if (value instanceof Date) {
          params.append(key, value.toISOString());
          return;
        }
        params.append(key, String(value));
      });
    }

    const queryString = params.toString();
    if (queryString) {
      url.search = queryString;
    }

    // For relative base URLs (e.g. /api/analytics), URL() with localhost yields absolute path we can strip.
    if (!this.baseUrl.startsWith("http")) {
      return url.pathname + url.search;
    }

    return url.toString();
  }

  /**
   * Internal request wrapper with rich error handling.
   */
  private async request<T>(
    path: string,
    options: RequestOptions & {
      method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    },
  ): Promise<T> {
    const { method, signal, headers, query, body } = options;

    const url = this.buildUrl(path, method === "GET" ? query : undefined);

    const requestInit: RequestInit = {
      method,
      signal,
      headers: mergeHeaders(this.defaultHeaders, headers),
    };

    if (method !== "GET") {
      requestInit.body = body ? JSON.stringify(body) : undefined;
    }

    const response = await this.fetcher(url, requestInit);

    if (!response.ok) {
      const payload = await safeJsonParse(response);
      throw new AnalyticsApiError(
        payload?.message ??
          `Analytics API request failed with status ${response.status}`,
        response.status,
        payload,
      );
    }

    // 204 No Content support
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }
}

function mergeHeaders(base: HeadersInit, override?: HeadersInit): HeadersInit {
  if (!override) return base;
  const result = new Headers(base);

  const extra = new Headers(override);
  extra.forEach((value, key) => {
    result.set(key, value);
  });

  return result;
}

async function safeJsonParse(response: Response): Promise<any | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/**
 * Factory helper for SSR/edge contexts.
 */
export function createAnalyticsApiClient(options?: AnalyticsApiClientOptions) {
  return new AnalyticsApiClient(options);
}

/**
 * Shallow comparison helper for memoising analytics query objects.
 */
export function areQueriesEqual(
  a?: AnalyticsQuery,
  b?: AnalyticsQuery,
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return isDeepStrictEqual(a, b);
}
