import { z } from 'zod'

// Course content upload validation
export const courseContentUploadSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  sectionId: z.string().uuid('Invalid section ID').optional(),
  contentType: z.enum(['video', 'document', 'image', 'gameAsset', 'archive']),
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?()]+$/, 'Invalid characters in title'),
  description: z.string()
    .max(1000, 'Description too long')
    .optional(),
  visibility: z.enum(['public', 'private', 'restricted']).default('private'),
  tags: z.array(z.string().max(50)).max(20).optional(),
  metadata: z.record(z.any()).optional()
})

// Portfolio upload validation
export const portfolioUploadSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  assetType: z.enum(['screenshot', 'video', 'document', 'gameAsset', 'build']),
  title: z.string()
    .min(1, 'Title is required')
    .max(150, 'Title too long'),
  description: z.string()
    .max(500, 'Description too long')
    .optional(),
  isPublic: z.boolean().default(false),
  sortOrder: z.number().int().min(0).max(100).default(0),
  platform: z.enum(['web', 'windows', 'mac', 'linux', 'android', 'ios']).optional()
})

// User avatar upload validation
export const avatarUploadSchema = z.object({
  cropData: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional()
})

// Course thumbnail upload validation
export const courseThumbnailSchema = z.object({
  courseId: z.string().uuid('Invalid course ID'),
  cropData: z.object({
    x: z.number().min(0),
    y: z.number().min(0),
    width: z.number().positive(),
    height: z.number().positive()
  }).optional()
})

// Game build upload validation
export const gameBuildUploadSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  buildType: z.enum(['webgl', 'windows', 'mac', 'linux', 'android', 'ios']),
  version: z.string()
    .regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9]+)?$/, 'Invalid version format (use semver)'),
  releaseNotes: z.string().max(2000).optional(),
  isPublic: z.boolean().default(false),
  minimumSpecs: z.object({
    os: z.string().optional(),
    memory: z.string().optional(),
    graphics: z.string().optional(),
    storage: z.string().optional()
  }).optional()
})

// Batch upload validation
export const batchUploadSchema = z.object({
  uploads: z.array(z.object({
    filename: z.string(),
    category: z.enum(['images', 'videos', 'documents', 'archives', 'gameAssets']),
    metadata: z.record(z.any()).optional()
  })).min(1).max(50), // Allow up to 50 files in batch
  targetId: z.string().uuid('Invalid target ID'),
  targetType: z.enum(['course', 'project', 'portfolio'])
})

// Upload progress tracking
export const uploadProgressSchema = z.object({
  uploadId: z.string().uuid('Invalid upload ID'),
  chunkIndex: z.number().int().min(0),
  totalChunks: z.number().int().positive(),
  chunkSize: z.number().positive(),
  checksum: z.string().optional()
})

// Validation functions for common use cases
export function validateCourseContentUpload(data: unknown) {
  return courseContentUploadSchema.safeParse(data)
}

export function validatePortfolioUpload(data: unknown) {
  return portfolioUploadSchema.safeParse(data)
}

export function validateAvatarUpload(data: unknown) {
  return avatarUploadSchema.safeParse(data)
}

export function validateCourseThumbnail(data: unknown) {
  return courseThumbnailSchema.safeParse(data)
}

export function validateGameBuildUpload(data: unknown) {
  return gameBuildUploadSchema.safeParse(data)
}

export function validateBatchUpload(data: unknown) {
  return batchUploadSchema.safeParse(data)
}

export function validateUploadProgress(data: unknown) {
  return uploadProgressSchema.safeParse(data)
}

// Content filtering rules
export const CONTENT_FILTERS = {
  profanity: {
    enabled: true,
    severity: 'medium' as const,
    blockedWords: [
      // Add profanity filter words as needed
      // This is a basic example - in production use a comprehensive list
    ]
  },

  copyright: {
    enabled: true,
    severity: 'high' as const,
    patterns: [
      /\bcopyright\s+\d{4}/gi,
      /\ball\s+rights\s+reserved/gi,
      /\(c\)\s*\d{4}/gi
    ]
  },

  maliciousContent: {
    enabled: true,
    severity: 'critical' as const,
    patterns: [
      /<script/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /data:.*base64/gi,
      /eval\s*\(/gi,
      /document\.write/gi
    ]
  }
} as const

// Virus scanning configuration
export const VIRUS_SCAN_CONFIG = {
  enabled: true,
  timeout: 30000, // 30 seconds
  quarantineOnFailure: true,
  scanTypes: ['upload', 'download', 'process'],
  excludedExtensions: ['.txt', '.json'], // Low-risk files
  requiredForTypes: ['archives', 'gameAssets', 'documents']
} as const

// Upload rate limiting
export const UPLOAD_RATE_LIMITS = {
  maxFilesPerHour: 100,
  maxBytesPerHour: 1024 * 1024 * 1024, // 1GB
  maxConcurrentUploads: 5,
  cooldownPeriod: 300, // 5 minutes after limit hit
} as const

// Storage quotas
export const STORAGE_QUOTAS = {
  student: {
    totalStorage: 5 * 1024 * 1024 * 1024, // 5GB
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 1000
  },
  instructor: {
    totalStorage: 50 * 1024 * 1024 * 1024, // 50GB
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxFiles: 10000
  },
  admin: {
    totalStorage: 500 * 1024 * 1024 * 1024, // 500GB
    maxFileSize: 2 * 1024 * 1024 * 1024, // 2GB
    maxFiles: 100000
  }
} as const

export type ContentFilter = keyof typeof CONTENT_FILTERS
export type UserRole = keyof typeof STORAGE_QUOTAS