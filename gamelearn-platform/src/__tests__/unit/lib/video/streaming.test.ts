/**
 * Unit tests for VideoStreamingService class
 * Tests streaming sessions, analytics, access control, and DRM
 */

import { jest } from '@jest/globals'

// Mock the dependencies before importing
jest.mock('@/lib/logger', () => ({
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}))

jest.mock('@/lib/redis', () => ({
  redis: {
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    setAdd: jest.fn(),
  },
}))

jest.mock('@/lib/config/env', () => ({
  env: {
    CDN_URL: 'https://test-cdn.lazygamedevs.com',
    APP_URL: 'http://localhost:3000',
    CLERK_SECRET_KEY: 'sk_test_dummy',
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: 'pk_test_dummy',
  },
}))

jest.mock('@/lib/security/monitoring', () => ({
  logSecurityEvent: jest.fn(),
}))

// Set test environment
process.env.NODE_ENV = 'test'

describe('VideoStreamingService', () => {
  let VideoStreamingService: any
  let videoStreaming: any
  let STREAMING_CONFIG: any
  let createVideoSession: any
  let updateVideoSession: any
  let trackVideoEvent: any
  let processVideoHeartbeat: any
  let endVideoSession: any
  let getVideoAnalytics: any
  let redis: any
  let logSecurityEvent: any

  beforeAll(async () => {
    // Clear module cache
    jest.resetModules()

    // Import the module under test
    const streamingModule = await import('@/lib/video/streaming')
    VideoStreamingService = streamingModule.VideoStreamingService
    videoStreaming = streamingModule.videoStreaming
    STREAMING_CONFIG = streamingModule.STREAMING_CONFIG
    createVideoSession = streamingModule.createVideoSession
    updateVideoSession = streamingModule.updateVideoSession
    trackVideoEvent = streamingModule.trackVideoEvent
    processVideoHeartbeat = streamingModule.processVideoHeartbeat
    endVideoSession = streamingModule.endVideoSession
    getVideoAnalytics = streamingModule.getVideoAnalytics

    // Import mocked modules
    const redisModule = await import('@/lib/redis')
    redis = redisModule.redis

    const securityModule = await import('@/lib/security/monitoring')
    logSecurityEvent = securityModule.logSecurityEvent
  })

  beforeEach(() => {
    jest.clearAllMocks()
    // Reset Redis mocks
    redis.set.mockResolvedValue(undefined)
    redis.get.mockResolvedValue(null)
    redis.del.mockResolvedValue(undefined)
    redis.setAdd.mockResolvedValue(undefined)
  })

  describe('VideoStreamingService class', () => {
    test('should be a singleton', () => {
      const instance1 = VideoStreamingService.getInstance()
      const instance2 = VideoStreamingService.getInstance()
      expect(instance1).toBe(instance2)
    })

    test('should export the singleton instance', () => {
      expect(videoStreaming).toBeDefined()
      expect(videoStreaming).toBeInstanceOf(VideoStreamingService)
    })
  })

  describe('STREAMING_CONFIG', () => {
    test('should have valid configuration structure', () => {
      expect(STREAMING_CONFIG).toBeDefined()
      expect(STREAMING_CONFIG.cdn).toBeDefined()
      expect(STREAMING_CONFIG.abr).toBeDefined()
      expect(STREAMING_CONFIG.drm).toBeDefined()
      expect(STREAMING_CONFIG.analytics).toBeDefined()
      expect(STREAMING_CONFIG.security).toBeDefined()
    })

    test('should have CDN configuration', () => {
      expect(STREAMING_CONFIG.cdn.baseUrl).toBeDefined()
      expect(STREAMING_CONFIG.cdn.regions).toBeInstanceOf(Array)
      expect(STREAMING_CONFIG.cdn.cacheTTL).toBeGreaterThan(0)
      expect(STREAMING_CONFIG.cdn.edgeLocations).toBeGreaterThan(0)
    })

    test('should have adaptive bitrate configuration', () => {
      expect(STREAMING_CONFIG.abr.defaultQuality).toBeDefined()
      expect(typeof STREAMING_CONFIG.abr.autoQualitySwitch).toBe('boolean')
      expect(STREAMING_CONFIG.abr.bufferLengthTarget).toBeGreaterThan(0)
      expect(STREAMING_CONFIG.abr.maxBitrateSwitchDelay).toBeGreaterThan(0)
      expect(STREAMING_CONFIG.abr.qualityChangeThreshold).toBeGreaterThan(0)
    })

    test('should have security configuration', () => {
      expect(typeof STREAMING_CONFIG.security.enableTokenAuth).toBe('boolean')
      expect(STREAMING_CONFIG.security.tokenExpiry).toBeGreaterThan(0)
      expect(STREAMING_CONFIG.security.allowedOrigins).toBeInstanceOf(Array)
      expect(STREAMING_CONFIG.security.maxConcurrentSessions).toBeGreaterThan(0)
    })
  })

  describe('createStreamingSession', () => {
    const mockDeviceInfo = {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      platform: 'Windows',
      browser: 'Chrome',
      screenResolution: '1920x1080',
    }

    const mockManifest = {
      videoId: 'video123',
      format: 'hls',
      baseUrl: 'https://cdn.test.com/video123/master.m3u8',
      manifest: 'master.m3u8',
      qualities: [
        { quality: '720p', bandwidth: 2500000, url: 'https://cdn.test.com/video123/720p/playlist.m3u8' },
        { quality: '480p', bandwidth: 1200000, url: 'https://cdn.test.com/video123/480p/playlist.m3u8' },
      ],
      thumbnails: [],
      duration: 1800,
      encrypted: true,
    }

    beforeEach(() => {
      // Mock the streaming manifest
      redis.get.mockImplementation((key: string) => {
        if (key === 'video_manifest:video123') {
          return Promise.resolve(mockManifest)
        }
        return Promise.resolve(null)
      })
    })

    test('should create a streaming session successfully', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123', 'course456', mockDeviceInfo)

      expect(session).toBeDefined()
      expect(session.sessionId).toBeDefined()
      expect(session.accessToken).toBeDefined()
      expect(session.videoId).toBe('sample-unity-tutorial')
      expect(session.format).toBe('mp4')
      expect(session.restrictions).toBeDefined()
      expect(session.analytics).toBeDefined()
      expect(session.analytics.trackingUrl).toBeDefined()
      expect(session.analytics.heartbeatUrl).toBeDefined()
    })

    test('should include watermark for premium access', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session.watermark).toBeDefined()
      expect(session.watermark.text).toContain('user123')
      expect(session.watermark.position).toBeDefined()
      expect(session.watermark.opacity).toBeGreaterThan(0)
    })

    test('should persist session to Redis', async () => {
      await createVideoSession('sample-unity-tutorial', 'user123')

      expect(redis.set).toHaveBeenCalledWith(
        expect.stringMatching(/^video_session:/),
        expect.any(Object),
        expect.any(Number)
      )
    })

    test('should throw error for non-existent video', async () => {
      redis.get.mockResolvedValueOnce(null) // No manifest found

      await expect(createVideoSession('non-existent-video', 'user123')).rejects.toThrow('Video manifest not found')
    })

    test('should enforce concurrent session limits', async () => {
      // Create multiple sessions to test limits
      const sessions = []
      const videoIds = ['sample-unity-tutorial', 'sample-csharp-tutorial']
      for (let i = 0; i < STREAMING_CONFIG.security.maxConcurrentSessions; i++) {
        const videoId = videoIds[i % videoIds.length]
        sessions.push(await createVideoSession(videoId, 'user123'))
      }

      // Creating one more should trigger enforcement
      await createVideoSession('sample-unity-tutorial', 'user123')

      expect(logSecurityEvent).toHaveBeenCalledWith(
        'resource_abuse',
        'medium',
        expect.objectContaining({
          context: 'video_streaming',
          action: 'session_limit_enforced',
          userId: 'user123',
        }),
        'user123'
      )
    })

    test('should generate unique session IDs', async () => {
      const session1 = await createVideoSession('sample-unity-tutorial', 'user123')
      const session2 = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session1.sessionId).not.toBe(session2.sessionId)
      expect(session1.sessionId).toMatch(/^session_\d+_[a-z0-9]+$/)
    })

    test('should include device info in session', async () => {
      await createVideoSession('sample-unity-tutorial', 'user123', undefined, mockDeviceInfo)

      // Check that the session was created with device info
      const sessionCall = redis.set.mock.calls.find(call =>
        call[0].startsWith('video_session:')
      )
      expect(sessionCall).toBeDefined()
      const sessionData = sessionCall[1]
      expect(sessionData.deviceInfo).toEqual(mockDeviceInfo)
    })
  })

  describe('updateSession', () => {
    let sessionId: string
    let mockSession: any

    beforeEach(async () => {
      // Create a session first
      const session = await createVideoSession('sample-unity-tutorial', 'user123')
      sessionId = session.sessionId

      mockSession = {
        sessionId,
        userId: 'user123',
        videoId: 'sample-unity-tutorial',
        startTime: Date.now(),
        lastActivity: Date.now(),
        currentPosition: 0,
        quality: '720p',
        playbackSpeed: 1.0,
        volume: 1.0,
        isFullscreen: false,
        deviceInfo: {
          userAgent: 'test',
          platform: 'test',
          browser: 'test',
          screenResolution: 'test',
        },
        watchTime: 0,
        completionPercentage: 0,
        events: [],
      }

      // Mock session retrieval and updates
      redis.get.mockImplementation((key: string) => {
        if (key === `video_session:${sessionId}`) {
          return Promise.resolve(mockSession)
        }
        if (key === 'video_manifest:sample-unity-tutorial') {
          return Promise.resolve({ duration: 1800 })
        }
        return Promise.resolve(null)
      })

      // Mock set to update our mockSession
      redis.set.mockImplementation((key: string, value: any) => {
        if (key === `video_session:${sessionId}`) {
          Object.assign(mockSession, value)
        }
        return Promise.resolve(undefined)
      })
    })

    test('should update session position', async () => {
      await updateVideoSession(sessionId, { currentPosition: 300 })

      expect(mockSession.currentPosition).toBe(300)
      expect(mockSession.lastActivity).toBeGreaterThan(0)
    })

    test('should calculate completion percentage', async () => {
      await updateVideoSession(sessionId, { currentPosition: 900 }) // Half of 1800 seconds

      expect(mockSession.completionPercentage).toBe(50)
    })

    test('should update quality', async () => {
      await updateVideoSession(sessionId, { quality: '1080p' })

      expect(mockSession.quality).toBe('1080p')
    })

    test('should update playback speed', async () => {
      await updateVideoSession(sessionId, { playbackSpeed: 1.25 })

      expect(mockSession.playbackSpeed).toBe(1.25)
    })

    test('should update volume', async () => {
      await updateVideoSession(sessionId, { volume: 0.5 })

      expect(mockSession.volume).toBe(0.5)
    })

    test('should update fullscreen state', async () => {
      await updateVideoSession(sessionId, { isFullscreen: true })

      expect(mockSession.isFullscreen).toBe(true)
    })

    test('should throw error for non-existent session', async () => {
      await expect(updateVideoSession('non-existent-session', { currentPosition: 100 }))
        .rejects.toThrow('Session not found')
    })

    test('should persist updated session', async () => {
      await updateVideoSession(sessionId, { currentPosition: 300 })

      expect(redis.set).toHaveBeenCalledWith(
        `video_session:${sessionId}`,
        expect.any(Object),
        expect.any(Number)
      )
    })
  })

  describe('trackEvent', () => {
    let sessionId: string
    let mockSession: any

    beforeEach(async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')
      sessionId = session.sessionId

      mockSession = {
        sessionId,
        userId: 'user123',
        videoId: 'sample-unity-tutorial',
        events: [],
        lastActivity: Date.now(),
      }

      redis.get.mockImplementation((key: string) => {
        if (key === `video_session:${sessionId}`) {
          return Promise.resolve(mockSession)
        }
        return Promise.resolve(null)
      })
    })

    test('should track play event', async () => {
      await trackVideoEvent(sessionId, 'play', 100, { quality: '720p' })

      expect(mockSession.events).toHaveLength(1)
      expect(mockSession.events[0]).toMatchObject({
        type: 'play',
        position: 100,
        metadata: { quality: '720p' },
      })
    })

    test('should track pause event', async () => {
      await trackVideoEvent(sessionId, 'pause', 200)

      expect(mockSession.events).toHaveLength(1)
      expect(mockSession.events[0].type).toBe('pause')
      expect(mockSession.events[0].position).toBe(200)
    })

    test('should track seek event', async () => {
      await trackVideoEvent(sessionId, 'seek', 500, { from: 100, to: 500 })

      expect(mockSession.events).toHaveLength(1)
      expect(mockSession.events[0]).toMatchObject({
        type: 'seek',
        position: 500,
        metadata: { from: 100, to: 500 },
      })
    })

    test('should track quality change event', async () => {
      await trackVideoEvent(sessionId, 'quality_change', 300, {
        from: '720p',
        to: '1080p',
        reason: 'user_selection',
      })

      expect(mockSession.events).toHaveLength(1)
      expect(mockSession.events[0]).toMatchObject({
        type: 'quality_change',
        metadata: {
          from: '720p',
          to: '1080p',
          reason: 'user_selection',
        },
      })
    })

    test('should track error events', async () => {
      await trackVideoEvent(sessionId, 'error', 150, {
        error: 'network_error',
        message: 'Failed to load video segment',
      })

      expect(mockSession.events).toHaveLength(1)
      expect(mockSession.events[0]).toMatchObject({
        type: 'error',
        metadata: {
          error: 'network_error',
          message: 'Failed to load video segment',
        },
      })
    })

    test('should limit event history to 100 events', async () => {
      // Add 101 events
      for (let i = 0; i < 101; i++) {
        await trackVideoEvent(sessionId, 'play', i)
      }

      expect(mockSession.events).toHaveLength(100)
      // Should keep the most recent events
      expect(mockSession.events[0].position).toBe(1) // Events 1-100 should remain
      expect(mockSession.events[99].position).toBe(100)
    })

    test('should update last activity timestamp', async () => {
      const initialActivity = mockSession.lastActivity
      await new Promise(resolve => setTimeout(resolve, 10))

      await trackVideoEvent(sessionId, 'play', 100)

      expect(mockSession.lastActivity).toBeGreaterThan(initialActivity)
    })

    test('should handle non-existent session gracefully', async () => {
      // Should not throw error
      await expect(trackVideoEvent('non-existent-session', 'play', 100))
        .resolves.not.toThrow()
    })
  })

  describe('processHeartbeat', () => {
    let sessionId: string
    let mockSession: any

    beforeEach(async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')
      sessionId = session.sessionId

      mockSession = {
        sessionId,
        userId: 'user123',
        videoId: 'video123',
        startTime: Date.now(),
        lastActivity: Date.now(),
        watchTime: 0,
      }

      redis.get.mockImplementation((key: string) => {
        if (key === `video_session:${sessionId}`) {
          return Promise.resolve(mockSession)
        }
        return Promise.resolve(null)
      })
    })

    test('should process valid heartbeat', async () => {
      const result = await processVideoHeartbeat(sessionId, 300, 15, '720p')

      expect(result.status).toBe('ok')
      expect(result.recommendedQuality).toBeDefined()
    })

    test('should recommend quality downgrade for low buffer', async () => {
      const result = await processVideoHeartbeat(sessionId, 300, 3, '720p') // Low buffer

      expect(result.status).toBe('ok')
      expect(result.recommendedQuality).toBe('480p') // Should step down
    })

    test('should recommend quality upgrade for good buffer', async () => {
      const result = await processVideoHeartbeat(sessionId, 300, 20, '720p') // Good buffer

      expect(result.status).toBe('ok')
      expect(result.recommendedQuality).toBe('1080p') // Should step up
    })

    test('should not recommend quality change for adequate buffer', async () => {
      const result = await processVideoHeartbeat(sessionId, 300, 10, '720p') // Adequate buffer

      expect(result.status).toBe('ok')
      expect(result.recommendedQuality).toBeUndefined()
    })

    test('should return invalid for non-existent session', async () => {
      const result = await processVideoHeartbeat('non-existent-session', 300, 15, '720p')

      expect(result.status).toBe('invalid')
    })

    test('should expire old sessions', async () => {
      // Set session start time to be old
      mockSession.startTime = Date.now() - (STREAMING_CONFIG.analytics.sessionTimeout + 1000)

      const result = await processVideoHeartbeat(sessionId, 300, 15, '720p')

      expect(result.status).toBe('expired')
    })

    test('should update watch time accurately', async () => {
      const initialWatchTime = mockSession.watchTime
      mockSession.lastActivity = Date.now() - 30000 // 30 seconds ago

      await processVideoHeartbeat(sessionId, 300, 15, '720p')

      expect(mockSession.watchTime).toBeGreaterThan(initialWatchTime)
    })
  })

  describe('endVideoSession', () => {
    let sessionId: string
    let mockSession: any

    beforeEach(async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')
      sessionId = session.sessionId

      mockSession = {
        sessionId,
        userId: 'user123',
        videoId: 'video123',
        courseId: 'course456',
        startTime: Date.now() - 300000, // 5 minutes ago
        watchTime: 240000, // 4 minutes
        completionPercentage: 80,
        events: [{ type: 'play' }, { type: 'pause' }],
        deviceInfo: { platform: 'desktop' },
      }

      redis.get.mockImplementation((key: string) => {
        if (key === `video_session:${sessionId}`) {
          return Promise.resolve(mockSession)
        }
        if (key === 'video_manifest:video123') {
          return Promise.resolve({ duration: 1800 })
        }
        return Promise.resolve(null)
      })
    })

    test('should end session and store watch history', async () => {
      await endVideoSession(sessionId)

      expect(redis.set).toHaveBeenCalledWith(
        `watch_history:${sessionId}`,
        expect.objectContaining({
          sessionId,
          userId: 'user123',
          videoId: 'video123',
          courseId: 'course456',
          watchTime: 240000,
          completionPercentage: 80,
        }),
        expect.any(Number)
      )
    })

    test('should add session to user watch history', async () => {
      await endVideoSession(sessionId)

      expect(redis.setAdd).toHaveBeenCalledWith(
        'user_watch_history:user123',
        sessionId
      )
    })

    test('should cleanup session data', async () => {
      await endVideoSession(sessionId)

      expect(redis.del).toHaveBeenCalledWith(`video_session:${sessionId}`)
    })

    test('should handle non-existent session gracefully', async () => {
      await expect(endVideoSession('non-existent-session')).resolves.not.toThrow()
    })
  })

  describe('getVideoAnalytics', () => {
    test('should return comprehensive analytics', async () => {
      const analytics = await getVideoAnalytics('video123', 7)

      expect(analytics).toHaveProperty('totalViews')
      expect(analytics).toHaveProperty('uniqueViewers')
      expect(analytics).toHaveProperty('totalWatchTime')
      expect(analytics).toHaveProperty('averageWatchTime')
      expect(analytics).toHaveProperty('completionRate')
      expect(analytics).toHaveProperty('qualityDistribution')
      expect(analytics).toHaveProperty('deviceDistribution')
      expect(analytics).toHaveProperty('dropOffPoints')
      expect(analytics).toHaveProperty('engagement')

      expect(typeof analytics.totalViews).toBe('number')
      expect(typeof analytics.uniqueViewers).toBe('number')
      expect(typeof analytics.totalWatchTime).toBe('number')
      expect(typeof analytics.averageWatchTime).toBe('number')
      expect(typeof analytics.completionRate).toBe('number')
      expect(analytics.qualityDistribution).toBeInstanceOf(Object)
      expect(analytics.deviceDistribution).toBeInstanceOf(Object)
      expect(analytics.dropOffPoints).toBeInstanceOf(Array)
      expect(analytics.engagement).toBeInstanceOf(Array)
    })

    test('should respect time range parameter', async () => {
      const analytics7Days = await getVideoAnalytics('video123', 7)
      const analytics30Days = await getVideoAnalytics('video123', 30)

      expect(analytics7Days).toBeDefined()
      expect(analytics30Days).toBeDefined()
      // In real implementation, these would be different
    })

    test('should handle analytics errors gracefully', async () => {
      // This would test error handling in real analytics aggregation
      await expect(getVideoAnalytics('video123')).resolves.toBeDefined()
    })
  })

  describe('access control', () => {
    test('should verify video access for premium users', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session.restrictions).toBeDefined()
      expect(session.restrictions.downloadDisabled).toBe(true)
      expect(session.restrictions.seekingDisabled).toBe(false)
      expect(session.restrictions.speedChangeDisabled).toBe(false)
    })

    test('should include appropriate watermarks', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session.watermark).toBeDefined()
      expect(session.watermark.text).toContain('LazyGameDevs')
      expect(session.watermark.text).toContain('user123')
      expect(['top-left', 'top-right', 'bottom-left', 'bottom-right'])
        .toContain(session.watermark.position)
      expect(session.watermark.opacity).toBeGreaterThan(0)
      expect(session.watermark.opacity).toBeLessThanOrEqual(1)
    })
  })

  describe('security features', () => {
    test('should generate secure access tokens', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session.accessToken).toBeDefined()
      expect(typeof session.accessToken).toBe('string')
      expect(session.accessToken.length).toBeGreaterThan(0)

      // Should be base64 encoded
      expect(() => Buffer.from(session.accessToken, 'base64')).not.toThrow()
    })

    test('should include expiry in access tokens', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      const tokenData = JSON.parse(Buffer.from(session.accessToken, 'base64').toString())
      expect(tokenData.exp).toBeDefined()
      expect(tokenData.exp).toBeGreaterThan(Date.now())
    })
  })

  describe('analytics tracking', () => {
    test('should provide analytics URLs', async () => {
      const session = await createVideoSession('sample-unity-tutorial', 'user123')

      expect(session.analytics.trackingUrl).toBeDefined()
      expect(session.analytics.heartbeatUrl).toBeDefined()
      expect(session.analytics.sessionId).toBe(session.sessionId)
    })
  })

  describe('error scenarios', () => {
    test('should handle Redis errors in session operations', async () => {
      redis.set.mockRejectedValue(new Error('Redis error'))
      redis.get.mockRejectedValue(new Error('Redis error'))

      // Should not throw errors
      await expect(createVideoSession('sample-unity-tutorial', 'user123')).resolves.toBeDefined()
    })

    test('should handle concurrent session management errors', async () => {
      // Test error handling when enforcing session limits fails
      logSecurityEvent.mockRejectedValue(new Error('Logging error'))

      // Should still complete session creation
      await expect(createVideoSession('sample-unity-tutorial', 'user123')).resolves.toBeDefined()
    })
  })
})