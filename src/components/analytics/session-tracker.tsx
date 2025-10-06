"use client";

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePostHogSession } from '@/hooks/use-posthog';

export function SessionTracker() {
  const { user } = useUser();
  const { startSession, endSession, updateSessionActivity } = usePostHogSession();
  const sessionStartTime = useRef<number | null>(null);
  const activityInterval = useRef<NodeJS.Timeout | null>(null);
  const pageViewCount = useRef(0);

  useEffect(() => {
    if (!user?.id) return;

    // Start session when user is authenticated
    const sessionId = startSession();
    sessionStartTime.current = Date.now();
    pageViewCount.current = 1; // Count current page

    // Set up activity tracking
    activityInterval.current = setInterval(() => {
      updateSessionActivity();
    }, 5 * 60 * 1000); // Every 5 minutes

    // Track page views
    const handlePageView = () => {
      pageViewCount.current += 1;
    };

    // Listen for navigation events
    window.addEventListener('popstate', handlePageView);

    // Track visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // User switched away from tab
        updateSessionActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload to track session end
    const handleBeforeUnload = () => {
      if (sessionStartTime.current) {
        const duration = (Date.now() - sessionStartTime.current) / 1000; // in seconds
        endSession(sessionId, duration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (activityInterval.current) {
        clearInterval(activityInterval.current);
      }

      window.removeEventListener('popstate', handlePageView);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // End session when component unmounts
      if (sessionStartTime.current) {
        const duration = (Date.now() - sessionStartTime.current) / 1000;
        endSession(sessionId, duration);
      }
    };
  }, [user?.id, startSession, endSession, updateSessionActivity]);

  // Track when user becomes inactive (no mouse/keyboard activity)
  useEffect(() => {
    if (!user?.id) return;

    let inactivityTimer: NodeJS.Timeout | null = null;
    const inactivityThreshold = 30 * 60 * 1000; // 30 minutes

    const resetInactivityTimer = () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      inactivityTimer = setTimeout(() => {
        // User has been inactive, end session
        if (sessionStartTime.current) {
          const duration = (Date.now() - sessionStartTime.current) / 1000;
          endSession(undefined, duration);
          sessionStartTime.current = null;
        }
      }, inactivityThreshold);
    };

    const handleActivity = () => {
      resetInactivityTimer();
    };

    // Listen for user activity
    document.addEventListener('mousedown', handleActivity);
    document.addEventListener('keydown', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('touchstart', handleActivity);

    // Start the inactivity timer
    resetInactivityTimer();

    return () => {
      if (inactivityTimer) {
        clearTimeout(inactivityTimer);
      }

      document.removeEventListener('mousedown', handleActivity);
      document.removeEventListener('keydown', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('touchstart', handleActivity);
    };
  }, [user?.id, endSession]);

  return null; // This component doesn't render anything
}