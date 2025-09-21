import { z } from 'zod'
import { createHash } from 'crypto'
import { readFile } from 'fs/promises'
import path from 'path'

// File type configurations
export const ALLOWED_FILE_TYPES = {
  images: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxSize: 10 * 1024 * 1024, // 10MB
    magicBytes: {
      'image/jpeg': [0xFF, 0xD8, 0xFF],
      'image/png': [0x89, 0x50, 0x4E, 0x47],
      'image/webp': [0x52, 0x49, 0x46, 0x46],
      'image/gif': [0x47, 0x49, 0x46]
    }
  },
  videos: {
    mimeTypes: ['video/mp4', 'video/webm', 'video/ogg'],
    extensions: ['.mp4', '.webm', '.ogv'],
    maxSize: 500 * 1024 * 1024, // 500MB
    magicBytes: {
      'video/mp4': [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70],
      'video/webm': [0x1A, 0x45, 0xDF, 0xA3]
    }
  },
  documents: {
    mimeTypes: ['application/pdf', 'text/plain', 'application/json'],
    extensions: ['.pdf', '.txt', '.json'],
    maxSize: 50 * 1024 * 1024, // 50MB
    magicBytes: {
      'application/pdf': [0x25, 0x50, 0x44, 0x46]
    }
  },
  archives: {
    mimeTypes: ['application/zip', 'application/x-tar', 'application/gzip'],
    extensions: ['.zip', '.tar', '.gz', '.tar.gz'],
    maxSize: 100 * 1024 * 1024, // 100MB
    magicBytes: {
      'application/zip': [0x50, 0x4B, 0x03, 0x04],
      'application/x-tar': [0x75, 0x73, 0x74, 0x61, 0x72],
      'application/gzip': [0x1F, 0x8B]
    }
  },
  gameAssets: {
    mimeTypes: ['application/octet-stream', 'text/plain', 'application/json'],
    extensions: ['.unity', '.unitypackage', '.prefab', '.asset', '.scene', '.fbx', '.obj', '.dae'],
    maxSize: 200 * 1024 * 1024, // 200MB
  }
} as const

// Validation schemas
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, 'Filename is required')
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Invalid filename characters'),
  mimetype: z.string().min(1, 'MIME type is required'),
  size: z.number().positive('File size must be positive'),
  category: z.enum(['images', 'videos', 'documents', 'archives', 'gameAssets']),
  checksum: z.string().optional()
})

export type FileUploadInput = z.infer<typeof fileUploadSchema>

export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  sanitizedFilename: string
  detectedMimeType?: string
  fileHash?: string
}

export class FileValidator {
  private static readonly DANGEROUS_EXTENSIONS = [
    '.exe', '.bat', '.cmd', '.com', '.scr', '.pif', '.vbs', '.js', '.jar',
    '.sh', '.bash', '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl'
  ]

  private static readonly SUSPICIOUS_PATTERNS = [
    /\.\./g, // Directory traversal
    /\x00/g, // Null bytes
    /<script/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /data:/gi, // Data URLs in filenames
    /vbscript:/gi // VBScript
  ]

