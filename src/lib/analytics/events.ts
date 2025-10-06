import { captureServerEvent, getUserDistinctId } from "./posthog";

/**
 * Analytics event definitions for learner engagement tracking
 */
export enum AnalyticsEvent {
  // Enrollment Events
  COURSE_ENROLLED = "course_enrolled",
  COURSE_COMPLETED = "course_completed",
  COURSE_DROPPED = "course_dropped",

  // Lesson/Video Events
  LESSON_STARTED = "lesson_started",
  LESSON_COMPLETED = "lesson_completed",
  VIDEO_PLAYED = "video_played",
  VIDEO_PAUSED = "video_paused",
  VIDEO_SEEKED = "video_seeked",
  VIDEO_COMPLETED = "video_completed",
  VIDEO_CHECKPOINT = "video_checkpoint",

  // Quiz Events
  QUIZ_STARTED = "quiz_started",
  QUIZ_COMPLETED = "quiz_completed",
  QUIZ_PASSED = "quiz_passed",
  QUIZ_FAILED = "quiz_failed",

  // Session Events
  SESSION_STARTED = "session_started",
  SESSION_ENDED = "session_ended",
  PAGE_VIEW = "page_view",

  // Progress Events
  PROGRESS_UPDATED = "progress_updated",
  MODULE_COMPLETED = "module_completed",

  // Interaction Events
  BOOKMARK_ADDED = "bookmark_added",
  NOTE_ADDED = "note_added",
  QUESTION_ASKED = "question_asked",
  RESOURCE_DOWNLOADED = "resource_downloaded",
}

// Event property interfaces
export interface BaseEventProperties {
  userId: string;
  timestamp?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string; // Will be hashed for privacy
}

export interface CourseEventProperties extends BaseEventProperties {
  courseId: string;
  courseTitle: string;
  instructorId: string;
  category?: string;
  difficulty?: string;
  price?: number;
}

export interface LessonEventProperties extends CourseEventProperties {
  lessonId: string;
  lessonTitle: string;
  moduleId: string;
  lessonType: string;
  duration?: number; // in seconds
}

export interface VideoEventProperties extends LessonEventProperties {
  videoDuration: number;
  currentPosition: number;
  completionPercentage: number;
  quality?: string;
  playbackSpeed?: number;
}

export interface QuizEventProperties extends LessonEventProperties {
  quizId: string;
  score: number;
  maxScore: number;
  passingScore: number;
  timeSpent?: number; // in seconds
  questionsCount: number;
}

export interface SessionEventProperties extends BaseEventProperties {
  duration?: number; // in seconds
  pageCount?: number;
  deviceType?: string;
  referrer?: string;
}

export interface ProgressEventProperties extends CourseEventProperties {
  lessonId?: string;
  moduleId?: string;
  completionPercentage: number;
  timeSpent: number; // in seconds
}

/**
 * Analytics event tracking service
 */
