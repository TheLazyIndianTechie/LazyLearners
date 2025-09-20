"use client"

import { useState, useRef, useEffect } from "react"
import ReactPlayer from "react-player"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Settings,
  SkipBack,
  SkipForward,
  RotateCcw
} from "lucide-react"
import { useProgress } from "@/hooks/use-progress"

interface VideoPlayerProps {
  url: string
  title?: string
  lessonId?: string
  courseId?: string
  onProgress?: (progress: { played: number; playedSeconds: number; loaded: number }) => void
  onEnded?: () => void
  onReady?: () => void
  startTime?: number
  className?: string
}

export function VideoPlayer({
  url,
  title,
  lessonId,
  courseId,
  onProgress,
  onEnded,
  onReady,
  startTime = 0,
  className = ""
}: VideoPlayerProps) {
  const playerRef = useRef<ReactPlayer>(null)
  const [playing, setPlaying] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [muted, setMuted] = useState(false)
  const [played, setPlayed] = useState(0)
  const [loaded, setLoaded] = useState(0)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [quality, setQuality] = useState('auto')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [lastProgressUpdate, setLastProgressUpdate] = useState(0)

  const { lessonProgress, updateProgress, markCompleted } = useProgress(lessonId, courseId)

  const controlsTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    const resetControlsTimeout = () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      controlsTimeoutRef.current = setTimeout(() => {
        if (playing) setShowControls(false)
      }, 3000)
    }

    if (playing) {
      resetControlsTimeout()
    } else {
      setShowControls(true)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [playing])

  const handlePlayPause = () => {
    setPlaying(!playing)
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const seekTo = (e.clientX - rect.left) / rect.width
    setPlayed(seekTo)
    playerRef.current?.seekTo(seekTo)
  }

  const handleVolumeChange = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const newVolume = (e.clientX - rect.left) / rect.width
    setVolume(newVolume)
    setMuted(false)
  }

  const handleMute = () => {
    setMuted(!muted)
  }

  const handleProgress = (progress: { played: number; playedSeconds: number; loaded: number }) => {
    setPlayed(progress.played)
    setLoaded(progress.loaded)
    setCurrentTime(progress.playedSeconds)

    // Update progress every 5 seconds and when lessonId is available
    if (lessonId && progress.playedSeconds - lastProgressUpdate >= 5) {
      const progressPercent = Math.round(progress.played * 100)
      const timeSpent = progress.playedSeconds - lastProgressUpdate

      updateProgress(lessonId, progressPercent, timeSpent)
        .catch(console.error)

      setLastProgressUpdate(progress.playedSeconds)
    }

    onProgress?.(progress)
  }

  const handleDuration = (duration: number) => {
    setDuration(duration)
  }

  const handleReady = () => {
    setIsReady(true)

    // Resume from saved progress or start time
    const resumeTime = lessonProgress?.progress ? (lessonProgress.progress / 100) * duration : startTime
    if (resumeTime > 0) {
      playerRef.current?.seekTo(resumeTime)
    }

    onReady?.()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleSkip = (seconds: number) => {
    const newTime = Math.max(0, Math.min(duration, currentTime + seconds))
    playerRef.current?.seekTo(newTime / duration)
  }

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const playbackRates = [0.5, 0.75, 1, 1.25, 1.5, 2]
  const qualities = ['auto', '1080p', '720p', '480p', '360p']

  return (
    <div
      className={`relative bg-black rounded-lg overflow-hidden group ${className}`}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => playing && setShowControls(false)}
    >
      <ReactPlayer
        ref={playerRef}
        url={url}
        width="100%"
        height="100%"
        playing={playing}
        volume={muted ? 0 : volume}
        playbackRate={playbackRate}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={() => {
          setPlaying(false)

          // Mark lesson as completed when video ends
          if (lessonId) {
            markCompleted(lessonId).catch(console.error)
          }

          onEnded?.()
        }}
        onReady={handleReady}
        config={{
          youtube: {
            playerVars: {
              showinfo: 0,
              controls: 0,
              modestbranding: 1,
              rel: 0
            }
          },
          vimeo: {
            playerOptions: {
              controls: false,
              title: false,
              byline: false,
              portrait: false
            }
          }
        }}
      />

      {/* Loading State */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Play Button Overlay */}
      {!playing && isReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Button
            size="lg"
            onClick={handlePlayPause}
            className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm border-2 border-white/50"
          >
            <Play className="w-6 h-6 text-white ml-1" />
          </Button>
        </div>
      )}

      {/* Video Title */}
      {title && (
        <div className="absolute top-4 left-4 right-4">
          <h2 className="text-white text-lg font-semibold bg-black/50 backdrop-blur-sm rounded px-3 py-2">
            {title}
          </h2>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Progress Bar */}
        <div className="mb-4">
          <div
            className="relative h-1 bg-white/20 rounded-full cursor-pointer group"
            onClick={handleSeek}
          >
            <div
              className="absolute h-full bg-blue-500 rounded-full"
              style={{ width: `${loaded * 100}%` }}
            />
            <div
              className="absolute h-full bg-white rounded-full"
              style={{ width: `${played * 100}%` }}
            />
            <div
              className="absolute w-3 h-3 bg-white rounded-full -mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${played * 100}%`, marginLeft: '-6px' }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          {/* Left Controls */}
          <div className="flex items-center space-x-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlayPause}
              className="text-white hover:bg-white/20"
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSkip(-10)}
              className="text-white hover:bg-white/20"
            >
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleSkip(10)}
              className="text-white hover:bg-white/20"
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            {/* Volume Control */}
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMute}
                className="text-white hover:bg-white/20"
              >
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <div
                className="w-16 h-1 bg-white/20 rounded-full cursor-pointer"
                onClick={handleVolumeChange}
              >
                <div
                  className="h-full bg-white rounded-full"
                  style={{ width: `${muted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>

            {/* Time Display */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Playback Speed */}
            <div className="relative group">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                {playbackRate}x
              </Button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <Card className="p-2 bg-black/80 border-white/20">
                  <div className="space-y-1">
                    {playbackRates.map(rate => (
                      <Button
                        key={rate}
                        size="sm"
                        variant="ghost"
                        onClick={() => setPlaybackRate(rate)}
                        className={`text-white hover:bg-white/20 w-full justify-start ${
                          rate === playbackRate ? 'bg-white/20' : ''
                        }`}
                      >
                        {rate}x
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            {/* Settings */}
            <div className="relative group">
              <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/20"
              >
                <Settings className="w-4 h-4" />
              </Button>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block">
                <Card className="p-2 bg-black/80 border-white/20 w-32">
                  <div className="space-y-1">
                    <div className="text-white text-xs font-medium px-2 py-1">Quality</div>
                    {qualities.map(q => (
                      <Button
                        key={q}
                        size="sm"
                        variant="ghost"
                        onClick={() => setQuality(q)}
                        className={`text-white hover:bg-white/20 w-full justify-start text-xs ${
                          q === quality ? 'bg-white/20' : ''
                        }`}
                      >
                        {q}
                      </Button>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <Button
              size="sm"
              variant="ghost"
              onClick={handleFullscreen}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}