  static async validateFile(
    file: FileUploadInput,
    fileBuffer?: Buffer
  ): Promise<FileValidationResult> {
    const errors: string[] = []
    let sanitizedFilename = ''
    let detectedMimeType: string | undefined
    let fileHash: string | undefined

    try {
      // Validate input schema
      const validatedInput = fileUploadSchema.parse(file)

      // Get file category configuration
      const categoryConfig = ALLOWED_FILE_TYPES[validatedInput.category]

      // 1. Filename validation and sanitization
      const filenameResult = this.validateAndSanitizeFilename(validatedInput.filename)
      if (!filenameResult.isValid) {
        errors.push(...filenameResult.errors)
      }
      sanitizedFilename = filenameResult.sanitizedFilename

      // 2. File extension validation
      const extension = path.extname(sanitizedFilename).toLowerCase()
      if (!categoryConfig.extensions.includes(extension)) {
        errors.push(`File extension ${extension} not allowed for category ${validatedInput.category}`)
      }

      // 3. MIME type validation
      if (!categoryConfig.mimeTypes.includes(validatedInput.mimetype)) {
        errors.push(`MIME type ${validatedInput.mimetype} not allowed for category ${validatedInput.category}`)
      }

      // 4. File size validation
      if (validatedInput.size > categoryConfig.maxSize) {
        const maxSizeMB = Math.round(categoryConfig.maxSize / (1024 * 1024))
        errors.push(`File size ${validatedInput.size} exceeds maximum allowed size of ${maxSizeMB}MB`)
      }

      // 5. Magic byte validation (if file buffer provided)
      if (fileBuffer && categoryConfig.magicBytes) {
        const magicByteResult = this.validateMagicBytes(
          fileBuffer,
          validatedInput.mimetype,
          categoryConfig.magicBytes
        )
        if (!magicByteResult.isValid) {
          errors.push('File content does not match declared MIME type')
        }
        detectedMimeType = magicByteResult.detectedMimeType
      }

      // 6. Generate file hash for integrity checking
      if (fileBuffer) {
        fileHash = this.generateFileHash(fileBuffer)
        if (validatedInput.checksum && validatedInput.checksum !== fileHash) {
          errors.push('File checksum validation failed')
        }
      }

      // 7. Content scanning for malicious patterns
      if (fileBuffer) {
        const contentScanResult = await this.scanFileContent(fileBuffer, validatedInput.mimetype)
        if (!contentScanResult.isValid) {
          errors.push(...contentScanResult.errors)
        }
      }

      return {
        isValid: errors.length === 0,
        errors,
        sanitizedFilename,
        detectedMimeType,
        fileHash
      }

    } catch (error) {
      if (error instanceof z.ZodError) {
        errors.push(...error.errors.map(e => `Validation error: ${e.message}`))
      } else {
        errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      return {
        isValid: false,
        errors,
        sanitizedFilename: file.filename || 'invalid'
      }
    }
  }

  private static validateAndSanitizeFilename(filename: string): {
    isValid: boolean
    errors: string[]
    sanitizedFilename: string
  } {
    const errors: string[] = []
    let sanitized = filename

    // Check for dangerous extensions
    const extension = path.extname(filename).toLowerCase()
    if (this.DANGEROUS_EXTENSIONS.includes(extension)) {
      errors.push(`Dangerous file extension ${extension} not allowed`)
    }

    // Check for suspicious patterns
    for (const pattern of this.SUSPICIOUS_PATTERNS) {
      if (pattern.test(filename)) {
        errors.push('Filename contains suspicious patterns')
        break
      }
    }

    // Sanitize filename
    sanitized = filename
      .replace(/[^\w\.-]/g, '_') // Replace non-alphanumeric chars except dots and hyphens
      .replace(/\.+/g, '.') // Replace multiple dots with single dot
      .replace(/^\.+|\.+$/g, '') // Remove leading/trailing dots
      .substring(0, 255) // Limit length

    // Ensure filename has valid extension
    if (!path.extname(sanitized)) {
      errors.push('Filename must have a valid extension')
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedFilename: sanitized
    }
  }

  private static validateMagicBytes(
    buffer: Buffer,
    declaredMimeType: string,
    magicBytesConfig: Record<string, number[]>
  ): { isValid: boolean; detectedMimeType?: string } {
    const expectedBytes = magicBytesConfig[declaredMimeType]
    if (!expectedBytes) {
      return { isValid: true } // No magic bytes to check
    }

    // Check if file starts with expected magic bytes
    for (let i = 0; i < expectedBytes.length; i++) {
      if (buffer[i] !== expectedBytes[i]) {
        // Try to detect actual MIME type
        for (const [mimeType, bytes] of Object.entries(magicBytesConfig)) {
          const matches = bytes.every((byte, index) => buffer[index] === byte)
          if (matches) {
            return { isValid: false, detectedMimeType: mimeType }
          }
        }
        return { isValid: false }
      }
    }

    return { isValid: true, detectedMimeType: declaredMimeType }
  }

  private static generateFileHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
  }

