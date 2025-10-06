"use client";

import { useEffect, useRef } from "react";
import { usePosthogAnalytics } from "./use-posthog-analytics";
import { AnalyticsTracker } from "@/lib/analytics/events";

interface SessionTrackingOptions {
  enabled?: boolean;
  trackPageViews?: boolean;
  trackActivity?: boolean;
  inactivityThreshold?: number; // in minutes
}

export function useSessionTracking(options: SessionTrackingOptions = {}) {
  const {
    enabled = true,
    trackPageViews = true,
    trackActivity = true,
    inactivityThreshold = 30, // 30 minutes
  } = options;

  const { capture, identify, pageview, isReady } = usePosthogAnalytics({
    autoPageview: trackPageViews,
  });

  const sessionStartTime = useRef<Date | null>(null);
  const lastActivityTime = useRef<Date>(new Date());
  const activityEventsBound = useRef(false);
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Track user activity
  const trackActivityEvent = () => {
    if (!enabled || !trackActivity) return;
    lastActivityTime.current = new Date();
  };

  // Bind activity event listeners
  useEffect(() => {
    if (!enabled || !trackActivity || activityEventsBound.current) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    const handleActivity = () => trackActivityEvent();

    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    activityEventsBound.current = true;

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
      activityEventsBound.current = false;
    };
  }, [enabled, trackActivity]);

  // Check for inactivity and end session if needed
  useEffect(() => {
    if (!enabled || !sessionStartTime.current) return;

    const checkInactivity = () => {
      const now = new Date();
      const timeSinceLastActivity = (now.getTime() - lastActivityTime.current.getTime()) / (1000 * 60); // in minutes

      if (timeSinceLastActivity >= inactivityThreshold) {
        endSession();
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [enabled, inactivityThreshold]);

  // Start session
  const startSession = async (userId: string) => {
    if (!enabled || !isReady || sessionStartTime.current) return;

    sessionStartTime.current = new Date();

    try {
      await AnalyticsTracker.trackSessionStarted({
        userId,
        timestamp: sessionStartTime.current.toISOString(),
        sessionId: sessionId.current,
        deviceType: getDeviceType(),
        referrer: document.referrer,
        userAgent: navigator.userAgent,
      });
    } catch (error) {
      console.error('Failed to track session start:', error);
    }
  };

  // End session
  const endSession = async () => {
    if (!enabled || !sessionStartTime.current) return;

    const endTime = new Date();
    const duration = (endTime.getTime() - sessionStartTime.current.getTime()) / 1000; // in seconds

    try {
      // Note: We don't have userId here, so we'll need to get it from context
      // This is a limitation - we might need to pass userId to this hook
      await AnalyticsTracker.trackSessionEnded({
        userId: 'unknown', // This should be passed in
        duration,
        timestamp: endTime.toISOString(),
        sessionId: sessionId.current,
        deviceType: getDeviceType(),
      });
    } catch (error) {
      console.error('Failed to track session end:', error);
    }

    sessionStartTime.current = null;
  };

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, potentially ending session
        // We'll let the inactivity check handle this
      } else {
        // Page is visible again, update activity
        trackActivityEvent();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled]);

  // Handle page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [enabled]);

  return {
    startSession,
    endSession,
    sessionId: sessionId.current,
    isSessionActive: !!sessionStartTime.current,
    sessionDuration: sessionStartTime.current
      ? (new Date().getTime() - sessionStartTime.current.getTime()) / 1000
      : 0,
  };
}

// Helper function to determine device type
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