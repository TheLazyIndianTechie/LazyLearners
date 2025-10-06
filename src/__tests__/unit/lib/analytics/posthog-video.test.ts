import { PostHogVideoAnalytics, posthogVideoAnalytics } from '@/lib/analytics/posthog-video'

// Mock PostHog
jest.mock('posthog-js', () => ({
  capture: jest.fn(),
  people: {
    set: jest.fn(),
    get_property: jest.fn().mockReturnValue(0),
  },
  __loaded: true,
}))

describe('PostHogVideoAnalytics', () => {
  let mockPosthog: any

  beforeEach(() => {
    mockPosthog = require('posthog-js')
    jest.clearAllMocks()
  })

  describe('trackVideoStart', () => {
    it('should track video session start with correct properties', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        courseId: 'course-789',
        lessonId: 'lesson-101',
        position: 0,
        duration: 600,
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
        deviceInfo: {
          platform: 'web',
          browser: 'chrome',
          screenResolution: '1920x1080'
        }
      }

      posthogVideoAnalytics.trackVideoStart(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_session_start', {
        ...properties,
        session_duration: 0,
        completion_percentage: 0,
        $set: {
          last_video_watched: 'video-456',
          last_course_accessed: 'course-789',
          last_lesson_accessed: 'lesson-101',
        },
        $set_once: {
          first_video_watched: 'video-456',
          first_course_accessed: 'course-789',
          first_lesson_accessed: 'lesson-101',
        }
      })

      expect(mockPosthog.people.set).toHaveBeenCalledWith({
        [`course_course-789_started`]: expect.any(String),
        [`course_course-789_videos_watched`]: 1
      })
    })
  })

  describe('trackVideoPlay', () => {
    it('should track video play event with position bucket', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 120,
        duration: 600,
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoPlay(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_play', {
        ...properties,
        session_duration: expect.any(Number),
        position_bucket: '25-50%',
        $set: {
          last_video_played: 'video-456',
          last_course_played: undefined,
        }
      })
    })
  })

  describe('trackVideoSeek', () => {
    it('should track forward seek with skip detection', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 300,
        duration: 600,
        seekFrom: 60,
        seekTo: 300,
        seekDirection: 'forward' as const,
        seekDistance: 240,
        seekMethod: 'progress_bar',
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoSeek(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_seek', {
        ...properties,
        session_duration: expect.any(Number),
        seek_from_bucket: '10-25%',
        seek_to_bucket: '50-75%',
        skip_detected: true,
        rewind_detected: false
      })
    })
  })

  describe('trackVideoComplete', () => {
    it('should track video completion and update user properties', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        courseId: 'course-789',
        position: 600,
        duration: 600,
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoComplete(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_complete', {
        ...properties,
        session_duration: expect.any(Number),
        completion_percentage: 100,
        $set: {
          [`video_video-456_completed`]: true,
          [`video_video-456_completed_at`]: expect.any(String),
          last_video_completed: 'video-456',
          last_course_completed: 'course-789',
          total_videos_completed: 1
        }
      })

      expect(mockPosthog.people.set).toHaveBeenCalledWith({
        [`course_course-789_videos_completed`]: 1,
        [`course_course-789_last_completed_at`]: expect.any(String)
      })
    })
  })

  describe('trackVideoQualityChange', () => {
    it('should track quality upgrade', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 120,
        duration: 600,
        fromQuality: '480p',
        toQuality: '720p',
        reason: 'auto',
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoQualityChange(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_quality_change', {
        ...properties,
        session_duration: expect.any(Number),
        quality_improved: true,
        quality_degraded: false,
        change_reason: 'auto'
      })
    })
  })

  describe('trackVideoBuffer', () => {
    it('should track buffer start with health category', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 120,
        duration: 600,
        bufferEvent: 'start' as const,
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 25,
      }

      posthogVideoAnalytics.trackVideoBuffer(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_buffer_start', {
        ...properties,
        session_duration: expect.any(Number),
        buffer_duration: undefined,
        buffer_health_category: 'fair'
      })
    })
  })

  describe('trackVideoEngagement', () => {
    it('should track fullscreen engagement', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 120,
        duration: 600,
        engagementType: 'fullscreen_enter' as const,
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: true,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoEngagement(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_engagement', {
        ...properties,
        session_duration: expect.any(Number),
        engagement_type: 'fullscreen_enter',
        engagement_value: undefined
      })
    })
  })

  describe('trackVideoDropOff', () => {
    it('should track video drop-off with bucket classification', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 180,
        duration: 600,
        dropOffReason: 'navigation',
        quality: '720p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: false,
        bufferHealth: 100,
      }

      posthogVideoAnalytics.trackVideoDropOff(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_drop_off', {
        ...properties,
        session_duration: expect.any(Number),
        completion_percentage: 30,
        drop_off_bucket: '25-50% (Halfway)',
        drop_off_reason: 'navigation'
      })
    })
  })

  describe('trackVideoHeartbeat', () => {
    it('should track periodic heartbeat with engagement score', () => {
      const properties = {
        sessionId: 'session-123',
        videoId: 'video-456',
        position: 120,
        duration: 600,
        quality: '1080p',
        playbackRate: 1,
        volume: 1,
        isFullscreen: true,
        bufferHealth: 80,
      }

      posthogVideoAnalytics.trackVideoHeartbeat(properties)

      expect(mockPosthog.capture).toHaveBeenCalledWith('video_heartbeat', {
        ...properties,
        session_duration: expect.any(Number),
        completion_percentage: 20,
        watch_time_bucket: expect.any(String),
        engagement_score: expect.any(Number)
      })
    })
  })

  describe('position bucket calculation', () => {
    it('should correctly categorize positions into buckets', () => {
      const analytics = new PostHogVideoAnalytics()

      // Access private method for testing
      const instance = analytics as any

      expect(instance.getPositionBucket(30, 600)).toBe('0-10%')
      expect(instance.getPositionBucket(120, 600)).toBe('25-50%')
      expect(instance.getPositionBucket(480, 600)).toBe('75-90%')
      expect(instance.getPositionBucket(570, 600)).toBe('90-100%')
    })
  })

  describe('drop-off bucket calculation', () => {
    it('should correctly categorize completion percentages', () => {
      const analytics = new PostHogVideoAnalytics()
      const instance = analytics as any

      expect(instance.getDropOffBucket(5)).toBe('0-10% (Early dropout)')
      expect(instance.getDropOffBucket(35)).toBe('25-50% (Halfway)')
      expect(instance.getDropOffBucket(85)).toBe('75-90% (Near completion)')
      expect(instance.getDropOffBucket(95)).toBe('90-100% (Completed)')
    })
  })

  describe('buffer health categorization', () => {
    it('should correctly categorize buffer health', () => {
      const analytics = new PostHogVideoAnalytics()
      const instance = analytics as any

      expect(instance.getBufferHealthCategory(95)).toBe('excellent')
      expect(instance.getBufferHealthCategory(25)).toBe('fair')
      expect(instance.getBufferHealthCategory(5)).toBe('poor')
    })
  })

  describe('quality change detection', () => {
    it('should detect quality improvements and degradations', () => {
      const analytics = new PostHogVideoAnalytics()
      const instance = analytics as any

      expect(instance.isQualityUpgrade('480p', '720p')).toBe(true)
      expect(instance.isQualityUpgrade('720p', '480p')).toBe(false)
      expect(instance.isQualityDowngrade('720p', '480p')).toBe(true)
      expect(instance.isQualityDowngrade('480p', '720p')).toBe(false)
    })
  })
})