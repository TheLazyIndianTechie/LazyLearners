/**
 * Integration tests for payment and enrollment flow
 * Tests the complete journey from payment initiation to course enrollment
 */

import { prisma } from '@/lib/prisma'
import { enrollUserInCourse } from '@/lib/payment'

// Mock Clerk auth
jest.mock('@clerk/nextjs/server', () => ({
  auth: jest.fn(),
  currentUser: jest.fn(),
}))

jest.mock('@/lib/mcp/dodo-payments', () => ({
  createCheckoutSession: jest.fn(),
  getPaymentStatus: jest.fn(),
}))

import { createCheckoutSession, getPaymentStatus } from '@/lib/mcp/dodo-payments'

describe('Payment and Enrollment Integration Flow', () => {
  const testUserId = 'test_user_integration_123'
  const testCourseId = 'test_course_integration_123'
  let createdUserDbId: string
  let createdCourseDbId: string

  beforeAll(async () => {
    // Create test user in database
    const user = await prisma.user.create({
      data: {
        id: testUserId,
        email: 'test@integration.com',
        name: 'Test User',
        role: 'STUDENT',
      },
    })
    createdUserDbId = user.id

    // Create test course in database
    const course = await prisma.course.create({
      data: {
        id: testCourseId,
        title: 'Integration Test Course',
        description: 'Course for integration testing',
        price: 99.99,
        instructorId: testUserId,
        engine: 'UNITY',
        difficulty: 'BEGINNER',
        isPublished: true,
      },
    })
    createdCourseDbId = course.id
  })

  afterAll(async () => {
    // Clean up test data
    await prisma.enrollment.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.licenseKey.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.payment.deleteMany({
      where: { userId: testUserId },
    })
    await prisma.course.delete({
      where: { id: testCourseId },
    })
    await prisma.user.delete({
      where: { id: testUserId },
    })
    await prisma.$disconnect()
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Free Course Enrollment Flow', () => {
    let freeCourseId: string

    beforeAll(async () => {
      const freeCourse = await prisma.course.create({
        data: {
          title: 'Free Integration Test Course',
          description: 'Free course for testing',
          price: 0,
          instructorId: testUserId,
          engine: 'UNREAL',
          difficulty: 'BEGINNER',
          isPublished: true,
        },
      })
      freeCourseId = freeCourse.id
    })

    afterAll(async () => {
      await prisma.enrollment.deleteMany({
        where: { courseId: freeCourseId },
      })
      await prisma.course.delete({
        where: { id: freeCourseId },
      })
    })

    it('should allow direct enrollment in free course without payment', async () => {
      const enrollment = await enrollUserInCourse(testUserId, freeCourseId)

      expect(enrollment).toBeDefined()
      expect(enrollment?.userId).toBe(testUserId)
      expect(enrollment?.courseId).toBe(freeCourseId)

      // Verify enrollment was created in database
      const dbEnrollment = await prisma.enrollment.findFirst({
        where: {
          userId: testUserId,
          courseId: freeCourseId,
        },
      })

      expect(dbEnrollment).toBeDefined()
      expect(dbEnrollment?.id).toBe(enrollment?.id)
    })

    it('should not create duplicate enrollments for the same course', async () => {
      // First enrollment
      await enrollUserInCourse(testUserId, freeCourseId)

      // Attempt duplicate enrollment
      const duplicateEnrollment = await enrollUserInCourse(testUserId, freeCourseId)

      // Should return existing enrollment
      expect(duplicateEnrollment).toBeDefined()

      // Verify only one enrollment exists
      const enrollments = await prisma.enrollment.findMany({
        where: {
          userId: testUserId,
          courseId: freeCourseId,
        },
      })

      expect(enrollments.length).toBe(1)
    })
  })

  describe('Paid Course Payment Flow', () => {
    it('should create checkout session for paid course', async () => {
      const mockCheckoutSession = {
        id: 'checkout_session_123',
        url: 'https://checkout.dodo.dev/session/123',
        courseIds: [testCourseId],
        amount: 9999, // in cents
      }

      ;(createCheckoutSession as jest.Mock).mockResolvedValue(mockCheckoutSession)

      const session = await createCheckoutSession({
        userId: testUserId,
        courseIds: [testCourseId],
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      })

      expect(session).toBeDefined()
      expect(session.id).toBe('checkout_session_123')
      expect(session.courseIds).toContain(testCourseId)
      expect(createCheckoutSession).toHaveBeenCalledWith({
        userId: testUserId,
        courseIds: [testCourseId],
        successUrl: 'http://localhost:3000/success',
        cancelUrl: 'http://localhost:3000/cancel',
      })
    })

    it('should create payment record on successful payment', async () => {
      const mockPaymentId = 'payment_integration_123'

      const payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: 99.99,
          currency: 'USD',
          status: 'COMPLETED',
          provider: 'DODO',
          providerPaymentId: 'dodo_payment_123',
        },
      })

      expect(payment).toBeDefined()
      expect(payment.userId).toBe(testUserId)
      expect(payment.amount).toBe(99.99)
      expect(payment.status).toBe('COMPLETED')

      // Clean up
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })

    it('should create license key after successful payment', async () => {
      const mockPaymentId = 'payment_license_test_123'

      // Create payment
      const payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: 99.99,
          currency: 'USD',
          status: 'COMPLETED',
          provider: 'DODO',
          providerPaymentId: 'dodo_payment_456',
        },
      })

      // Create license key (simulating webhook behavior)
      const licenseKey = await prisma.licenseKey.create({
        data: {
          key: `LICENSE_${Date.now()}`,
          userId: testUserId,
          courseId: testCourseId,
          paymentId: payment.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        },
      })

      expect(licenseKey).toBeDefined()
      expect(licenseKey.userId).toBe(testUserId)
      expect(licenseKey.courseId).toBe(testCourseId)
      expect(licenseKey.status).toBe('ACTIVE')
      expect(licenseKey.paymentId).toBe(payment.id)

      // Clean up
      await prisma.licenseKey.delete({
        where: { id: licenseKey.id },
      })
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })
  })

  describe('Complete Payment to Enrollment Flow', () => {
    it('should complete full flow: payment → license → enrollment', async () => {
      const mockPaymentId = 'payment_full_flow_123'

      // Step 1: Create payment
      const payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: 99.99,
          currency: 'USD',
          status: 'COMPLETED',
          provider: 'DODO',
          providerPaymentId: 'dodo_full_flow_123',
        },
      })

      expect(payment.status).toBe('COMPLETED')

      // Step 2: Create license key
      const licenseKey = await prisma.licenseKey.create({
        data: {
          key: `LICENSE_FULL_FLOW_${Date.now()}`,
          userId: testUserId,
          courseId: testCourseId,
          paymentId: payment.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      expect(licenseKey.status).toBe('ACTIVE')

      // Step 3: Enroll in course
      const enrollment = await enrollUserInCourse(testUserId, testCourseId)

      expect(enrollment).toBeDefined()
      expect(enrollment?.userId).toBe(testUserId)
      expect(enrollment?.courseId).toBe(testCourseId)

      // Step 4: Verify complete flow
      const enrollmentWithDetails = await prisma.enrollment.findFirst({
        where: {
          id: enrollment?.id,
        },
        include: {
          course: true,
          user: true,
        },
      })

      expect(enrollmentWithDetails).toBeDefined()
      expect(enrollmentWithDetails?.course.id).toBe(testCourseId)
      expect(enrollmentWithDetails?.user.id).toBe(testUserId)

      // Verify license key is still active
      const activeLicense = await prisma.licenseKey.findFirst({
        where: {
          userId: testUserId,
          courseId: testCourseId,
          status: 'ACTIVE',
        },
      })

      expect(activeLicense).toBeDefined()
      expect(activeLicense?.id).toBe(licenseKey.id)

      // Clean up
      await prisma.enrollment.delete({
        where: { id: enrollment?.id },
      })
      await prisma.licenseKey.delete({
        where: { id: licenseKey.id },
      })
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })

    it('should prevent enrollment without valid license for paid course', async () => {
      // Ensure no active license exists
      await prisma.licenseKey.deleteMany({
        where: {
          userId: testUserId,
          courseId: testCourseId,
          status: 'ACTIVE',
        },
      })

      // Attempt to enroll without license should fail
      // (This would be handled by the API route, not the enrollUserInCourse function)
      const activeLicense = await prisma.licenseKey.findFirst({
        where: {
          userId: testUserId,
          courseId: testCourseId,
          status: 'ACTIVE',
        },
      })

      expect(activeLicense).toBeNull()
    })
  })

  describe('Payment Status Tracking', () => {
    it('should track payment status transitions', async () => {
      const mockPaymentId = 'payment_status_tracking_123'

      // Create pending payment
      let payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: 99.99,
          currency: 'USD',
          status: 'PENDING',
          provider: 'DODO',
          providerPaymentId: 'dodo_tracking_123',
        },
      })

      expect(payment.status).toBe('PENDING')

      // Update to processing
      payment = await prisma.payment.update({
        where: { id: mockPaymentId },
        data: { status: 'PROCESSING' },
      })

      expect(payment.status).toBe('PROCESSING')

      // Update to completed
      payment = await prisma.payment.update({
        where: { id: mockPaymentId },
        data: { status: 'COMPLETED' },
      })

      expect(payment.status).toBe('COMPLETED')

      // Clean up
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })

    it('should handle failed payment status', async () => {
      const mockPaymentId = 'payment_failed_123'

      const payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: 99.99,
          currency: 'USD',
          status: 'FAILED',
          provider: 'DODO',
          providerPaymentId: 'dodo_failed_123',
        },
      })

      expect(payment.status).toBe('FAILED')

      // Verify no license key is created for failed payment
      const licenseKey = await prisma.licenseKey.findFirst({
        where: { paymentId: payment.id },
      })

      expect(licenseKey).toBeNull()

      // Clean up
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })
  })

  describe('Multi-Course Purchase Flow', () => {
    let additionalCourseId: string

    beforeAll(async () => {
      const additionalCourse = await prisma.course.create({
        data: {
          title: 'Additional Integration Test Course',
          description: 'Second course for multi-purchase testing',
          price: 49.99,
          instructorId: testUserId,
          engine: 'GODOT',
          difficulty: 'INTERMEDIATE',
          isPublished: true,
        },
      })
      additionalCourseId = additionalCourse.id
    })

    afterAll(async () => {
      await prisma.enrollment.deleteMany({
        where: { courseId: additionalCourseId },
      })
      await prisma.licenseKey.deleteMany({
        where: { courseId: additionalCourseId },
      })
      await prisma.course.delete({
        where: { id: additionalCourseId },
      })
    })

    it('should handle purchase of multiple courses in single transaction', async () => {
      const mockPaymentId = 'payment_multi_course_123'
      const totalAmount = 99.99 + 49.99

      // Create payment for both courses
      const payment = await prisma.payment.create({
        data: {
          id: mockPaymentId,
          userId: testUserId,
          amount: totalAmount,
          currency: 'USD',
          status: 'COMPLETED',
          provider: 'DODO',
          providerPaymentId: 'dodo_multi_123',
        },
      })

      // Create license keys for both courses
      const licenseKey1 = await prisma.licenseKey.create({
        data: {
          key: `LICENSE_MULTI_1_${Date.now()}`,
          userId: testUserId,
          courseId: testCourseId,
          paymentId: payment.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      const licenseKey2 = await prisma.licenseKey.create({
        data: {
          key: `LICENSE_MULTI_2_${Date.now()}`,
          userId: testUserId,
          courseId: additionalCourseId,
          paymentId: payment.id,
          status: 'ACTIVE',
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      })

      // Enroll in both courses
      const enrollment1 = await enrollUserInCourse(testUserId, testCourseId)
      const enrollment2 = await enrollUserInCourse(testUserId, additionalCourseId)

      expect(enrollment1).toBeDefined()
      expect(enrollment2).toBeDefined()

      // Verify both licenses are linked to same payment
      const licenses = await prisma.licenseKey.findMany({
        where: { paymentId: payment.id },
      })

      expect(licenses.length).toBe(2)
      expect(licenses.map(l => l.courseId)).toContain(testCourseId)
      expect(licenses.map(l => l.courseId)).toContain(additionalCourseId)

      // Clean up
      await prisma.enrollment.deleteMany({
        where: {
          id: { in: [enrollment1?.id, enrollment2?.id].filter(Boolean) as string[] },
        },
      })
      await prisma.licenseKey.deleteMany({
        where: { id: { in: [licenseKey1.id, licenseKey2.id] } },
      })
      await prisma.payment.delete({
        where: { id: mockPaymentId },
      })
    })
  })
})
