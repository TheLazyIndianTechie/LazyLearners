"use client";

import { useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePostHog } from "posthog-js/react";

type Properties = Record<string, unknown>;
type Groups = Record<string, string>;

interface PosthogAnalyticsOptions {
  autoPageview?: boolean;
  defaultProperties?: Properties;
}

interface CaptureOpts {
  properties?: Properties;
  groups?: Groups;
}

export function usePosthogAnalytics(
  options?: PosthogAnalyticsOptions,
) {
  const posthog = usePostHog();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const isReady = Boolean(posthog);

  const mergeProperties = useCallback(
    (properties?: Properties): Properties => ({
      ...(options?.defaultProperties ?? {}),
      ...(properties ?? {}),
    }),
    [options?.defaultProperties],
  );

  const capture = useCallback(
    (event: string, opts?: CaptureOpts) => {
      if (!posthog || !event) return;
      posthog.capture(event, mergeProperties(opts?.properties), opts?.groups);
    },
    [posthog, mergeProperties],
  );

  const identify = useCallback(
    (distinctId: string, properties?: Properties) => {
      if (!posthog || !distinctId) return;
      posthog.identify(distinctId, mergeProperties(properties));
    },
    [posthog, mergeProperties],
  );

  const group = useCallback(
    (groupType: string, groupKey: string, properties?: Properties) => {
      if (!posthog || !groupType || !groupKey) return;
      posthog.group(groupType, groupKey, mergeProperties(properties));
    },
    [posthog, mergeProperties],
  );

  const alias = useCallback(
    (aliasId: string) => {
      if (!posthog || !aliasId) return;
      posthog.alias(aliasId);
    },
    [posthog],
  );

  const pageview = useCallback(
    (properties?: Properties) => {
      if (!posthog) return;
      const path = pathname ?? "/";
      const search = searchParams?.toString();
      const url = search ? `${path}?${search}` : path;
      capture("$pageview", {
        properties: mergeProperties({
          $current_url: url,
          ...properties,
        }),
      });
    },
    [posthog, pathname, searchParams, capture, mergeProperties],
  );

  if (options?.autoPageview) {
    pageview();
  }

  return {
    isReady,
    capture,
    identify,
    group,
    alias,
    pageview,
  };
}
