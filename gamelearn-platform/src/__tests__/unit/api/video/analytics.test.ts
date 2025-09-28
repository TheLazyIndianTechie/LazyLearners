/**
 * Unit tests for Video Analytics API endpoint
 * Tests POST and GET methods for video analytics route
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

jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  clerkClient: {
    users: {
      getUser: jest.fn(),
    },
  },
}))

jest.mock('@/lib/video/streaming', () => ({
  videoStreaming: {
    getSession: jest.fn(),
  },
  trackVideoEvent: jest.fn(),
  getVideoAnalytics: jest.fn(),
}))

describe('/api/video/analytics', () => {
  let POST: any
  let GET: any
  let authMock: jest.Mock
  let getUserMock: jest.Mock
  let trackVideoEvent: any
  let getVideoAnalytics: any
  let videoStreaming: any

  beforeAll(async () => {
    // Import the route handlers
    const analyticsRoute = await import('@/app/api/video/analytics/route')
    POST = analyticsRoute.POST
    GET = analyticsRoute.GET

    // Import mocked functions
    const clerkServer = await import('@clerk/nextjs/server')
    authMock = clerkServer.auth as jest.Mock
    getUserMock = clerkServer.clerkClient.users.getUser as jest.Mock

    const streaming = await import('@/lib/video/streaming')
    trackVideoEvent = streaming.trackVideoEvent
    getVideoAnalytics = streaming.getVideoAnalytics
    videoStreaming = streaming.videoStreaming
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    authMock.mockReturnValue({ userId: 'user123' })
    getUserMock.mockResolvedValue({
      id: 'user123',
      emailAddresses: [
        {
          id: 'email_1',
          emailAddress: 'instructor@lazygamedevs.com',
        },
      ],
      primaryEmailAddressId: 'email_1',
      publicMetadata: { role: 'INSTRUCTOR' },
      privateMetadata: {},
      unsafeMetadata: {},
    })
  })

  describe('POST /api/video/analytics', () => {
    const createMockRequest = (body: any, headers: Record<string, string> = {}) => {
      return {
        headers: new Headers({
          'content-type': 'application/json',
          'user-agent': 'Mozilla/5.0 (Test Browser)',
          ...headers,
        }),
        json: jest.fn().mockResolvedValue(body),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest
    }

    const mockSession = {
      sessionId: 'session123',
      userId: 'user123',
      videoId: 'video123',
      courseId: 'course456',
      startTime: Date.now() - 300000, // 5 minutes ago
      completionPercentage: 75,
    }

    beforeEach(() => {
      videoStreaming.getSession.mockResolvedValue(mockSession)
    })

    test('should track play event successfully', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'play',
        position: 300,
        metadata: {
          quality: '720p',
          playbackRate: 1.0,
        },
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.sessionId).toBe('session123')
      expect(responseData.data.eventType).toBe('play')
      expect(responseData.data.position).toBe(300)

      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'play',
        300,
        expect.objectContaining({
          quality: '720p',
          playbackRate: 1.0,
          userId: 'user123',
          videoId: 'video123',
          courseId: 'course456',
          userAgent: 'Mozilla/5.0 (Test Browser)',
        })
      )
    })

    test('should track pause event', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'pause',
        position: 450,
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'pause',
        450,
        expect.any(Object)
      )
    })

    test('should track seek event with metadata', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'seek',
        position: 600,
        metadata: {
          from: 300,
          to: 600,
          seekDirection: 'forward',
          seekDistance: 300,
        },
      }

      const request = createMockRequest(eventData)
      await POST(request)

      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'seek',
        600,
        expect.objectContaining({
          from: 300,
          to: 600,
          seekDirection: 'forward',
          seekDistance: 300,
        })
      )
    })

    test('should track quality change event', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'quality_change',
        position: 200,
        metadata: {
          from: '720p',
          to: '1080p',
          reason: 'user_selection',
        },
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.qualityChangeTracked).toBe(true)
    })

    test('should track error event', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'error',
        position: 150,
        metadata: {
          error: 'network_error',
          message: 'Failed to load video segment',
          code: 'NETWORK_FAILURE',
        },
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.errorLogged).toBe(true)
    })

    test('should mark video as completed for ended event', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        completionPercentage: 95, // >90% completion
      })

      const eventData = {
        sessionId: 'session123',
        eventType: 'ended',
        position: 1800,
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.videoCompleted).toBe(true)
      expect(responseData.data.completionTime).toBeDefined()
    })

    test('should track buffer issues', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'buffer_start',
        position: 300,
        metadata: {
          bufferHealth: 2,
          networkCondition: 'poor',
        },
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.bufferIssueTracked).toBe(true)
    })

    test('should detect skip behavior', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'seek',
        position: 400,
        metadata: {
          seekDirection: 'forward',
          seekDistance: 45, // >30 seconds
        },
      }

      const request = createMockRequest(eventData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.skipDetected).toBe(true)
    })

    test('should reject unauthenticated requests', async () => {
      authMock.mockReturnValue({ userId: null })

      const request = createMockRequest({ sessionId: 'session123' })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should validate event data', async () => {
      const invalidData = {
        sessionId: '', // Invalid: empty string
        eventType: 'invalid_event', // Invalid: not in enum
        position: -1, // Invalid: negative
      }

      const request = createMockRequest(invalidData)
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid event data')
      expect(responseData.error.details).toBeDefined()
    })

    test('should handle non-existent session', async () => {
      videoStreaming.getSession.mockResolvedValue(null)

      const request = createMockRequest({
        sessionId: 'non-existent',
        eventType: 'play',
        position: 100,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Session not found')
    })

    test('should prevent tracking events for other user sessions', async () => {
      videoStreaming.getSession.mockResolvedValue({
        ...mockSession,
        userId: 'other-user',
      })

      const request = createMockRequest({
        sessionId: 'session123',
        eventType: 'play',
        position: 100,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
    })

    test('should enhance metadata with context', async () => {
      const eventData = {
        sessionId: 'session123',
        eventType: 'play',
        position: 100,
        metadata: { custom: 'data' },
      }

      const request = createMockRequest(eventData, {
        'x-correlation-id': 'corr123',
      })
      await POST(request)

      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'play',
        100,
        expect.objectContaining({
          custom: 'data',
          userId: 'user123',
          videoId: 'video123',
          courseId: 'course456',
          userAgent: 'Mozilla/5.0 (Test Browser)',
          sessionAge: expect.any(Number),
        })
      )
    })

    test('should handle tracking errors gracefully', async () => {
      trackVideoEvent.mockRejectedValue(new Error('Tracking failed'))

      const request = createMockRequest({
        sessionId: 'session123',
        eventType: 'play',
        position: 100,
      })
      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to track analytics event')
    })
  })

  describe('GET /api/video/analytics', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/video/analytics')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return {
        headers: new Headers(),
        url: url.toString(),
        method: 'GET',
      } as unknown as NextRequest
    }

    const mockVideoAnalytics = {
      totalViews: 150,
      uniqueViewers: 120,
      totalWatchTime: 45000,
      averageWatchTime: 375,
      completionRate: 0.78,
      qualityDistribution: {
        '240p': 10,
        '360p': 25,
        '480p': 35,
        '720p': 25,
        '1080p': 5,
      },
      deviceDistribution: {
        desktop: 60,
        mobile: 30,
        tablet: 10,
      },
      dropOffPoints: [
        { position: 120, dropOffRate: 0.15 },
        { position: 300, dropOffRate: 0.08 },
      ],
      engagement: [
        { position: 0, viewerCount: 150 },
        { position: 60, viewerCount: 140 },
      ],
    }

    const mockCourseAnalytics = {
      courseId: 'course123',
      totalVideos: 12,
      totalViews: 450,
      averageWatchTime: 420,
      completionRate: 0.72,
      studentProgress: {
        completed: 8,
        inProgress: 3,
        notStarted: 1,
      },
    }

    beforeEach(() => {
      getVideoAnalytics.mockResolvedValue(mockVideoAnalytics)
    })

    test('should get video analytics for specific video', async () => {
      const request = createMockRequest({
        videoId: 'video123',
        timeRange: '30',
        metrics: 'views,watch_time,completion_rate',
      })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.analytics).toEqual(mockVideoAnalytics)
      expect(responseData.data.metadata.timeRange).toBe(30)
      expect(responseData.data.metadata.requestedMetrics).toEqual(['views', 'watch_time', 'completion_rate'])

      expect(getVideoAnalytics).toHaveBeenCalledWith('video123', 30)
    })

    test('should get course analytics', async () => {
      // Mock course analytics function
      jest.doMock('@/app/api/video/analytics/route', () => ({
        ...jest.requireActual('@/app/api/video/analytics/route'),
        getCourseAnalytics: jest.fn().mockResolvedValue(mockCourseAnalytics),
      }))

      const request = createMockRequest({
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        timeRange: '7',
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    test('should get user analytics for instructors', async () => {
      const request = createMockRequest({
        timeRange: '14',
        aggregation: 'weekly',
      })
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(response.status).not.toBe(403) // Should allow instructor access
    })

    test('should filter metrics when specified', async () => {
      const request = createMockRequest({
        videoId: 'video123',
        metrics: 'views,completion_rate',
      })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.metadata.requestedMetrics).toEqual(['views', 'completion_rate'])
    })

    test('should use default parameters', async () => {
      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.metadata.timeRange).toBe(7) // Default
      expect(responseData.data.metadata.requestedMetrics).toEqual(['views', 'watch_time', 'completion_rate'])
    })

    test('should include comparison data', async () => {
      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.comparison).toBeDefined()
      expect(responseData.data.comparison.previousPeriod).toBeDefined()
      expect(responseData.data.comparison.changes).toBeDefined()
    })

    test('should include metadata', async () => {
      const request = createMockRequest({
        videoId: 'video123',
        timeRange: '30',
        aggregation: 'weekly',
      })
      const response = await GET(request)
      const responseData = await response.json()

      expect(responseData.data.metadata).toEqual({
        timeRange: 30,
        aggregation: 'weekly',
        requestedMetrics: ['views', 'watch_time', 'completion_rate'],
        includeEvents: false,
        generatedAt: expect.any(String),
        period: {
          start: expect.any(String),
          end: expect.any(String),
        },
      })
    })

    test('should reject unauthenticated requests', async () => {
      authMock.mockReturnValue({ userId: null })

      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should validate query parameters', async () => {
      const request = createMockRequest({
        timeRange: 'invalid',
        aggregation: 'invalid',
        metrics: 'invalid_metric',
      })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid query parameters')
    })

    test('should enforce access control for video analytics', async () => {
      // Mock access verification to fail
      jest.doMock('@/app/api/video/analytics/route', () => ({
        ...jest.requireActual('@/app/api/video/analytics/route'),
        verifyVideoAnalyticsAccess: jest.fn().mockResolvedValue(false),
      }))

      const request = createMockRequest({ videoId: 'restricted-video' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied. You don\'t have permission to view these analytics.')
    })

    test('should handle analytics retrieval errors', async () => {
      getVideoAnalytics.mockRejectedValue(new Error('Analytics retrieval failed'))

      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to retrieve analytics data')
    })

    test('should handle different user roles', async () => {
      // Test admin access
      authMock.mockReturnValueOnce({ userId: 'admin123' })
      getUserMock.mockResolvedValueOnce({
        id: 'admin123',
        emailAddresses: [
          {
            id: 'email_admin',
            emailAddress: 'admin@lazygamedevs.com',
          },
        ],
        primaryEmailAddressId: 'email_admin',
        publicMetadata: { role: 'ADMIN' },
        privateMetadata: {},
        unsafeMetadata: {},
      })

      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    test('should handle student access', async () => {
      authMock.mockReturnValue({ userId: 'student123' })
      getUserMock.mockResolvedValue({
        id: 'student123',
        emailAddresses: [
          {
            id: 'email_student',
            emailAddress: 'student@lazygamedevs.com',
          },
        ],
        primaryEmailAddressId: 'email_student',
        publicMetadata: { role: 'student' },
        privateMetadata: {},
        unsafeMetadata: {},
      })

      const request = createMockRequest({ videoId: 'video123' })
      const response = await GET(request)

      // Should still process request (access control is mocked to allow)
      expect(response.status).not.toBe(500)
    })
  })

  describe('Helper functions and special events', () => {
    test('should handle video completion logic', async () => {
      const mockSession = {
        sessionId: 'session123',
        userId: 'user123',
        videoId: 'video123',
        courseId: 'course456',
        completionPercentage: 95,
      }

      videoStreaming.getSession.mockResolvedValue(mockSession)

      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId: 'session123',
          eventType: 'ended',
          position: 1800,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.videoCompleted).toBe(true)
    })

    test('should not mark incomplete videos as completed', async () => {
      const mockSession = {
        sessionId: 'session123',
        userId: 'user123',
        videoId: 'video123',
        completionPercentage: 70, // <90%
      }

      videoStreaming.getSession.mockResolvedValue(mockSession)

      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId: 'session123',
          eventType: 'ended',
          position: 1800,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(responseData.data.videoCompleted).toBeUndefined()
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle malformed JSON requests', async () => {
      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle session errors', async () => {
      authMock.mockImplementation(() => {
        throw new Error('Session error')
      })

      const request = {
        headers: new Headers(),
        json: jest.fn().mockResolvedValue({ sessionId: 'session123' }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle events without metadata', async () => {
      videoStreaming.getSession.mockResolvedValue({
        sessionId: 'session123',
        userId: 'user123',
        videoId: 'video123',
        startTime: Date.now(),
      })

      const request = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId: 'session123',
          eventType: 'play',
          position: 100,
          // No metadata
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as unknown as NextRequest

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(trackVideoEvent).toHaveBeenCalledWith(
        'session123',
        'play',
        100,
        expect.objectContaining({
          userId: 'user123',
          videoId: 'video123',
        })
      )
    })
  })
})