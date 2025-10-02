import { PrismaClient } from '@prisma/client'
import { randomBytes } from 'crypto'

const prisma = new PrismaClient()

export interface CreateLicenseKeyParams {
  userId: string
  courseId: string
  paymentId?: string
  dodoLicenseKeyId?: string
  activationsLimit?: number
  expiresAt?: Date
}

export interface ValidateLicenseKeyParams {
  key: string
  userId: string
  courseId: string
}

export interface ActivateLicenseKeyParams {
  key: string
  userId: string
  instanceName?: string
}

/**
 * License Key Service
 * Manages course access through license keys integrated with Dodo Payments
 */
export class LicenseKeyService {
  /**
   * Generate a unique license key
   */
  private generateLicenseKey(): string {
    // Generate a readable license key format: XXXX-XXXX-XXXX-XXXX
    const segments = []
    for (let i = 0; i < 4; i++) {
      const segment = randomBytes(2).toString('hex').toUpperCase()
      segments.push(segment)
    }
    return segments.join('-')
  }

  /**
   * Create a new license key for course access
   */
  async createLicenseKey(params: CreateLicenseKeyParams) {
    const key = this.generateLicenseKey()

    return await prisma.licenseKey.create({
      data: {
        key,
        userId: params.userId,
        courseId: params.courseId,
        paymentId: params.paymentId,
        dodoLicenseKeyId: params.dodoLicenseKeyId,
        activationsLimit: params.activationsLimit,
        expiresAt: params.expiresAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            price: true,
          },
        },
        payment: {
          select: {
            id: true,
            dodoPaymentId: true,
            status: true,
          },
        },
      },
    })
  }

  /**
   * Validate if a license key grants access to a course
   */
  async validateLicenseKey(params: ValidateLicenseKeyParams): Promise<{
    valid: boolean
    reason?: string
    licenseKey?: any
  }> {
    const licenseKey = await prisma.licenseKey.findFirst({
      where: {
        key: params.key,
        userId: params.userId,
        courseId: params.courseId,
      },
      include: {
        course: true,
        user: true,
      },
    })

    if (!licenseKey) {
      return {
        valid: false,
        reason: 'License key not found or does not belong to this user/course',
      }
    }

    if (licenseKey.status !== 'ACTIVE') {
      return {
        valid: false,
        reason: `License key is ${licenseKey.status.toLowerCase()}`,
        licenseKey,
      }
    }

    if (licenseKey.expiresAt && licenseKey.expiresAt < new Date()) {
      // Auto-expire the license key
      await this.expireLicenseKey(licenseKey.id)
      return {
        valid: false,
        reason: 'License key has expired',
        licenseKey,
      }
    }

    if (
      licenseKey.activationsLimit &&
      licenseKey.activationsCount >= licenseKey.activationsLimit
    ) {
      return {
        valid: false,
        reason: 'License key activation limit reached',
        licenseKey,
      }
    }

    return {
      valid: true,
      licenseKey,
    }
  }

  /**
   * Activate a license key (increment activation count)
   */
  async activateLicenseKey(params: ActivateLicenseKeyParams) {
    const licenseKey = await prisma.licenseKey.findUnique({
      where: { key: params.key },
      include: { course: true, user: true },
    })

    if (!licenseKey) {
      throw new Error('License key not found')
    }

    if (licenseKey.userId !== params.userId) {
      throw new Error('License key does not belong to this user')
    }

    const validation = await this.validateLicenseKey({
      key: params.key,
      userId: params.userId,
      courseId: licenseKey.courseId,
    })

    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    // Increment activation count
    const updatedLicenseKey = await prisma.licenseKey.update({
      where: { id: licenseKey.id },
      data: {
        activationsCount: {
          increment: 1,
        },
        updatedAt: new Date(),
      },
      include: {
        user: true,
        course: true,
      },
    })

    // Create or update enrollment
    await this.ensureEnrollment(params.userId, licenseKey.courseId)

    return updatedLicenseKey
  }

  /**
   * Get license keys for a user
   */
  async getUserLicenseKeys(userId: string) {
    return await prisma.licenseKey.findMany({
      where: { userId },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            thumbnail: true,
            category: true,
            difficulty: true,
            duration: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            currency: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Get license keys for a course (admin/instructor view)
   */
  async getCourseLicenseKeys(courseId: string) {
    return await prisma.licenseKey.findMany({
      where: { courseId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  /**
   * Check if user has access to a course via license key
   */
  async hasAccessToCourse(userId: string, courseId: string): Promise<boolean> {
    const licenseKey = await prisma.licenseKey.findFirst({
      where: {
        userId,
        courseId,
        status: 'ACTIVE',
      },
    })

    if (!licenseKey) return false

    // Check if license key is still valid
    const validation = await this.validateLicenseKey({
      key: licenseKey.key,
      userId,
      courseId,
    })

    return validation.valid
  }

  /**
   * Expire a license key
   */
  async expireLicenseKey(licenseKeyId: string) {
    return await prisma.licenseKey.update({
      where: { id: licenseKeyId },
      data: {
        status: 'EXPIRED',
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Revoke a license key
   */
  async revokeLicenseKey(licenseKeyId: string) {
    return await prisma.licenseKey.update({
      where: { id: licenseKeyId },
      data: {
        status: 'REVOKED',
        updatedAt: new Date(),
      },
    })
  }

  /**
   * Ensure user is enrolled in course when license key is activated
   */
  private async ensureEnrollment(userId: string, courseId: string) {
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
        },
      })
    } else if (existingEnrollment.status !== 'ACTIVE') {
      await prisma.enrollment.update({
        where: {
          userId_courseId: {
            userId,
            courseId,
          },
        },
        data: {
          status: 'ACTIVE',
        },
      })
    }
  }

  /**
   * Handle successful payment webhook - create license key
   */
  async handlePaymentSuccess(paymentData: {
    dodoPaymentId: string
    userId: string
    courseId: string
    licenseKeyData?: any
  }) {
    // Check if license key already exists for this payment
    const existingPayment = await prisma.payment.findUnique({
      where: { dodoPaymentId: paymentData.dodoPaymentId },
      include: { licenseKey: true },
    })

    if (existingPayment?.licenseKey) {
      return existingPayment.licenseKey
    }

    // Create license key for successful payment
    const licenseKey = await this.createLicenseKey({
      userId: paymentData.userId,
      courseId: paymentData.courseId,
      paymentId: existingPayment?.id,
      dodoLicenseKeyId: paymentData.licenseKeyData?.id,
      activationsLimit: paymentData.licenseKeyData?.activationsLimit,
      expiresAt: paymentData.licenseKeyData?.expiresAt,
    })

    return licenseKey
  }
}

// Singleton instance
export const licenseKeyService = new LicenseKeyService()