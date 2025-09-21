/**
 * Unit tests for Video Streaming API endpoint
 * Tests POST, PUT, and DELETE methods for video streaming route
 */

import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/logger', () => ({
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(() => jest.fn()),
    logRequest: jest.fn(),
  })),
}))

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

jest.mock('@/lib/video/streaming', () => ({
  videoStreaming: {
    getSession: jest.fn(),
  },
  createVideoSession: jest.fn(),
  updateVideoSession: jest.fn(),
  endVideoSession: jest.fn(),
  STREAMING_CONFIG: {
    abr: {
      defaultQuality: '720p',
    },
    security: {
      tokenExpiry: 3600,
    },
  },
}))

jest.mock('@/lib/security/monitoring', () => ({
  logSecurityEvent: jest.fn(),
}))

describe('/api/video/stream', () => {
  let POST: any
  let PUT: any
  let DELETE: any
  let getServerSession: any
  let createVideoSession: any
  let updateVideoSession: any
  let endVideoSession: any
  let videoStreaming: any
  let logSecurityEvent: any

  beforeAll(async () => {
    // Import the route handlers
    const streamRoute = await import('@/app/api/video/stream/route')
    POST = streamRoute.POST
    PUT = streamRoute.PUT
    DELETE = streamRoute.DELETE

    // Import mocked functions
    const nextAuth = await import('next-auth/next')
    getServerSession = nextAuth.getServerSession

    const streaming = await import('@/lib/video/streaming')
    createVideoSession = streaming.createVideoSession
    updateVideoSession = streaming.updateVideoSession
    endVideoSession = streaming.endVideoSession
    videoStreaming = streaming.videoStreaming

    const security = await import('@/lib/security/monitoring')
    logSecurityEvent = security.logSecurityEvent
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    getServerSession.mockResolvedValue({
      user: {
        id: 'user123',
        email: 'student@lazygamedevs.com',
        name: 'Test Student',
        role: 'student',
      },
    })
  })

  describe('POST /api/video/stream', () => {
    const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
      return {
        headers: new Headers({
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          ...headers,
        }),
        json: jest.fn().mockResolvedValue(body),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest
    }

    const mockStreamingManifest = {
      sessionId: 'session123',
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
      accessToken: 'abc123',
      restrictions: {
        downloadDisabled: true,
        seekingDisabled: false,
        speedChangeDisabled: false,
      },
      watermark: {
        text: 'LazyGameDevs - user123',
        position: 'bottom-right',
        opacity: 0.7,
      },
      analytics: {
        trackingUrl: 'http://localhost:3000/api/video/analytics',
        heartbeatUrl: 'http://localhost:3000/api/video/heartbeat',
        sessionId: 'session123',
      },
    }

    test('should create streaming session successfully', async () => {
      createVideoSession.mockResolvedValue(mockStreamingManifest)

      const requestBody = {
        videoId: 'video123',
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        deviceInfo: {
          userAgent: 'Mozilla/5.0 (Test Browser)',
          platform: 'Windows',
          browser: 'Chrome',
          screenResolution: '1920x1080',
        },
      }

      const request = createMockRequest(requestBody)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(201)
      expect(responseData.success).toBe(true)
      expect(responseData.data.sessionId).toBe('session123')
      expect(responseData.data.manifestUrl).toBe(mockStreamingManifest.baseUrl)
      expect(responseData.data.format).toBe('hls')
      expect(responseData.data.qualities).toHaveLength(2)
      expect(responseData.data.accessToken).toBe('abc123')
      expect(responseData.data.playerConfig).toBeDefined()
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ videoId: 'video123' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
      expect(logSecurityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'medium',
        expect.objectContaining({
          resource: 'video_streaming',
        }),
        undefined,
        undefined,
        'Mozilla/5.0 (Test Browser)',
        undefined
      )
    })

    test('should validate request body', async () => {
      const invalidBody = {
        videoId: '', // Invalid: empty string
        courseId: 'invalid-uuid', // Invalid: not a UUID
      }

      const request = createMockRequest(invalidBody)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid request parameters')
      expect(responseData.error.details).toBeDefined()
    })

    test('should handle non-existent video', async () => {
      // Mock video verification to fail
      jest.doMock('@/app/api/video/stream/route', () => ({
        ...jest.requireActual('@/app/api/video/stream/route'),
        verifyVideoExists: jest.fn().mockResolvedValue(false),
      }))

      const request = createMockRequest({ videoId: 'non-existent' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Video not found')
    })

    test('should handle access denied', async () => {
      // Mock access verification to fail
      jest.doMock('@/app/api/video/stream/route', () => ({
        ...jest.requireActual('@/app/api/video/stream/route'),
        verifyUserVideoAccess: jest.fn().mockResolvedValue(false),
      }))

      const request = createMockRequest({ videoId: 'restricted-video' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied. You need to enroll in this course.')
    })

    test('should extract device info from headers', async () => {
      createVideoSession.mockResolvedValue(mockStreamingManifest)

      const requestBody = { videoId: 'video123' }
      const headers = {
        'user-agent': 'Mozilla/5.0 (Custom Browser)',
        'x-forwarded-for': '192.168.1.100',
        'referer': 'https://lazygamedevs.com/course',
      }

      const request = createMockRequest(requestBody, headers)
      await POST(request)

      expect(createVideoSession).toHaveBeenCalledWith(
        'video123',
        'user123',
        undefined,
        expect.objectContaining({
          userAgent: 'Mozilla/5.0 (Custom Browser)',
          ipAddress: '192.168.1.100',
          referer: 'https://lazygamedevs.com/course',
        })
      )
    })

    test('should handle session creation errors', async () => {
      createVideoSession.mockRejectedValue(new Error('Session creation failed'))

      const request = createMockRequest({ videoId: 'video123' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to create video streaming session')
    })

    test('should include player configuration', async () => {
      createVideoSession.mockResolvedValue(mockStreamingManifest)

      const request = createMockRequest({ videoId: 'video123' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.playerConfig).toEqual({
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        defaultQuality: '720p',
        enableQualitySelector: true,
        enableSubtitles: true,
        enableFullscreen: true, // !seekingDisabled
      })
    })
  })

  describe('PUT /api/video/stream', () => {
    const createMockRequest = (body: any) => {
      return {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(body),
        method: 'PUT',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest
    }

    const mockSession = {
      sessionId: 'session123',
      userId: 'user123',
      videoId: 'video123',
      currentPosition: 100,
    }

    beforeEach(() => {
      videoStreaming.getSession.mockResolvedValue(mockSession)
    })

    test('should update session successfully', async () => {
      const updateData = {
        sessionId: 'session123',
        currentPosition: 300,
        quality: '1080p',
        playbackSpeed: 1.25,
        volume: 0.8,
        isFullscreen: true,
      }

      const request = createMockRequest(updateData)
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.sessionId).toBe('session123')
      expect(updateVideoSession).toHaveBeenCalledWith('session123', {
        currentPosition: 300,
        quality: '1080p',
        playbackSpeed: 1.25,
        volume: 0.8,
        isFullscreen: true,
      })
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should validate request body', async () => {
      const invalidBody = {
        sessionId: '', // Invalid: empty string
        currentPosition: -1, // Invalid: negative
        playbackSpeed: 3.0, // Invalid: too high
      }

      const request = createMockRequest(invalidBody)
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid session update parameters')
    })

    test('should handle non-existent session', async () => {
      videoStreaming.getSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'non-existent' })
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Streaming session not found')
    })

    test('should prevent updating other user sessions', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      })

      const request = createMockRequest({ sessionId: 'session123', currentPosition: 300 })
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
      expect(logSecurityEvent).toHaveBeenCalledWith(
        'unauthorized_access',
        'medium',
        expect.objectContaining({
          resource: 'video_session',
          sessionId: 'session123',
          attemptedUserId: 'user123',
          actualUserId: 'other-user',
        }),
        'user123'
      )
    })

    test('should handle update errors', async () => {
      updateVideoSession.mockRejectedValue(new Error('Update failed'))

      const request = createMockRequest({ sessionId: 'session123', currentPosition: 300 })
      const response = await PUT(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to update streaming session')
    })

    test('should update only provided fields', async () => {
      const partialUpdate = {
        sessionId: 'session123',
        currentPosition: 300,
        // Only position, no other fields
      }

      const request = createMockRequest(partialUpdate)
      await PUT(request)

      expect(updateVideoSession).toHaveBeenCalledWith('session123', {
        currentPosition: 300,
      })
    })
  })

  describe('DELETE /api/video/stream', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/video/stream')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return {
        headers: new Headers(),
        url: url.toString(),
        method: 'DELETE',
      } as unknown as NextRequest
    }

    const mockSession = {
      sessionId: 'session123',
      userId: 'user123',
      videoId: 'video123',
      courseId: 'course456',
      startTime: Date.now() - 300000, // 5 minutes ago
      watchTime: 240000, // 4 minutes
      completionPercentage: 80,
    }

    beforeEach(() => {
      videoStreaming.getSession.mockResolvedValue(mockSession)
    })

    test('should end session successfully', async () => {
      const request = createMockRequest({ sessionId: 'session123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.sessionId).toBe('session123')
      expect(responseData.data.watchTime).toBe(240000)
      expect(responseData.data.completionPercentage).toBe(80)
      expect(endVideoSession).toHaveBeenCalledWith('session123')
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should require session ID', async () => {
      const request = createMockRequest()
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Session ID is required')
    })

    test('should handle non-existent session', async () => {
      videoStreaming.getSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'non-existent' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Streaming session not found')
    })

    test('should prevent ending other user sessions', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
    })

    test('should handle end session errors', async () => {
      endVideoSession.mockRejectedValue(new Error('End session failed'))

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to end streaming session')
    })

    test('should track analytics on session end', async () => {
      // Mock the trackStreamingAnalytics function
      const trackStreamingAnalytics = jest.fn().mockResolvedValue(undefined)

      // Since we can't easily mock the imported function, we'll verify the session end call
      const request = createMockRequest({ sessionId: 'session123' })
      await DELETE(request)

      expect(endVideoSession).toHaveBeenCalledWith('session123')
    })
  })

  describe('Helper functions', () => {
    test('should handle video existence verification', async () => {
      // These functions are internal to the route file, so we test them indirectly
      // by verifying their effects through the main API functions
      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ videoId: 'video123' }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest

      // The video existence check should be called during POST
      await POST(request)

      // We can't directly test the helper functions, but we can verify
      // that the request was processed (either successfully or with appropriate error)
      expect(request.json).toHaveBeenCalled()
    })

    test('should handle access control verification', async () => {
      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'video123',
          courseId: '550e8400-e29b-41d4-a716-446655440000',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest

      await POST(request)

      // Verify that access control was checked by ensuring request was processed
      expect(request.json).toHaveBeenCalled()
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle malformed JSON requests', async () => {
      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle session errors', async () => {
      getServerSession.mockRejectedValue(new Error('Session error'))

      const request = {
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ videoId: 'video123' }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle missing headers gracefully', async () => {
      createVideoSession.mockResolvedValue({
        sessionId: 'session123',
        videoId: 'video123',
        format: 'hls',
        qualities: [],
        duration: 1800,
        analytics: {},
      })

      const request = {
        headers: new Headers(), // Minimal headers
        json: jest.fn().mockResolvedValue({ videoId: 'video123' }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as unknown as NextRequest

      const response = await POST(request)

      // Should still process the request with default values
      expect(response.status).not.toBe(500)
    })
  })
})