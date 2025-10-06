/* eslint-disable @typescript-eslint/no-explicit-any */

export interface PosthogEmbedOptions {
  insightId?: string;
  dashboardId?: string;
  filters?: Record<string, unknown>;
  refresh?: boolean;
}

export interface PosthogEmbedResponse {
  url: string;
  token: string;
  expiresAt: string;
}

/**
 * Creates a short-lived PostHog embed token for an insight or dashboard.
 *
 * NOTE: This helper relies on the following environment variables:
 * - POSTHOG_API_KEY        (Personal or project API key with embed permissions)
 * - POSTHOG_PROJECT_ID     (Numeric project identifier)
 * - POSTHOG_API_HOST       (Optional, defaults to PostHog Cloud host)
 */
export async function createPosthogEmbed(
  options: PosthogEmbedOptions,
): Promise<PosthogEmbedResponse> {
  const apiKey = process.env.POSTHOG_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiHost =
    process.env.POSTHOG_API_HOST?.replace(/\/+$/, "") ??
    "https://us.i.posthog.com";

  if (!apiKey) {
    throw new Error(
      "POSTHOG_API_KEY is required to request PostHog embed tokens.",
    );
  }

  if (!projectId) {
    throw new Error(
      "POSTHOG_PROJECT_ID is required to request PostHog embed tokens.",
    );
  }

  const resourcePath = resolveResourcePath(options);
  const url = `${apiHost}/api/projects/${projectId}/${resourcePath}/embed/`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      refresh: options.refresh ?? false,
      filters: options.filters ?? {},
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    const message =
      (payload && (payload.detail ?? payload.error)) ||
      `PostHog embed request failed with status ${response.status}`;
    throw new Error(message);
  }

  const payload = (await response.json()) as {
    url: string;
    token: string;
    expires_at?: string;
    expiresAt?: string;
  };

  return {
    url: payload.url,
    token: payload.token,
    expiresAt: payload.expiresAt ?? payload.expires_at ?? "",
  };
}

function resolveResourcePath(options: PosthogEmbedOptions): string {
  const { insightId, dashboardId } = options;

  if (insightId && dashboardId) {
    throw new Error(
      "Only one of insightId or dashboardId can be provided for PostHog embed requests.",
    );
  }

  if (insightId) {
    return `insights/${encodeURIComponent(insightId)}`;
  }

  if (dashboardId) {
    return `dashboards/${encodeURIComponent(dashboardId)}`;
  }

  throw new Error(
    "Either insightId or dashboardId must be provided to create a PostHog embed.",
  );
}

async function safeJson(response: Response): Promise<any | undefined> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}
