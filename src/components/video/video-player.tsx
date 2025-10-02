"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface VideoPlayerProps {
  sessionId: string
  manifestUrl: string
  title?: string
  duration?: number
  thumbnails?: string[]
  watermark?: {
    text: string
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    opacity: number
  }
  onProgress?: (currentTime: number, duration: number) => void
  onQualityChange?: (quality: string) => void
  onError?: (error: Error) => void
  className?: string
}

interface VideoState {
  isPlaying: boolean
  currentTime: number
  duration: number
  bufferedTime: number
  volume: number
  isMuted: boolean
  isFullscreen: boolean
  quality: string
  playbackRate: number
  isLoading: boolean
  error: string | null
}

const HEARTBEAT_INTERVAL = 10000 // 10 seconds
const ANALYTICS_THROTTLE = 1000 // 1 second

function VideoPlayer({
  sessionId,
  manifestUrl,
  title,
  duration: initialDuration = 0,
  thumbnails = [],
  watermark,
  onProgress,
  onQualityChange,
  onError,
  className
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout>()
  const heartbeatIntervalRef = useRef<NodeJS.Timeout>()
  const lastAnalyticsRef = useRef<number>(0)

  const [state, setState] = useState<VideoState>({
    isPlaying: false,
    currentTime: 0,
    duration: initialDuration,
    bufferedTime: 0,
    volume: 1,
    isMuted: false,
    isFullscreen: false,
    quality: '720p',
    playbackRate: 1,
    isLoading: true,
    error: null
  })

  const [showControls, setShowControls] = useState(true)
  const [isDragging, setIsDragging] = useState(false)

  // Available qualities and playback speeds
  const qualities = ['240p', '360p', '480p', '720p', '1080p']
  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Initialize video and setup event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        duration: video.duration,
        isLoading: false
      }))
    }

    const handleTimeUpdate = () => {
      if (!isDragging) {
        setState(prev => ({
          ...prev,
          currentTime: video.currentTime
        }))

        // Throttled analytics tracking
        const now = Date.now()
        if (now - lastAnalyticsRef.current > ANALYTICS_THROTTLE) {
          onProgress?.(video.currentTime, video.duration)
          trackAnalyticsEvent('heartbeat', video.currentTime)
          lastAnalyticsRef.current = now
        }
      }
    }

    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setState(prev => ({
          ...prev,
          bufferedTime: video.buffered.end(video.buffered.length - 1)
        }))
      }
    }

    const handlePlay = () => {
      setState(prev => ({ ...prev, isPlaying: true }))
      trackAnalyticsEvent('play', video.currentTime)
    }

    const handlePause = () => {
      setState(prev => ({ ...prev, isPlaying: false }))
      trackAnalyticsEvent('pause', video.currentTime)
    }

    const handleEnded = () => {
      setState(prev => ({ ...prev, isPlaying: false }))
      trackAnalyticsEvent('ended', video.currentTime)
    }

    const handleError = () => {
      const error = new Error(`Video error: ${video.error?.message || 'Unknown error'}`)
      setState(prev => ({ ...prev, error: error.message, isLoading: false }))
      onError?.(error)
      trackAnalyticsEvent('error', video.currentTime, { error: error.message })
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
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('error', handleError)
    video.addEventListener('volumechange', handleVolumeChange)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('error', handleError)
      video.removeEventListener('volumechange', handleVolumeChange)
    }
  }, [isDragging, onProgress, onError])

  // Setup heartbeat for session monitoring
  useEffect(() => {
    if (sessionId) {
      heartbeatIntervalRef.current = setInterval(() => {
        sendHeartbeat()
      }, HEARTBEAT_INTERVAL)

      return () => {
        if (heartbeatIntervalRef.current) {
          clearInterval(heartbeatIntervalRef.current)
        }
      }
    }
  }, [sessionId])

  // Auto-hide controls
  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }

      if (state.isPlaying && !isDragging) {
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false)
        }, 3000)
      }
    }

    resetControlsTimeout()
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [state.isPlaying, isDragging])

  // Analytics and heartbeat functions
  const trackAnalyticsEvent = useCallback(async (eventType: string, position: number, metadata?: any) => {
    try {
      await fetch('/api/video/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          eventType,
          position,
          metadata
        })
      })
    } catch (error) {
      console.warn('Failed to track analytics event:', error)
    }
  }, [sessionId])

  const sendHeartbeat = useCallback(async () => {
    const video = videoRef.current
    if (!video) return

    try {
      await fetch('/api/video/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          currentPosition: video.currentTime,
          bufferHealth: getBufferHealth(),
          quality: state.quality,
          playbackRate: state.playbackRate,
          volume: state.volume,
          isPlaying: state.isPlaying,
          isFullscreen: state.isFullscreen
        })
      })
    } catch (error) {
      console.warn('Failed to send heartbeat:', error)
    }
  }, [sessionId, state])

  // Utility functions
  const getBufferHealth = () => {
    const video = videoRef.current
    if (!video || video.buffered.length === 0) return 0

    const currentTime = video.currentTime
    const bufferedEnd = video.buffered.end(video.buffered.length - 1)
    return Math.max(0, Math.min(100, ((bufferedEnd - currentTime) / 30) * 100))
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // Control handlers
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
    setState(prev => ({ ...prev, currentTime: newTime }))

    if (!isDragging) {
      trackAnalyticsEvent('seek', newTime, {
        seekDirection: newTime > state.currentTime ? 'forward' : 'backward',
        seekDistance: Math.abs(newTime - state.currentTime)
      })
    }
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
    trackAnalyticsEvent('volume_change', video.currentTime, {
      volume: video.muted ? 0 : video.volume,
      action: video.muted ? 'mute' : 'unmute'
    })
  }

  const toggleFullscreen = async () => {
    const container = containerRef.current
    if (!container) return

    try {
      if (!state.isFullscreen) {
        await container.requestFullscreen()
        setState(prev => ({ ...prev, isFullscreen: true }))
        trackAnalyticsEvent('fullscreen_enter', state.currentTime)
      } else {
        await document.exitFullscreen()
        setState(prev => ({ ...prev, isFullscreen: false }))
        trackAnalyticsEvent('fullscreen_exit', state.currentTime)
      }
    } catch (error) {
      console.warn('Fullscreen error:', error)
    }
  }

  const changeQuality = (newQuality: string) => {
    setState(prev => ({ ...prev, quality: newQuality }))
    onQualityChange?.(newQuality)
    trackAnalyticsEvent('quality_change', state.currentTime, {
      from: state.quality,
      to: newQuality,
      reason: 'manual'
    })
  }

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = rate
    setState(prev => ({ ...prev, playbackRate: rate }))
    trackAnalyticsEvent('speed_change', state.currentTime, {
      from: state.playbackRate,
      to: rate
    })
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    const newTime = Math.max(0, Math.min(state.duration, state.currentTime + seconds))
    video.currentTime = newTime
    trackAnalyticsEvent('seek', newTime, {
      seekDirection: seconds > 0 ? 'forward' : 'backward',
      seekDistance: Math.abs(seconds),
      method: 'skip_button'
    })
  }

  if (state.error) {
    return (
      <div className={cn("relative bg-black rounded-lg overflow-hidden", className)}>
        <div className="flex items-center justify-center h-64 text-white">
          <div className="text-center">
            <p className="text-lg font-semibold mb-2">Video Error</p>
            <p className="text-sm text-gray-300">{state.error}</p>
          </div>
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
        src={manifestUrl}
        className="w-full h-full"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
      />

      {/* Loading Spinner */}
      {state.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Watermark */}
      {watermark && (
        <div
          className={cn(
            "absolute text-white text-sm font-medium z-10 pointer-events-none",
            {
              'top-4 left-4': watermark.position === 'top-left',
              'top-4 right-4': watermark.position === 'top-right',
              'bottom-4 left-4': watermark.position === 'bottom-left',
              'bottom-4 right-4': watermark.position === 'bottom-right',
            }
          )}
          style={{ opacity: watermark.opacity }}
        >
          {watermark.text}
        </div>
      )}

      {/* Video Title */}
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
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
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
            {/* Skip Back */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(-10)}
              className="text-white hover:text-blue-400"
            >
              <SkipBack className="h-4 w-4" />
            </Button>

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

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => skip(10)}
              className="text-white hover:text-blue-400"
            >
              <SkipForward className="h-4 w-4" />
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
            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-blue-400"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <div className="p-2">
                  <div className="text-sm font-medium mb-2">Quality</div>
                  {qualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality}
                      onClick={() => changeQuality(quality)}
                      className={state.quality === quality ? "bg-blue-100" : ""}
                    >
                      {quality}
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <div className="text-sm font-medium mb-2">Speed</div>
                  {playbackSpeeds.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => changePlaybackRate(speed)}
                      className={state.playbackRate === speed ? "bg-blue-100" : ""}
                    >
                      {speed}x
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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

// Export both default and named export for compatibility
export default VideoPlayer
export { VideoPlayer }