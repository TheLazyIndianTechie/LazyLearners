/**
 * Unit tests for Video Heartbeat API endpoint
 * Tests POST and GET methods for video heartbeat route
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
  processVideoHeartbeat: jest.fn(),
  trackVideoEvent: jest.fn(),
}))

describe('/api/video/heartbeat', () => {
  let POST: any
  let GET: any
  let getServerSession: any
  let processVideoHeartbeat: any
  let trackVideoEvent: any
  let videoStreaming: any

  beforeAll(async () => {
    // Import the route handlers
    const heartbeatRoute = await import('@/app/api/video/heartbeat/route')
    POST = heartbeatRoute.POST
    GET = heartbeatRoute.GET

    // Import mocked functions
    const nextAuth = await import('next-auth/next')
    getServerSession = nextAuth.getServerSession

    const streaming = await import('@/lib/video/streaming')
    processVideoHeartbeat = streaming.processVideoHeartbeat
    trackVideoEvent = streaming.trackVideoEvent
    videoStreaming = streaming.videoStreaming
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

  describe('POST /api/video/heartbeat', () => {
    const createMockRequest = (body: any) => {
      return {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(body),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as unknown as NextRequest
    }

    const mockSession = {
      sessionId: 'session123',
      userId: 'user123',
      videoId: 'video123',
      startTime: Date.now() - 300000, // 5 minutes ago
      lastActivity: Date.now() - 30000, // 30 seconds ago
      watchTime: 240000, // 4 minutes
      completionPercentage: 75,
    }

    beforeEach(() => {
      videoStreaming.getSession.mockResolvedValue(mockSession)
      processVideoHeartbeat.mockResolvedValue({
        status: 'ok',
        recommendedQuality: undefined,
        messages: [],
      })
    })

    test('should process heartbeat successfully', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        playbackRate: 1.0,
        volume: 0.8,
        isPlaying: true,
        isFullscreen: false,
        networkInfo: {
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
        },
        playerState: {
          bufferedRanges: [{ start: 0, end: 320 }],
        },
      }

      const request = createMockRequest(heartbeatData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.status).toBe('ok')
      expect(responseData.data.sessionId).toBe('session123')
      expect(responseData.data.serverTime).toBeDefined()
      expect(responseData.data.recommendations).toBeDefined()
      expect(responseData.data.analytics).toEqual({
        watchTime: 240000,
        completionPercentage: 75,
      })

      expect(processVideoHeartbeat).toHaveBeenCalledWith(
        'session123',
        300,
        15,
        '720p'
      )
    })

    test('should track analytics when playing', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
        playbackRate: 1.25,
        volume: 0.9,
        isFullscreen: true,
        networkInfo: { effectiveType: '4g' },
      }

      const request = createMockRequest(heartbeatData)
      await POST(request)

      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'heartbeat',
        300,
        {
          quality: '720p',
          bufferHealth: 15,
          playbackRate: 1.25,
          volume: 0.9,
          isFullscreen: true,
          networkInfo: { effectiveType: '4g' },
          playerState: undefined,
        }
      )
    })

    test('should not track analytics when paused', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: false, // Paused
      }

      const request = createMockRequest(heartbeatData)
      await POST(request)

      expect(trackVideoEvent).not.toHaveBeenCalled()
    })

    test('should provide quality recommendations', async () => {
      processVideoHeartbeat.mockResolvedValue({
        status: 'ok',
        recommendedQuality: '1080p',
        messages: [],
      })

      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 25, // Good buffer
        quality: '720p',
        isPlaying: true,
      }

      const request = createMockRequest(heartbeatData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.recommendations.quality).toBe('1080p')
      expect(responseData.data.recommendations.messages).toContain(
        'Quality change recommended: 720p → 1080p'
      )
    })

    test('should provide buffer health warnings', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 5, // Low buffer
        quality: '720p',
        isPlaying: true,
      }

      const request = createMockRequest(heartbeatData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.recommendations.messages).toContain(
        'Low buffer detected. Consider reducing quality.'
      )
    })

    test('should suggest quality increase for good buffer', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 35, // Excellent buffer
        quality: '480p', // Not highest quality
        isPlaying: true,
      }

      const request = createMockRequest(heartbeatData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.recommendations.messages).toContain(
        'Good buffer health. Quality can be increased.'
      )
    })

    test('should provide network-based recommendations', async () => {
      const heartbeatData = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
        networkInfo: {
          effectiveType: '2g', // Slow network
        },
      }

      const request = createMockRequest(heartbeatData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.recommendations.messages).toContain(
        'Slow network detected. Consider using 240p quality.'
      )
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should validate heartbeat data', async () => {
      const invalidData = {
        sessionId: '', // Invalid: empty string
        currentPosition: -1, // Invalid: negative
        bufferHealth: 150, // Invalid: > 100
        quality: 'invalid', // Invalid: not in enum
        playbackRate: 5.0, // Invalid: too high
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid heartbeat data')
      expect(responseData.error.details).toBeDefined()
    })

    test('should handle non-existent session', async () => {
      videoStreaming.getSession.mockResolvedValue(null)

      const request = createMockRequest({
        sessionId: 'non-existent',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Session not found')
    })

    test('should prevent heartbeat for other user sessions', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      })

      const request = createMockRequest({
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
    })

    test('should handle heartbeat processing errors', async () => {
      processVideoHeartbeat.mockRejectedValue(new Error('Heartbeat processing failed'))

      const request = createMockRequest({
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to process heartbeat')
    })

    test('should handle expired sessions', async () => {
      processVideoHeartbeat.mockResolvedValue({
        status: 'expired',
      })

      const request = createMockRequest({
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.status).toBe('expired')
    })

    test('should handle invalid sessions', async () => {
      processVideoHeartbeat.mockResolvedValue({
        status: 'invalid',
      })

      const request = createMockRequest({
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.status).toBe('invalid')
    })
  })

  describe('GET /api/video/heartbeat', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/video/heartbeat')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return {
        headers: new Headers(),
        url: url.toString(),
        method: 'GET',
      } as unknown as NextRequest
    }

    const mockSession = {
      sessionId: 'session123',
      userId: 'user123',
      videoId: 'video123',
      startTime: Date.now() - 300000, // 5 minutes ago
      lastActivity: Date.now() - 30000, // 30 seconds ago
      currentPosition: 300,
      quality: '720p',
      playbackSpeed: 1.25,
      volume: 0.8,
      isFullscreen: false,
      watchTime: 240000,
      completionPercentage: 75,
      events: [
        { type: 'play', timestamp: Date.now() - 60000 },
        { type: 'pause', timestamp: Date.now() - 30000 },
        { type: 'play', timestamp: Date.now() - 15000 },
      ],
    }

    beforeEach(() => {
      videoStreaming.getSession.mockResolvedValue(mockSession)
    })

    test('should return session status for active session', async () => {
      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.sessionId).toBe('session123')
      expect(responseData.data.status).toBe('active') // Within last minute
      expect(responseData.data.currentPosition).toBe(300)
      expect(responseData.data.quality).toBe('720p')
      expect(responseData.data.playbackSpeed).toBe(1.25)
      expect(responseData.data.volume).toBe(0.8)
      expect(responseData.data.isFullscreen).toBe(false)
      expect(responseData.data.watchTime).toBe(240000)
      expect(responseData.data.completionPercentage).toBe(75)
      expect(responseData.data.eventCount).toBe(3)
      expect(responseData.data.recentEvents).toHaveLength(3)
    })

    test('should return inactive status for old session', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        lastActivity: Date.now() - 120000, // 2 minutes ago (inactive)
      })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.status).toBe('inactive')
    })

    test('should calculate session metrics correctly', async () => {
      const startTime = Date.now() - 300000 // 5 minutes ago
      const lastActivity = Date.now() - 30000 // 30 seconds ago

      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        startTime,
        lastActivity,
      })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.sessionAge).toBeCloseTo(300000, -2) // ~5 minutes
      expect(responseData.data.timeSinceLastActivity).toBeCloseTo(30000, -2) // ~30 seconds
    })

    test('should limit recent events to 5', async () => {
      const manyEvents = Array.from({ length: 10 }, (_, i) => ({
        type: 'heartbeat',
        timestamp: Date.now() - (i * 10000),
      }))

      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        events: manyEvents,
      })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.recentEvents).toHaveLength(5)
      expect(responseData.data.eventCount).toBe(10)
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should require session ID', async () => {
      const request = createMockRequest()
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Session ID is required')
    })

    test('should handle non-existent session', async () => {
      videoStreaming.getSession.mockResolvedValue(null)

      const request = createMockRequest({ sessionId: 'non-existent' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Session not found')
    })

    test('should prevent access to other user sessions', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
    })

    test('should handle session retrieval errors', async () => {
      videoStreaming.getSession.mockRejectedValue(new Error('Session retrieval failed'))

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to get heartbeat status')
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle malformed JSON requests', async () => {
      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
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
        json: jest.fn().mockResolvedValue({ sessionId: 'session123' }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle optional fields gracefully', async () => {
      videoStreaming.getSession.mockResolvedValue({
        sessionId: 'session123',
        userId: 'user123',
        startTime: Date.now(),
        lastActivity: Date.now(),
      })

      processVideoHeartbeat.mockResolvedValue({
        status: 'ok',
      })

      const minimalHeartbeat = {
        sessionId: 'session123',
        currentPosition: 300,
        bufferHealth: 15,
        quality: '720p',
        isPlaying: true,
        // Missing optional fields
      }

      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue(minimalHeartbeat),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})