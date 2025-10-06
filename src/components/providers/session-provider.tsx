"use client";

import React from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "posthog-js/react";

export function Providers({ children }: { children: React.ReactNode }) {
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const posthogHost =
    process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";
  const posthogOptions = {
    api_host: posthogHost,
    capture_pageview: true,
    capture_pageleave: true,
    person_profiles: "identified_only",
    persistence: "localStorage+cookie",
  };

  if (!posthogKey) {
    return (
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
        }}
      >
        {children}
      </ClerkProvider>
    );
  }

  return (
    <PostHogProvider apiKey={posthogKey} options={posthogOptions}>
      <ClerkProvider
        publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: undefined,
        }}
      >
        {children}
      </ClerkProvider>
    </PostHogProvider>
  );
}