  private static async scanFileContent(buffer: Buffer, mimeType: string): Promise<{
    isValid: boolean
    errors: string[]
  }> {
    const errors: string[] = []

    try {
      // Convert buffer to string for text-based scans
      const content = buffer.toString('utf8', 0, Math.min(buffer.length, 10000)) // First 10KB

      // Check for embedded scripts in various file types
      const scriptPatterns = [
        /<script[^>]*>.*?<\/script>/gis,
        /javascript:/gi,
        /vbscript:/gi,
        /on\w+\s*=/gi, // Event handlers
        /data:.*base64/gi // Base64 data URLs
      ]

      for (const pattern of scriptPatterns) {
        if (pattern.test(content)) {
          errors.push('File contains potentially malicious script content')
          break
        }
      }

      // Check for suspicious binary patterns
      if (mimeType.startsWith('image/') || mimeType.startsWith('video/')) {
        // Look for embedded executables in media files
        const executableSignatures = [
          Buffer.from([0x4D, 0x5A]), // PE executable
          Buffer.from([0x7F, 0x45, 0x4C, 0x46]), // ELF executable
          Buffer.from([0xFE, 0xED, 0xFA, 0xCE]) // Mach-O executable
        ]

        for (const signature of executableSignatures) {
          if (buffer.includes(signature)) {
            errors.push('File contains embedded executable code')
            break
          }
        }
      }

      // Additional MIME-specific validations
      if (mimeType === 'application/json') {
        try {
          JSON.parse(content)
        } catch {
          errors.push('Invalid JSON file format')
        }
      }

    } catch (error) {
      errors.push(`Content scanning failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Quarantine suspicious files
  static async quarantineFile(fileInfo: FileUploadInput, reason: string): Promise<void> {
    const quarantineRecord = {
      filename: fileInfo.filename,
      mimetype: fileInfo.mimetype,
      size: fileInfo.size,
      category: fileInfo.category,
      reason,
      quarantinedAt: new Date().toISOString(),
      checksum: fileInfo.checksum
    }

    // Log security event
    console.warn('File quarantined', {
      type: 'security_event',
      severity: 'high',
      event: 'file_quarantined',
      ...quarantineRecord
    })

    // In production, you would store quarantine records in database
    // and potentially alert security team
  }

  // Generate secure filename for storage
  static generateSecureFilename(originalFilename: string, category: string): string {
    const extension = path.extname(originalFilename).toLowerCase()
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)

    return `${category}_${timestamp}_${randomSuffix}${extension}`
  }

  // Validate file upload metadata
  static validateUploadMetadata(metadata: Record<string, any>): {
    isValid: boolean
    errors: string[]
    sanitizedMetadata: Record<string, any>
  } {
    const errors: string[] = []
    const sanitized: Record<string, any> = {}

    // Define allowed metadata fields
    const allowedFields = ['title', 'description', 'tags', 'visibility', 'category']
    const stringFields = ['title', 'description', 'visibility', 'category']
    const arrayFields = ['tags']

    for (const [key, value] of Object.entries(metadata)) {
      if (!allowedFields.includes(key)) {
        errors.push(`Metadata field '${key}' is not allowed`)
        continue
      }

      if (stringFields.includes(key)) {
        if (typeof value !== 'string') {
          errors.push(`Metadata field '${key}' must be a string`)
          continue
        }

        // Sanitize string values
        sanitized[key] = value
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .replace(/[<>'"]/g, '') // Remove dangerous characters
          .trim()
          .substring(0, 500) // Limit length
      }

      if (arrayFields.includes(key)) {
        if (!Array.isArray(value)) {
          errors.push(`Metadata field '${key}' must be an array`)
          continue
        }

        // Sanitize array values
        sanitized[key] = value
          .filter(item => typeof item === 'string')
          .map(item => item.replace(/[<>'"]/g, '').trim())
          .slice(0, 10) // Limit number of items
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedMetadata: sanitized
    }
  }
}

// Export utility functions
export const validateFileUpload = FileValidator.validateFile
export const quarantineFile = FileValidator.quarantineFile
export const generateSecureFilename = FileValidator.generateSecureFilename
export const validateUploadMetadata = FileValidator.validateUploadMetadata