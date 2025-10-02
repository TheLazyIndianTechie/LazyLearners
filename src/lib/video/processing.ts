import { createHash } from 'crypto'
import { createRequestLogger } from '@/lib/logger'
import { redis } from '@/lib/redis'
import { env, isProduction } from '@/lib/config/env'
import { logSecurityEvent } from '@/lib/security/monitoring'

// Video processing configuration
export const VIDEO_CONFIG = {
  // Supported input formats
  supportedFormats: [
    'video/mp4',
    'video/webm',
    'video/mov',
    'video/avi',
    'video/mkv',
    'video/wmv'
  ],

  // Output quality profiles for adaptive streaming
  qualityProfiles: {
    '240p': {
      resolution: '426x240',
      videoBitrate: '400k',
      audioBitrate: '64k',
      fps: 24,
      profile: 'baseline'
    },
    '360p': {
      resolution: '640x360',
      videoBitrate: '800k',
      audioBitrate: '96k',
      fps: 30,
      profile: 'main'
    },
    '480p': {
      resolution: '854x480',
      videoBitrate: '1200k',
      audioBitrate: '128k',
      fps: 30,
      profile: 'main'
    },
    '720p': {
      resolution: '1280x720',
      videoBitrate: '2500k',
      audioBitrate: '192k',
      fps: 30,
      profile: 'high'
    },
    '1080p': {
      resolution: '1920x1080',
      videoBitrate: '5000k',
      audioBitrate: '256k',
      fps: 30,
      profile: 'high'
    }
  },

  // HLS (HTTP Live Streaming) configuration
  hls: {
    segmentDuration: 6, // seconds
    playlistType: 'vod', // Video on Demand
    enableEncryption: true,
    keyRotationInterval: 300 // 5 minutes
  },

  // DASH (Dynamic Adaptive Streaming) configuration
  dash: {
    segmentDuration: 4, // seconds
    adaptationSets: ['video', 'audio'],
    enableEncryption: true
  },

  // Processing limits
  limits: {
    maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
    maxDuration: 4 * 60 * 60, // 4 hours
    maxConcurrentJobs: 5,
    processingTimeout: 60 * 60 * 1000 // 1 hour
  },

  // Storage configuration
  storage: {
    tempDir: '/tmp/video-processing',
    outputDir: '/var/www/video-streams',
    cdnBaseUrl: env.CDN_URL || 'https://cdn.lazygamedevs.com',
    retention: {
      temp: 24 * 60 * 60, // 24 hours
      processed: 365 * 24 * 60 * 60 // 1 year
    }
  }
} as const

// Video processing job status
export type VideoProcessingStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'

// Video processing job interface
export interface VideoProcessingJob {
  id: string
  userId: string
  courseId?: string
  originalFilename: string
  originalFilesize: number
  inputPath: string
  outputPath?: string
  status: VideoProcessingStatus
  progress: number
  error?: string
  metadata: VideoMetadata
  qualities: string[]
  createdAt: number
  startedAt?: number
  completedAt?: number
  estimatedDuration?: number
}

// Video metadata interface
export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  audioCodec: string
  thumbnail?: string
  chapters?: VideoChapter[]
  subtitles?: VideoSubtitle[]
}

export interface VideoChapter {
  id: string
  title: string
  startTime: number
  endTime: number
  thumbnail?: string
}

export interface VideoSubtitle {
  language: string
  label: string
  url: string
  default?: boolean
}

// Adaptive streaming manifest
export interface StreamingManifest {
  videoId: string
  format: 'hls' | 'dash'
  baseUrl: string
  manifest: string
  qualities: Array<{
    quality: string
    bandwidth: number
    url: string
  }>
  thumbnails: Array<{
    time: number
    url: string
  }>
  duration: number
  encrypted: boolean
}

export class VideoProcessor {
  private static instance: VideoProcessor
  private logger = createRequestLogger({ headers: new Headers() } as any)
  private processingJobs = new Map<string, VideoProcessingJob>()
  private activeJobs = new Set<string>()

  private constructor() {}

  static getInstance(): VideoProcessor {
    if (!VideoProcessor.instance) {
      VideoProcessor.instance = new VideoProcessor()
    }
    return VideoProcessor.instance
  }

