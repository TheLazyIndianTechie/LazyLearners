/**
 * Test utilities and custom render functions
 * Provides common testing utilities and helpers
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

// Mock providers that might be needed for components
const MockProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Custom render function that includes providers
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: MockProviders, ...options })

// Mock functions for common use cases
export const createMockVideoFile = (overrides: Partial<File> = {}) => {
  const file = new File(['mock video content'], 'test-video.mp4', {
    type: 'video/mp4',
    ...overrides,
  })

  // Add custom properties that might be needed
  Object.defineProperty(file, 'size', {
    writable: true,
    value: overrides.size || 1024 * 1024 * 100, // 100MB default
  })

  return file
}

export const createMockSession = (overrides = {}) => ({
  user: {
    id: 'test-user-id',
    email: 'test@lazygamedevs.com',
    name: 'Test User',
    role: 'INSTRUCTOR',
    ...overrides,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
})

export const createMockStreamingSession = (overrides = {}) => ({
  sessionId: 'test-session-123',
  manifestUrl: 'https://cdn.test.com/video.m3u8',
  format: 'hls',
  qualities: ['720p', '1080p'],
  duration: 1800,
  thumbnails: [],
  watermark: {
    text: 'Test Watermark',
    position: 'bottom-right',
    opacity: 0.7,
  },
  restrictions: {
    downloadDisabled: true,
    seekingDisabled: false,
    speedChangeDisabled: false,
  },
  analytics: {
    trackingUrl: '/api/video/analytics',
    heartbeatUrl: '/api/video/heartbeat',
    sessionId: 'test-session-123',
  },
  ...overrides,
})

export const createMockVideoJob = (overrides = {}) => ({
  id: 'job-123',
  userId: 'user-123',
  status: 'pending',
  progress: 0,
  originalFilename: 'test-video.mp4',
  originalFilesize: 1024 * 1024 * 100,
  inputPath: '/tmp/input/test-video.mp4',
  metadata: {
    duration: 1800,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
    codec: 'h264',
    audioCodec: 'aac',
  },
  qualities: ['720p', '1080p'],
  createdAt: Date.now(),
  ...overrides,
})

// Mock fetch responses
export const createMockFetchResponse = (data: any, options: { status?: number; ok?: boolean } = {}) => ({
  ok: options.ok ?? true,
  status: options.status ?? 200,
  json: async () => data,
  text: async () => JSON.stringify(data),
  headers: new Headers(),
})

// Mock video element helpers
export const mockVideoElement = () => {
  const video = document.createElement('video')

  Object.defineProperty(video, 'duration', { value: 1800, writable: true })
  Object.defineProperty(video, 'currentTime', { value: 0, writable: true })
  Object.defineProperty(video, 'volume', { value: 1, writable: true })
  Object.defineProperty(video, 'muted', { value: false, writable: true })
  Object.defineProperty(video, 'playbackRate', { value: 1, writable: true })
  Object.defineProperty(video, 'buffered', {
    value: {
      length: 1,
      end: jest.fn().mockReturnValue(300),
    },
  })

  video.play = jest.fn().mockResolvedValue(undefined)
  video.pause = jest.fn()
  video.load = jest.fn()

  return video
}

// Wait for async operations
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// Custom matchers for better assertions
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling
    if (pass) {
      return {
        message: () => `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      }
    } else {
      return {
        message: () => `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      }
    }
  },
})

// Declare custom matcher types
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R
    }
  }
}

// Re-export everything from testing-library
export * from '@testing-library/react'
export * from '@testing-library/user-event'

// Override the default render with our custom one
export { customRender as render }