"use client";

import { useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePostHog } from 'posthog-js/react';
import { hashForAnalytics } from '@/lib/analytics/posthog';

export interface UserProperties {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: string;
  lastLoginAt?: string;
  totalCoursesEnrolled?: number;
  totalLessonsCompleted?: number;
  totalQuizzesPassed?: number;
  preferredLanguage?: string;
  timezone?: string;
  deviceType?: string;
  browser?: string;
  referrer?: string;
}

export interface PrivacySettings {
  analyticsEnabled: boolean;
  marketingEmails: boolean;
  dataRetention: boolean;
}

/**
 * Hook for managing PostHog user identification and properties
 */
export function usePostHogUser() {
  const { user, isLoaded } = useUser();
  const posthog = usePostHog();

  const identifyUser = useCallback((properties?: Partial<UserProperties>) => {
    if (!posthog.__loaded || !user?.id) return;

    const distinctId = `user_${user.id}`;

    // Identify user with Clerk ID
    posthog.identify(distinctId, {
      email: user.primaryEmailAddress?.emailAddress,
      name: user.fullName,
      role: user.publicMetadata?.role || 'STUDENT',
      created_at: user.createdAt?.toISOString(),
      last_login_at: new Date().toISOString(),
      ...properties,
    });

    // Set user properties for cohort analysis
    posthog.people.set({
      $email: user.primaryEmailAddress?.emailAddress,
      $name: user.fullName,
      role: user.publicMetadata?.role || 'STUDENT',
      created_at: user.createdAt?.toISOString(),
      last_active_at: new Date().toISOString(),
      ...properties,
    });
  }, [posthog, user]);

  const updateUserProperties = useCallback((properties: Partial<UserProperties>) => {
    if (!posthog.__loaded) return;

    posthog.people.set(properties);
  }, [posthog]);

  const resetUser = useCallback(() => {
    if (!posthog.__loaded) return;

    posthog.reset();
  }, [posthog]);

  // Auto-identify user when loaded
  useEffect(() => {
    if (isLoaded && user?.id) {
      identifyUser();
    }
  }, [isLoaded, user?.id, identifyUser]);

  return {
    identifyUser,
    updateUserProperties,
    resetUser,
    isIdentified: !!user?.id,
  };
}

/**
 * Hook for managing privacy settings and opt-out functionality
 */
export function usePostHogPrivacy() {
  const posthog = usePostHog();

  const optOut = useCallback(() => {
    if (!posthog.__loaded) return;

    posthog.opt_out_capturing();
    localStorage.setItem('posthog_opt_out', 'true');
  }, [posthog]);

  const optIn = useCallback(() => {
    if (!posthog.__loaded) return;

    posthog.opt_in_capturing();
    localStorage.removeItem('posthog_opt_out');
  }, [posthog]);

  const isOptedOut = useCallback(() => {
    return localStorage.getItem('posthog_opt_out') === 'true';
  }, []);

  const hasOptedOut = isOptedOut();

  // Check if user has opted out on mount
  useEffect(() => {
    if (hasOptedOut && posthog.__loaded) {
      posthog.opt_out_capturing();
    }
  }, [hasOptedOut, posthog]);

  return {
    optOut,
    optIn,
    isOptedOut: hasOptedOut,
    hasConsented: !hasOptedOut,
  };
}

/**
 * Hook for tracking custom events with privacy controls
 */
export function usePostHogTracking() {
  const posthog = usePostHog();
  const { isOptedOut } = usePostHogPrivacy();

  const trackEvent = useCallback((
    event: string,
    properties?: Record<string, any>,
    options?: {
      send_instantly?: boolean;
    }
  ) => {
    if (!posthog.__loaded || isOptedOut) return;

    posthog.capture(event, properties, options);
  }, [posthog, isOptedOut]);

  const trackPageView = useCallback((pageName?: string) => {
    if (!posthog.__loaded || isOptedOut) return;

    posthog.capture('$pageview', {
      page_name: pageName,
      timestamp: new Date().toISOString(),
    });
  }, [posthog, isOptedOut]);

  const trackFeatureUsage = useCallback((
    feature: string,
    action: string,
    properties?: Record<string, any>
  ) => {
    trackEvent(`feature_${feature}_${action}`, {
      feature,
      action,
      ...properties,
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackPageView,
    trackFeatureUsage,
  };
}

/**
 * Hook for session tracking
 */
export function usePostHogSession() {
  const posthog = usePostHog();
  const { isOptedOut } = usePostHogPrivacy();
  const { user } = useUser();

  const startSession = useCallback(() => {
    if (!posthog.__loaded || isOptedOut || !user?.id) return;

    const sessionId = `session_${Date.now()}_${hashForAnalytics(user.id)}`;

    posthog.capture('session_started', {
      session_id: sessionId,
      user_id: user.id,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      url: window.location.href,
      device_type: getDeviceType(),
      screen_resolution: `${window.screen.width}x${window.screen.height}`,
    });

    // Store session ID for later use
    sessionStorage.setItem('posthog_session_id', sessionId);

    return sessionId;
  }, [posthog, isOptedOut, user]);

  const endSession = useCallback((sessionId?: string, duration?: number) => {
    if (!posthog.__loaded || isOptedOut) return;

    const currentSessionId = sessionId || sessionStorage.getItem('posthog_session_id');
    if (!currentSessionId) return;

    posthog.capture('session_ended', {
      session_id: currentSessionId,
      duration_seconds: duration,
      timestamp: new Date().toISOString(),
      page_count: getPageViewCount(),
    });

    sessionStorage.removeItem('posthog_session_id');
  }, [posthog, isOptedOut]);

  const updateSessionActivity = useCallback(() => {
    if (!posthog.__loaded || isOptedOut) return;

    const sessionId = sessionStorage.getItem('posthog_session_id');
    if (!sessionId) return;

    posthog.capture('session_activity', {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
      current_page: window.location.pathname,
    });
  }, [posthog, isOptedOut]);

  // Track page visibility changes for session activity
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        updateSessionActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [updateSessionActivity]);

  return {
    startSession,
    endSession,
    updateSessionActivity,
  };
}

// Helper functions
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    return 'tablet';
  }
  if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
    return 'mobile';
  }
  return 'desktop';
}

function getPageViewCount(): number {
  // This is a simple implementation - in a real app you might track this more accurately
  const count = parseInt(sessionStorage.getItem('page_view_count') || '0');
  return count;
}