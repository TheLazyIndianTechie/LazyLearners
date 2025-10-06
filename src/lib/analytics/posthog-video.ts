import posthog from 'posthog-js'

export interface VideoEventProperties {
  sessionId: string
  videoId: string
  courseId?: string
  lessonId?: string
  position: number
  duration: number
  quality: string
  playbackRate: number
  volume: number
  isFullscreen: boolean
  bufferHealth: number
  networkInfo?: {
    effectiveType?: string
    downlink?: number
    rtt?: number
  }
  deviceInfo?: {
    platform: string
    browser: string
    screenResolution: string
  }
  metadata?: Record<string, any>
}

export interface VideoAnalyticsEvent {
  event: string
  properties: VideoEventProperties
  timestamp?: number
}

/**
 * PostHog Video Analytics Service
 * Handles granular video playback events for analytics and insights
 */
export class PostHogVideoAnalytics {
  private static instance: PostHogVideoAnalytics
  private sessionStartTime: Map<string, number> = new Map()
  private lastHeartbeat: Map<string, number> = new Map()

  private constructor() {}

  static getInstance(): PostHogVideoAnalytics {
    if (!PostHogVideoAnalytics.instance) {
      PostHogVideoAnalytics.instance = new PostHogVideoAnalytics()
    }
    return PostHogVideoAnalytics.instance
  }

  /**
   * Track video session start
   */
  trackVideoStart(properties: VideoEventProperties): void {
    if (!posthog.__loaded) return

    const { sessionId, videoId, courseId, lessonId } = properties

    // Mark session start time
    this.sessionStartTime.set(sessionId, Date.now())

    posthog.capture('video_session_start', {
      ...properties,
      session_duration: 0,
      completion_percentage: 0,
      $set: {
        last_video_watched: videoId,
        last_course_accessed: courseId,
        last_lesson_accessed: lessonId,
      },
      $set_once: {
        first_video_watched: videoId,
        first_course_accessed: courseId,
        first_lesson_accessed: lessonId,
      }
    })

    // Set user properties for cohort analysis
    if (courseId) {
      posthog.people.set({
        [`course_${courseId}_started`]: new Date().toISOString(),
        [`course_${courseId}_videos_watched`]: (posthog.people.get_property(`course_${courseId}_videos_watched`) || 0) + 1
      })
    }
  }

