/**
 * Integration tests for video streaming workflow
 * Tests end-to-end video streaming from upload to playback
 */

import { jest } from '@jest/globals'

// Mock external dependencies
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

jest.mock('@/lib/security/monitoring', () => ({
  logSecurityEvent: jest.fn(),
}))

jest.mock('@/lib/security/file-validation', () => ({
  validateFileUpload: jest.fn().mockResolvedValue({ isValid: true, errors: [] }),
}))

describe('Video Streaming Workflow Integration', () => {
  let authMock: jest.Mock
  let getUserMock: jest.Mock
  let defaultUser: {
    id: string
    email: string
    role: string
  }

  beforeAll(async () => {
    // Set up test environment
    process.env.NODE_ENV = 'test'
    process.env.CDN_URL = 'https://test-cdn.lazygamedevs.com'
    process.env.APP_URL = 'http://localhost:3000'

    // Import mocked functions
    const clerkServer = await import('@clerk/nextjs/server')
    authMock = clerkServer.auth as jest.Mock
    getUserMock = clerkServer.clerkClient.users.getUser as jest.Mock

    // Default session setup
    defaultUser = {
      id: 'instructor123',
      email: 'instructor@lazygamedevs.com',
      role: 'INSTRUCTOR',
    }
  })

  beforeEach(() => {
    jest.clearAllMocks()
    authMock.mockReturnValue({ userId: defaultUser.id })
    getUserMock.mockResolvedValue({
      id: defaultUser.id,
      emailAddresses: [
        {
          id: 'email_default',
          emailAddress: defaultUser.email,
        },
      ],
      primaryEmailAddressId: 'email_default',
      publicMetadata: { role: defaultUser.role },
      privateMetadata: {},
      unsafeMetadata: {},
    })
  })

  describe('Complete Video Upload and Streaming Workflow', () => {
    test('should handle complete video workflow from upload to streaming', async () => {
      // Step 1: Upload video
      const { POST: uploadPOST } = await import('@/app/api/video/upload/route')

      const mockVideoFile = new File(['video content'], 'test-video.mp4', {
        type: 'video/mp4',
      })

      const uploadFormData = new FormData()
      uploadFormData.append('video', mockVideoFile)
      uploadFormData.append('metadata', JSON.stringify({
        title: 'Integration Test Video',
        description: 'Test video for integration testing',
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        isPublic: false,
      }))

      const uploadRequest = {
        headers: new Headers({ 'content-type': 'multipart/form-data' }),
        formData: jest.fn().mockResolvedValue(uploadFormData),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as any

      const uploadResponse = await uploadPOST(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(202)
      expect(uploadData.success).toBe(true)
      expect(uploadData.data.jobId).toBeDefined()

      const jobId = uploadData.data.jobId

      // Step 2: Check job status
      const { GET: uploadGET } = await import('@/app/api/video/upload/route')

      const statusRequest = {
        headers: new Headers(),
        url: `http://localhost:3000/api/video/upload?jobId=${jobId}`,
        method: 'GET',
      } as any

      const statusResponse = await uploadGET(statusRequest)
      const statusData = await statusResponse.json()

      expect(statusResponse.status).toBe(200)
      expect(statusData.success).toBe(true)
      expect(statusData.data.job.id).toBe(jobId)

      // Step 3: Simulate job completion by getting video manifest
      const videoId = 'video123' // In real scenario, this would come from completed job

      // Step 4: Create streaming session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId,
          courseId: '550e8400-e29b-41d4-a716-446655440000',
          deviceInfo: {
            userAgent: 'Mozilla/5.0 (Test Browser)',
            platform: 'Test Platform',
            screenResolution: '1920x1080',
          },
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()

      expect(streamResponse.status).toBe(201)
      expect(streamData.success).toBe(true)
      expect(streamData.data.sessionId).toBeDefined()

      const sessionId = streamData.data.sessionId

      // Step 5: Send heartbeat
      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      const heartbeatRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          currentPosition: 300,
          bufferHealth: 15,
          quality: '720p',
          playbackRate: 1.0,
          volume: 0.8,
          isPlaying: true,
          isFullscreen: false,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as any

      const heartbeatResponse = await heartbeatPOST(heartbeatRequest)
      const heartbeatData = await heartbeatResponse.json()

      expect(heartbeatResponse.status).toBe(200)
      expect(heartbeatData.success).toBe(true)
      expect(heartbeatData.data.status).toBe('ok')

      // Step 6: Track analytics events
      const { POST: analyticsPOST } = await import('@/app/api/video/analytics/route')

      const analyticsRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          eventType: 'play',
          position: 300,
          metadata: { quality: '720p' },
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as any

      const analyticsResponse = await analyticsPOST(analyticsRequest)
      const analyticsData = await analyticsResponse.json()

      expect(analyticsResponse.status).toBe(200)
      expect(analyticsData.success).toBe(true)

      // Step 7: End streaming session
      const { DELETE: streamDELETE } = await import('@/app/api/video/stream/route')

      const endSessionRequest = {
        headers: new Headers(),
        url: `http://localhost:3000/api/video/stream?sessionId=${sessionId}`,
        method: 'DELETE',
      } as any

      const endSessionResponse = await streamDELETE(endSessionRequest)
      const endSessionData = await endSessionResponse.json()

      expect(endSessionResponse.status).toBe(200)
      expect(endSessionData.success).toBe(true)
    })

    test('should handle video processing errors in workflow', async () => {
      // Test error scenarios in the workflow
      const { POST: uploadPOST } = await import('@/app/api/video/upload/route')

      // Upload with invalid file
      const invalidFile = new File(['invalid content'], 'document.pdf', {
        type: 'application/pdf',
      })

      const uploadFormData = new FormData()
      uploadFormData.append('video', invalidFile)
      uploadFormData.append('metadata', JSON.stringify({
        title: 'Invalid File Test',
      }))

      const uploadRequest = {
        headers: new Headers({ 'content-type': 'multipart/form-data' }),
        formData: jest.fn().mockResolvedValue(uploadFormData),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as any

      const uploadResponse = await uploadPOST(uploadRequest)
      const uploadData = await uploadResponse.json()

      expect(uploadResponse.status).toBe(400)
      expect(uploadData.success).toBe(false)
      expect(uploadData.error.message).toBe('Invalid upload metadata')
    })

    test('should handle session limits and concurrent access', async () => {
      // Create multiple sessions to test limits
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const sessions = []
      const videoId = 'test-video-123'

      // Create multiple sessions
      for (let i = 0; i < 4; i++) {
        const streamRequest = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({
            videoId,
            deviceInfo: {
              userAgent: `Test Browser ${i}`,
              platform: 'Test Platform',
            },
          }),
          method: 'POST',
          url: 'http://localhost:3000/api/video/stream',
        } as any

        const streamResponse = await streamPOST(streamRequest)
        const streamData = await streamResponse.json()

        if (streamResponse.status === 201) {
          sessions.push(streamData.data.sessionId)
        }

        expect(streamResponse.status).toBe(201)
      }

      // All sessions should be created successfully (session limits handled internally)
      expect(sessions.length).toBeGreaterThan(0)
    })

    test('should handle quality adaptation workflow', async () => {
      // Create session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Send heartbeat with low buffer health
      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      const lowBufferHeartbeat = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          currentPosition: 300,
          bufferHealth: 3, // Low buffer
          quality: '720p',
          isPlaying: true,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as any

      const heartbeatResponse = await heartbeatPOST(lowBufferHeartbeat)
      const heartbeatData = await heartbeatResponse.json()

      expect(heartbeatResponse.status).toBe(200)
      expect(heartbeatData.data.recommendations.quality).toBe('480p') // Should recommend lower quality

      // Track quality change
      const { POST: analyticsPOST } = await import('@/app/api/video/analytics/route')

      const qualityChangeRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          eventType: 'quality_change',
          position: 300,
          metadata: {
            from: '720p',
            to: '480p',
            reason: 'adaptive',
          },
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as any

      const analyticsResponse = await analyticsPOST(qualityChangeRequest)
      expect(analyticsResponse.status).toBe(200)
    })

    test('should handle video completion workflow', async () => {
      // Create session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
          courseId: '550e8400-e29b-41d4-a716-446655440000',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Track video ended event
      const { POST: analyticsPOST } = await import('@/app/api/video/analytics/route')

      const endedRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          eventType: 'ended',
          position: 1800, // Full duration
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/analytics',
      } as any

      const analyticsResponse = await analyticsPOST(endedRequest)
      const analyticsData = await analyticsResponse.json()

      expect(analyticsResponse.status).toBe(200)
      expect(analyticsData.data.videoCompleted).toBe(true)
    })
  })

  describe('Error Recovery and Resilience', () => {
    test('should handle Redis connection failures gracefully', async () => {
      // Mock Redis to fail
      jest.doMock('@/lib/redis', () => ({
        redis: {
          set: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
          get: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
          del: jest.fn().mockRejectedValue(new Error('Redis connection failed')),
        },
      }))

      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      // Should still work despite Redis failures
      const streamResponse = await streamPOST(streamRequest)
      expect(streamResponse.status).toBe(201)
    })

    test('should handle session timeout scenarios', async () => {
      // Create session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Mock expired session for heartbeat
      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      // Mock processVideoHeartbeat to return expired status
      jest.doMock('@/lib/video/streaming', () => ({
        videoStreaming: {
          getSession: jest.fn().mockResolvedValue({
            sessionId,
            userId: 'instructor123',
            startTime: Date.now() - 2000000, // Very old session
          }),
        },
        processVideoHeartbeat: jest.fn().mockResolvedValue({ status: 'expired' }),
        trackVideoEvent: jest.fn(),
      }))

      const heartbeatRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          currentPosition: 300,
          bufferHealth: 15,
          quality: '720p',
          isPlaying: true,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as any

      const heartbeatResponse = await heartbeatPOST(heartbeatRequest)
      const heartbeatData = await heartbeatResponse.json()

      expect(heartbeatData.data.status).toBe('expired')
    })
  })

  describe('Security and Access Control', () => {
    test('should enforce authentication across all endpoints', async () => {
      // Set no session
      authMock.mockReturnValue({ userId: null })

      const endpoints = [
        { module: '@/app/api/video/upload/route', method: 'POST' },
        { module: '@/app/api/video/stream/route', method: 'POST' },
        { module: '@/app/api/video/heartbeat/route', method: 'POST' },
        { module: '@/app/api/video/analytics/route', method: 'POST' },
      ]

      for (const endpoint of endpoints) {
        const { [endpoint.method]: handler } = await import(endpoint.module)

        const request = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({}),
          formData: jest.fn().mockResolvedValue(new FormData()),
          method: endpoint.method,
          url: 'http://localhost:3000',
        } as any

        const response = await handler(request)
        expect(response.status).toBe(401)
      }
    })

    test('should enforce role-based access for video upload', async () => {
      // Set student session
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

      const { POST: uploadPOST } = await import('@/app/api/video/upload/route')

      const uploadRequest = {
        headers: new Headers({ 'content-type': 'multipart/form-data' }),
        formData: jest.fn().mockResolvedValue(new FormData()),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as any

      const uploadResponse = await uploadPOST(uploadRequest)
      expect(uploadResponse.status).toBe(403)
    })

    test('should prevent access to other users sessions', async () => {
      // Create session as user1
      authMock.mockReturnValue({ userId: 'user1' })
      getUserMock.mockResolvedValue({
        id: 'user1',
        emailAddresses: [
          {
            id: 'email_user1',
            emailAddress: 'user1@lazygamedevs.com',
          },
        ],
        primaryEmailAddressId: 'email_user1',
        publicMetadata: { role: 'INSTRUCTOR' },
        privateMetadata: {},
        unsafeMetadata: {},
      })

      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Switch to user2
      authMock.mockReturnValue({ userId: 'user2' })
      getUserMock.mockResolvedValue({
        id: 'user2',
        emailAddresses: [
          {
            id: 'email_user2',
            emailAddress: 'user2@lazygamedevs.com',
          },
        ],
        primaryEmailAddressId: 'email_user2',
        publicMetadata: { role: 'INSTRUCTOR' },
        privateMetadata: {},
        unsafeMetadata: {},
      })

      // Try to access user1's session
      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      const heartbeatRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          sessionId,
          currentPosition: 300,
          bufferHealth: 15,
          quality: '720p',
          isPlaying: true,
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/heartbeat',
      } as any

      const heartbeatResponse = await heartbeatPOST(heartbeatRequest)
      expect(heartbeatResponse.status).toBe(403)
    })
  })

  describe('Performance and Scalability', () => {
    test('should handle multiple concurrent uploads', async () => {
      const { POST: uploadPOST } = await import('@/app/api/video/upload/route')

      const uploadPromises = []

      for (let i = 0; i < 5; i++) {
        const mockVideoFile = new File(['video content'], `test-video-${i}.mp4`, {
          type: 'video/mp4',
        })

        const uploadFormData = new FormData()
        uploadFormData.append('video', mockVideoFile)
        uploadFormData.append('metadata', JSON.stringify({
          title: `Concurrent Test Video ${i}`,
        }))

        const uploadRequest = {
          headers: new Headers({ 'content-type': 'multipart/form-data' }),
          formData: jest.fn().mockResolvedValue(uploadFormData),
          method: 'POST',
          url: 'http://localhost:3000/api/video/upload',
        } as any

        uploadPromises.push(uploadPOST(uploadRequest))
      }

      const responses = await Promise.all(uploadPromises)

      // All uploads should succeed
      responses.forEach(response => {
        expect([202, 429]).toContain(response.status) // 202 success or 429 rate limited
      })
    })

    test('should handle high-frequency heartbeats', async () => {
      // Create session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Send multiple rapid heartbeats
      const { POST: heartbeatPOST } = await import('@/app/api/video/heartbeat/route')

      const heartbeatPromises = []

      for (let i = 0; i < 10; i++) {
        const heartbeatRequest = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({
            sessionId,
            currentPosition: 300 + i,
            bufferHealth: 15,
            quality: '720p',
            isPlaying: true,
          }),
          method: 'POST',
          url: 'http://localhost:3000/api/video/heartbeat',
        } as any

        heartbeatPromises.push(heartbeatPOST(heartbeatRequest))
      }

      const responses = await Promise.all(heartbeatPromises)

      // All heartbeats should be processed successfully
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })
    })
  })

  describe('Data Consistency', () => {
    test('should maintain session state consistency across operations', async () => {
      // Create session
      const { POST: streamPOST } = await import('@/app/api/video/stream/route')

      const streamRequest = {
        headers: new Headers({ 'content-type': 'application/json' }),
        json: jest.fn().mockResolvedValue({
          videoId: 'test-video-123',
        }),
        method: 'POST',
        url: 'http://localhost:3000/api/video/stream',
      } as any

      const streamResponse = await streamPOST(streamRequest)
      const streamData = await streamResponse.json()
      const sessionId = streamData.data.sessionId

      // Update session multiple times
      const { PUT: streamPUT } = await import('@/app/api/video/stream/route')

      for (let i = 0; i < 5; i++) {
        const updateRequest = {
          headers: new Headers({ 'content-type': 'application/json' }),
          json: jest.fn().mockResolvedValue({
            sessionId,
            currentPosition: i * 100,
            quality: i % 2 === 0 ? '720p' : '1080p',
          }),
          method: 'PUT',
          url: 'http://localhost:3000/api/video/stream',
        } as any

        const updateResponse = await streamPUT(updateRequest)
        expect(updateResponse.status).toBe(200)
      }

      // Session should still be valid
      const { GET: heartbeatGET } = await import('@/app/api/video/heartbeat/route')

      const statusRequest = {
        headers: new Headers(),
        url: `http://localhost:3000/api/video/heartbeat?sessionId=${sessionId}`,
        method: 'GET',
      } as any

      const statusResponse = await heartbeatGET(statusRequest)
      expect(statusResponse.status).toBe(200)
    })
  })
})