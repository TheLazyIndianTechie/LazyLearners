"use client"

import React, { useState, useRef, useEffect } from 'react'
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
    const video = videoRef.current
    const videoSource = streamUrl || url
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
  }, [streamUrl, url, onProgress, onEnded])

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

  if (!currentVideoUrl && !videoId) {
    return (
      <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center", className)}>
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
      <div className={cn("relative bg-gray-900 rounded-lg overflow-hidden flex items-center justify-center", className)}>
        <div className="text-center text-white p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-700 flex items-center justify-center">
            <Play className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Video Error</h3>
          <p className="text-gray-300">{state.error}</p>
          <Button
            onClick={() => {
              setState(prev => ({ ...prev, error: null }))
              videoRef.current?.load()
            }}
            variant="outline"
            className="mt-4"
          >
            Try Again
          </Button>
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