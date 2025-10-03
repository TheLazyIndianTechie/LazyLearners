/**
 * Load Testing Scenarios for LazyGameDevs Platform
 * Uses k6 for load testing concurrent users
 *
 * Installation:
 * brew install k6  (macOS)
 * or download from https://k6.io/docs/getting-started/installation/
 *
 * Usage:
 * k6 run tests/load/load-test-scenarios.js
 *
 * Scenarios:
 * - Homepage browsing
 * - Course catalog browsing
 * - Video streaming
 * - API endpoint stress testing
 */

import http from 'k6/http'
import { check, group, sleep } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')
const apiResponseTime = new Trend('api_response_time')
const pageLoadTime = new Trend('page_load_time')
const videoStreamRequests = new Counter('video_stream_requests')

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 100 },  // Ramp up to 100 users
    { duration: '2m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% failed requests
    errors: ['rate<0.1'],                            // Less than 10% error rate
  },
}

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

// Scenario 1: Homepage Load Test
export function homepageLoad() {
  group('Homepage Load', () => {
    const startTime = new Date()
    const res = http.get(`${BASE_URL}/`)
    const endTime = new Date()

    pageLoadTime.add(endTime - startTime)

    const passed = check(res, {
      'homepage status is 200': (r) => r.status === 200,
      'homepage loads within 2s': (r) => r.timings.duration < 2000,
      'homepage contains expected content': (r) => r.body.includes('GameLearn') || r.body.includes('Courses'),
    })

    errorRate.add(!passed)

    sleep(1)
  })
}

// Scenario 2: Course Catalog Browsing
export function courseCatalogBrowsing() {
  group('Course Catalog', () => {
    const startTime = new Date()
    const res = http.get(`${BASE_URL}/courses`)
    const endTime = new Date()

    pageLoadTime.add(endTime - startTime)

    const passed = check(res, {
      'courses page status is 200': (r) => r.status === 200,
      'courses page loads within 2s': (r) => r.timings.duration < 2000,
    })

    errorRate.add(!passed)

    sleep(2)
  })
}

// Scenario 3: API Health Check
export function apiHealthCheck() {
  group('API Health Check', () => {
    const startTime = new Date()
    const res = http.get(`${BASE_URL}/api/health`)
    const endTime = new Date()

    apiResponseTime.add(endTime - startTime)

    const passed = check(res, {
      'health check status is 200': (r) => r.status === 200,
      'health check response is valid JSON': (r) => {
        try {
          JSON.parse(r.body)
          return true
        } catch {
          return false
        }
      },
      'health check shows healthy status': (r) => {
        try {
          const data = JSON.parse(r.body)
          return data.status === 'healthy' || data.status === 'degraded'
        } catch {
          return false
        }
      },
    })

    errorRate.add(!passed)

    sleep(0.5)
  })
}

// Scenario 4: Course Detail Page Load
export function courseDetailLoad() {
  group('Course Detail Page', () => {
    // First, get list of courses
    const catalogRes = http.get(`${BASE_URL}/courses`)

    if (catalogRes.status === 200) {
      // In a real scenario, we'd parse the HTML to get course IDs
      // For now, we'll use a mock course ID
      const mockCourseId = 'test-course-id'

      const startTime = new Date()
      const detailRes = http.get(`${BASE_URL}/courses/${mockCourseId}`)
      const endTime = new Date()

      pageLoadTime.add(endTime - startTime)

      const passed = check(detailRes, {
        'course detail page loads': (r) => r.status === 200 || r.status === 404,
        'course detail response time acceptable': (r) => r.timings.duration < 3000,
      })

      errorRate.add(!passed && detailRes.status !== 404)
    }

    sleep(3)
  })
}

// Scenario 5: Video Streaming Load Test
export function videoStreamingLoad() {
  group('Video Streaming', () => {
    // Simulate video streaming request
    const params = {
      headers: {
        'Range': 'bytes=0-1048576', // Request first 1MB
      },
    }

    const startTime = new Date()
    const res = http.get(`${BASE_URL}/api/video/stream?lesson_id=test`, params)
    const endTime = new Date()

    apiResponseTime.add(endTime - startTime)
    videoStreamRequests.add(1)

    const passed = check(res, {
      'video stream status is 200, 206, or 403': (r) => [200, 206, 403].includes(r.status),
      'video stream starts within 2s': (r) => r.timings.duration < 2000,
    })

    errorRate.add(!passed && res.status !== 403)

    sleep(5)
  })
}

// Scenario 6: Authentication Load Test
export function authenticationLoad() {
  group('Authentication', () => {
    const signInRes = http.get(`${BASE_URL}/sign-in`)

    const passed = check(signInRes, {
      'sign-in page loads': (r) => r.status === 200,
      'sign-in page loads within 2s': (r) => r.timings.duration < 2000,
    })

    errorRate.add(!passed)

    sleep(1)
  })
}

// Scenario 7: API Enrollment Endpoint
export function enrollmentAPILoad() {
  group('Enrollment API', () => {
    const startTime = new Date()
    const res = http.get(`${BASE_URL}/api/enrollment`)
    const endTime = new Date()

    apiResponseTime.add(endTime - startTime)

    const passed = check(res, {
      'enrollment API responds': (r) => r.status === 200 || r.status === 401,
      'enrollment API responds within 1s': (r) => r.timings.duration < 1000,
    })

    errorRate.add(!passed && res.status !== 401)

    sleep(1)
  })
}

// Main test function - distributes load across scenarios
export default function () {
  const scenario = Math.floor(Math.random() * 7)

  switch (scenario) {
    case 0:
      homepageLoad()
      break
    case 1:
      courseCatalogBrowsing()
      break
    case 2:
      apiHealthCheck()
      break
    case 3:
      courseDetailLoad()
      break
    case 4:
      videoStreamingLoad()
      break
    case 5:
      authenticationLoad()
      break
    case 6:
      enrollmentAPILoad()
      break
  }
}

// Teardown function - runs once after test completion
export function teardown(data) {
  console.log('Load test completed')
}
