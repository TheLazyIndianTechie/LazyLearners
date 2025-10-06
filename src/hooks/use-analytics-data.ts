"use client";

import { useCallback, useMemo } from "react";
import useSWR, { type SWRConfiguration, type SWRResponse } from "swr";
import useSWRMutation from "swr/mutation";
import { formatCurrency } from "@/lib/utils";

type ISODateString = string;

export interface AnalyticsQuery {
  /**
   * Course IDs to include in the analytics query.
   * When empty, the API should default to all courses owned by the instructor.
   */
  courseIds?: string[];
  /**
   * Inclusive start date for the analytics window (ISO 8601).
   */
  startDate?: ISODateString;
  /**
   * Inclusive end date for the analytics window (ISO 8601).
   */
  endDate?: ISODateString;
  /**
   * Optional preset identifier, e.g. "7d", "30d", "ytd".
   * When supplied the API can override start/end based on business rules.
   */
  preset?: string;
  /**
   * Include archived or unpublished courses in aggregations.
   */
  includeArchived?: boolean;
  /**
   * Request that the API returns data optimized for live updates.
   */
  realtime?: boolean;
  /**
   * Arbitrary extra filters (cohort, region, etc.).
   * Keys and values are opaque to the hook and simply forwarded to the API.
   */
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
}

export interface AnalyticsResponse<TData = unknown> {
  data: TData;
  meta: AnalyticsMeta;
  warnings?: string[];
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

export class AnalyticsError extends Error {
  status?: number;
  payload?: unknown;

  constructor(message: string, status?: number, payload?: unknown) {
    super(message);
    this.name = "AnalyticsError";
    this.status = status;
    this.payload = payload;
  }
}

const jsonFetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await safeParseJSON(response);
    throw new AnalyticsError(
      payload?.message ??
        `Analytics request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return response.json() as Promise<T>;
};

const mutationFetcher = async <T>(
  url: string,
  { arg }: { arg?: AnalyticsQuery },
): Promise<T> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(arg ?? {}),
  });

  if (!response.ok) {
    const payload = await safeParseJSON(response);
    throw new AnalyticsError(
      payload?.message ??
        `Analytics mutation failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return response.json() as Promise<T>;
};

const embedMutationFetcher = async (
  url: string,
  { arg }: { arg?: PosthogEmbedOptions },
): Promise<PosthogEmbedResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(arg ?? {}),
  });

  if (!response.ok) {
    const payload = await safeParseJSON(response);
    throw new AnalyticsError(
      payload?.message ??
        `PostHog embed request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return response.json() as Promise<PosthogEmbedResponse>;
};

const safeParseJSON = async (response: Response): Promise<any | undefined> => {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
};

const buildQueryString = (params: AnalyticsQuery | undefined): string => {
  if (!params) return "";
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(`${key}[]`, String(item)));
      return;
    }
    if (value instanceof Date) {
      search.append(key, value.toISOString());
      return;
    }
    search.append(key, String(value));
  });

  const queryString = search.toString();
  return queryString ? `?${queryString}` : "";
};

export interface UseAnalyticsDataOptions<T> extends SWRConfiguration<T> {
  /**
   * Whether to pause fetching even if the key is provided.
   */
  disabled?: boolean;
}

/**
 * Generic analytics data fetching hook using SWR.
 *
 * @param endpoint API endpoint (e.g. `/api/analytics/performance`)
 * @param params   Query parameters that will be serialized into the URL
 * @param options  SWR configuration
 */
export function useAnalyticsData<TData = unknown>(
  endpoint: string | null,
  params?: AnalyticsQuery,
  options?: UseAnalyticsDataOptions<AnalyticsResponse<TData>>,
): SWRResponse<AnalyticsResponse<TData>, AnalyticsError> {
  const key = useMemo(() => {
    if (!endpoint || options?.disabled) return null;
    return `${endpoint}${buildQueryString(params)}`;
  }, [endpoint, params, options?.disabled]);

  return useSWR<AnalyticsResponse<TData>, AnalyticsError>(
    key,
    jsonFetcher,
    options,
  );
}

export function formatAnalyticsCurrency(
  ...args: Parameters<typeof formatCurrency>
) {
  return formatCurrency(...args);
}

/**
 * Helper hook for triggering server-side recomputations (e.g. expensive exports or cached aggregations).
 * Falls back to POSTing the same endpoint with the current filters.
 */
export function useAnalyticsRefresh<TData = AnalyticsResponse>(
  endpoint: string | null,
) {
  const { trigger, isMutating, error, data } = useSWRMutation<
    TData,
    AnalyticsError,
    string | null,
    AnalyticsQuery | undefined
  >(endpoint, mutationFetcher);

  const refresh = useCallback(
    async (payload?: AnalyticsQuery) => {
      if (!endpoint) return undefined;
      return trigger(payload, { revalidate: true });
    },
    [endpoint, trigger],
  );

  return {
    refresh,
    isRefreshing: isMutating,
    error,
    data,
  };
}

export function usePosthogEmbed(endpoint: string | null) {
  const { trigger, isMutating, error, data } = useSWRMutation<
    PosthogEmbedResponse,
    AnalyticsError,
    string | null,
    PosthogEmbedOptions | undefined
  >(endpoint, embedMutationFetcher);

  const getEmbed = useCallback(
    async (payload?: PosthogEmbedOptions) => {
      if (!endpoint) return undefined;
      return trigger(payload, { revalidate: false });
    },
    [endpoint, trigger],
  );

  return {
    getEmbed,
    isLoading: isMutating,
    data,
    error,
  };
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
  expiresAt: string;
}

const metabaseEmbedMutationFetcher = async (
  url: string,
  { arg }: { arg?: MetabaseEmbedOptions },
): Promise<MetabaseEmbedResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify(arg ?? {}),
  });

  if (!response.ok) {
    const payload = await safeParseJSON(response);
    throw new AnalyticsError(
      payload?.message ??
        `Metabase embed request failed with status ${response.status}`,
      response.status,
      payload,
    );
  }

  return response.json() as Promise<MetabaseEmbedResponse>;
};

export function useMetabaseEmbed(endpoint: string | null) {
  const { trigger, isMutating, error, data } = useSWRMutation<
    MetabaseEmbedResponse,
    AnalyticsError,
    string | null,
    MetabaseEmbedOptions | undefined
  >(endpoint, metabaseEmbedMutationFetcher);

  const getEmbed = useCallback(
    async (payload?: MetabaseEmbedOptions) => {
      if (!endpoint) return undefined;
      return trigger(payload, { revalidate: false });
    },
    [endpoint, trigger],
  );

  return {
    getEmbed,
    isLoading: isMutating,
    data,
    error,
  };
}

/**
 * Convenience hook that ties SWR data to an auto-refresh interval (e.g. for real-time dashboards).
 */
export function useRealTimeAnalytics<TData = unknown>(
  endpoint: string | null,
  params: AnalyticsQuery | undefined,
  intervalSeconds: number,
  options?: UseAnalyticsDataOptions<AnalyticsResponse<TData>>,
) {
  const mergedOptions: UseAnalyticsDataOptions<AnalyticsResponse<TData>> = {
    refreshInterval: intervalSeconds > 0 ? intervalSeconds * 1000 : undefined,
    dedupingInterval: intervalSeconds > 0 ? intervalSeconds * 500 : undefined,
    revalidateOnFocus: true,
    ...options,
  };

  return useAnalyticsData<TData>(endpoint, params, mergedOptions);
}