  // Submit video for processing
  async submitVideo(
    file: File,
    userId: string,
    courseId?: string,
    options: {
      qualities?: string[]
      generateThumbnails?: boolean
      extractAudio?: boolean
      enableDRM?: boolean
    } = {}
  ): Promise<VideoProcessingJob> {
    const jobId = this.generateJobId()
    const inputPath = await this.saveInputFile(file, jobId)

    // Validate video file
    const validation = await this.validateVideoFile(file, inputPath)
    if (!validation.isValid) {
      throw new Error(`Video validation failed: ${validation.errors.join(', ')}`)
    }

    // Extract basic metadata
    const metadata = await this.extractMetadata(inputPath)

    // Create processing job
    const job: VideoProcessingJob = {
      id: jobId,
      userId,
      courseId,
      originalFilename: file.name,
      originalFilesize: file.size,
      inputPath,
      status: 'pending',
      progress: 0,
      metadata,
      qualities: options.qualities || this.getDefaultQualities(metadata),
      createdAt: Date.now()
    }

    // Store job
    this.processingJobs.set(jobId, job)
    await this.persistJob(job)

    // Log video upload
    this.logger.info('Video processing job created', {
      jobId,
      userId,
      courseId,
      filename: file.name,
      filesize: file.size,
      duration: metadata.duration,
      qualities: job.qualities
    })

    // Start processing if under concurrent limit
    if (this.activeJobs.size < VIDEO_CONFIG.limits.maxConcurrentJobs) {
      this.processVideoAsync(jobId)
    }

    return job
  }

  // Get processing job status
  async getJob(jobId: string): Promise<VideoProcessingJob | null> {
    let job = this.processingJobs.get(jobId)

    if (!job) {
      // Try to load from Redis
      job = await this.loadJob(jobId)
      if (job) {
        this.processingJobs.set(jobId, job)
      }
    }

    return job || null
  }

  // Get user's processing jobs
  async getUserJobs(userId: string, limit = 50): Promise<VideoProcessingJob[]> {
    const jobs = Array.from(this.processingJobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit)

    return jobs
  }

  // Cancel processing job
  async cancelJob(jobId: string, userId: string): Promise<boolean> {
    const job = await this.getJob(jobId)

    if (!job) {
      return false
    }

    if (job.userId !== userId) {
      throw new Error('Unauthorized: Cannot cancel another user\'s job')
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return false
    }

    // Update job status
    job.status = 'cancelled'
    job.progress = 0
    this.processingJobs.set(jobId, job)
    await this.persistJob(job)

    // Remove from active jobs
    this.activeJobs.delete(jobId)

    // Cleanup files
    await this.cleanupJobFiles(jobId)

    this.logger.info('Video processing job cancelled', { jobId, userId })
    return true
  }

  // Process video asynchronously
  private async processVideoAsync(jobId: string): Promise<void> {
    try {
      const job = await this.getJob(jobId)
      if (!job || job.status !== 'pending') {
        return
      }

      this.activeJobs.add(jobId)

      // Update job status
      job.status = 'processing'
      job.startedAt = Date.now()
      job.estimatedDuration = this.estimateProcessingTime(job)
      await this.updateJob(job)

      this.logger.info('Starting video processing', {
        jobId,
        qualities: job.qualities,
        estimatedDuration: job.estimatedDuration
      })

      // Process each quality profile
      const outputPaths: string[] = []
      const totalSteps = job.qualities.length + 2 // +2 for thumbnails and manifest

      for (let i = 0; i < job.qualities.length; i++) {
        const quality = job.qualities[i]

        try {
          const outputPath = await this.processQuality(job, quality)
          outputPaths.push(outputPath)

          // Update progress
          job.progress = Math.round(((i + 1) / totalSteps) * 100)
          await this.updateJob(job)

          this.logger.debug('Quality processed successfully', {
            jobId,
            quality,
            outputPath,
            progress: job.progress
          })
        } catch (error) {
          this.logger.error('Quality processing failed', error as Error, {
            jobId,
            quality
          })
          throw error
        }
      }

      // Generate thumbnails
      const thumbnails = await this.generateThumbnails(job)
      job.progress = Math.round(((job.qualities.length + 1) / totalSteps) * 100)
      await this.updateJob(job)

      // Create streaming manifests
      const manifests = await this.createStreamingManifests(job, outputPaths, thumbnails)
      job.progress = 100
      job.outputPath = manifests.hls.baseUrl
      await this.updateJob(job)

      // Mark job as completed
      job.status = 'completed'
      job.completedAt = Date.now()
      await this.updateJob(job)

      // Cleanup temporary files
      await this.cleanupTempFiles(jobId)

      // Log completion
      const processingTime = Date.now() - (job.startedAt || job.createdAt)
      this.logger.info('Video processing completed', {
        jobId,
        processingTime,
        outputQualities: job.qualities,
        outputPath: job.outputPath
      })

    } catch (error) {
      const job = await this.getJob(jobId)
      if (job) {
        job.status = 'failed'
        job.error = error instanceof Error ? error.message : 'Unknown error'
        job.completedAt = Date.now()
        await this.updateJob(job)
      }

      this.logger.error('Video processing failed', error as Error, { jobId })

      // Log security event for suspicious failures
      if (error instanceof Error && error.message.includes('malicious')) {
        await logSecurityEvent(
          'malware_detected',
          'high',
          {
            context: 'video_processing',
            jobId,
            error: error.message
          },
          job?.userId
        )
      }

      // Cleanup files
      await this.cleanupJobFiles(jobId)
    } finally {
      this.activeJobs.delete(jobId)

      // Start next pending job if any
      const nextJob = Array.from(this.processingJobs.values())
        .find(j => j.status === 'pending')

      if (nextJob && this.activeJobs.size < VIDEO_CONFIG.limits.maxConcurrentJobs) {
        this.processVideoAsync(nextJob.id)
      }
    }
  }

