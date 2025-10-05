import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import { createRequestLogger } from '@/lib/logger'

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

const logger = createRequestLogger({ headers: new Headers() } as any)

// Video quality profiles matching the configuration
export interface QualityProfile {
  resolution: string
  videoBitrate: string
  audioBitrate: string
  fps: number
  profile: 'baseline' | 'main' | 'high'
}

export const QUALITY_PROFILES: Record<string, QualityProfile> = {
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
}

export interface VideoMetadata {
  duration: number
  width: number
  height: number
  fps: number
  bitrate: number
  codec: string
  audioCodec: string
  format: string
  size: number
}

export interface TranscodingProgress {
  percent: number
  currentFps: number
  targetSize: string
  timemark: string
}

export interface TranscodingOptions {
  quality: string
  inputPath: string
  outputPath: string
  onProgress?: (progress: TranscodingProgress) => void
}

export interface ThumbnailOptions {
  inputPath: string
  outputDir: string
  count?: number
  width?: number
  timestamps?: string[]
}

export interface HLSOptions {
  inputPath: string
  outputDir: string
  segmentDuration?: number
  qualities: string[]
}

/**
 * Extract comprehensive video metadata using ffprobe
 */
export async function extractVideoMetadata(inputPath: string): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) {
        logger.error('Failed to extract video metadata', err, { inputPath })
        reject(new Error(`FFprobe error: ${err.message}`))
        return
      }

      try {
        const videoStream = metadata.streams.find(s => s.codec_type === 'video')
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio')

        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }

        const result: VideoMetadata = {
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          fps: eval(videoStream.r_frame_rate || '30/1'), // e.g., "30/1" -> 30
          bitrate: metadata.format.bit_rate ? parseInt(metadata.format.bit_rate) : 0,
          codec: videoStream.codec_name || 'unknown',
          audioCodec: audioStream?.codec_name || 'none',
          format: metadata.format.format_name || 'unknown',
          size: metadata.format.size ? parseInt(metadata.format.size.toString()) : 0
        }

        logger.info('Video metadata extracted', {
          inputPath,
          duration: result.duration,
          resolution: `${result.width}x${result.height}`,
          codec: result.codec
        })

        resolve(result)
      } catch (error) {
        reject(new Error(`Failed to parse metadata: ${error}`))
      }
    })
  })
}

/**
 * Validate video file format and properties
 */
export async function validateVideo(inputPath: string): Promise<{
  isValid: boolean
  errors: string[]
  metadata?: VideoMetadata
}> {
  const errors: string[] = []

  try {
    // Check if file exists
    try {
      await fs.access(inputPath)
    } catch {
      return { isValid: false, errors: ['File does not exist'] }
    }

    // Extract metadata
    const metadata = await extractVideoMetadata(inputPath)

    // Validate duration (max 4 hours)
    const maxDuration = 4 * 60 * 60 // 4 hours
    if (metadata.duration > maxDuration) {
      errors.push(`Video duration exceeds maximum allowed (${maxDuration / 3600} hours)`)
    }

    // Validate minimum duration (at least 1 second)
    if (metadata.duration < 1) {
      errors.push('Video duration is too short (minimum 1 second)')
    }

    // Validate resolution
    if (metadata.width < 240 || metadata.height < 240) {
      errors.push('Video resolution is too low (minimum 240p)')
    }

    if (metadata.width > 3840 || metadata.height > 2160) {
      errors.push('Video resolution is too high (maximum 4K)')
    }

    // Validate aspect ratio
    const aspectRatio = metadata.width / metadata.height
    if (aspectRatio < 0.5 || aspectRatio > 2.5) {
      errors.push('Invalid aspect ratio')
    }

    // Validate codecs
    const supportedVideoCodecs = ['h264', 'hevc', 'vp8', 'vp9', 'av1']
    if (!supportedVideoCodecs.includes(metadata.codec.toLowerCase())) {
      errors.push(`Unsupported video codec: ${metadata.codec}`)
    }

    return {
      isValid: errors.length === 0,
      errors,
      metadata
    }
  } catch (error) {
    logger.error('Video validation failed', error as Error, { inputPath })
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
    }
  }
}

/**
 * Transcode video to specified quality
 */
