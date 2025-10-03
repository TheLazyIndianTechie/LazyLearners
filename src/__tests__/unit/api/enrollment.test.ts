import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/enrollment/route'

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
}))

jest.mock('@/lib/payment', () => ({
  enrollUserInCourse: jest.fn(),
  getUserEnrollments: jest.fn(),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {
    enrollment: {
      findFirst: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
    },
    licenseKey: {
      findFirst: jest.fn(),
    },
  },
}))

import { auth } from '@clerk/nextjs/server'
import { enrollUserInCourse, getUserEnrollments } from '@/lib/payment'
import { prisma } from '@/lib/prisma'

describe('Enrollment API Route', () => {
  const mockUserId = 'user_12345'
  const mockCourseId = 'course_123'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/enrollment', () => {
    it('should return 401 when user is not authenticated', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/enrollment')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return specific course enrollment when courseId is provided', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUserId,
        courseId: mockCourseId,
        enrolledAt: new Date(),
      }

      ;(prisma.enrollment.findFirst as jest.Mock).mockResolvedValue(mockEnrollment)

      const request = new NextRequest(`http://localhost:3000/api/enrollment?courseId=${mockCourseId}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrollment).toEqual(mockEnrollment)
      expect(prisma.enrollment.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          courseId: mockCourseId,
        },
      })
    })

    it('should return null enrollment when user is not enrolled in specific course', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })
      ;(prisma.enrollment.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest(`http://localhost:3000/api/enrollment?courseId=${mockCourseId}`)
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrollment).toBeNull()
    })

    it('should return all user enrollments when no courseId is provided', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockEnrollments = [
        { id: 'enrollment_1', userId: mockUserId, courseId: 'course_1' },
        { id: 'enrollment_2', userId: mockUserId, courseId: 'course_2' },
      ]

      ;(getUserEnrollments as jest.Mock).mockResolvedValue(mockEnrollments)

      const request = new NextRequest('http://localhost:3000/api/enrollment')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.enrollments).toEqual(mockEnrollments)
      expect(getUserEnrollments).toHaveBeenCalledWith(mockUserId)
    })

    it('should handle errors gracefully', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })
      ;(getUserEnrollments as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/enrollment')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/enrollment', () => {
    it('should return 401 when user is not authenticated', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: null })

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 400 when courseId is missing', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Course ID is required')
    })

    it('should return 404 when course is not found', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })
      ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Course not found')
    })

    it('should enroll user in free course without license key check', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockCourse = { price: 0 }
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUserId,
        courseId: mockCourseId,
      }

      ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse)
      ;(enrollUserInCourse as jest.Mock).mockResolvedValue(mockEnrollment)

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.enrollment).toEqual(mockEnrollment)
      expect(enrollUserInCourse).toHaveBeenCalledWith(mockUserId, mockCourseId)
    })

    it('should return 403 when paid course requires license key but none found', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockCourse = { price: 99.99 }
      ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse)
      ;(prisma.licenseKey.findFirst as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toContain('Valid license key required')
    })

    it('should enroll user in paid course when valid license key exists', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockCourse = { price: 99.99 }
      const mockLicenseKey = {
        id: 'license_1',
        userId: mockUserId,
        courseId: mockCourseId,
        status: 'ACTIVE',
      }
      const mockEnrollment = {
        id: 'enrollment_1',
        userId: mockUserId,
        courseId: mockCourseId,
      }

      ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse)
      ;(prisma.licenseKey.findFirst as jest.Mock).mockResolvedValue(mockLicenseKey)
      ;(enrollUserInCourse as jest.Mock).mockResolvedValue(mockEnrollment)

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.enrollment).toEqual(mockEnrollment)
      expect(prisma.licenseKey.findFirst).toHaveBeenCalledWith({
        where: {
          userId: mockUserId,
          courseId: mockCourseId,
          status: 'ACTIVE',
        },
      })
    })

    it('should return 500 when enrollment fails', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })

      const mockCourse = { price: 0 }
      ;(prisma.course.findUnique as jest.Mock).mockResolvedValue(mockCourse)
      ;(enrollUserInCourse as jest.Mock).mockResolvedValue(null)

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to enroll in course')
    })

    it('should handle database errors gracefully', async () => {
      ;(auth as jest.Mock).mockReturnValue({ userId: mockUserId })
      ;(prisma.course.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'))

      const request = new NextRequest('http://localhost:3000/api/enrollment', {
        method: 'POST',
        body: JSON.stringify({ courseId: mockCourseId }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })
})
