/**
 * Unit tests for Video Upload API endpoint
 * Tests POST, GET, and DELETE methods for video upload route
 */

import { jest } from '@jest/globals'
import { NextRequest, NextResponse } from 'next/server'

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
}))

jest.mock('@/lib/video/processing', () => ({
  submitVideo: jest.fn(),
  getVideoJob: jest.fn(),
  getUserVideoJobs: jest.fn(),
  cancelVideoJob: jest.fn(),
  VIDEO_CONFIG: {
    limits: {
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    },
  },
}))

jest.mock('@/lib/security/file-validation', () => ({
  validateFileUpload: jest.fn(),
}))

describe('/api/video/upload', () => {
  let POST: any
  let GET: any
  let DELETE: any
  let getServerSession: any
  let submitVideo: any
  let getVideoJob: any
  let getUserVideoJobs: any
  let cancelVideoJob: any
  let validateFileUpload: any

  beforeAll(async () => {
    // Import the route handlers
    const uploadRoute = await import('@/app/api/video/upload/route')
    POST = uploadRoute.POST
    GET = uploadRoute.GET
    DELETE = uploadRoute.DELETE

    // Import mocked functions
    const nextAuth = await import('next-auth/next')
    getServerSession = nextAuth.getServerSession

    const processing = await import('@/lib/video/processing')
    submitVideo = processing.submitVideo
    getVideoJob = processing.getVideoJob
    getUserVideoJobs = processing.getUserVideoJobs
    cancelVideoJob = processing.cancelVideoJob

    const fileValidation = await import('@/lib/security/file-validation')
    validateFileUpload = fileValidation.validateFileUpload
  })

  beforeEach(() => {
    jest.clearAllMocks()

    // Default mock implementations
    validateFileUpload.mockResolvedValue({ isValid: true, errors: [] })
    getServerSession.mockResolvedValue({
      user: {
        id: 'user123',
        email: 'instructor@lazygamedevs.com',
        name: 'Test Instructor',
        role: 'INSTRUCTOR',
      },
    })
  })

  describe('POST /api/video/upload', () => {
    const createMockRequest = (formData: FormData, headers: Record<string, string> = {}) => {
      return {
        headers: new Headers({
          'content-type': 'multipart/form-data',
          ...headers,
        }),
        formData: jest.fn().mockResolvedValue(formData),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as unknown as NextRequest
    }

    const createMockFormData = (videoFile?: File, metadata?: any) => {
      const formData = new FormData()

      if (videoFile) {
        formData.append('video', videoFile)
      }

      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata))
      }

      return formData
    }

    test('should successfully upload valid video', async () => {
      const videoFile = new File(['video content'], 'test-video.mp4', {
        type: 'video/mp4',
      })

      const metadata = {
        title: 'Test Video',
        description: 'Test video description',
        courseId: '550e8400-e29b-41d4-a716-446655440000',
        isPublic: false,
      }

      const mockJob = {
        id: 'job123',
        userId: 'user123',
        status: 'pending',
        progress: 0,
        estimatedDuration: 300000,
        qualities: ['720p', '480p', '360p'],
      }

      submitVideo.mockResolvedValue(mockJob)
      getUserVideoJobs.mockResolvedValue([])

      const formData = createMockFormData(videoFile, metadata)
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(202)
      expect(responseData.success).toBe(true)
      expect(responseData.data.jobId).toBe('job123')
      expect(responseData.data.status).toBe('pending')
      expect(submitVideo).toHaveBeenCalledWith(
        videoFile,
        'user123',
        metadata.courseId,
        expect.objectContaining({
          generateThumbnails: true,
          extractAudio: false,
          enableDRM: true,
        })
      )
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const formData = createMockFormData()
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should reject student uploads', async () => {
      getServerSession.mockResolvedValue({
        user: {
          id: 'student123',
          role: 'student',
        },
      })

      const formData = createMockFormData()
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Video upload requires instructor privileges')
    })

    test('should reject requests without video file', async () => {
      const formData = createMockFormData(undefined, { title: 'Test' })
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('No video file provided')
    })

    test('should validate metadata format', async () => {
      const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('metadata', 'invalid json')

      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid metadata format')
    })

    test('should validate metadata schema', async () => {
      const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const invalidMetadata = {
        title: '', // Invalid: empty title
        courseId: 'invalid-uuid', // Invalid: not a UUID
      }

      const formData = createMockFormData(videoFile, invalidMetadata)
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid upload metadata')
      expect(responseData.error.details).toBeDefined()
    })

    test('should validate file security', async () => {
      const videoFile = new File(['content'], 'malicious.mp4', { type: 'video/mp4' })
      validateFileUpload.mockResolvedValue({
        isValid: false,
        errors: ['File contains suspicious content'],
      })

      const formData = createMockFormData(videoFile, { title: 'Test' })
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Video file validation failed')
      expect(responseData.error.details).toContain('File contains suspicious content')
    })

    test('should enforce file size limits', async () => {
      const largeFile = new File(['x'.repeat(1000)], 'large.mp4', { type: 'video/mp4' })
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 * 1024 }) // 6GB

      const formData = createMockFormData(largeFile, { title: 'Test' })
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(413)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Video file too large')
    })

    test('should enforce concurrent job limits', async () => {
      const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' })

      // Mock user having too many active jobs
      getUserVideoJobs.mockResolvedValue([
        { status: 'pending' },
        { status: 'processing' },
        { status: 'pending' },
      ])

      const formData = createMockFormData(videoFile, { title: 'Test' })
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(429)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Too many active video processing jobs')
      expect(responseData.error.activeJobs).toBe(2)
    })

    test('should handle processing errors', async () => {
      const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      submitVideo.mockRejectedValue(new Error('Processing failed'))
      getUserVideoJobs.mockResolvedValue([])

      const formData = createMockFormData(videoFile, { title: 'Test' })
      const request = createMockRequest(formData)

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to process video upload')
    })

    test('should handle custom quality settings', async () => {
      const videoFile = new File(['content'], 'test.mp4', { type: 'video/mp4' })
      const metadata = {
        title: 'Test Video',
        qualities: ['1080p', '720p'],
        generateThumbnails: false,
        extractAudio: true,
        enableDRM: false,
      }

      const mockJob = { id: 'job123', status: 'pending' }
      submitVideo.mockResolvedValue(mockJob)
      getUserVideoJobs.mockResolvedValue([])

      const formData = createMockFormData(videoFile, metadata)
      const request = createMockRequest(formData)

      await POST(request)

      expect(submitVideo).toHaveBeenCalledWith(
        videoFile,
        'user123',
        undefined,
        {
          qualities: ['1080p', '720p'],
          generateThumbnails: false,
          extractAudio: true,
          enableDRM: false,
        }
      )
    })
  })

  describe('GET /api/video/upload', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/video/upload')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return {
        headers: new Headers(),
        url: url.toString(),
        method: 'GET',
      } as unknown as NextRequest
    }

    test('should get specific job by ID', async () => {
      const mockJob = {
        id: 'job123',
        userId: 'user123',
        status: 'completed',
        progress: 100,
        originalFilename: 'test.mp4',
      }

      getVideoJob.mockResolvedValue(mockJob)

      const request = createMockRequest({ jobId: 'job123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.job.id).toBe('job123')
      expect(responseData.data.job.status).toBe('completed')
    })

    test('should get user jobs list', async () => {
      const mockJobs = [
        { id: 'job1', status: 'completed', createdAt: Date.now() },
        { id: 'job2', status: 'processing', createdAt: Date.now() - 1000 },
      ]

      getUserVideoJobs.mockResolvedValue(mockJobs)

      const request = createMockRequest()
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.jobs).toHaveLength(2)
      expect(responseData.data.total).toBe(2)
    })

    test('should filter jobs by status', async () => {
      const mockJobs = [
        { id: 'job1', status: 'completed' },
        { id: 'job2', status: 'processing' },
      ]

      getUserVideoJobs.mockResolvedValue(mockJobs)

      const request = createMockRequest({ status: 'completed' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.data.jobs).toHaveLength(1)
      expect(responseData.data.jobs[0].status).toBe('completed')
    })

    test('should respect limit parameter', async () => {
      getUserVideoJobs.mockImplementation((userId, limit) => {
        expect(limit).toBe(5)
        return Promise.resolve([])
      })

      const request = createMockRequest({ limit: '5' })
      await GET(request)

      expect(getUserVideoJobs).toHaveBeenCalledWith('user123', 5)
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest()
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should return 404 for non-existent job', async () => {
      getVideoJob.mockResolvedValue(null)

      const request = createMockRequest({ jobId: 'non-existent' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(404)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Video processing job not found')
    })

    test('should prevent access to other user jobs', async () => {
      const otherUserJob = {
        id: 'job123',
        userId: 'other-user',
        status: 'completed',
      }

      getVideoJob.mockResolvedValue(otherUserJob)
      getServerSession.mockResolvedValue({
        user: { id: 'user123', role: 'INSTRUCTOR' },
      })

      const request = createMockRequest({ jobId: 'job123' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Access denied')
    })

    test('should allow admin access to any job', async () => {
      const otherUserJob = {
        id: 'job123',
        userId: 'other-user',
        status: 'completed',
      }

      getVideoJob.mockResolvedValue(otherUserJob)
      getServerSession.mockResolvedValue({
        user: { id: 'admin123', role: 'ADMIN' },
      })

      const request = createMockRequest({ jobId: 'job123' })
      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    test('should validate query parameters', async () => {
      const request = createMockRequest({ limit: 'invalid' })
      const response = await GET(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Invalid query parameters')
    })
  })

  describe('DELETE /api/video/upload', () => {
    const createMockRequest = (searchParams: Record<string, string> = {}) => {
      const url = new URL('http://localhost:3000/api/video/upload')
      Object.entries(searchParams).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })

      return {
        headers: new Headers(),
        url: url.toString(),
        method: 'DELETE',
      } as unknown as NextRequest
    }

    test('should successfully cancel job', async () => {
      cancelVideoJob.mockResolvedValue(true)

      const request = createMockRequest({ jobId: 'job123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(200)
      expect(responseData.success).toBe(true)
      expect(responseData.data.message).toBe('Video processing job cancelled successfully')
      expect(cancelVideoJob).toHaveBeenCalledWith('job123', 'user123')
    })

    test('should reject unauthenticated requests', async () => {
      getServerSession.mockResolvedValue(null)

      const request = createMockRequest({ jobId: 'job123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(401)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Authentication required')
    })

    test('should require job ID', async () => {
      const request = createMockRequest()
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Job ID is required')
    })

    test('should handle cancellation failure', async () => {
      cancelVideoJob.mockResolvedValue(false)

      const request = createMockRequest({ jobId: 'job123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(400)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to cancel job. Job may not exist or already completed.')
    })

    test('should handle unauthorized cancellation', async () => {
      cancelVideoJob.mockRejectedValue(new Error('Unauthorized: Cannot cancel another user\'s job'))

      const request = createMockRequest({ jobId: 'job123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(403)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('You can only cancel your own video processing jobs')
    })

    test('should handle server errors', async () => {
      cancelVideoJob.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({ jobId: 'job123' })
      const response = await DELETE(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
      expect(responseData.error.message).toBe('Failed to cancel video processing job')
    })
  })

  describe('Edge cases and error handling', () => {
    test('should handle malformed requests gracefully', async () => {
      const request = {
        headers: new Headers(),
        formData: jest.fn().mockRejectedValue(new Error('Malformed multipart data')),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })

    test('should handle session errors', async () => {
      getServerSession.mockRejectedValue(new Error('Session error'))

      const formData = new FormData()
      const request = {
        headers: new Headers(),
        formData: jest.fn().mockResolvedValue(formData),
        method: 'POST',
        url: 'http://localhost:3000/api/video/upload',
      } as unknown as NextRequest

      const response = await POST(request)
      const responseData = await response.json()

      expect(response.status).toBe(500)
      expect(responseData.success).toBe(false)
    })
  })
})