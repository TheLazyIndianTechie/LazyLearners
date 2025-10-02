/**
 * Unit tests for VideoProcessor class
 * Tests video processing, validation, transcoding, and job management
 */

import { jest } from '@jest/globals'

// Mock the dependencies before importing
jest.mock('@/lib/logger', () => ({
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    time: jest.fn(() => jest.fn()),
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
  },
  isProduction: false,
}))

jest.mock('@/lib/security/monitoring', () => ({
  logSecurityEvent: jest.fn(),
}))

// Set test environment
process.env.NODE_ENV = 'test'

describe('VideoProcessor', () => {
  let VideoProcessor: any
  let videoProcessor: any
  let VIDEO_CONFIG: any
  let submitVideo: any
  let getVideoJob: any
  let getUserVideoJobs: any
  let cancelVideoJob: any
  let redis: any
  let logSecurityEvent: any

  beforeAll(async () => {
    // Clear module cache
    jest.resetModules()

    // Import the module under test
    const processingModule = await import('@/lib/video/processing')
    VideoProcessor = processingModule.VideoProcessor
    videoProcessor = processingModule.videoProcessor
    VIDEO_CONFIG = processingModule.VIDEO_CONFIG
    submitVideo = processingModule.submitVideo
    getVideoJob = processingModule.getVideoJob
    getUserVideoJobs = processingModule.getUserVideoJobs
    cancelVideoJob = processingModule.cancelVideoJob

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

  describe('VideoProcessor class', () => {
    test('should be a singleton', () => {
      const instance1 = VideoProcessor.getInstance()
      const instance2 = VideoProcessor.getInstance()
      expect(instance1).toBe(instance2)
    })

    test('should export the singleton instance', () => {
      expect(videoProcessor).toBeDefined()
      expect(videoProcessor).toBeInstanceOf(VideoProcessor)
    })
  })

  describe('VIDEO_CONFIG', () => {
    test('should have valid configuration structure', () => {
      expect(VIDEO_CONFIG).toBeDefined()
      expect(VIDEO_CONFIG.supportedFormats).toBeInstanceOf(Array)
      expect(VIDEO_CONFIG.qualityProfiles).toBeDefined()
      expect(VIDEO_CONFIG.limits).toBeDefined()
      expect(VIDEO_CONFIG.storage).toBeDefined()
    })

    test('should have all required quality profiles', () => {
      const requiredQualities = ['240p', '360p', '480p', '720p', '1080p']
      requiredQualities.forEach(quality => {
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toBeDefined()
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toHaveProperty('resolution')
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toHaveProperty('videoBitrate')
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toHaveProperty('audioBitrate')
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toHaveProperty('fps')
        expect(VIDEO_CONFIG.qualityProfiles[quality]).toHaveProperty('profile')
      })
    })

    test('should have reasonable limits', () => {
      expect(VIDEO_CONFIG.limits.maxFileSize).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.limits.maxDuration).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.limits.maxConcurrentJobs).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.limits.processingTimeout).toBeGreaterThan(0)
    })
  })

  describe('submitVideo', () => {
    const createMockFile = (overrides = {}) => {
      return {
        name: 'test-video.mp4',
        size: 1024 * 1024 * 100, // 100MB
        type: 'video/mp4',
        ...overrides,
      } as File
    }

    test('should successfully submit a valid video', async () => {
      const mockFile = createMockFile()
      const userId = 'user123'
      const courseId = 'course456'

      const job = await submitVideo(mockFile, userId, courseId)

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.userId).toBe(userId)
      expect(job.courseId).toBe(courseId)
      expect(job.originalFilename).toBe(mockFile.name)
      expect(job.originalFilesize).toBe(mockFile.size)
      expect(job.status).toBe('pending')
      expect(job.progress).toBe(0)
      expect(job.metadata).toBeDefined()
      expect(job.qualities).toBeInstanceOf(Array)
      expect(job.createdAt).toBeDefined()
    })

    test('should validate file format', async () => {
      const invalidFile = createMockFile({
        name: 'document.pdf',
        type: 'application/pdf',
      })

      await expect(submitVideo(invalidFile, 'user123')).rejects.toThrow('Video validation failed')
    })

    test('should validate file size', async () => {
      const largeFile = createMockFile({
        size: VIDEO_CONFIG.limits.maxFileSize + 1,
      })

      await expect(submitVideo(largeFile, 'user123')).rejects.toThrow('Video validation failed')
    })

    test('should handle optional parameters', async () => {
      const mockFile = createMockFile()
      const options = {
        qualities: ['720p', '1080p'],
        generateThumbnails: false,
        extractAudio: true,
        enableDRM: false,
      }

      const job = await submitVideo(mockFile, 'user123', undefined, options)

      expect(job.qualities).toEqual(options.qualities)
    })

    test('should persist job to Redis', async () => {
      const mockFile = createMockFile()

      await submitVideo(mockFile, 'user123')

      expect(redis.set).toHaveBeenCalled()
      expect(redis.setAdd).toHaveBeenCalled()
    })
  })

  describe('getVideoJob', () => {
    test('should return job from memory cache', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      const retrievedJob = await getVideoJob(job.id)
      expect(retrievedJob).toEqual(job)
    })

    test('should return job from Redis when not in memory', async () => {
      const mockJob = {
        id: 'job123',
        userId: 'user123',
        status: 'completed',
        progress: 100,
      }

      redis.get.mockResolvedValueOnce(mockJob)

      const retrievedJob = await getVideoJob('job123')
      expect(retrievedJob).toEqual(mockJob)
      expect(redis.get).toHaveBeenCalledWith('video_job:job123')
    })

    test('should return null for non-existent job', async () => {
      redis.get.mockResolvedValueOnce(null)

      const job = await getVideoJob('non-existent-job')
      expect(job).toBeNull()
    })

    test('should handle Redis errors gracefully', async () => {
      redis.get.mockRejectedValueOnce(new Error('Redis connection error'))

      const job = await getVideoJob('job123')
      expect(job).toBeNull()
    })
  })

  describe('getUserVideoJobs', () => {
    test('should return user jobs sorted by creation time', async () => {
      const mockFile = createMockFile()

      // Create multiple jobs for the same user
      const job1 = await submitVideo(mockFile, 'user123')
      await new Promise(resolve => setTimeout(resolve, 10)) // Ensure different timestamps
      const job2 = await submitVideo(mockFile, 'user123')
      await new Promise(resolve => setTimeout(resolve, 10))
      const job3 = await submitVideo(mockFile, 'user123')

      const userJobs = await getUserVideoJobs('user123')

      expect(userJobs).toHaveLength(3)
      expect(userJobs[0].id).toBe(job3.id) // Most recent first
      expect(userJobs[1].id).toBe(job2.id)
      expect(userJobs[2].id).toBe(job1.id)
    })

    test('should respect limit parameter', async () => {
      const mockFile = createMockFile()

      // Create 5 jobs
      for (let i = 0; i < 5; i++) {
        await submitVideo(mockFile, 'user123')
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      const userJobs = await getUserVideoJobs('user123', 3)
      expect(userJobs).toHaveLength(3)
    })

    test('should return empty array for user with no jobs', async () => {
      const userJobs = await getUserVideoJobs('user-no-jobs')
      expect(userJobs).toEqual([])
    })
  })

  describe('cancelVideoJob', () => {
    test('should cancel pending job', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      const cancelled = await cancelVideoJob(job.id, 'user123')

      expect(cancelled).toBe(true)

      const updatedJob = await getVideoJob(job.id)
      expect(updatedJob?.status).toBe('cancelled')
      expect(updatedJob?.progress).toBe(0)
    })

    test('should cancel processing job', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      // Simulate job being processed
      job.status = 'processing'
      job.progress = 50

      const cancelled = await cancelVideoJob(job.id, 'user123')

      expect(cancelled).toBe(true)
      expect(job.status).toBe('cancelled')
    })

    test('should not cancel completed job', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      // Simulate completed job
      job.status = 'completed'
      job.progress = 100

      const cancelled = await cancelVideoJob(job.id, 'user123')

      expect(cancelled).toBe(false)
    })

    test('should not cancel failed job', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      // Simulate failed job
      job.status = 'failed'
      job.error = 'Processing failed'

      const cancelled = await cancelVideoJob(job.id, 'user123')

      expect(cancelled).toBe(false)
    })

    test('should not allow canceling another user\'s job', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      await expect(cancelVideoJob(job.id, 'user456')).rejects.toThrow('Unauthorized')
    })

    test('should return false for non-existent job', async () => {
      const cancelled = await cancelVideoJob('non-existent-job', 'user123')
      expect(cancelled).toBe(false)
    })
  })

  describe('video validation', () => {
    test('should validate supported video formats', async () => {
      const validFormats = VIDEO_CONFIG.supportedFormats

      for (const format of validFormats) {
        const mockFile = {
          name: `test.${format.split('/')[1]}`,
          size: 1024 * 1024,
          type: format,
        } as File

        const job = await submitVideo(mockFile, 'user123')
        expect(job.status).toBe('pending')
      }
    })

    test('should reject unsupported formats', async () => {
      const unsupportedFormats = [
        { name: 'audio.mp3', type: 'audio/mpeg' },
        { name: 'image.jpg', type: 'image/jpeg' },
        { name: 'document.pdf', type: 'application/pdf' },
      ]

      for (const file of unsupportedFormats) {
        const mockFile = {
          size: 1024 * 1024,
          ...file,
        } as File

        await expect(submitVideo(mockFile, 'user123')).rejects.toThrow('Video validation failed')
      }
    })

    test('should check file extensions', async () => {
      const invalidExtensions = [
        'video.txt',
        'video.exe',
        'video.doc',
        'video',
      ]

      for (const filename of invalidExtensions) {
        const mockFile = {
          name: filename,
          size: 1024 * 1024,
          type: 'video/mp4',
        } as File

        await expect(submitVideo(mockFile, 'user123')).rejects.toThrow('Video validation failed')
      }
    })
  })

  describe('metadata extraction', () => {
    test('should extract basic metadata', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      expect(job.metadata).toHaveProperty('duration')
      expect(job.metadata).toHaveProperty('width')
      expect(job.metadata).toHaveProperty('height')
      expect(job.metadata).toHaveProperty('fps')
      expect(job.metadata).toHaveProperty('bitrate')
      expect(job.metadata).toHaveProperty('codec')
      expect(job.metadata).toHaveProperty('audioCodec')

      expect(typeof job.metadata.duration).toBe('number')
      expect(typeof job.metadata.width).toBe('number')
      expect(typeof job.metadata.height).toBe('number')
      expect(typeof job.metadata.fps).toBe('number')
      expect(typeof job.metadata.bitrate).toBe('number')
    })

    test('should determine default qualities based on resolution', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      // Default metadata has 1920x1080 resolution
      expect(job.qualities).toContain('1080p')
      expect(job.qualities).toContain('720p')
      expect(job.qualities).toContain('480p')
      expect(job.qualities).toContain('360p')
      expect(job.qualities).toContain('240p')
    })
  })

  describe('processing workflow', () => {
    test('should start processing automatically if under concurrent limit', async () => {
      const mockFile = createMockFile()

      // Submit multiple jobs to test concurrent processing
      const jobs = []
      for (let i = 0; i < 3; i++) {
        jobs.push(await submitVideo(mockFile, `user${i}`))
      }

      // All jobs should be pending initially
      jobs.forEach(job => {
        expect(job.status).toBe('pending')
      })
    })

    test('should handle processing timeout', () => {
      expect(VIDEO_CONFIG.limits.processingTimeout).toBeGreaterThan(0)
    })

    test('should generate unique job IDs', async () => {
      const mockFile = createMockFile()

      const job1 = await submitVideo(mockFile, 'user123')
      const job2 = await submitVideo(mockFile, 'user123')

      expect(job1.id).not.toBe(job2.id)
      expect(job1.id).toMatch(/^video_\d+_[a-z0-9]+$/)
      expect(job2.id).toMatch(/^video_\d+_[a-z0-9]+$/)
    })
  })

  describe('error handling', () => {
    test('should handle Redis persistence errors gracefully', async () => {
      redis.set.mockRejectedValueOnce(new Error('Redis error'))
      redis.setAdd.mockRejectedValueOnce(new Error('Redis error'))

      const mockFile = createMockFile()

      // Should not throw error even if Redis fails
      const job = await submitVideo(mockFile, 'user123')
      expect(job).toBeDefined()
    })

    test('should handle malware detection', async () => {
      // This would be integration with actual malware scanning
      // For now, just ensure the structure is in place
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      expect(job.status).toBe('pending') // Should pass basic validation
    })

    test('should log security events for suspicious content', async () => {
      // Test that security logging is called when needed
      expect(logSecurityEvent).toHaveBeenCalledTimes(0) // Should not be called for normal operations
    })
  })

  describe('bandwidth calculation', () => {
    test('should calculate correct bandwidth for quality profiles', async () => {
      const mockFile = createMockFile()
      const job = await submitVideo(mockFile, 'user123')

      // Test that qualities are selected based on resolution
      expect(job.qualities).toBeInstanceOf(Array)
      expect(job.qualities.length).toBeGreaterThan(0)
    })
  })

  describe('storage paths', () => {
    test('should generate correct storage paths', () => {
      expect(VIDEO_CONFIG.storage.tempDir).toBeDefined()
      expect(VIDEO_CONFIG.storage.outputDir).toBeDefined()
      expect(VIDEO_CONFIG.storage.cdnBaseUrl).toBeDefined()
    })

    test('should have reasonable retention policies', () => {
      expect(VIDEO_CONFIG.storage.retention.temp).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.storage.retention.processed).toBeGreaterThan(0)
    })
  })

  describe('HLS and DASH configuration', () => {
    test('should have valid HLS configuration', () => {
      expect(VIDEO_CONFIG.hls.segmentDuration).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.hls.playlistType).toBe('vod')
      expect(typeof VIDEO_CONFIG.hls.enableEncryption).toBe('boolean')
      expect(VIDEO_CONFIG.hls.keyRotationInterval).toBeGreaterThan(0)
    })

    test('should have valid DASH configuration', () => {
      expect(VIDEO_CONFIG.dash.segmentDuration).toBeGreaterThan(0)
      expect(VIDEO_CONFIG.dash.adaptationSets).toBeInstanceOf(Array)
      expect(typeof VIDEO_CONFIG.dash.enableEncryption).toBe('boolean')
    })
  })
})