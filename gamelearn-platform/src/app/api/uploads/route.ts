import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  FileValidator,
  validateFileUpload,
  quarantineFile,
  generateSecureFilename,
  validateUploadMetadata,
  ALLOWED_FILE_TYPES
} from "@/lib/security/file-validation"
import {
  validateCourseContentUpload,
  validatePortfolioUpload,
  validateAvatarUpload,
  UPLOAD_RATE_LIMITS,
  STORAGE_QUOTAS
} from "@/lib/validations/uploads"
import { redis } from "@/lib/redis"
import { prisma } from "@/lib/prisma"
import { ZodError } from "zod"

// Maximum upload size (500MB)
const MAX_UPLOAD_SIZE = 500 * 1024 * 1024

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('file_upload')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing file upload")

    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      requestLogger.warn("Unauthorized upload attempt")
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

    // 2. Rate limiting check
    const rateLimitResult = await checkUploadRateLimit(userId, requestLogger)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Upload rate limit exceeded",
            retryAfter: rateLimitResult.retryAfter
          }
        },
        { status: 429 }
      )
    }

    // 3. Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const uploadType = formData.get('uploadType') as string
    const metadataStr = formData.get('metadata') as string

    if (!file) {
      requestLogger.warn("No file provided in upload request")
      return NextResponse.json(
        {
          success: false,
          error: { message: "No file provided" }
        },
        { status: 400 }
      )
    }

    // 4. Basic file validation
    if (file.size > MAX_UPLOAD_SIZE) {
      requestLogger.warn("File size exceeds maximum", {
        fileSize: file.size,
        maxSize: MAX_UPLOAD_SIZE
      })
      return NextResponse.json(
        {
          success: false,
          error: { message: "File size exceeds maximum allowed size" }
        },
        { status: 413 }
      )
    }

    // 5. Parse and validate metadata
    let metadata = {}
    let validatedUploadData: any = {}

    try {
      if (metadataStr) {
        metadata = JSON.parse(metadataStr)
      }

      // Validate upload type and metadata
      switch (uploadType) {
        case 'courseContent':
          const courseResult = validateCourseContentUpload(metadata)
          if (!courseResult.success) {
            throw new Error(`Course content validation failed: ${courseResult.error.message}`)
          }
          validatedUploadData = courseResult.data
          break

        case 'portfolio':
          const portfolioResult = validatePortfolioUpload(metadata)
          if (!portfolioResult.success) {
            throw new Error(`Portfolio validation failed: ${portfolioResult.error.message}`)
          }
          validatedUploadData = portfolioResult.data
          break

        case 'avatar':
          const avatarResult = validateAvatarUpload(metadata)
          if (!avatarResult.success) {
            throw new Error(`Avatar validation failed: ${avatarResult.error.message}`)
          }
          validatedUploadData = avatarResult.data
          break

        default:
          throw new Error(`Invalid upload type: ${uploadType}`)
      }
    } catch (error) {
      requestLogger.warn("Upload metadata validation failed", { error: error instanceof Error ? error.message : 'Unknown error' })
      return NextResponse.json(
        {
          success: false,
          error: { message: "Invalid upload metadata" }
        },
        { status: 400 }
      )
    }

    // 6. Determine file category based on upload type and file
    const fileCategory = determineFileCategory(uploadType, file.type)
    if (!fileCategory) {
      requestLogger.warn("Unable to determine file category", {
        uploadType,
        mimeType: file.type
      })
      return NextResponse.json(
        {
          success: false,
          error: { message: "Unsupported file type" }
        },
        { status: 400 }
      )
    }

    // 7. Storage quota check
    const quotaCheck = await checkStorageQuota(userId, userRole, file.size, requestLogger)
    if (!quotaCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: quotaCheck.message,
            currentUsage: quotaCheck.currentUsage,
            quota: quotaCheck.quota
          }
        },
        { status: 413 }
      )
    }

    // 8. Read file buffer for validation
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // 9. Comprehensive file validation
    const validationResult = await validateFileUpload({
      filename: file.name,
      mimetype: file.type,
      size: file.size,
      category: fileCategory
    }, fileBuffer)

    if (!validationResult.isValid) {
      requestLogger.warn("File validation failed", {
        errors: validationResult.errors,
        filename: file.name
      })

      // Quarantine suspicious files
      if (validationResult.errors.some(error =>
        error.includes('malicious') ||
        error.includes('executable') ||
        error.includes('script')
      )) {
        await quarantineFile({
          filename: file.name,
          mimetype: file.type,
          size: file.size,
          category: fileCategory
        }, validationResult.errors.join(', '))

        requestLogger.logSecurityEvent('malicious_file_upload_blocked', 'high', {
          userId,
          filename: file.name,
          errors: validationResult.errors
        })
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            message: "File validation failed",
            details: validationResult.errors
          }
        },
        { status: 400 }
      )
    }

    // 10. Generate secure filename
    const secureFilename = generateSecureFilename(validationResult.sanitizedFilename, fileCategory)

    // 11. Validate metadata fields
    const metadataValidation = validateUploadMetadata(metadata)
    if (!metadataValidation.isValid) {
      requestLogger.warn("Upload metadata validation failed", {
        errors: metadataValidation.errors
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Invalid metadata",
            details: metadataValidation.errors
          }
        },
        { status: 400 }
      )
    }

    // 12. Create upload record
    const uploadRecord = await createUploadRecord({
      userId,
      uploadType,
      originalFilename: file.name,
      secureFilename,
      fileSize: file.size,
      mimeType: file.type,
      fileHash: validationResult.fileHash,
      metadata: {
        ...validatedUploadData,
        ...metadataValidation.sanitizedMetadata
      }
    }, requestLogger)

    // 13. Store file (in production, this would upload to cloud storage)
    // For now, we'll simulate the storage process
    await simulateFileStorage(secureFilename, fileBuffer, requestLogger)

    // 14. Update user storage usage
    await updateStorageUsage(userId, file.size, requestLogger)

    // 15. Log successful upload
    requestLogger.logBusinessEvent('file_uploaded', {
      userId,
      uploadId: uploadRecord.id,
      filename: secureFilename,
      fileSize: file.size,
      uploadType
    })

    requestLogger.info("File upload completed successfully", {
      uploadId: uploadRecord.id,
      filename: secureFilename
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: {
          uploadId: uploadRecord.id,
          filename: secureFilename,
          originalFilename: file.name,
          fileSize: file.size,
          fileHash: validationResult.fileHash,
          uploadedAt: uploadRecord.createdAt
        },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    )

  } catch (error) {
    if (error instanceof ZodError) {
      requestLogger.warn("Upload validation failed", {
        validationErrors: error.errors
      })

      endTimer()
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    requestLogger.error("File upload processing failed", error as Error, {
      operation: 'file_upload'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Upload processing failed" }
      },
      { status: 500 }
    )
  }
}

