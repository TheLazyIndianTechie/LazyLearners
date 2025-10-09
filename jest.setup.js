// Jest setup file for global test configuration

import '@testing-library/jest-dom'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: '',
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    }
  },
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock Next.js server actions
jest.mock('next/server', () => ({
  NextRequest: jest.fn().mockImplementation((input, init) => ({
    url: input,
    method: init?.method || 'GET',
    headers: new Headers(init?.headers),
    json: jest.fn().mockResolvedValue({}),
    formData: jest.fn().mockResolvedValue(new FormData()),
    text: jest.fn().mockResolvedValue(''),
    clone: jest.fn(),
    ...init,
  })),
  NextResponse: {
    json: jest.fn().mockImplementation((data, init) => ({
      status: init?.status || 200,
      statusText: '',
      headers: new Headers(init?.headers),
      json: jest.fn().mockResolvedValue(data),
      text: jest.fn().mockResolvedValue(JSON.stringify(data)),
      clone: jest.fn(),
      ok: (init?.status || 200) >= 200 && (init?.status || 200) < 300,
    })),
    redirect: jest.fn().mockImplementation((url, init) => ({
      status: init?.status || 302,
      headers: new Headers({ 'Location': url }),
      url,
    })),
  },
}))

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.CDN_URL = 'https://test-cdn.lazygamedevs.com'

// Mock File API
global.File = class File {
  constructor(fileBits, fileName, options = {}) {
    this.name = fileName
    this.size = fileBits.length || 0
    this.type = options.type || ''
    this.lastModified = Date.now()
  }
}

// Mock FormData
global.FormData = class FormData {
  constructor() {
    this.data = new Map()
  }

  append(key, value) {
    this.data.set(key, value)
  }

  get(key) {
    return this.data.get(key)
  }

  has(key) {
    return this.data.has(key)
  }

  delete(key) {
    this.data.delete(key)
  }
}

// Polyfill ResizeObserver for components relying on it in tests
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Mock console methods to reduce test noise
const originalError = console.error
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
})

// Global test helpers
global.testHelpers = {
  // Create a mock session
  createMockSession: (overrides = {}) => ({
    user: {
      id: 'test-user-id',
      email: 'test@lazygamedevs.com',
      name: 'Test User',
      role: 'INSTRUCTOR',
      ...overrides.user,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    ...overrides,
  }),

  // Create a mock video file
  createMockVideoFile: (overrides = {}) => new File(
    ['mock video content'],
    'test-video.mp4',
    {
      type: 'video/mp4',
      ...overrides,
    }
  ),

  // Create a mock FormData for video upload
  createMockFormData: (videoFile, metadata = {}) => {
    const formData = new FormData()
    formData.append('video', videoFile)
    formData.append('metadata', JSON.stringify({
      title: 'Test Video',
      description: 'Test video description',
      isPublic: false,
      ...metadata,
    }))
    return formData
  },

  // Wait for async operations
  waitFor: (ms = 100) => new Promise(resolve => setTimeout(resolve, ms)),

  // Create mock request
  createMockRequest: (overrides = {}) => ({
    headers: {
      get: (name) => {
        const headers = {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          ...overrides.headers,
        };
        return headers[name.toLowerCase()] || null;
      },
      has: (name) => {
        const headers = {
          'content-type': 'application/json',
          'user-agent': 'test-agent',
          ...overrides.headers,
        };
        return name.toLowerCase() in headers;
      },
    },
    method: 'GET',
    url: 'http://localhost:3000/test',
    formData: jest.fn(),
    json: jest.fn().mockResolvedValue(overrides.body || {}),
    ...overrides,
  }),
}

// Additional global mocks for API route dependencies
// These work alongside the test-specific mocks

// Mock helper functions that are used in API routes
jest.mock('@/lib/video/streaming', () => {
  const originalModule = jest.requireActual('@/lib/video/streaming')

  return {
    ...originalModule,
    // Override specific functions for testing
    verifyVideoExists: jest.fn().mockResolvedValue(true),
    verifyUserVideoAccess: jest.fn().mockResolvedValue(true),
    trackStreamingAnalytics: jest.fn()
  }
}, { virtual: true })

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks()
  jest.clearAllTimers()
})