export async function transcodeVideo(options: TranscodingOptions): Promise<string> {
  const { quality, inputPath, outputPath, onProgress } = options
  const profile = QUALITY_PROFILES[quality]

  if (!profile) {
    throw new Error(`Unknown quality profile: ${quality}`)
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  return new Promise((resolve, reject) => {
    const [width, height] = profile.resolution.split('x').map(Number)

    logger.info('Starting video transcoding', {
      inputPath,
      outputPath,
      quality,
      resolution: profile.resolution
    })

    const command = ffmpeg(inputPath)
      .outputOptions([
        // Video codec
        '-c:v libx264',
        `-profile:v ${profile.profile}`,
        `-b:v ${profile.videoBitrate}`,
        `-maxrate ${profile.videoBitrate}`,
        `-bufsize ${parseInt(profile.videoBitrate) * 2}k`,

        // Audio codec
        '-c:a aac',
        `-b:a ${profile.audioBitrate}`,
        '-ac 2', // Stereo

        // Scaling
        `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`,

        // Frame rate
        `-r ${profile.fps}`,

        // GOP size (2 seconds)
        `-g ${profile.fps * 2}`,
        '-keyint_min', `${profile.fps}`,

        // Encoding preset
        '-preset medium',

        // Pixel format
        '-pix_fmt yuv420p',

        // Fast start for web playback
        '-movflags +faststart'
      ])
      .output(outputPath)
      .on('start', (commandLine) => {
        logger.debug('FFmpeg command started', { commandLine })
      })
      .on('progress', (progress) => {
        if (onProgress) {
          onProgress({
            percent: progress.percent || 0,
            currentFps: progress.currentFps || 0,
            targetSize: progress.targetSize || '0kB',
            timemark: progress.timemark || '00:00:00.00'
          })
        }
      })
      .on('end', () => {
        logger.info('Video transcoding completed', {
          outputPath,
          quality
        })
        resolve(outputPath)
      })
      .on('error', (err, stdout, stderr) => {
        logger.error('Video transcoding failed', err, {
          outputPath,
          quality,
          stderr
        })
        reject(new Error(`Transcoding failed: ${err.message}`))
      })

    command.run()
  })
}

/**
 * Generate video thumbnails at specific timestamps or intervals
 */
export async function generateThumbnails(options: ThumbnailOptions): Promise<string[]> {
  const {
    inputPath,
    outputDir,
    count = 10,
    width = 320,
    timestamps
  } = options

  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true })

  try {
    // Get video duration
    const metadata = await extractVideoMetadata(inputPath)
    const duration = metadata.duration

    // Calculate timestamps if not provided
    const timePoints = timestamps || Array.from(
      { length: count },
      (_, i) => `${Math.floor((duration / (count + 1)) * (i + 1))}` // Evenly distributed
    )

    const thumbnailPaths: string[] = []

    logger.info('Generating video thumbnails', {
      inputPath,
      outputDir,
      count: timePoints.length
    })

    // Generate thumbnails in parallel
    await Promise.all(
      timePoints.map((timestamp, index) =>
        new Promise<void>((resolve, reject) => {
          const outputPath = path.join(outputDir, `thumb_${index}_${timestamp}s.jpg`)

          ffmpeg(inputPath)
            .screenshots({
              timestamps: [timestamp],
              filename: path.basename(outputPath),
              folder: outputDir,
              size: `${width}x?`
            })
            .on('end', () => {
              thumbnailPaths.push(outputPath)
              resolve()
            })
            .on('error', (err) => {
              logger.warn('Failed to generate thumbnail', err, { timestamp, outputPath })
              reject(err)
            })
        })
      )
    )

    logger.info('Thumbnails generated successfully', {
      count: thumbnailPaths.length,
      outputDir
    })

    return thumbnailPaths.sort()
  } catch (error) {
    logger.error('Thumbnail generation failed', error as Error, { inputPath, outputDir })
    throw new Error(`Failed to generate thumbnails: ${error}`)
  }
}

/**
 * Generate HLS (HTTP Live Streaming) manifest and segments
 */