// Helper functions

async function checkUploadRateLimit(userId: string, logger: any): Promise<{
  allowed: boolean
  retryAfter?: number
}> {
  try {
    const hourlyKey = `upload_rate:${userId}:${Math.floor(Date.now() / (1000 * 60 * 60))}`
    const uploadCount = await redis.incrementKey(hourlyKey, 3600) // 1 hour TTL

    if (uploadCount > UPLOAD_RATE_LIMITS.maxFilesPerHour) {
      logger.warn("Upload rate limit exceeded", { userId, uploadCount })
      return {
        allowed: false,
        retryAfter: 3600 - (Math.floor(Date.now() / 1000) % 3600)
      }
    }

    return { allowed: true }
  } catch (error) {
    logger.warn("Rate limit check failed", error as Error)
    return { allowed: true } // Allow on failure
  }
}

function determineFileCategory(uploadType: string, mimeType: string): keyof typeof ALLOWED_FILE_TYPES | null {
  if (mimeType.startsWith('image/')) return 'images'
  if (mimeType.startsWith('video/')) return 'videos'
  if (mimeType.includes('pdf') || mimeType.includes('text')) return 'documents'
  if (mimeType.includes('zip') || mimeType.includes('tar') || mimeType.includes('gzip')) return 'archives'

  // Special handling for game assets
  if (uploadType === 'courseContent' || uploadType === 'portfolio') {
    return 'gameAssets'
  }

  return null
}

async function checkStorageQuota(userId: string, userRole: string, fileSize: number, logger: any): Promise<{
  allowed: boolean
  message?: string
  currentUsage?: number
  quota?: number
}> {
  try {
    const quota = STORAGE_QUOTAS[userRole as keyof typeof STORAGE_QUOTAS] || STORAGE_QUOTAS.student

    // Get current usage from database
    const currentUsage = await prisma.upload.aggregate({
      where: { userId },
      _sum: { fileSize: true }
    })

    const totalUsed = currentUsage._sum.fileSize || 0
    const newTotal = totalUsed + fileSize

    if (newTotal > quota.totalStorage) {
      return {
        allowed: false,
        message: "Storage quota exceeded",
        currentUsage: totalUsed,
        quota: quota.totalStorage
      }
    }

    if (fileSize > quota.maxFileSize) {
      return {
        allowed: false,
        message: "File size exceeds maximum for your account type",
        quota: quota.maxFileSize
      }
    }

    return { allowed: true }
  } catch (error) {
    logger.warn("Storage quota check failed", error as Error)
    return { allowed: true } // Allow on failure
  }
}

async function createUploadRecord(uploadData: any, logger: any) {
  try {
    return await prisma.upload.create({
      data: {
        userId: uploadData.userId,
        uploadType: uploadData.uploadType,
        originalFilename: uploadData.originalFilename,
        secureFilename: uploadData.secureFilename,
        fileSize: uploadData.fileSize,
        mimeType: uploadData.mimeType,
        fileHash: uploadData.fileHash,
        metadata: uploadData.metadata,
        status: 'completed'
      }
    })
  } catch (error) {
    logger.error("Failed to create upload record", error as Error)
    throw new Error("Database operation failed")
  }
}

async function simulateFileStorage(filename: string, buffer: Buffer, logger: any): Promise<void> {
  // In production, this would upload to AWS S3, Google Cloud Storage, etc.
  logger.debug("Simulating file storage", { filename, size: buffer.length })

  // Add artificial delay to simulate upload
  await new Promise(resolve => setTimeout(resolve, 100))
}

async function updateStorageUsage(userId: string, fileSize: number, logger: any): Promise<void> {
  try {
    // Update user's storage usage stats
    await prisma.user.update({
      where: { id: userId },
      data: {
        // In a real implementation, you'd have storage usage fields
        // storageUsed: { increment: fileSize }
      }
    })
  } catch (error) {
    logger.warn("Failed to update storage usage", error as Error)
    // Non-critical error, don't fail the upload
  }
}