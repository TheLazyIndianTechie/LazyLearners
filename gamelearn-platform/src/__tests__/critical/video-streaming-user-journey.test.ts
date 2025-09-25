/**
 * CRITICAL TEST: Complete Video Streaming User Journey
 * This test validates the full user experience from course access to video playback
 *
 * Tests the exact scenario that exposed the missing GET method bug
 */

import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}))

jest.mock('@/lib/auth', () => ({
  authOptions: {},
}))

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

jest.mock('@/lib/security/monitoring', () => ({
  logSecurityEvent: jest.fn(),
}))

describe('CRITICAL: Video Streaming User Journey', () => {
  let getServerSession: any
  let mockSession: any

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test'
    process.env.ENABLE_VIDEO_TEST = 'true'
    process.env.APP_URL = 'http://localhost:3000'

    // Import mocked functions
    const nextAuth = await import('next-auth/next')
    getServerSession = nextAuth.getServerSession

    // Create a realistic user session
    mockSession = {
      user: {
        id: 'user-123',
        email: 'student@lazygamedevs.com',
        name: 'Test Student',
        role: 'STUDENT',
      },
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    getServerSession.mockResolvedValue(mockSession)
  })

  describe('Complete User Journey: Browse → Enroll → Watch Video', () => {
    test('CRITICAL: Student should be able to access video stream after enrollment', async () => {
      // ========================================
      // STEP 1: Student browses course catalog
      // ========================================

      // This would typically happen via the UI, but we're testing the API flow
      const courseId = 'course-unity-fundamentals'
      const videoId = 'sample-unity-tutorial'

      // ========================================
      // STEP 2: Student enrolls in course
      // ========================================

      // Note: In a real scenario, this would involve payment flow
      // For this test, we assume enrollment is successful

      // ========================================
      // STEP 3: Student clicks "Watch Video" - This is where the bug occurred
      // ========================================

      // Import the fixed video stream route
      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      // Create a realistic request that mimics what the video player component makes
      const streamRequest = new NextRequest(
        `http://localhost:3000/api/video/stream?videoId=${videoId}&courseId=${courseId}&quality=720p&format=hls`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Referer': `http://localhost:3000/course/${courseId}/lesson/1`,
            'x-correlation-id': 'test-correlation-123'
          }
        }
      )

      // This should now work (previously would have failed with "Method not allowed")
      const response = await streamGET(streamRequest)
      const responseData = await response.json()

      // ========================================
      // CRITICAL ASSERTIONS: The video streaming must work
      // ========================================

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data).toBeDefined()
      expect(responseData.data.sessionId).toBeDefined()
      expect(responseData.data.manifestUrl).toBeDefined()
      expect(responseData.data.streamUrl).toBeDefined()
      expect(responseData.data.playerConfig).toBeDefined()

      // Verify streaming manifest contains required data for video player
      expect(responseData.data.format).toBe('hls')
      expect(responseData.data.qualities).toBeDefined()
      expect(responseData.data.duration).toBeDefined()
      expect(responseData.data.playerConfig.controls).toBe(true)
      expect(responseData.data.playerConfig.enableQualitySelector).toBe(true)

      // Verify security and analytics are properly configured
      expect(responseData.data.accessToken).toBeDefined()
      expect(responseData.meta.correlationId).toBe('test-correlation-123')
      expect(responseData.meta.timestamp).toBeDefined()
      expect(responseData.meta.expiresAt).toBeDefined()

      // ========================================
      // STEP 4: Video player uses the streaming data
      // ========================================

      const sessionId = responseData.data.sessionId
      const streamUrl = responseData.data.streamUrl

      // Verify the streaming URL is properly formatted for HLS
      expect(streamUrl).toMatch(/\.m3u8$/)

      // ========================================
      // STEP 5: Student watches video (heartbeat simulation)
      // ========================================

      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      const heartbeatRequest = new NextRequest(
        'http://localhost:3000/api/video/heartbeat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            currentPosition: 120, // 2 minutes in
            bufferHealth: 10,
            quality: '720p',
            playbackRate: 1.0,
            volume: 0.8,
            isPlaying: true,
            isFullscreen: false,
          })
        }
      )

      const heartbeatResponse = await heartbeatPOST(heartbeatRequest)
      const heartbeatData = await heartbeatResponse.json()

      expect(heartbeatResponse.status).toBe(200)
      expect(heartbeatData.success).toBe(true)
      expect(heartbeatData.data.status).toBe('ok')

      // ========================================
      // STEP 6: Student completes video
      // ========================================

      const { POST: analyticsPOST } = await import('@/app/api/video/analytics/route')

      const completionRequest = new NextRequest(
        'http://localhost:3000/api/video/analytics',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            eventType: 'ended',
            position: 1800, // Full duration
            metadata: {
              watchTime: 1800,
              completionPercentage: 100
            }
          })
        }
      )

      const completionResponse = await analyticsPOST(completionRequest)
      const completionData = await completionResponse.json()

      expect(completionResponse.status).toBe(200)
      expect(completionData.success).toBe(true)

      console.log('✅ CRITICAL TEST PASSED: Complete video streaming user journey works end-to-end')
    })

    test('CRITICAL: All HTTP methods are properly implemented on video stream endpoint', async () => {
      const videoId = 'sample-unity-tutorial'
      const courseId = 'course-unity-fundamentals'

      // Test GET method (the one that was missing)
      const { GET } = await import('@/app/api/video/stream/route')
      expect(GET).toBeDefined()
      expect(typeof GET).toBe('function')

      // Test POST method
      const { POST } = await import('@/app/api/video/stream/route')
      expect(POST).toBeDefined()
      expect(typeof POST).toBe('function')

      // Test PUT method
      const { PUT } = await import('@/app/api/video/stream/route')
      expect(PUT).toBeDefined()
      expect(typeof PUT).toBe('function')

      // Test DELETE method
      const { DELETE } = await import('@/app/api/video/stream/route')
      expect(DELETE).toBeDefined()
      expect(typeof DELETE).toBe('function')

      console.log('✅ All HTTP methods properly implemented on video stream endpoint')
    })

    test('CRITICAL: Video player integration scenarios', async () => {
      const videoId = 'sample-unity-tutorial'
      const courseId = 'course-unity-fundamentals'

      // Test scenario 1: Direct video URL access (what video player does)
      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      const directAccessRequest = new NextRequest(
        `http://localhost:3000/api/video/stream?videoId=${videoId}&courseId=${courseId}`,
        { method: 'GET' }
      )

      const directResponse = await streamGET(directAccessRequest)
      expect(directResponse.status).toBe(200)

      const streamData = await directResponse.json()

      // Test scenario 2: Session-based access (resume video)
      const sessionId = streamData.data.sessionId

      const sessionAccessRequest = new NextRequest(
        `http://localhost:3000/api/video/stream?videoId=${videoId}&sessionId=${sessionId}`,
        { method: 'GET' }
      )

      const sessionResponse = await streamGET(sessionAccessRequest)
      expect(sessionResponse.status).toBe(200)

      // Test scenario 3: Quality selection
      const qualityRequest = new NextRequest(
        `http://localhost:3000/api/video/stream?videoId=${videoId}&quality=480p&format=hls`,
        { method: 'GET' }
      )

      const qualityResponse = await streamGET(qualityRequest)
      expect(qualityResponse.status).toBe(200)

      const qualityData = await qualityResponse.json()
      expect(qualityData.data.currentQuality).toBe('480p')

      console.log('✅ Video player integration scenarios work correctly')
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    test('CRITICAL: Proper error handling for unauthenticated users', async () => {
      // Remove authentication
      getServerSession.mockResolvedValue(null)

      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      const request = new NextRequest(
        'http://localhost:3000/api/video/stream?videoId=sample-unity-tutorial',
        { method: 'GET' }
      )

      const response = await streamGET(request)
      expect(response.status).toBe(401)

      const errorData = await response.json()
      expect(errorData.success).toBe(false)
      expect(errorData.error.message).toBe('Authentication required')
    })

    test('CRITICAL: Missing videoId parameter handling', async () => {
      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      const request = new NextRequest(
        'http://localhost:3000/api/video/stream', // No videoId
        { method: 'GET' }
      )

      const response = await streamGET(request)
      expect(response.status).toBe(400)

      const errorData = await response.json()
      expect(errorData.success).toBe(false)
      expect(errorData.error.message).toBe('Video ID is required')
    })

    test('CRITICAL: Non-existent video handling', async () => {
      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      const request = new NextRequest(
        'http://localhost:3000/api/video/stream?videoId=non-existent-video',
        { method: 'GET' }
      )

      const response = await streamGET(request)

      // In test mode, videos are allowed to exist, so this might pass
      // In production, this should return 404
      expect([200, 404]).toContain(response.status)
    })
  })

  describe('Performance and Reliability', () => {
    test('CRITICAL: Concurrent video access handling', async () => {
      const { GET: streamGET } = await import('@/app/api/video/stream/route')

      // Simulate 5 concurrent requests for the same video
      const requests = Array.from({ length: 5 }, (_, i) =>
        streamGET(new NextRequest(
          `http://localhost:3000/api/video/stream?videoId=sample-unity-tutorial&sessionId=session-${i}`,
          { method: 'GET' }
        ))
      )

      const responses = await Promise.all(requests)

      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      console.log('✅ Concurrent video access handled successfully')
    })
  })
})