  // Video file validation
  private async validateVideoFile(file: File, inputPath: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    // Check file size
    if (file.size > VIDEO_CONFIG.limits.maxFileSize) {
      errors.push(`File size exceeds maximum allowed (${VIDEO_CONFIG.limits.maxFileSize / (1024 * 1024 * 1024)}GB)`)
    }

    // Check MIME type
    if (!VIDEO_CONFIG.supportedFormats.includes(file.type)) {
      errors.push(`Unsupported video format: ${file.type}`)
    }

    // Check file extension
    const extension = file.name.toLowerCase().split('.').pop()
    const supportedExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'wmv']
    if (!extension || !supportedExtensions.includes(extension)) {
      errors.push(`Unsupported file extension: ${extension}`)
    }

    // Basic malware scanning (placeholder for actual implementation)
    const isSuspicious = await this.scanVideoForMalware(inputPath)
    if (isSuspicious) {
      errors.push('File contains suspicious content')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Extract video metadata using ffprobe (simulated)
  private async extractMetadata(inputPath: string): Promise<VideoMetadata> {
    // In production, this would use ffprobe to extract real metadata
    // For now, returning simulated metadata
    return {
      duration: 1800, // 30 minutes
      width: 1920,
      height: 1080,
      fps: 30,
      bitrate: 5000000, // 5 Mbps
      codec: 'h264',
      audioCodec: 'aac'
    }
  }

  // Process single quality profile
  private async processQuality(job: VideoProcessingJob, quality: string): Promise<string> {
    const profile = VIDEO_CONFIG.qualityProfiles[quality as keyof typeof VIDEO_CONFIG.qualityProfiles]
    if (!profile) {
      throw new Error(`Unknown quality profile: ${quality}`)
    }

    const outputPath = `${VIDEO_CONFIG.storage.outputDir}/${job.id}/${quality}`

    // In production, this would use ffmpeg to transcode the video
    // For now, simulating the process
    this.logger.debug('Processing video quality', {
      jobId: job.id,
      quality,
      profile,
      outputPath
    })

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))