  /**
   * Track video play event
   */
  trackVideoPlay(properties: VideoEventProperties): void {
    if (!posthog.__loaded) return

    const { sessionId, position } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_play', {
      ...properties,
      session_duration: sessionDuration,
      position_bucket: this.getPositionBucket(position, properties.duration),
      $set: {
        last_video_played: properties.videoId,
        last_course_played: properties.courseId,
      }
    })
  }

  /**
   * Track video pause event
   */
  trackVideoPause(properties: VideoEventProperties): void {
    if (!posthog.__loaded) return

    const { sessionId, position } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_pause', {
      ...properties,
      session_duration: sessionDuration,
      position_bucket: this.getPositionBucket(position, properties.duration),
      pause_reason: properties.metadata?.pauseReason || 'user_action'
    })
  }

  /**
   * Track video seek event
   */
  trackVideoSeek(properties: VideoEventProperties & {
    seekFrom: number
    seekTo: number
    seekDirection: 'forward' | 'backward'
    seekDistance: number
    seekMethod: string
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, seekFrom, seekTo, seekDirection, seekDistance } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_seek', {
      ...properties,
      session_duration: sessionDuration,
      seek_from_bucket: this.getPositionBucket(seekFrom, properties.duration),
      seek_to_bucket: this.getPositionBucket(seekTo, properties.duration),
      skip_detected: seekDirection === 'forward' && seekDistance > 30,
      rewind_detected: seekDirection === 'backward' && seekDistance > 10
    })
  }

  /**
   * Track video quality change
   */
  trackVideoQualityChange(properties: VideoEventProperties & {
    fromQuality: string
    toQuality: string
    reason: string
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, fromQuality, toQuality, reason } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_quality_change', {
      ...properties,
      session_duration: sessionDuration,
      quality_improved: this.isQualityUpgrade(fromQuality, toQuality),
      quality_degraded: this.isQualityDowngrade(fromQuality, toQuality),
      change_reason: reason
    })
  }

  /**
   * Track video buffer events
   */
  trackVideoBuffer(properties: VideoEventProperties & {
    bufferEvent: 'start' | 'end'
    bufferDuration?: number
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, bufferEvent, bufferDuration } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture(`video_buffer_${bufferEvent}`, {
      ...properties,
      session_duration: sessionDuration,
      buffer_duration: bufferDuration,
      buffer_health_category: this.getBufferHealthCategory(properties.bufferHealth)
    })
  }

  /**
   * Track video completion
   */
  trackVideoComplete(properties: VideoEventProperties): void {
    if (!posthog.__loaded) return

    const { sessionId, videoId, courseId } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_complete', {
      ...properties,
      session_duration: sessionDuration,
      completion_percentage: 100,
      $set: {
        [`video_${videoId}_completed`]: true,
        [`video_${videoId}_completed_at`]: new Date().toISOString(),
        last_video_completed: videoId,
        last_course_completed: courseId,
        total_videos_completed: (posthog.people.get_property('total_videos_completed') || 0) + 1
      }
    })

    // Update course progress if applicable
    if (courseId) {
      posthog.people.set({
        [`course_${courseId}_videos_completed`]: (posthog.people.get_property(`course_${courseId}_videos_completed`) || 0) + 1,
        [`course_${courseId}_last_completed_at`]: new Date().toISOString()
      })
    }

    // Clean up session tracking
    this.sessionStartTime.delete(sessionId)
    this.lastHeartbeat.delete(sessionId)
  }

  /**
   * Track video error
   */
  trackVideoError(properties: VideoEventProperties & {
    error: string
    errorCode?: string
    errorDetails?: any
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, error, errorCode } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_error', {
      ...properties,
      session_duration: sessionDuration,
      error_message: error,
      error_code: errorCode,
      $set: {
        last_video_error: properties.videoId,
        last_error_at: new Date().toISOString(),
        total_video_errors: (posthog.people.get_property('total_video_errors') || 0) + 1
      }
    })
  }

  /**
   * Track video heartbeat (periodic updates during playback)
   */
  trackVideoHeartbeat(properties: VideoEventProperties): void {
    if (!posthog.__loaded) return

    const { sessionId } = properties
    const now = Date.now()
    const lastHeartbeat = this.lastHeartbeat.get(sessionId) || 0

    // Throttle heartbeats to every 30 seconds
    if (now - lastHeartbeat < 30000) return

    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart
    const completionPercentage = (properties.position / properties.duration) * 100

    posthog.capture('video_heartbeat', {
      ...properties,
      session_duration: sessionDuration,
      completion_percentage: completionPercentage,
      watch_time_bucket: this.getWatchTimeBucket(sessionDuration),
      engagement_score: this.calculateEngagementScore(properties)
    })

    this.lastHeartbeat.set(sessionId, now)
  }

  /**
   * Track video engagement metrics
   */
  trackVideoEngagement(properties: VideoEventProperties & {
    engagementType: 'fullscreen_enter' | 'fullscreen_exit' | 'pip_enter' | 'pip_exit' | 'caption_toggle' | 'speed_change'
    engagementValue?: any
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, engagementType, engagementValue } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart

    posthog.capture('video_engagement', {
      ...properties,
      session_duration: sessionDuration,
      engagement_type: engagementType,
      engagement_value: engagementValue
    })
  }

  /**
   * Track video drop-off (when user leaves without completing)
   */
  trackVideoDropOff(properties: VideoEventProperties & {
    dropOffReason?: 'tab_closed' | 'navigation' | 'app_closed' | 'timeout'
  }): void {
    if (!posthog.__loaded) return

    const { sessionId, position, duration } = properties
    const sessionStart = this.sessionStartTime.get(sessionId) || Date.now()
    const sessionDuration = Date.now() - sessionStart
    const completionPercentage = (position / duration) * 100

    posthog.capture('video_drop_off', {
      ...properties,
      session_duration: sessionDuration,
      completion_percentage: completionPercentage,
      drop_off_bucket: this.getDropOffBucket(completionPercentage),
      drop_off_reason: properties.dropOffReason || 'unknown'
    })

    // Clean up session tracking
    this.sessionStartTime.delete(sessionId)
    this.lastHeartbeat.delete(sessionId)
  }

  // Helper methods

  private getPositionBucket(position: number, duration: number): string {
    const percentage = (position / duration) * 100
    if (percentage < 10) return '0-10%'
    if (percentage < 25) return '10-25%'
    if (percentage < 50) return '25-50%'
    if (percentage < 75) return '50-75%'
    if (percentage < 90) return '75-90%'
    return '90-100%'
  }

  private getWatchTimeBucket(sessionDuration: number): string {
    const minutes = sessionDuration / (1000 * 60)
    if (minutes < 1) return '< 1 min'
    if (minutes < 5) return '1-5 min'
    if (minutes < 15) return '5-15 min'
    if (minutes < 30) return '15-30 min'
    if (minutes < 60) return '30-60 min'
    return '> 60 min'
  }

  private getDropOffBucket(completionPercentage: number): string {
    if (completionPercentage < 10) return '0-10% (Early dropout)'
    if (completionPercentage < 25) return '10-25% (Very early)'
    if (completionPercentage < 50) return '25-50% (Halfway)'
    if (completionPercentage < 75) return '50-75% (Late dropout)'
    if (completionPercentage < 90) return '75-90% (Near completion)'
    return '90-100% (Completed)'
  }

  private getBufferHealthCategory(bufferHealth: number): string {
    if (bufferHealth >= 30) return 'excellent'
    if (bufferHealth >= 15) return 'good'
    if (bufferHealth >= 5) return 'fair'
    return 'poor'
  }

  private isQualityUpgrade(from: string, to: string): boolean {
    const qualityOrder = ['240p', '360p', '480p', '720p', '1080p']
    const fromIndex = qualityOrder.indexOf(from)
    const toIndex = qualityOrder.indexOf(to)
    return toIndex > fromIndex
  }

  private isQualityDowngrade(from: string, to: string): boolean {
    const qualityOrder = ['240p', '360p', '480p', '720p', '720p', '1080p']
    const fromIndex = qualityOrder.indexOf(from)
    const toIndex = qualityOrder.indexOf(to)
    return toIndex < fromIndex
  }

  private calculateEngagementScore(properties: VideoEventProperties): number {
    let score = 0

    // Base score for watching
    score += 10

    // Bonus for fullscreen
    if (properties.isFullscreen) score += 5

    // Bonus for higher quality
    if (properties.quality === '1080p') score += 3
    else if (properties.quality === '720p') score += 2
    else if (properties.quality === '480p') score += 1

    // Bonus for normal playback speed
    if (properties.playbackRate === 1) score += 2

    // Bonus for good buffer health
    if (properties.bufferHealth >= 15) score += 3

    return Math.min(score, 25) // Cap at 25
  }
}

