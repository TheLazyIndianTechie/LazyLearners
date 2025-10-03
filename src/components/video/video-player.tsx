"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize, Settings, SkipBack, SkipForward, Minimize, PictureInPicture, Subtitles } from 'lucide-react'
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
  isPiP: boolean
  showCaptions: boolean
  thumbnailPreview: { time: number; url: string } | null
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
  const seekBarRef = useRef<HTMLDivElement>(null)
  const thumbnailCanvasRef = useRef<HTMLCanvasElement>(null)

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
    error: null,
    isPiP: false,
    showCaptions: false,
    thumbnailPreview: null
  })

  const [showControls, setShowControls] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Available qualities and playback speeds
  const qualities = ['240p', '360p', '480p', '720p', '1080p']
  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      const video = videoRef.current
      if (!video) return

      // Ignore keyboard shortcuts if user is typing in an input
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          skip(-5)
          break
        case 'ArrowRight':
          e.preventDefault()
          skip(5)
          break
        case 'ArrowUp':
          e.preventDefault()
          handleVolumeChange([Math.min(1, state.volume + 0.1)])
          break
        case 'ArrowDown':
          e.preventDefault()
          handleVolumeChange([Math.max(0, state.volume - 0.1)])
          break
        case 'f':
          e.preventDefault()
          toggleFullscreen()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'p':
          e.preventDefault()
          togglePiP()
          break
        case 'c':
          e.preventDefault()
          toggleCaptions()
          break
        case 'j':
          e.preventDefault()
          skip(-10)
          break
        case 'l':
          e.preventDefault()
          skip(10)
          break
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault()
          const percent = parseInt(e.key) / 10
          video.currentTime = video.duration * percent
          break
        case '<':
        case ',':
          e.preventDefault()
          changePlaybackRate(Math.max(0.25, state.playbackRate - 0.25))
          break
        case '>':
        case '.':
          e.preventDefault()
          changePlaybackRate(Math.min(2, state.playbackRate + 0.25))
          break
      }
    }

    document.addEventListener('keydown', handleKeyboard)
    return () => document.removeEventListener('keydown', handleKeyboard)
  }, [state.volume, state.playbackRate, state.isPlaying])

  // Picture-in-Picture event listeners
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleEnterPiP = () => {
      setState(prev => ({ ...prev, isPiP: true }))
    }

    const handleLeavePiP = () => {
      setState(prev => ({ ...prev, isPiP: false }))
    }

    video.addEventListener('enterpictureinpicture', handleEnterPiP)
    video.addEventListener('leavepictureinpicture', handleLeavePiP)

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP)
      video.removeEventListener('leavepictureinpicture', handleLeavePiP)
    }
  }, [])

  // Load saved position from localStorage
  useEffect(() => {
    const video = videoRef.current
    if (!video || !sessionId) return

    const savedPosition = localStorage.getItem(`video-position-${sessionId}`)
    if (savedPosition) {
      const position = parseFloat(savedPosition)
      if (!isNaN(position) && position > 0 && position < video.duration - 5) {
        video.currentTime = position
      }
    }

    // Save position periodically
    const saveInterval = setInterval(() => {
      if (video.currentTime > 0) {
        localStorage.setItem(`video-position-${sessionId}`, video.currentTime.toString())
      }
    }, 5000)

    return () => clearInterval(saveInterval)
  }, [sessionId])

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

  const togglePiP = async () => {
    const video = videoRef.current
    if (!video) return

    try {
      if (!state.isPiP) {
        if ('pictureInPictureEnabled' in document) {
          await video.requestPictureInPicture()
          setState(prev => ({ ...prev, isPiP: true }))
          trackAnalyticsEvent('pip_enter', state.currentTime)
        }
      } else {
        await document.exitPictureInPicture()
        setState(prev => ({ ...prev, isPiP: false }))
        trackAnalyticsEvent('pip_exit', state.currentTime)
      }
    } catch (error) {
      console.warn('Picture-in-Picture error:', error)
    }
  }

  const toggleCaptions = () => {
    const video = videoRef.current
    if (!video || !video.textTracks || video.textTracks.length === 0) return

    const newShowCaptions = !state.showCaptions

    // Toggle all text tracks
    for (let i = 0; i < video.textTracks.length; i++) {
      video.textTracks[i].mode = newShowCaptions ? 'showing' : 'hidden'
    }

    setState(prev => ({ ...prev, showCaptions: newShowCaptions }))
    trackAnalyticsEvent('captions_toggle', state.currentTime, {
      enabled: newShowCaptions
    })
  }

  const generateThumbnailPreview = useCallback(async (seekTime: number) => {
    const video = videoRef.current
    const canvas = thumbnailCanvasRef.current
    if (!video || !canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Create a temporary video element for thumbnail generation
    const tempVideo = document.createElement('video')
    tempVideo.src = video.src
    tempVideo.currentTime = seekTime
    tempVideo.muted = true
    tempVideo.playsInline = true

    return new Promise<string>((resolve) => {
      tempVideo.onseeked = () => {
        canvas.width = 160
        canvas.height = 90
        context.drawImage(tempVideo, 0, 0, canvas.width, canvas.height)
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7)
        resolve(thumbnailUrl)
      }
    })
  }, [])

  const handleSeekBarHover = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const seekBar = seekBarRef.current
    if (!seekBar || state.duration === 0) return

    const rect = seekBar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const hoverTime = percent * state.duration

    // Generate thumbnail for hover position
    const thumbnailUrl = await generateThumbnailPreview(hoverTime)
    if (thumbnailUrl) {
      setState(prev => ({
        ...prev,
        thumbnailPreview: { time: hoverTime, url: thumbnailUrl }
      }))
    }
  }, [state.duration, generateThumbnailPreview])

  const handleSeekBarLeave = useCallback(() => {
    setState(prev => ({ ...prev, thumbnailPreview: null }))
  }, [])

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

      {/* Hidden canvas for thumbnail generation */}
      <canvas ref={thumbnailCanvasRef} className="hidden" />

      {/* Controls */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress Bar */}
        <div
          ref={seekBarRef}
          className={cn("mb-3 md:mb-4 relative", isMobile && "py-2")}
          onMouseMove={handleSeekBarHover}
          onMouseLeave={handleSeekBarLeave}
        >
          {/* Thumbnail Preview */}
          {state.thumbnailPreview && !isMobile && (
            <div
              className="absolute bottom-full mb-2 transform -translate-x-1/2 pointer-events-none"
              style={{
                left: `${(state.thumbnailPreview.time / state.duration) * 100}%`
              }}
            >
              <div className="bg-black rounded-lg overflow-hidden shadow-lg">
                <img
                  src={state.thumbnailPreview.url}
                  alt="Preview"
                  className="w-40 h-auto"
                />
                <div className="text-white text-xs text-center py-1 px-2">
                  {formatTime(state.thumbnailPreview.time)}
                </div>
              </div>
            </div>
          )}

          <Slider
            value={[state.currentTime]}
            max={state.duration}
            step={0.1}
            onValueChange={handleSeek}
            onPointerDown={() => setIsDragging(true)}
            onPointerUp={() => setIsDragging(false)}
            className={cn(
              "w-full touch-manipulation",
              isMobile && "[&_[role=slider]]:h-5 [&_[role=slider]]:w-5"
            )}
            aria-label="Video progress"
          />
          <div className={cn(
            "flex justify-between text-gray-300 mt-1",
            isMobile ? "text-sm" : "text-xs"
          )}>
            <span>{formatTime(state.currentTime)}</span>
            <span>{formatTime(state.duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between flex-wrap md:flex-nowrap gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            {/* Skip Back */}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={() => skip(-10)}
              className={cn(
                "text-white hover:text-blue-400",
                isMobile && "min-h-[44px] min-w-[44px] p-2"
              )}
              aria-label="Skip back 10 seconds"
            >
              <SkipBack className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>

            {/* Play/Pause */}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={togglePlay}
              className={cn(
                "text-white hover:text-blue-400",
                isMobile && "min-h-[44px] min-w-[44px] p-2"
              )}
              aria-label={state.isPlaying ? "Pause" : "Play"}
            >
              {state.isPlaying ? (
                <Pause className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
              ) : (
                <Play className={isMobile ? "h-6 w-6" : "h-5 w-5"} />
              )}
            </Button>

            {/* Skip Forward */}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={() => skip(10)}
              className={cn(
                "text-white hover:text-blue-400",
                isMobile && "min-h-[44px] min-w-[44px] p-2"
              )}
              aria-label="Skip forward 10 seconds"
            >
              <SkipForward className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>

            {/* Volume */}
            <div className="flex items-center gap-1 md:gap-2">
              <Button
                variant="ghost"
                size={isMobile ? "default" : "sm"}
                onClick={toggleMute}
                className={cn(
                  "text-white hover:text-blue-400",
                  isMobile && "min-h-[44px] min-w-[44px] p-2"
                )}
                aria-label={state.isMuted ? "Unmute" : "Mute"}
              >
                {state.isMuted || state.volume === 0 ? (
                  <VolumeX className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                ) : (
                  <Volume2 className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                )}
              </Button>
              {/* Hide volume slider on very small screens */}
              <div className={cn("hidden sm:block", isMobile ? "w-24" : "w-20")}>
                <Slider
                  value={[state.isMuted ? 0 : state.volume]}
                  max={1}
                  step={0.1}
                  onValueChange={handleVolumeChange}
                  className="touch-manipulation"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2">
            {/* Captions */}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={toggleCaptions}
              className={cn(
                "text-white hover:text-blue-400",
                state.showCaptions && "text-blue-400",
                isMobile && "min-h-[44px] min-w-[44px] p-2"
              )}
              title="Toggle captions (C)"
              aria-label="Toggle captions"
            >
              <Subtitles className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
            </Button>

            {/* Settings Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={isMobile ? "default" : "sm"}
                  className={cn(
                    "text-white hover:text-blue-400",
                    isMobile && "min-h-[44px] min-w-[44px] p-2"
                  )}
                  aria-label="Settings"
                >
                  <Settings className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className={isMobile ? "min-w-[200px]" : ""}>
                <div className="p-2">
                  <div className={cn("font-medium mb-2", isMobile ? "text-base" : "text-sm")}>Quality</div>
                  {qualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality}
                      onClick={() => changeQuality(quality)}
                      className={cn(
                        state.quality === quality ? "bg-blue-100 dark:bg-blue-900" : "",
                        isMobile && "min-h-[44px] text-base"
                      )}
                    >
                      {quality}
                    </DropdownMenuItem>
                  ))}
                </div>
                <div className="p-2 border-t">
                  <div className={cn("font-medium mb-2", isMobile ? "text-base" : "text-sm")}>Speed</div>
                  {playbackSpeeds.map((speed) => (
                    <DropdownMenuItem
                      key={speed}
                      onClick={() => changePlaybackRate(speed)}
                      className={cn(
                        state.playbackRate === speed ? "bg-blue-100 dark:bg-blue-900" : "",
                        isMobile && "min-h-[44px] text-base"
                      )}
                    >
                      {speed}x
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Picture-in-Picture - Hide on very small mobile */}
            {'pictureInPictureEnabled' in document && (
              <Button
                variant="ghost"
                size={isMobile ? "default" : "sm"}
                onClick={togglePiP}
                className={cn(
                  "text-white hover:text-blue-400 hidden sm:inline-flex",
                  isMobile && "min-h-[44px] min-w-[44px] p-2"
                )}
                title="Picture in Picture (P)"
                aria-label="Picture in Picture"
              >
                <PictureInPicture className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              </Button>
            )}

            {/* Fullscreen */}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={toggleFullscreen}
              className={cn(
                "text-white hover:text-blue-400",
                isMobile && "min-h-[44px] min-w-[44px] p-2"
              )}
              title="Fullscreen (F)"
              aria-label={state.isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {state.isFullscreen ? (
                <Minimize className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              ) : (
                <Maximize className={isMobile ? "h-5 w-5" : "h-4 w-4"} />
              )}
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