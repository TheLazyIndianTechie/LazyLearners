/**
 * Unit tests for VideoStreamingWrapper component
 * Tests session initialization, error handling, and component integration
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jest } from '@jest/globals'
import VideoStreamingWrapper from '@/components/video/video-streaming-wrapper'

// Mock the toast hook
jest.mock('@/hooks/use-toast', () => ({
  toast: jest.fn(),
}))

// Mock the VideoPlayer component
jest.mock('@/components/video/video-player', () => {
  return function MockVideoPlayer(props: any) {
    return (
      <div data-testid="video-player">
        <div>Session ID: {props.sessionId}</div>
        <div>Manifest URL: {props.manifestUrl}</div>
        <div>Title: {props.title}</div>
        <button onClick={() => props.onProgress?.(300, 1800)}>Simulate Progress</button>
        <button onClick={() => props.onQualityChange?.('1080p')}>Change Quality</button>
        <button onClick={() => props.onError?.(new Error('Video error'))}>Trigger Error</button>
      </div>
    )
  }
})

// Mock fetch globally
global.fetch = jest.fn()

// Mock navigator properties
Object.defineProperty(navigator, 'userAgent', {
  writable: true,
  value: 'Mozilla/5.0 (Test Browser)',
})

Object.defineProperty(navigator, 'platform', {
  writable: true,
  value: 'Test Platform',
})

Object.defineProperty(global, 'screen', {
  writable: true,
  value: {
    width: 1920,
    height: 1080,
  },
})

describe('VideoStreamingWrapper Component', () => {
  const defaultProps = {
    videoId: 'test-video-123',
    courseId: 'course-456',
    title: 'Test Video Title',
    description: 'Test video description',
    className: 'test-wrapper-class',
  }

  const mockStreamingResponse = {
    success: true,
    data: {
      sessionId: 'session-123',
      manifestUrl: 'https://cdn.example.com/video.m3u8',
      format: 'hls',
      qualities: ['720p', '1080p'],
      duration: 1800,
      thumbnails: ['thumb1.jpg', 'thumb2.jpg'],
      watermark: {
        text: 'LazyGameDevs - test',
        position: 'bottom-right',
        opacity: 0.7,
      },
      restrictions: {
        maxConcurrentSessions: 3,
        seekingDisabled: false,
        downloadDisabled: true,
      },
    },
  }

  let mockToast: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    mockToast = require('@/hooks/use-toast').toast
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockStreamingResponse,
    })
  })

  describe('Initial State', () => {
    test('should render ready state without session', () => {
      render(<VideoStreamingWrapper {...defaultProps} />)

      expect(screen.getByText('Ready to Watch')).toBeInTheDocument()
      expect(screen.getByText('Test Video Title')).toBeInTheDocument()
      expect(screen.getByText('Test video description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start video/i })).toBeInTheDocument()
    })

    test('should render without optional props', () => {
      render(<VideoStreamingWrapper videoId="test-video" />)

      expect(screen.getByText('Ready to Watch')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start video/i })).toBeInTheDocument()
    })

    test('should apply custom className', () => {
      const { container } = render(<VideoStreamingWrapper {...defaultProps} />)

      expect(container.firstChild).toHaveClass('test-wrapper-class')
    })
  })

  describe('Session Initialization', () => {
    test('should initialize streaming session successfully', async () => {
      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      expect(screen.getByText('Initializing Video')).toBeInTheDocument()
      expect(screen.getByText('Setting up streaming session...')).toBeInTheDocument()

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/video/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            videoId: 'test-video-123',
            courseId: 'course-456',
            deviceInfo: {
              userAgent: 'Mozilla/5.0 (Test Browser)',
              platform: 'Test Platform',
              screenResolution: '1920x1080',
            },
          }),
        })
      })

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Video Ready',
        description: 'Streaming session initialized successfully',
      })
    })

    test('should send device info correctly', async () => {
      const user = userEvent.setup()
      render(<VideoStreamingWrapper videoId="test-video" />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/video/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: expect.stringContaining('Mozilla/5.0 (Test Browser)'),
        })
      })
    })

    test('should handle initialization without courseId', async () => {
      const user = userEvent.setup()
      render(<VideoStreamingWrapper videoId="test-video" />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        const fetchCall = (global.fetch as jest.Mock).mock.calls[0]
        const requestBody = JSON.parse(fetchCall[1].body)
        expect(requestBody.courseId).toBeUndefined()
      })
    })
  })

  describe('Video Player Integration', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })
    })

    test('should pass correct props to VideoPlayer', () => {
      expect(screen.getByText('Session ID: session-123')).toBeInTheDocument()
      expect(screen.getByText('Manifest URL: https://cdn.example.com/video.m3u8')).toBeInTheDocument()
      expect(screen.getByText('Title: Test Video Title')).toBeInTheDocument()
    })

    test('should handle video progress updates', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const progressButton = screen.getByRole('button', { name: /simulate progress/i })
      await user.click(progressButton)

      expect(consoleSpy).toHaveBeenCalledWith('Video progress: 17% (300/1800)')

      consoleSpy.mockRestore()
    })

    test('should handle quality changes', async () => {
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const qualityButton = screen.getByRole('button', { name: /change quality/i })
      await user.click(qualityButton)

      expect(consoleSpy).toHaveBeenCalledWith('Quality changed to: 1080p')

      // Should update the quality badge
      await waitFor(() => {
        expect(screen.getByText('Quality: 1080p')).toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    test('should handle video errors', async () => {
      const user = userEvent.setup()

      const errorButton = screen.getByRole('button', { name: /trigger error/i })
      await user.click(errorButton)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Video Error',
        description: 'Video error',
        variant: 'destructive',
      })
    })
  })

  describe('Video Information Display', () => {
    beforeEach(async () => {
      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })
    })

    test('should display video metadata', () => {
      expect(screen.getByText('Test Video Title')).toBeInTheDocument()
      expect(screen.getByText('Test video description')).toBeInTheDocument()
    })

    test('should display video stats badges', () => {
      expect(screen.getByText('Duration: 30:00')).toBeInTheDocument()
      expect(screen.getByText('Quality: 720p')).toBeInTheDocument()
      expect(screen.getByText('Format: HLS')).toBeInTheDocument()
      expect(screen.getByText('Adaptive Quality (2 levels)')).toBeInTheDocument()
    })

    test('should display restrictions information', () => {
      expect(screen.getByText('• Download is disabled for this video')).toBeInTheDocument()
      expect(screen.getByText('• Maximum 3 concurrent session(s) allowed')).toBeInTheDocument()
    })

    test('should show seeking restriction if disabled', async () => {
      // Mock response with seeking disabled
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ...mockStreamingResponse,
          data: {
            ...mockStreamingResponse.data,
            restrictions: {
              ...mockStreamingResponse.data.restrictions,
              seekingDisabled: true,
            },
          },
        }),
      })

      const user = userEvent.setup()
      const { rerender } = render(<VideoStreamingWrapper videoId="new-video" />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('• Seeking is disabled for this video')).toBeInTheDocument()
      })
    })

    test('should display LazyGameDevs branding', () => {
      expect(screen.getByText(/Powered by LazyGameDevs GameLearn Platform/)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    test('should handle API errors during initialization', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: { message: 'Video not found' },
        }),
      })

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Video Error')).toBeInTheDocument()
        expect(screen.getByText('Video not found')).toBeInTheDocument()
      })

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Streaming Error',
        description: 'Video not found',
        variant: 'destructive',
      })
    })

    test('should handle network errors', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'))

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Video Error')).toBeInTheDocument()
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    test('should allow retry after error', async () => {
      ;(global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStreamingResponse,
        })

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Video Error')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })
    })

    test('should handle malformed API responses', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}), // No error message
      })

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Failed to initialize streaming')).toBeInTheDocument()
      })
    })
  })

  describe('Session Cleanup', () => {
    test('should end session on unmount', async () => {
      const user = userEvent.setup()
      const { unmount } = render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })

      unmount()

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/video/stream?sessionId=session-123',
        { method: 'DELETE' }
      )
    })

    test('should handle session end errors gracefully', async () => {
      ;(global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockStreamingResponse,
        })
        .mockRejectedValueOnce(new Error('End session failed'))

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()

      const user = userEvent.setup()
      const { unmount } = render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })

      unmount()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to end streaming session:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Progress Tracking', () => {
    test('should track progress for course videos', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })

      const progressButton = screen.getByRole('button', { name: /simulate progress/i })
      await user.click(progressButton)

      expect(consoleSpy).toHaveBeenCalledWith('Video progress: 17% (300/1800)')

      consoleSpy.mockRestore()
    })

    test('should not track progress for non-course videos', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

      const user = userEvent.setup()
      render(<VideoStreamingWrapper videoId="test-video" />) // No courseId

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })

      const progressButton = screen.getByRole('button', { name: /simulate progress/i })
      await user.click(progressButton)

      // Should not log progress for non-course videos
      expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('Video progress'))

      consoleSpy.mockRestore()
    })
  })

  describe('Loading States', () => {
    test('should show loading state during initialization', async () => {
      let resolvePromise: (value: any) => void
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve
      })

      ;(global.fetch as jest.Mock).mockReturnValueOnce(fetchPromise)

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      expect(screen.getByText('Initializing Video')).toBeInTheDocument()
      expect(screen.getByText('Setting up streaming session...')).toBeInTheDocument()

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: async () => mockStreamingResponse,
      })

      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    test('should have proper button labels', () => {
      render(<VideoStreamingWrapper {...defaultProps} />)

      expect(screen.getByRole('button', { name: /start video/i })).toBeInTheDocument()
    })

    test('should have descriptive error messages', async () => {
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'))

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('Connection failed')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    test('should handle missing session data gracefully', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: null }),
      })

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      // Should handle gracefully and not crash
      await waitFor(() => {
        expect(screen.queryByTestId('video-player')).not.toBeInTheDocument()
      })
    })

    test('should handle undefined session restrictions', async () => {
      const responseWithoutRestrictions = {
        ...mockStreamingResponse,
        data: {
          ...mockStreamingResponse.data,
          restrictions: undefined,
        },
      }

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutRestrictions,
      })

      const user = userEvent.setup()
      render(<VideoStreamingWrapper {...defaultProps} />)

      const startButton = screen.getByRole('button', { name: /start video/i })
      await user.click(startButton)

      // Should not crash even without restrictions
      await waitFor(() => {
        expect(screen.getByTestId('video-player')).toBeInTheDocument()
      })
    })
  })
})