    return outputPath
  }

  // Generate video thumbnails
  private async generateThumbnails(job: VideoProcessingJob): Promise<string[]> {
    const thumbnails: string[] = []
    const duration = job.metadata.duration
    const intervalSeconds = 10 // Thumbnail every 10 seconds

    for (let time = 0; time < duration; time += intervalSeconds) {
      const thumbnailPath = `${VIDEO_CONFIG.storage.outputDir}/${job.id}/thumbnails/thumb_${time}.jpg`

      // In production, this would use ffmpeg to extract thumbnails
      thumbnails.push(thumbnailPath)
    }

    this.logger.debug('Generated video thumbnails', {
      jobId: job.id,
      thumbnailCount: thumbnails.length
    })

    return thumbnails
  }

  // Create streaming manifests (HLS and DASH)
  private async createStreamingManifests(
    job: VideoProcessingJob,
    outputPaths: string[],
    thumbnails: string[]
  ): Promise<{
    hls: StreamingManifest
    dash: StreamingManifest
  }> {
    const baseUrl = `${VIDEO_CONFIG.storage.cdnBaseUrl}/videos/${job.id}`

    // Create HLS manifest
    const hlsManifest = await this.createHLSManifest(job, outputPaths, baseUrl)

    // Create DASH manifest
    const dashManifest = await this.createDASHManifest(job, outputPaths, baseUrl)

    this.logger.debug('Created streaming manifests', {
      jobId: job.id,
      hlsUrl: hlsManifest.baseUrl,
      dashUrl: dashManifest.baseUrl
    })

    return {
      hls: hlsManifest,
      dash: dashManifest
    }
  }

  // Helper methods

  private generateJobId(): string {
    return `video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`
  }

  private async saveInputFile(file: File, jobId: string): Promise<string> {
    const inputDir = `${VIDEO_CONFIG.storage.tempDir}/${jobId}`
    const inputPath = `${inputDir}/${file.name}`

    // In production, this would save the actual file
    this.logger.debug('Saving input file', { jobId, inputPath })
    return inputPath
  }

  private getDefaultQualities(metadata: VideoMetadata): string[] {
    const { width, height } = metadata
    const qualities: string[] = []

    // Add qualities based on input resolution
    if (width >= 1920 && height >= 1080) qualities.push('1080p')
    if (width >= 1280 && height >= 720) qualities.push('720p')
    if (width >= 854 && height >= 480) qualities.push('480p')
    qualities.push('360p', '240p')

    return qualities
  }

  private estimateProcessingTime(job: VideoProcessingJob): number {
    // Rough estimation: 1 minute of processing per minute of video per quality
    const baseTime = job.metadata.duration * job.qualities.length
    return baseTime * 1000 // Convert to milliseconds
  }

  private async scanVideoForMalware(inputPath: string): Promise<boolean> {
    // Placeholder for malware scanning
    // In production, this would integrate with antivirus APIs
    return false
  }

  private async createHLSManifest(job: VideoProcessingJob, outputPaths: string[], baseUrl: string): Promise<StreamingManifest> {
    // In production, this would generate actual HLS manifest files
    const qualities = job.qualities.map(quality => ({
      quality,
      bandwidth: this.getBandwidthForQuality(quality),
      url: `${baseUrl}/${quality}/playlist.m3u8`
    }))

    return {
      videoId: job.id,
      format: 'hls',
      baseUrl: `${baseUrl}/master.m3u8`,
      manifest: 'master.m3u8',
      qualities,
      thumbnails: [],
      duration: job.metadata.duration,
      encrypted: VIDEO_CONFIG.hls.enableEncryption
    }
  }

  private async createDASHManifest(job: VideoProcessingJob, outputPaths: string[], baseUrl: string): Promise<StreamingManifest> {
    // In production, this would generate actual DASH manifest files
    const qualities = job.qualities.map(quality => ({
      quality,
      bandwidth: this.getBandwidthForQuality(quality),
      url: `${baseUrl}/${quality}/manifest.mpd`
    }))

    return {
      videoId: job.id,
      format: 'dash',
      baseUrl: `${baseUrl}/manifest.mpd`,
      manifest: 'manifest.mpd',
      qualities,
      thumbnails: [],
      duration: job.metadata.duration,
      encrypted: VIDEO_CONFIG.dash.enableEncryption
    }
  }

  private getBandwidthForQuality(quality: string): number {
    const profile = VIDEO_CONFIG.qualityProfiles[quality as keyof typeof VIDEO_CONFIG.qualityProfiles]
    if (!profile) return 1000000

    // Convert bitrate string to number
    const videoBitrate = parseInt(profile.videoBitrate.replace('k', '')) * 1000
    const audioBitrate = parseInt(profile.audioBitrate.replace('k', '')) * 1000
    return videoBitrate + audioBitrate
  }

  private async persistJob(job: VideoProcessingJob): Promise<void> {
    try {
      await redis.set(`video_job:${job.id}`, job, VIDEO_CONFIG.storage.retention.processed)
      await redis.setAdd(`user_video_jobs:${job.userId}`, job.id)
    } catch (error) {
      this.logger.warn('Failed to persist video job', error as Error)
    }
  }

  private async loadJob(jobId: string): Promise<VideoProcessingJob | null> {
    try {
      return await redis.get(`video_job:${jobId}`)
    } catch (error) {
      this.logger.warn('Failed to load video job', error as Error)
      return null
    }
  }

  private async updateJob(job: VideoProcessingJob): Promise<void> {
    this.processingJobs.set(job.id, job)
    await this.persistJob(job)
  }

  private async cleanupJobFiles(jobId: string): Promise<void> {
    // In production, this would delete actual files
    this.logger.debug('Cleaning up job files', { jobId })
  }

  private async cleanupTempFiles(jobId: string): Promise<void> {
    // In production, this would delete temporary files
    this.logger.debug('Cleaning up temporary files', { jobId })
  }
}

// Export singleton instance
export const videoProcessor = VideoProcessor.getInstance()

// Convenience functions
export const submitVideo = videoProcessor.submitVideo.bind(videoProcessor)
export const getVideoJob = videoProcessor.getJob.bind(videoProcessor)
export const getUserVideoJobs = videoProcessor.getUserJobs.bind(videoProcessor)
export const cancelVideoJob = videoProcessor.cancelJob.bind(videoProcessor)