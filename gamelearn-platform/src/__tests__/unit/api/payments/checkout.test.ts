import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { POST } from '@/app/api/payments/checkout/route'
import { prisma } from '@/lib/prisma'
import { dodoPayments } from '@/lib/payments/dodo'

// Mock dependencies
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/prisma', () => ({
  prisma: {
    course: {
      findUnique: jest.fn(),
    },
    enrollment: {
      findUnique: jest.fn(),
    },
  },
}))
jest.mock('@/lib/payments/dodo')

const mockAuth = auth as jest.MockedFunction<typeof auth>
const mockPrisma = prisma as jest.Mocked<typeof prisma>
const mockDodoPayments = dodoPayments as jest.Mocked<typeof dodoPayments>

describe('/api/payments/checkout', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (body: any) => {
    return new NextRequest('http://localhost:3002/api/payments/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  const validRequestBody = {
    courseId: 'course-123',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    },
    quantity: 1,
    returnUrl: 'http://localhost:3002/courses/course-123/success',
    discountCode: 'DISCOUNT10',
  }

  const mockCourse = {
    id: 'course-123',
    title: 'Test Course',
    price: 9999, // $99.99 in cents
    isPublished: true,
  }

  describe('Authentication', () => {
    test('returns 401 when user is not authenticated', async () => {
      mockAuth.mockReturnValue({ userId: null })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data).toEqual({
        success: false,
        error: 'Unauthorized',
      })
    })

    test('proceeds when user is authenticated', async () => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Request Validation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
    })

    test('validates required courseId', async () => {
      const request = createRequest({
        ...validRequestBody,
        courseId: '',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    test('validates customer name', async () => {
      const request = createRequest({
        ...validRequestBody,
        customer: {
          ...validRequestBody.customer,
          name: '',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    test('validates customer email format', async () => {
      const request = createRequest({
        ...validRequestBody,
        customer: {
          ...validRequestBody.customer,
          email: 'invalid-email',
        },
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    test('accepts valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.co.uk',
        'user+tag@example.org',
        'user123@example-domain.com',
      ]

      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      for (const email of validEmails) {
        const request = createRequest({
          ...validRequestBody,
          customer: {
            ...validRequestBody.customer,
            email,
          },
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    test('validates quantity minimum value', async () => {
      const request = createRequest({
        ...validRequestBody,
        quantity: 0,
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Invalid request data')
    })

    test('accepts optional fields', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest({
        courseId: 'course-123',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
        },
      })

      const response = await POST(request)
      expect(response.status).toBe(200)
    })
  })

  describe('Course Validation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
    })

    test('returns 404 when course does not exist', async () => {
      mockPrisma.course.findUnique.mockResolvedValue(null)

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data).toEqual({
        success: false,
        error: 'Course not found',
      })
    })

    test('returns 400 when course is not published', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        ...mockCourse,
        isPublished: false,
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Course is not available for purchase',
      })
    })

    test('returns 400 when course is free', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        ...mockCourse,
        price: 0,
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Course is free. Use standard enrollment instead.',
      })
    })

    test('returns 400 when course has null price', async () => {
      mockPrisma.course.findUnique.mockResolvedValue({
        ...mockCourse,
        price: null,
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Course is free. Use standard enrollment instead.',
      })
    })
  })

  describe('Enrollment Validation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
    })

    test('returns 400 when user is already enrolled', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue({
        id: 'enrollment-123',
        userId: 'user-123',
        courseId: 'course-123',
        enrolledAt: new Date(),
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'You are already enrolled in this course',
      })
    })

    test('proceeds when user is not enrolled', async () => {
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Dodo Payments Integration', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
    })

    test('calls dodoPayments.createCheckoutSession with correct parameters', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest(validRequestBody)
      await POST(request)

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith({
        products: [{ productId: 'course-123', quantity: 1 }],
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
        },
        returnUrl: 'http://localhost:3002/courses/course-123/success',
        metadata: {
          course_id: 'course-123',
          user_id: 'user-123',
          course_title: 'Test Course',
          source: 'gamelearn-platform',
          timestamp: expect.any(String),
        },
        discountCode: 'DISCOUNT10',
      })
    })

    test('generates correct return URL when not provided', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest({
        ...validRequestBody,
        returnUrl: undefined,
      })
      await POST(request)

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          returnUrl: 'http://localhost:3002/courses/course-123/success',
        })
      )
    })

    test('sanitizes customer data', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest({
        ...validRequestBody,
        customer: {
          name: '  John Doe  ',
          email: 'john@example.com',
          phoneNumber: '+1234567890',
        },
      })
      await POST(request)

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
          },
        })
      )
    })

    test('returns correct response format on success', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: {
          sessionId: 'session-123',
          checkoutUrl: 'https://checkout.dodo.com/123',
          paymentId: 'payment-123',
          returnUrl: 'http://localhost:3002/courses/course-123/success',
          courseTitle: 'Test Course',
        },
      })
    })

    test('handles Dodo Payments errors', async () => {
      mockDodoPayments.createCheckoutSession.mockRejectedValue(
        new Error('Dodo API Error: Invalid API key')
      )

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to create checkout session',
        message: 'Dodo API Error: Invalid API key',
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
    })

    test('handles database connection errors', async () => {
      mockPrisma.course.findUnique.mockRejectedValue(new Error('Database connection failed'))

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create checkout session')
    })

    test('handles malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3002/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid-json',
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
    })

    test('handles unexpected errors gracefully', async () => {
      mockPrisma.course.findUnique.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const request = createRequest(validRequestBody)
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to create checkout session')
      expect(data.message).toBe('Unexpected error')
    })
  })

  describe('Metadata Generation', () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: 'user-123' })
      mockPrisma.course.findUnique.mockResolvedValue(mockCourse)
      mockPrisma.enrollment.findUnique.mockResolvedValue(null)
    })

    test('includes correct metadata in checkout session', async () => {
      mockDodoPayments.createCheckoutSession.mockResolvedValue({
        id: 'session-123',
        url: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const request = createRequest(validRequestBody)
      await POST(request)

      expect(mockDodoPayments.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: {
            course_id: 'course-123',
            user_id: 'user-123',
            course_title: 'Test Course',
            source: 'gamelearn-platform',
            timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          },
        })
      )
    })
  })
})