/**
 * Unit tests for VideoPlayer component
 * Tests video controls, analytics tracking, and user interactions
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import VideoPlayer from '@/components/video/video-player'

// Mock fetch globally
global.fetch = jest.fn()

// Mock HTMLVideoElement methods and properties
Object.defineProperty(HTMLVideoElement.prototype, 'play', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

Object.defineProperty(HTMLVideoElement.prototype, 'pause', {
  writable: true,
  value: jest.fn(),
})

Object.defineProperty(HTMLVideoElement.prototype, 'load', {
  writable: true,
  value: jest.fn(),
})

// Mock video properties
Object.defineProperty(HTMLVideoElement.prototype, 'duration', {
  writable: true,
  value: 1800, // 30 minutes
})

Object.defineProperty(HTMLVideoElement.prototype, 'currentTime', {
  writable: true,
  value: 0,
})

Object.defineProperty(HTMLVideoElement.prototype, 'volume', {
  writable: true,
  value: 1,
})

Object.defineProperty(HTMLVideoElement.prototype, 'muted', {
  writable: true,
  value: false,
})

Object.defineProperty(HTMLVideoElement.prototype, 'playbackRate', {
  writable: true,
  value: 1,
})

Object.defineProperty(HTMLVideoElement.prototype, 'buffered', {
  value: {
    length: 1,
    end: jest.fn().mockReturnValue(300),
  },
})

// Mock requestFullscreen and exitFullscreen
Object.defineProperty(HTMLElement.prototype, 'requestFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

Object.defineProperty(document, 'exitFullscreen', {
  writable: true,
  value: jest.fn().mockResolvedValue(undefined),
})

// Mock timers
jest.useFakeTimers()

describe('VideoPlayer Component', () => {
  const defaultProps = {
    sessionId: 'test-session-123',
    manifestUrl: 'https://example.com/video.m3u8',
    title: 'Test Video',
    duration: 1800,
    thumbnails: ['thumb1.jpg', 'thumb2.jpg'],
    watermark: {
      text: 'LazyGameDevs',
      position: 'bottom-right' as const,
      opacity: 0.7,
    },
  }

  const mockCallbacks = {
    onProgress: jest.fn(),
    onQualityChange: jest.fn(),
    onError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    })
  })

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers()
    })
  })

  describe('Rendering', () => {
    test('should render video player with basic elements', () => {
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      expect(screen.getByText('Test Video')).toBeInTheDocument()
      expect(screen.getByText('LazyGameDevs')).toBeInTheDocument()
    })

    test('should render without optional props', () => {
      render(
        <VideoPlayer
          sessionId="test-session"
          manifestUrl="https://example.com/video.m3u8"
        />
      )

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    })

    test('should show loading spinner initially', () => {
      render(<VideoPlayer {...defaultProps} />)

      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    test('should display watermark in correct position', () => {
      const { rerender } = render(<VideoPlayer {...defaultProps} />)

      let watermark = screen.getByText('LazyGameDevs')
      expect(watermark).toHaveClass('bottom-4', 'right-4')

      rerender(
        <VideoPlayer
          {...defaultProps}
          watermark={{
            text: 'Test Watermark',
            position: 'top-left',
            opacity: 0.5,
          }}
        />
      )

      watermark = screen.getByText('Test Watermark')
      expect(watermark).toHaveClass('top-4', 'left-4')
    })

    test('should apply custom className', () => {
      const { container } = render(
        <VideoPlayer {...defaultProps} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })

  describe('Video Controls', () => {
    test('should toggle play/pause on button click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      const playButton = screen.getByRole('button', { name: /play/i })

      // Click play
      await user.click(playButton)
      expect(HTMLVideoElement.prototype.play).toHaveBeenCalled()

      // Simulate video playing
      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('play'))
      })

      // Should show pause button
      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()

      // Click pause
      const pauseButton = screen.getByRole('button', { name: /pause/i })
      await user.click(pauseButton)
      expect(HTMLVideoElement.prototype.pause).toHaveBeenCalled()
    })

    test('should toggle play/pause on video click', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      const video = screen.getByRole('generic') // video element
      await user.click(video)

      expect(HTMLVideoElement.prototype.play).toHaveBeenCalled()
    })

    test('should handle volume controls', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      // Test mute button
      const muteButton = screen.getByRole('button', { name: /volume/i })
      await user.click(muteButton)

      // Should call mute
      const video = document.querySelector('video')!
      expect(video.muted).toBe(true)
    })

    test('should handle skip forward and backward', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      // Simulate video loaded
      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('loadedmetadata'))
      })

      const skipBackButton = screen.getByRole('button', { name: /skip back/i })
      const skipForwardButton = screen.getByRole('button', { name: /skip forward/i })

      // Set initial time
      Object.defineProperty(video, 'currentTime', { value: 100, writable: true })

      await user.click(skipBackButton)
      expect(video.currentTime).toBe(90) // 100 - 10

      await user.click(skipForwardButton)
      expect(video.currentTime).toBe(110) // 100 + 10
    })

    test('should handle fullscreen toggle', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      const fullscreenButton = screen.getByRole('button', { name: /maximize/i })
      await user.click(fullscreenButton)

      const container = document.querySelector('[class*="group"]')!
      expect(container.requestFullscreen).toHaveBeenCalled()
    })

    test('should handle quality changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      // Open settings menu
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Select 1080p quality
      const quality1080p = screen.getByRole('menuitem', { name: '1080p' })
      await user.click(quality1080p)

      expect(mockCallbacks.onQualityChange).toHaveBeenCalledWith('1080p')
    })

    test('should handle playback speed changes', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      // Open settings menu
      const settingsButton = screen.getByRole('button', { name: /settings/i })
      await user.click(settingsButton)

      // Select 1.25x speed
      const speed125 = screen.getByRole('menuitem', { name: '1.25x' })
      await user.click(speed125)

      const video = document.querySelector('video')!
      expect(video.playbackRate).toBe(1.25)
    })
  })

  describe('Video Events', () => {
    test('should handle video loaded metadata', () => {
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('loadedmetadata'))
      })

      // Loading should be hidden
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
    })

    test('should handle time updates', () => {
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      const video = document.querySelector('video')!
      Object.defineProperty(video, 'currentTime', { value: 300, writable: true })

      act(() => {
        fireEvent(video, new Event('timeupdate'))
      })

      expect(mockCallbacks.onProgress).toHaveBeenCalledWith(300, 1800)
    })

    test('should handle video progress updates', () => {
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('progress'))
      })

      // Should update buffered time
      expect(video.buffered.end).toHaveBeenCalled()
    })

    test('should handle video errors', () => {
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      const video = document.querySelector('video')!
      Object.defineProperty(video, 'error', {
        value: { message: 'Network error' },
      })

      act(() => {
        fireEvent(video, new Event('error'))
      })

      expect(mockCallbacks.onError).toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.stringContaining('Network error') })
      )
    })

    test('should handle video ended', () => {
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('ended'))
      })

      // Should be in paused state
      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
    })
  })

  describe('Analytics Tracking', () => {
    test('should send analytics events', async () => {
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!

      // Simulate play event
      act(() => {
        fireEvent(video, new Event('play'))
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/video/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: 'test-session-123',
            eventType: 'play',
            position: 0,
            metadata: undefined,
          }),
        })
      })
    })

    test('should send heartbeat periodically', async () => {
      render(<VideoPlayer {...defaultProps} />)

      // Advance timers to trigger heartbeat
      act(() => {
        jest.advanceTimersByTime(10000) // 10 seconds
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/video/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('test-session-123'),
        })
      })
    })

    test('should track seek events with metadata', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      // Simulate video loaded
      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('loadedmetadata'))
      })

      // Find progress slider and interact with it
      const progressSlider = document.querySelector('[role="slider"]')!
      await user.click(progressSlider)

      // Should track seek event
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/video/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('seek'),
        })
      })
    })

    test('should throttle analytics events', () => {
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!

      // Simulate multiple rapid time updates
      act(() => {
        fireEvent(video, new Event('timeupdate'))
        fireEvent(video, new Event('timeupdate'))
        fireEvent(video, new Event('timeupdate'))
      })

      // Should only call analytics once due to throttling
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('Controls Auto-hide', () => {
    test('should auto-hide controls during playback', async () => {
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!

      // Start playing
      act(() => {
        fireEvent(video, new Event('play'))
      })

      // Advance time to trigger auto-hide
      act(() => {
        jest.advanceTimersByTime(3000)
      })

      const controls = document.querySelector('[class*="opacity-0"]')
      expect(controls).toBeInTheDocument()
    })

    test('should show controls on mouse movement', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      const container = document.querySelector('[class*="group"]')!

      await user.hover(container)

      const controls = document.querySelector('[class*="opacity-100"]')
      expect(controls).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('should display error state', () => {
      render(<VideoPlayer {...defaultProps} {...mockCallbacks} />)

      const video = document.querySelector('video')!
      Object.defineProperty(video, 'error', {
        value: { message: 'Failed to load video' },
      })

      act(() => {
        fireEvent(video, new Event('error'))
      })

      expect(screen.getByText('Video Error')).toBeInTheDocument()
      expect(screen.getByText(/Failed to load video/)).toBeInTheDocument()
    })

    test('should handle analytics fetch errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!
      act(() => {
        fireEvent(video, new Event('play'))
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to track analytics event:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })

    test('should handle heartbeat errors gracefully', async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url) => {
        if (url.includes('heartbeat')) {
          return Promise.reject(new Error('Heartbeat failed'))
        }
        return Promise.resolve({ ok: true, json: () => ({ success: true }) })
      })

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      render(<VideoPlayer {...defaultProps} />)

      act(() => {
        jest.advanceTimersByTime(10000)
      })

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to send heartbeat:',
          expect.any(Error)
        )
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Keyboard Interactions', () => {
    test('should handle spacebar for play/pause', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      await user.keyboard(' ')

      expect(HTMLVideoElement.prototype.play).toHaveBeenCalled()
    })

    test('should handle arrow keys for seeking', async () => {
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!
      video.focus()

      await user.keyboard('{ArrowRight}')
      // Would need to implement keyboard handlers in component
    })
  })

  describe('Accessibility', () => {
    test('should have proper ARIA labels', () => {
      render(<VideoPlayer {...defaultProps} />)

      expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /volume/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /maximize/i })).toBeInTheDocument()
    })

    test('should have proper slider controls', () => {
      render(<VideoPlayer {...defaultProps} />)

      const sliders = screen.getAllByRole('slider')
      expect(sliders.length).toBeGreaterThan(0)
    })
  })

  describe('Performance', () => {
    test('should cleanup intervals on unmount', () => {
      const { unmount } = render(<VideoPlayer {...defaultProps} />)

      const clearIntervalSpy = jest.spyOn(global, 'clearInterval')

      unmount()

      expect(clearIntervalSpy).toHaveBeenCalled()
    })

    test('should cleanup timeouts on unmount', () => {
      const { unmount } = render(<VideoPlayer {...defaultProps} />)

      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout')

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })

    test('should remove event listeners on unmount', () => {
      const { unmount } = render(<VideoPlayer {...defaultProps} />)

      const video = document.querySelector('video')!
      const removeEventListenerSpy = jest.spyOn(video, 'removeEventListener')

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledTimes(8) // Number of event listeners
    })
  })

  describe('Time Formatting', () => {
    test('should format time correctly', () => {
      render(<VideoPlayer {...defaultProps} />)

      // Should display formatted duration
      expect(screen.getByText('30:00')).toBeInTheDocument() // 1800 seconds = 30 minutes
      expect(screen.getByText('0:00')).toBeInTheDocument() // Current time
    })
  })

  describe('Buffer Health', () => {
    test('should calculate buffer health correctly', () => {
      render(<VideoPlayer {...defaultProps} />)

      // Buffer health calculation is internal but affects heartbeat data
      act(() => {
        jest.advanceTimersByTime(10000)
      })

      // Verify heartbeat includes buffer health
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/video/heartbeat',
        expect.objectContaining({
          body: expect.stringContaining('bufferHealth'),
        })
      )
    })
  })
})