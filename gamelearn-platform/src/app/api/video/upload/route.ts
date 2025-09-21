import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  videoProcessor,
  submitVideo,
  getVideoJob,
  getUserVideoJobs,
  cancelVideoJob,
  VIDEO_CONFIG
} from "@/lib/video/processing"
import { validateFileUpload } from "@/lib/security/file-validation"
import { z } from "zod"

// Validation schemas
const videoUploadSchema = z.object({
  courseId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  chapter: z.string().max(100).optional(),
  isPublic: z.boolean().default(false),
  qualities: z.array(z.enum(['240p', '360p', '480p', '720p', '1080p'])).optional(),
  generateThumbnails: z.boolean().default(true),
  extractAudio: z.boolean().default(false),
  enableDRM: z.boolean().default(true)
})

const jobQuerySchema = z.object({
  jobId: z.string().optional(),
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20)
})

// POST - Upload video for processing
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_upload')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing video upload request")

    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      requestLogger.warn("Unauthorized video upload attempt")
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const userId = session.user.id
    const userRole = session.user.role || 'student'

    // 2. Check if user can upload videos (instructors and admins only for courses)
    if (userRole === 'student') {
      requestLogger.warn("Student attempted video upload", {
        userId,
        userRole
      })
      return NextResponse.json(
        {
          success: false,
          error: { message: "Video upload requires instructor privileges" }
        },
        { status: 403 }
      )
    }

    // 3. Parse multipart form data
    const formData = await request.formData()
    const videoFile = formData.get('video') as File
    const metadataStr = formData.get('metadata') as string

    if (!videoFile) {
      requestLogger.warn("No video file provided in upload request")
      return NextResponse.json(
        {
          success: false,
          error: { message: "No video file provided" }
        },
        { status: 400 }
      )
    }

    // 4. Parse and validate metadata
    let metadata = {}
    try {
      if (metadataStr) {
        metadata = JSON.parse(metadataStr)
      }
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid metadata format" }
        },
        { status: 400 }
      )
    }

    const validationResult = videoUploadSchema.safeParse(metadata)
    if (!validationResult.success) {
      requestLogger.warn("Video upload metadata validation failed", {
        validationErrors: validationResult.error.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid upload metadata",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const uploadData = validationResult.data

    // 5. Validate video file
    const fileValidation = await validateFileUpload({
      filename: videoFile.name,
      mimetype: videoFile.type,
      size: videoFile.size,
      category: 'videos'
    })

    if (!fileValidation.isValid) {
      requestLogger.warn("Video file validation failed", {
        errors: fileValidation.errors,
        filename: videoFile.name,
        mimetype: videoFile.type,
        size: videoFile.size
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Video file validation failed",
            details: fileValidation.errors
          }
        },
        { status: 400 }
      )
    }

    // 6. Check file size limits
    if (videoFile.size > VIDEO_CONFIG.limits.maxFileSize) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Video file too large",
            maxSize: VIDEO_CONFIG.limits.maxFileSize / (1024 * 1024 * 1024) + "GB"
          }
        },
        { status: 413 }
      )
    }

    // 7. Check user's current processing jobs
    const userJobs = await getUserVideoJobs(userId, 50)
    const activeJobs = userJobs.filter(job =>
      ['pending', 'processing'].includes(job.status)
    )

    if (activeJobs.length >= 3) { // Limit concurrent jobs per user
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Too many active video processing jobs",
            activeJobs: activeJobs.length,
            maxJobs: 3
          }
        },
        { status: 429 }
      )
    }

    // 8. Submit video for processing
    const processingJob = await submitVideo(
      videoFile,
      userId,
      uploadData.courseId,
      {
        qualities: uploadData.qualities,
        generateThumbnails: uploadData.generateThumbnails,
        extractAudio: uploadData.extractAudio,
        enableDRM: uploadData.enableDRM
      }
    )

    // 9. Store additional metadata
    await storeVideoMetadata(processingJob.id, {
      title: uploadData.title,
      description: uploadData.description,
      chapter: uploadData.chapter,
      isPublic: uploadData.isPublic,
      uploadedBy: userId,
      uploadedByEmail: session.user.email
    })

    requestLogger.info("Video upload submitted successfully", {
      jobId: processingJob.id,
      userId,
      filename: videoFile.name,
      fileSize: videoFile.size,
      courseId: uploadData.courseId,
      estimatedDuration: processingJob.estimatedDuration
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          jobId: processingJob.id,
          status: processingJob.status,
          progress: processingJob.progress,
          estimatedDuration: processingJob.estimatedDuration,
          qualities: processingJob.qualities,
          message: "Video upload started. Processing will begin shortly."
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 202 }
    )

  } catch (error) {
    requestLogger.error("Video upload processing failed", error as Error, {
      operation: 'video_upload'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to process video upload" }
      },
      { status: 500 }
    )
  }
}

