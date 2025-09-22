import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const {
      paymentId,
      courseId,
      userId,
      amount,
      currency,
      customer
    } = await request.json()

    console.log('Processing payment success:', {
      paymentId,
      courseId,
      userId,
      amount,
      currency
    })

    // Start a database transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create or update payment record
      const payment = await tx.payment.upsert({
        where: { dodoPaymentId: paymentId },
        create: {
          dodoPaymentId: paymentId,
          status: 'SUCCEEDED',
          amount,
          currency,
          userId,
          courseId,
          metadata: {
            customer,
            processedAt: new Date().toISOString()
          }
        },
        update: {
          status: 'SUCCEEDED',
          metadata: {
            customer,
            processedAt: new Date().toISOString()
          }
        }
      })

      // 2. Generate license key for course access
      const licenseKey = await tx.licenseKey.create({
        data: {
          key: generateLicenseKey(),
          userId,
          courseId,
          paymentId: payment.id,
          status: 'ACTIVE',
          activationsLimit: 3, // Allow 3 device activations
          activationsCount: 0,
          expiresAt: null // No expiration for purchased courses
        }
      })

      // 3. Create course enrollment
      await tx.enrollment.upsert({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        },
        create: {
          userId,
          courseId,
          status: 'ACTIVE',
          enrolledAt: new Date(),
          accessType: 'LICENSED'
        },
        update: {
          status: 'ACTIVE',
          accessType: 'LICENSED'
        }
      })

      return { payment, licenseKey }
    })

    console.log('Successfully processed payment and created license key:', {
      paymentId: result.payment.id,
      licenseKey: result.licenseKey.key
    })

    return NextResponse.json({
      success: true,
      paymentId: result.payment.id,
      licenseKey: result.licenseKey.key,
      message: 'Course access granted successfully'
    })

  } catch (error) {
    console.error('Error processing payment success:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment success',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function generateLicenseKey(): string {
  // Generate a secure license key in format: XXXX-XXXX-XXXX-XXXX
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segments = Array.from({ length: 4 }, () => {
    return Array.from({ length: 4 }, () =>
      chars.charAt(Math.floor(Math.random() * chars.length))
    ).join('')
  })
  return segments.join('-')
}