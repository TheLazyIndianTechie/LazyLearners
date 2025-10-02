"use client"

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface SimpleVideoPlayerProps {
  url?: string
  videoId?: string
  title?: string
  lessonId?: string
  courseId?: string
  onProgress?: (progress: number) => void
  onEnded?: () => void
  className?: string
}

interface VideoState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  isLoading: boolean
  error: string | null
}

const FALLBACK_VIDEO_URL = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"

function isLikelyPlayableUrl(u?: string | null) {
  if (!u) return false
  try {
    const parsed = new URL(u)
    const ext = parsed.pathname.split('.').pop()?.toLowerCase()
    // Allow common HTML5 video formats and HLS
    if (ext && ["mp4", "webm", "ogg", "m3u8"].includes(ext)) return true
    // Explicitly disallow YouTube URLs for <video>
    if (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")) return false
    return false
  } catch {
    return false
  }
}

function isYouTubeUrl(u?: string | null) {
  if (!u) return false
  try {
    const parsed = new URL(u)
    return parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be")
  } catch {
    return false
  }
}

function getYouTubeId(u?: string | null) {
  if (!u) return null
  try {
    const parsed = new URL(u)
    if (parsed.hostname.includes('youtu.be')) {
      // youtu.be/<id>
      return parsed.pathname.slice(1) || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      // youtube.com/watch?v=<id>
      const v = parsed.searchParams.get('v')
      if (v) return v
      // youtube.com/embed/<id>
      const parts = parsed.pathname.split('/')
      const idx = parts.indexOf('embed')
      if (idx >= 0 && parts[idx+1]) return parts[idx+1]
    }
    return null
  } catch {
    return null
  }
}

export function SimpleVideoPlayer({
  url,
  videoId,
  title,
  lessonId,
  courseId,
  onProgress,
  onEnded,
  className
}: SimpleVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [showControls, setShowControls] = useState(true)
  const [streamUrl, setStreamUrl] = useState<string | null>(null)

  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    isLoading: false,
    error: null
  })

  const youtubeUrl = url && isYouTubeUrl(url) ? url : null
  const youtubeId = useMemo(() => getYouTubeId(youtubeUrl || undefined), [youtubeUrl])

  // Fetch streaming URL when videoId is provided
  useEffect(() => {
    if (!videoId || url) return

    const fetchStreamUrl = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        const params = new URLSearchParams({
          videoId,
          ...(courseId && { courseId }),
          quality: 'auto',
          format: 'hls'
        })

        const response = await fetch(`/api/video/stream?${params.toString()}`)
        const data = await response.json()

        if (data.success && data.data.streamUrl) {
          setStreamUrl(data.data.streamUrl)
        } else {
          setState(prev => ({
            ...prev,
            error: data.error?.message || 'Failed to load video stream',
            isLoading: false
          }))
        }
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: 'Failed to connect to video service',
          isLoading: false
        }))
      }
    }

    fetchStreamUrl()
  }, [videoId, courseId, url])

  // Initialize video and setup event listeners
  useEffect(() => {
    // If this is a YouTube URL, skip native <video> setup; handled by react-player
    if (youtubeUrl) return
    const video = videoRef.current
    // Choose a safe playable source
    let chosenSource: string | null = streamUrl || (isLikelyPlayableUrl(url) ? url! : null)
    if (!chosenSource && !streamUrl && url && !isLikelyPlayableUrl(url)) {
      // Fallback to a sample video when URL is not directly playable (e.g., YouTube)
      chosenSource = FALLBACK_VIDEO_URL
      setStreamUrl(FALLBACK_VIDEO_URL)
    }

    const videoSource = chosenSource
    if (!video || !videoSource) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false
      }))
    }

    const handleTimeUpdate = () => {
      setState(prev => ({
        ...prev,
        currentTime: video.currentTime
      }))

      if (onProgress) {
        const progress = video.duration > 0 ? (video.currentTime / video.duration) * 100 : 0
        onProgress(progress)
      }
    }

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }))
    }

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }))
    }

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }))
      onEnded?.()
    }

    const handleError = () => {
      const errorMessage = video.error?.message || 'Video failed to load'
      // If the current source isn't already the fallback, try switching to fallback once
      if (video.src !== FALLBACK_VIDEO_URL) {
        try {
          video.src = FALLBACK_VIDEO_URL
          video.load()
          void video.play().catch(() => {/* ignore */})
          setStreamUrl(FALLBACK_VIDEO_URL)
          setState(prev => ({ ...prev, isLoading: false, error: null }))
          return
        } catch {}
      }
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false
      }))
    }

    const handleVolumeChange = () => {
      setState(prev => ({
        ...prev,
        volume: video.volume,
        isMuted: video.muted
      }))
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('volumechange', handleVolumeChange)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [streamUrl, url, youtubeUrl, onProgress, onEnded])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (state.isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const handleSeek = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newTime = value[0]
    video.currentTime = newTime
  }

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = value[0]
    video.volume = newVolume
    video.muted = newVolume === 0
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!state.isFullscreen) {
        await container.requestFullscreen()
        setState(prev => ({ ...prev, isFullscreen: true }))
      } else {
        await document.exitFullscreen()
        setState(prev => ({ ...prev, isFullscreen: false }))
      }
    } catch (error) {
      console.warn('Fullscreen error:', error)
    }
  }

  const currentVideoUrl = streamUrl || url

  // Show loading state while fetching stream URL
  if (videoId && !currentVideoUrl && !state.error && state.isLoading) {
    return (
      <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]", className)}>
        <div className="text-center text-white p-8">
          <div className="w-16 h-16 mx-auto mb-4 relative">
            <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Loading Video...</h3>
          <p className="text-gray-400 text-sm">Preparing your content</p>
        </div>
      </div>
    )
  }

  if (!currentVideoUrl && !videoId) {
    return (
      <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]", className)}>
        <div className="text-center text-white p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-700 flex items-center justify-center">
            <Play className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Video Available</h3>
          <p className="text-gray-300">Select a lesson to watch the video</p>
        </div>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center min-h-[400px]", className)}>
        <div className="text-center text-white p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-900/50 border-2 border-red-500 flex items-center justify-center">
            <Play className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2 text-red-400">Video Error</h3>
          <p className="text-gray-300 mb-4">{state.error}</p>
          <Button
            onClick={() => {
              setState(prev => ({ ...prev, error: null, isLoading: true }))
              if (videoId) {
                // Retry fetching stream URL
                window.location.reload()
              } else if (videoRef.current) {
                videoRef.current.load()
              }
            }}
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Render YouTube via react-player when applicable
  if (youtubeUrl && youtubeId) {
    const embedSrc = `https://www.youtube.com/embed/${youtubeId}?autoplay=1&mute=1&playsinline=1&rel=0`
    return (
      <div className={cn("relative bg-black rounded-lg overflow-hidden group", className)}>
        <div className="relative" style={{ paddingTop: '56.25%' }}>
          <iframe
            src={embedSrc}
            title={title || 'YouTube video player'}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full"
          />
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative bg-black rounded-lg overflow-hidden group", className)}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => !state.isPlaying || setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentVideoUrl}
        className="w-full h-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        crossOrigin="anonymous"
      />

      {/* Loading Spinner */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Title Overlay */}
      {title && showControls && (
        <div className="absolute top-4 left-4 right-4 text-white z-20">
          <h3 className="text-lg font-semibold truncate">{title}</h3>
        </div>
      )}

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <Slider
            value={[state.currentTime]}
            max={state.duration}
            step={0.1}
            onValueChange={handleSeek}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-300 mt-1">
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlay}
              className="text-white hover:text-blue-400"
            >
              {state.isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="text-white hover:text-blue-400"
              >
                {state.isMuted || state.volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <div className="w-20">
                <Slider
                  value={[state.isMuted ? 0 : state.volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Fullscreen */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400"
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export as both named and default
export default SimpleVideoPlayer