// GET - Get video processing status and user's jobs
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_upload_status')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing video status request")

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const validationResult = jobQuerySchema.safeParse({
      jobId: searchParams.get('jobId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit')
    })

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid query parameters",
            details: validationResult.error.errors
          }
        },
        { status: 400 }
      )
    }

    const { jobId, status, limit } = validationResult.data

    // Get specific job or user's jobs
    if (jobId) {
      const job = await getVideoJob(jobId)

      if (!job) {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Video processing job not found" }
          },
          { status: 404 }
        )
      }

      // Check ownership
      if (job.userId !== userId && session.user.role !== 'ADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: { message: "Access denied" }
          },
          { status: 403 }
        )
      }

      // Get additional metadata
      const additionalMetadata = await getVideoMetadata(jobId)

      endTimer()
      return NextResponse.json(
        {
          success: true,
          data: {
            job: {
              ...job,
              ...additionalMetadata
            }
          }
        },
        { status: 200 }
      )
    } else {
      // Get user's jobs
      let jobs = await getUserVideoJobs(userId, limit)

      // Filter by status if specified
      if (status) {
        jobs = jobs.filter(job => job.status === status)
      }

      // Add additional metadata for each job
      const jobsWithMetadata = await Promise.all(
        jobs.map(async (job) => {
          const additionalMetadata = await getVideoMetadata(job.id)
          return { ...job, ...additionalMetadata }
        })
      )

      endTimer()
      return NextResponse.json(
        {
          success: true,
          data: {
            jobs: jobsWithMetadata,
            total: jobs.length,
            filters: { status, limit }
          }
        },
        { status: 200 }
      )
    }

  } catch (error) {
    requestLogger.error("Video status request failed", error as Error, {
      operation: 'video_upload_status'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to retrieve video status" }
      },
      { status: 500 }
    )
  }
}

// DELETE - Cancel video processing job
export async function DELETE(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('video_upload_cancel')

  try {
    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Job ID is required" }
        },
        { status: 400 }
      )
    }

    // Cancel the job
    const cancelled = await cancelVideoJob(jobId, session.user.id)

    if (!cancelled) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Failed to cancel job. Job may not exist or already completed." }
        },
        { status: 400 }
      )
    }

    requestLogger.info("Video processing job cancelled", {
      jobId,
      userId: session.user.id
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          message: "Video processing job cancelled successfully",
          jobId
        }
      },
      { status: 200 }
    )

  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "You can only cancel your own video processing jobs" }
        },
        { status: 403 }
      )
    }

    requestLogger.error("Video cancellation failed", error as Error, {
      operation: 'video_upload_cancel'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to cancel video processing job" }
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function storeVideoMetadata(jobId: string, metadata: Record<string, any>): Promise<void> {
  try {
    // In production, this would store in database
    // For now, using Redis
    const { redis } = await import('@/lib/redis')
    await redis.set(`video_metadata:${jobId}`, metadata, 60 * 60 * 24 * 365) // 1 year
  } catch (error) {
    console.warn('Failed to store video metadata:', error)
  }
}

async function getVideoMetadata(jobId: string): Promise<Record<string, any>> {
  try {
    const { redis } = await import('@/lib/redis')
    return await redis.get(`video_metadata:${jobId}`) || {}
  } catch (error) {
    console.warn('Failed to get video metadata:', error)
    return {}
  }
}