export class AnalyticsTracker {
  /**
   * Track course enrollment
   */
  static trackCourseEnrolled(props: CourseEventProperties): void {
    captureServerEvent(AnalyticsEvent.COURSE_ENROLLED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        instructor_id: props.instructorId,
        category: props.category,
        difficulty: props.difficulty,
        price: props.price,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track course completion
   */
  static trackCourseCompleted(props: CourseEventProperties & { timeSpent: number }): void {
    captureServerEvent(AnalyticsEvent.COURSE_COMPLETED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        instructor_id: props.instructorId,
        time_spent_seconds: props.timeSpent,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track lesson started
   */
  static trackLessonStarted(props: LessonEventProperties): void {
    captureServerEvent(AnalyticsEvent.LESSON_STARTED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        lesson_type: props.lessonType,
        duration_seconds: props.duration,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track lesson completion
   */
  static trackLessonCompleted(props: LessonEventProperties & { timeSpent: number }): void {
    captureServerEvent(AnalyticsEvent.LESSON_COMPLETED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        lesson_type: props.lessonType,
        duration_seconds: props.duration,
        time_spent_seconds: props.timeSpent,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track video progress checkpoints
   */
  static trackVideoCheckpoint(props: VideoEventProperties): void {
    captureServerEvent(AnalyticsEvent.VIDEO_CHECKPOINT, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        video_duration_seconds: props.videoDuration,
        current_position_seconds: props.currentPosition,
        completion_percentage: props.completionPercentage,
        quality: props.quality,
        playback_speed: props.playbackSpeed,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track video completed
   */
  static trackVideoCompleted(props: VideoEventProperties & { timeSpent: number }): void {
    captureServerEvent(AnalyticsEvent.VIDEO_COMPLETED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        video_duration_seconds: props.videoDuration,
        time_spent_seconds: props.timeSpent,
        completion_percentage: props.completionPercentage,
        quality: props.quality,
        playback_speed: props.playbackSpeed,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track quiz started
   */
  static trackQuizStarted(props: QuizEventProperties): void {
    captureServerEvent(AnalyticsEvent.QUIZ_STARTED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        quiz_id: props.quizId,
        questions_count: props.questionsCount,
        passing_score: props.passingScore,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        quiz: props.quizId,
        instructor: props.instructorId,
      },
    });
  }

  /**
   * Track quiz completion
   */
  static trackQuizCompleted(props: QuizEventProperties): void {
    const passed = props.score >= props.passingScore;

    captureServerEvent(AnalyticsEvent.QUIZ_COMPLETED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        lesson_title: props.lessonTitle,
        module_id: props.moduleId,
        quiz_id: props.quizId,
        score: props.score,
        max_score: props.maxScore,
        passing_score: props.passingScore,
        passed,
        score_percentage: (props.score / props.maxScore) * 100,
        questions_count: props.questionsCount,
        time_spent_seconds: props.timeSpent,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        lesson: props.lessonId,
        quiz: props.quizId,
        instructor: props.instructorId,
      },
    });

    // Also track pass/fail events
    if (passed) {
      captureServerEvent(AnalyticsEvent.QUIZ_PASSED, {
        distinctId: getUserDistinctId(props.userId)!,
        properties: {
          course_id: props.courseId,
          lesson_id: props.lessonId,
          quiz_id: props.quizId,
          score: props.score,
          max_score: props.maxScore,
          score_percentage: (props.score / props.maxScore) * 100,
          time_spent_seconds: props.timeSpent,
          timestamp: props.timestamp || new Date().toISOString(),
        },
        groups: {
          course: props.courseId,
          lesson: props.lessonId,
          quiz: props.quizId,
          instructor: props.instructorId,
        },
      });
    } else {
      captureServerEvent(AnalyticsEvent.QUIZ_FAILED, {
        distinctId: getUserDistinctId(props.userId)!,
        properties: {
          course_id: props.courseId,
          lesson_id: props.lessonId,
          quiz_id: props.quizId,
          score: props.score,
          max_score: props.maxScore,
          passing_score: props.passingScore,
          score_percentage: (props.score / props.maxScore) * 100,
          time_spent_seconds: props.timeSpent,
          timestamp: props.timestamp || new Date().toISOString(),
        },
        groups: {
          course: props.courseId,
          lesson: props.lessonId,
          quiz: props.quizId,
          instructor: props.instructorId,
        },
      });
    }
  }

  /**
   * Track session started
   */
  static trackSessionStarted(props: SessionEventProperties): void {
    captureServerEvent(AnalyticsEvent.SESSION_STARTED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        device_type: props.deviceType,
        referrer: props.referrer,
        user_agent: props.userAgent,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
    });
  }

  /**
   * Track session ended
   */
  static trackSessionEnded(props: SessionEventProperties): void {
    captureServerEvent(AnalyticsEvent.SESSION_ENDED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        duration_seconds: props.duration,
        page_count: props.pageCount,
        device_type: props.deviceType,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
    });
  }

  /**
   * Track progress updated
   */
  static trackProgressUpdated(props: ProgressEventProperties): void {
    captureServerEvent(AnalyticsEvent.PROGRESS_UPDATED, {
      distinctId: getUserDistinctId(props.userId)!,
      properties: {
        course_id: props.courseId,
        course_title: props.courseTitle,
        lesson_id: props.lessonId,
        module_id: props.moduleId,
        completion_percentage: props.completionPercentage,
        time_spent_seconds: props.timeSpent,
        instructor_id: props.instructorId,
        timestamp: props.timestamp || new Date().toISOString(),
        session_id: props.sessionId,
      },
      groups: {
        course: props.courseId,
        instructor: props.instructorId,
      },
    });
  }
}