// Export singleton instance
export const posthogVideoAnalytics = PostHogVideoAnalytics.getInstance()

// Convenience functions for easy usage
export const trackVideoStart = posthogVideoAnalytics.trackVideoStart.bind(posthogVideoAnalytics)
export const trackVideoPlay = posthogVideoAnalytics.trackVideoPlay.bind(posthogVideoAnalytics)
export const trackVideoPause = posthogVideoAnalytics.trackVideoPause.bind(posthogVideoAnalytics)
export const trackVideoSeek = posthogVideoAnalytics.trackVideoSeek.bind(posthogVideoAnalytics)
export const trackVideoQualityChange = posthogVideoAnalytics.trackVideoQualityChange.bind(posthogVideoAnalytics)
export const trackVideoBuffer = posthogVideoAnalytics.trackVideoBuffer.bind(posthogVideoAnalytics)
export const trackVideoComplete = posthogVideoAnalytics.trackVideoComplete.bind(posthogVideoAnalytics)
export const trackVideoError = posthogVideoAnalytics.trackVideoError.bind(posthogVideoAnalytics)
export const trackVideoHeartbeat = posthogVideoAnalytics.trackVideoHeartbeat.bind(posthogVideoAnalytics)
export const trackVideoEngagement = posthogVideoAnalytics.trackVideoEngagement.bind(posthogVideoAnalytics)
export const trackVideoDropOff = posthogVideoAnalytics.trackVideoDropOff.bind(posthogVideoAnalytics)