export async function generateHLSManifest(options: HLSOptions): Promise<{
  masterPlaylist: string
  qualityPlaylists: Record<string, string>
}> {
  const {
    inputPath,
    outputDir,
    segmentDuration = 6,
    qualities
  } = options

  await fs.mkdir(outputDir, { recursive: true })

  const qualityPlaylists: Record<string, string> = {}

  logger.info('Generating HLS manifest', {
    inputPath,
    outputDir,
    qualities: qualities.length
  })

  // Generate segments for each quality
  for (const quality of qualities) {
    const profile = QUALITY_PROFILES[quality]
    if (!profile) continue

    const qualityDir = path.join(outputDir, quality)
    await fs.mkdir(qualityDir, { recursive: true })

    const [width, height] = profile.resolution.split('x').map(Number)
    const playlistPath = path.join(qualityDir, 'playlist.m3u8')

    await new Promise<void>((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          // Video
          '-c:v libx264',
          `-profile:v ${profile.profile}`,
          `-b:v ${profile.videoBitrate}`,
          `-maxrate ${profile.videoBitrate}`,
          `-bufsize ${parseInt(profile.videoBitrate) * 2}k`,

          // Audio
          '-c:a aac',
          `-b:a ${profile.audioBitrate}`,
          '-ac 2',

          // Scaling
          `-vf scale=${width}:${height}:force_original_aspect_ratio=decrease`,

          // HLS settings
          '-f hls',
          `-hls_time ${segmentDuration}`,
          '-hls_playlist_type vod',
          '-hls_segment_filename', path.join(qualityDir, 'segment_%03d.ts'),
          '-hls_flags independent_segments'
        ])
        .output(playlistPath)
        .on('end', () => {
          qualityPlaylists[quality] = playlistPath
          resolve()
        })
        .on('error', (err) => {
          logger.error('HLS generation failed for quality', err, { quality })
          reject(err)
        })
        .run()
    })
  }

  // Create master playlist
  const masterPlaylistPath = path.join(outputDir, 'master.m3u8')
  const masterPlaylistContent = generateMasterPlaylist(qualities, qualityPlaylists)
  await fs.writeFile(masterPlaylistPath, masterPlaylistContent, 'utf-8')

  logger.info('HLS manifest generation completed', {
    masterPlaylist: masterPlaylistPath,
    qualities: qualities.length
  })

  return {
    masterPlaylist: masterPlaylistPath,
    qualityPlaylists
  }
}

/**
 * Generate master playlist content for HLS
 */
function generateMasterPlaylist(
  qualities: string[],
  qualityPlaylists: Record<string, string>
): string {
  let content = '#EXTM3U\n#EXT-X-VERSION:3\n\n'

  for (const quality of qualities) {
    const profile = QUALITY_PROFILES[quality]
    if (!profile) continue

    const [width, height] = profile.resolution.split('x').map(Number)
    const bandwidth = parseInt(profile.videoBitrate) * 1000 + parseInt(profile.audioBitrate) * 1000

    content += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidth},RESOLUTION=${width}x${height},NAME="${quality}"\n`
    content += `${quality}/playlist.m3u8\n\n`
  }

  return content
}

/**
 * Extract audio track from video
 */
export async function extractAudio(
  inputPath: string,
  outputPath: string,
  options: {
    bitrate?: string
    codec?: string
  } = {}
): Promise<string> {
  const { bitrate = '192k', codec = 'aac' } = options

  const outputDir = path.dirname(outputPath)
  await fs.mkdir(outputDir, { recursive: true })

  return new Promise((resolve, reject) => {
    logger.info('Extracting audio from video', { inputPath, outputPath })

    ffmpeg(inputPath)
      .noVideo()
      .audioCodec(codec)
      .audioBitrate(bitrate)
      .output(outputPath)
      .on('end', () => {
        logger.info('Audio extraction completed', { outputPath })
        resolve(outputPath)
      })
      .on('error', (err) => {
        logger.error('Audio extraction failed', err, { inputPath })
        reject(new Error(`Audio extraction failed: ${err.message}`))
      })
      .run()
  })
}

/**
 * Generate video checksum for integrity verification
 */
export async function generateVideoChecksum(filePath: string): Promise<string> {
  const fileBuffer = await fs.readFile(filePath)
  const hash = createHash('sha256')
  hash.update(fileBuffer)
  return hash.digest('hex')
}

/**
 * Get optimal quality profiles based on input video resolution
 */
export function getOptimalQualities(width: number, height: number): string[] {
  const qualities: string[] = []

  // Always include lower qualities for adaptive streaming
  qualities.push('240p', '360p')

  // Add higher qualities based on input resolution
  if (height >= 480) qualities.push('480p')
  if (height >= 720) qualities.push('720p')
  if (height >= 1080) qualities.push('1080p')

  return qualities
}
