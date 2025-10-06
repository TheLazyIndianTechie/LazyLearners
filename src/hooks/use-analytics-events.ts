"use client";

import { useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePostHogTracking } from './use-posthog';

export interface CourseEventData {
  courseId: string;
  courseTitle: string;
  instructorId: string;
  category?: string;
  difficulty?: string;
  price?: number;
}

export interface LessonEventData {
  lessonId: string;
  lessonTitle: string;
  courseId: string;
  moduleId: string;
  lessonType: string;
  duration?: number;
}

export interface QuizEventData {
  quizId: string;
  lessonId: string;
  courseId: string;
  score: number;
  maxScore: number;
  passingScore: number;
  timeSpent: number;
  questionsCount: number;
}

export interface VideoEventData {
  videoId: string;
  lessonId: string;
  courseId: string;
  position: number;
  duration: number;
  completionPercentage: number;
  quality?: string;
  playbackSpeed?: number;
}

/**
 * Hook for tracking course-related events
 */
export function useCourseAnalytics() {
  const { user } = useUser();
  const { trackEvent } = usePostHogTracking();

  const trackCourseView = useCallback((courseData: CourseEventData) => {
    if (!user?.id) return;

    trackEvent('course_viewed', {
      course_id: courseData.courseId,
      course_title: courseData.courseTitle,
      instructor_id: courseData.instructorId,
      category: courseData.category,
      difficulty: courseData.difficulty,
      price: courseData.price,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackCourseEnrollment = useCallback((courseData: CourseEventData) => {
    if (!user?.id) return;

    trackEvent('course_enrolled', {
      course_id: courseData.courseId,
      course_title: courseData.courseTitle,
      instructor_id: courseData.instructorId,
      category: courseData.category,
      difficulty: courseData.difficulty,
      price: courseData.price,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackCourseCompleted = useCallback((courseData: CourseEventData & { timeSpent: number }) => {
    if (!user?.id) return;

    trackEvent('course_completed', {
      course_id: courseData.courseId,
      course_title: courseData.courseTitle,
      instructor_id: courseData.instructorId,
      time_spent_seconds: courseData.timeSpent,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  return {
    trackCourseView,
    trackCourseEnrollment,
    trackCourseCompleted,
  };
}

/**
 * Hook for tracking lesson-related events
 */
export function useLessonAnalytics() {
  const { user } = useUser();
  const { trackEvent } = usePostHogTracking();

  const trackLessonStarted = useCallback((lessonData: LessonEventData) => {
    if (!user?.id) return;

    trackEvent('lesson_started', {
      lesson_id: lessonData.lessonId,
      lesson_title: lessonData.lessonTitle,
      course_id: lessonData.courseId,
      module_id: lessonData.moduleId,
      lesson_type: lessonData.lessonType,
      duration_seconds: lessonData.duration,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackLessonCompleted = useCallback((lessonData: LessonEventData & { timeSpent: number }) => {
    if (!user?.id) return;

    trackEvent('lesson_completed', {
      lesson_id: lessonData.lessonId,
      lesson_title: lessonData.lessonTitle,
      course_id: lessonData.courseId,
      module_id: lessonData.moduleId,
      lesson_type: lessonData.lessonType,
      duration_seconds: lessonData.duration,
      time_spent_seconds: lessonData.timeSpent,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  return {
    trackLessonStarted,
    trackLessonCompleted,
  };
}

/**
 * Hook for tracking quiz-related events
 */
export function useQuizAnalytics() {
  const { user } = useUser();
  const { trackEvent } = usePostHogTracking();

  const trackQuizStarted = useCallback((quizData: QuizEventData) => {
    if (!user?.id) return;

    trackEvent('quiz_started', {
      quiz_id: quizData.quizId,
      lesson_id: quizData.lessonId,
      course_id: quizData.courseId,
      questions_count: quizData.questionsCount,
      passing_score: quizData.passingScore,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackQuizCompleted = useCallback((quizData: QuizEventData) => {
    if (!user?.id) return;

    const passed = quizData.score >= quizData.passingScore;

    trackEvent('quiz_completed', {
      quiz_id: quizData.quizId,
      lesson_id: quizData.lessonId,
      course_id: quizData.courseId,
      score: quizData.score,
      max_score: quizData.maxScore,
      passing_score: quizData.passingScore,
      passed,
      score_percentage: (quizData.score / quizData.maxScore) * 100,
      questions_count: quizData.questionsCount,
      time_spent_seconds: quizData.timeSpent,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });

    // Also track pass/fail events
    if (passed) {
      trackEvent('quiz_passed', {
        quiz_id: quizData.quizId,
        lesson_id: quizData.lessonId,
        course_id: quizData.courseId,
        score: quizData.score,
        score_percentage: (quizData.score / quizData.maxScore) * 100,
        time_spent_seconds: quizData.timeSpent,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });
    } else {
      trackEvent('quiz_failed', {
        quiz_id: quizData.quizId,
        lesson_id: quizData.lessonId,
        course_id: quizData.courseId,
        score: quizData.score,
        passing_score: quizData.passingScore,
        score_percentage: (quizData.score / quizData.maxScore) * 100,
        time_spent_seconds: quizData.timeSpent,
        user_id: user.id,
        timestamp: new Date().toISOString(),
      });
    }
  }, [user?.id, trackEvent]);

  return {
    trackQuizStarted,
    trackQuizCompleted,
  };
}

/**
 * Hook for tracking video-related events
 */
export function useVideoAnalytics() {
  const { user } = useUser();
  const { trackEvent } = usePostHogTracking();

  const trackVideoStarted = useCallback((videoData: VideoEventData) => {
    if (!user?.id) return;

    trackEvent('video_started', {
      video_id: videoData.videoId,
      lesson_id: videoData.lessonId,
      course_id: videoData.courseId,
      video_duration_seconds: videoData.duration,
      quality: videoData.quality,
      playback_speed: videoData.playbackSpeed,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackVideoCheckpoint = useCallback((videoData: VideoEventData) => {
    if (!user?.id) return;

    trackEvent('video_checkpoint', {
      video_id: videoData.videoId,
      lesson_id: videoData.lessonId,
      course_id: videoData.courseId,
      video_duration_seconds: videoData.duration,
      current_position_seconds: videoData.position,
      completion_percentage: videoData.completionPercentage,
      quality: videoData.quality,
      playback_speed: videoData.playbackSpeed,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackVideoCompleted = useCallback((videoData: VideoEventData & { timeSpent: number }) => {
    if (!user?.id) return;

    trackEvent('video_completed', {
      video_id: videoData.videoId,
      lesson_id: videoData.lessonId,
      course_id: videoData.courseId,
      video_duration_seconds: videoData.duration,
      time_spent_seconds: videoData.timeSpent,
      completion_percentage: videoData.completionPercentage,
      quality: videoData.quality,
      playback_speed: videoData.playbackSpeed,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  return {
    trackVideoStarted,
    trackVideoCheckpoint,
    trackVideoCompleted,
  };
}

/**
 * Hook for tracking user engagement and feature usage
 */
export function useEngagementAnalytics() {
  const { user } = useUser();
  const { trackEvent, trackFeatureUsage } = usePostHogTracking();

  const trackSearch = useCallback((query: string, resultsCount: number, filters?: Record<string, any>) => {
    if (!user?.id) return;

    trackEvent('search_performed', {
      search_query: query,
      results_count: resultsCount,
      filters,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackBookmarkAdded = useCallback((lessonId: string, courseId: string) => {
    if (!user?.id) return;

    trackEvent('bookmark_added', {
      lesson_id: lessonId,
      course_id: courseId,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackNoteAdded = useCallback((lessonId: string, courseId: string, noteLength: number) => {
    if (!user?.id) return;

    trackEvent('note_added', {
      lesson_id: lessonId,
      course_id: courseId,
      note_length: noteLength,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackQuestionAsked = useCallback((lessonId: string, courseId: string, questionLength: number) => {
    if (!user?.id) return;

    trackEvent('question_asked', {
      lesson_id: lessonId,
      course_id: courseId,
      question_length: questionLength,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  const trackResourceDownloaded = useCallback((resourceId: string, resourceType: string, courseId: string) => {
    if (!user?.id) return;

    trackEvent('resource_downloaded', {
      resource_id: resourceId,
      resource_type: resourceType,
      course_id: courseId,
      user_id: user.id,
      timestamp: new Date().toISOString(),
    });
  }, [user?.id, trackEvent]);

  return {
    trackSearch,
    trackBookmarkAdded,
    trackNoteAdded,
    trackQuestionAsked,
    trackResourceDownloaded,
    trackFeatureUsage,
  };
}