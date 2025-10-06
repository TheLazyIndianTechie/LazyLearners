import { createHash } from "crypto";
import { PostHog } from "posthog-node";

const POSTHOG_API_KEY = process.env.POSTHOG_API_KEY;
const POSTHOG_API_HOST =
  process.env.POSTHOG_API_HOST ?? "https://us.i.posthog.com";

let client: PostHog | null = null;

export function getPosthogClient(): PostHog | null {
  if (!POSTHOG_API_KEY) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[analytics] POSTHOG_API_KEY not set. Server-side analytics disabled.",
      );
    }
    return null;
  }

  if (!client) {
    client = new PostHog(POSTHOG_API_KEY, {
      host: POSTHOG_API_HOST,
      flushAt: 20,
      flushInterval: 1000,
      featureFlagsPollingInterval: 30000,
    });
  }

  return client;
}

export function captureServerEvent(
  event: string,
  payload: {
    distinctId: string;
    properties?: Record<string, unknown>;
    groups?: Record<string, string>;
  },
): void {
  const posthog = getPosthogClient();
  if (!posthog) return;

  try {
    posthog.capture({
      event,
      distinctId: payload.distinctId,
      properties: payload.properties,
      groups: payload.groups,
    });
  } catch (error) {
    console.error(`[analytics] Failed to capture event "${event}"`, error);
  }
}

export function identifyServerUser(
  distinctId: string,
  traits: Record<string, unknown>,
): void {
  const posthog = getPosthogClient();
  if (!posthog) return;

  try {
    posthog.identify({
      distinctId,
      properties: traits,
    });
  } catch (error) {
    console.error("[analytics] Failed to identify user", error);
  }
}

export function flushAnalytics(): void {
  const posthog = getPosthogClient();
  if (!posthog) return;

  try {
    posthog.flush();
  } catch (error) {
    console.error("[analytics] Failed to flush PostHog queue", error);
  }
}

export function hashForAnalytics(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function getUserDistinctId(
  userId: string,
  fallback?: string,
): string | undefined {
  if (userId) return `user_${userId}`;
  if (fallback) {
    return `anon_${hashForAnalytics(fallback)}`;
  }
  return undefined;
}

process.on("beforeExit", () => {
  if (client) {
    flushAnalytics();
    client.shutdown();
  }
});
