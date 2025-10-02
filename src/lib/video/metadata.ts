/**
 * Video metadata extraction utilities
 * Extracts duration, resolution, codec, and other metadata from video files
 */

export interface VideoMetadata {
  duration: number // in seconds
  width: number
  height: number
  size: number // in bytes
  type: string
  codec?: string
  bitrate?: number
  frameRate?: number
  aspectRatio?: string
}

/**
 * Extract metadata from a video file using HTMLVideoElement
 * @param file - The video file to extract metadata from
 * @returns Promise resolving to video metadata
 */
export async function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video')
      video.preload = 'metadata'

      const objectUrl = URL.createObjectURL(file)

      video.onloadedmetadata = function() {
        // Clean up object URL
        URL.revokeObjectURL(objectUrl)

        const metadata: VideoMetadata = {
          duration: video.duration,
          width: video.videoWidth,
          height: video.videoHeight,
          size: file.size,
          type: file.type,
          aspectRatio: calculateAspectRatio(video.videoWidth, video.videoHeight)
        }

        resolve(metadata)
      }

      video.onerror = function() {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to load video metadata'))
      }

      video.src = objectUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Validate video metadata against requirements
 * @param metadata - The video metadata to validate
 * @param requirements - Optional validation requirements
 * @returns Validation result with errors if any
 */
export function validateVideoMetadata(
  metadata: VideoMetadata,
  requirements?: {
    maxDuration?: number // in seconds
    minDuration?: number // in seconds
    maxWidth?: number
    minWidth?: number
    maxHeight?: number
    minHeight?: number
    maxSize?: number // in bytes
    minSize?: number // in bytes
    allowedTypes?: string[]
  }
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Duration validation
  if (requirements?.maxDuration && metadata.duration > requirements.maxDuration) {
    errors.push(`Video duration (${formatDuration(metadata.duration)}) exceeds maximum allowed (${formatDuration(requirements.maxDuration)})`)
  }

  if (requirements?.minDuration && metadata.duration < requirements.minDuration) {
    errors.push(`Video duration (${formatDuration(metadata.duration)}) is below minimum required (${formatDuration(requirements.minDuration)})`)
  }

  // Resolution validation
  if (requirements?.maxWidth && metadata.width > requirements.maxWidth) {
    errors.push(`Video width (${metadata.width}px) exceeds maximum allowed (${requirements.maxWidth}px)`)
  }

  if (requirements?.minWidth && metadata.width < requirements.minWidth) {
    errors.push(`Video width (${metadata.width}px) is below minimum required (${requirements.minWidth}px)`)
  }

  if (requirements?.maxHeight && metadata.height > requirements.maxHeight) {
    errors.push(`Video height (${metadata.height}px) exceeds maximum allowed (${requirements.maxHeight}px)`)
  }

  if (requirements?.minHeight && metadata.height < requirements.minHeight) {
    errors.push(`Video height (${metadata.height}px) is below minimum required (${requirements.minHeight}px)`)
  }

  // File size validation
  if (requirements?.maxSize && metadata.size > requirements.maxSize) {
    errors.push(`File size (${formatFileSize(metadata.size)}) exceeds maximum allowed (${formatFileSize(requirements.maxSize)})`)
  }

  if (requirements?.minSize && metadata.size < requirements.minSize) {
    errors.push(`File size (${formatFileSize(metadata.size)}) is below minimum required (${formatFileSize(requirements.minSize)})`)
  }

  // Type validation
  if (requirements?.allowedTypes && !requirements.allowedTypes.includes(metadata.type)) {
    errors.push(`Video type (${metadata.type}) is not allowed. Allowed types: ${requirements.allowedTypes.join(', ')}`)
  }

  // Basic sanity checks
  if (metadata.duration <= 0 || isNaN(metadata.duration) || !isFinite(metadata.duration)) {
    errors.push('Invalid video duration')
  }

  if (metadata.width <= 0 || metadata.height <= 0) {
    errors.push('Invalid video resolution')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Calculate aspect ratio from width and height
 * @param width - Video width
 * @param height - Video height
 * @returns Aspect ratio as a string (e.g., "16:9")
 */
function calculateAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => {
    return b === 0 ? a : gcd(b, a % b)
  }

  const divisor = gcd(width, height)
  const aspectWidth = width / divisor
  const aspectHeight = height / divisor

  // Common aspect ratios
  const commonRatios: { [key: string]: string } = {
    '16:9': '16:9',
    '4:3': '4:3',
    '21:9': '21:9',
    '1:1': '1:1',
    '9:16': '9:16' // Vertical video
  }

  const ratioKey = `${aspectWidth}:${aspectHeight}`
  return commonRatios[ratioKey] || ratioKey
}

/**
 * Format duration in seconds to human-readable string
 * @param seconds - Duration in seconds
 * @returns Formatted duration string
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
    return '0:00'
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format file size in bytes to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get video quality label from resolution
 * @param width - Video width
 * @param height - Video height
 * @returns Quality label (e.g., "1080p", "720p")
 */
export function getQualityLabel(width: number, height: number): string {
  const maxDimension = Math.max(width, height)

  if (maxDimension >= 3840) return '4K'
  if (maxDimension >= 2560) return '1440p'
  if (maxDimension >= 1920) return '1080p'
  if (maxDimension >= 1280) return '720p'
  if (maxDimension >= 854) return '480p'
  if (maxDimension >= 640) return '360p'
  if (maxDimension >= 426) return '240p'

  return `${maxDimension}p`
}

/**
 * Generate video thumbnail from file
 * @param file - The video file
 * @param seekTo - Time in seconds to seek to for thumbnail (default: 1 second)
 * @returns Promise resolving to thumbnail data URL
 */
export async function generateVideoThumbnail(
  file: File,
  seekTo: number = 1
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const video = document.createElement('video')
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      if (!context) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      const objectUrl = URL.createObjectURL(file)

      video.onloadedmetadata = function() {
        // Seek to specified time or 1 second
        const seekTime = Math.min(seekTo, video.duration)
        video.currentTime = seekTime
      }

      video.onseeked = function() {
        // Set canvas size to video size
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height)

        // Convert canvas to data URL
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)

        // Clean up
        URL.revokeObjectURL(objectUrl)

        resolve(thumbnailUrl)
      }

      video.onerror = function() {
        URL.revokeObjectURL(objectUrl)
        reject(new Error('Failed to generate thumbnail'))
      }

      video.src = objectUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * Check if video codec is supported by browser
 * @param mimeType - The MIME type with codec (e.g., 'video/mp4; codecs="avc1.42E01E"')
 * @returns True if supported, false otherwise
 */
export function isCodecSupported(mimeType: string): boolean {
  const video = document.createElement('video')
  return video.canPlayType(mimeType) !== ''
}

/**
 * Get supported video codecs
 * @returns Array of supported codec MIME types
 */
export function getSupportedCodecs(): string[] {
  const video = document.createElement('video')
  const codecs = [
    'video/mp4; codecs="avc1.42E01E"', // H.264
    'video/mp4; codecs="avc1.4D401E"', // H.264 Main Profile
    'video/mp4; codecs="avc1.64001E"', // H.264 High Profile
    'video/webm; codecs="vp8"', // VP8
    'video/webm; codecs="vp9"', // VP9
    'video/webm; codecs="av1"', // AV1
    'video/ogg; codecs="theora"', // Theora
  ]

  return codecs.filter(codec => video.canPlayType(codec) !== '')
}
