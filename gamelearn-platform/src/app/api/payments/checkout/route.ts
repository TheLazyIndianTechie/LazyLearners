import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { dodoPayments } from '@/lib/payments/dodo'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const createCheckoutSchema = z.object({
  courseId: z.string().trim().min(1, 'Course ID is required'),
  quantity: z.number().min(1).default(1),
  customer: z.object({
    name: z.string().trim().min(1, 'Customer name is required'),
    email: z.string().trim().regex(emailRegex, 'Invalid email address'),
    phoneNumber: z.string().optional(),
  }),
  returnUrl: z.string().url().optional(),
  discountCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { courseId, quantity, customer, returnUrl, discountCode } = createCheckoutSchema.parse(body)

    const sanitizedCustomer = {
      name: customer.name.trim(),
      email: customer.email,
      phoneNumber: customer.phoneNumber,
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { title: true, price: true, isPublished: true }
    })

    if (!course) {
      return NextResponse.json(
        { success: false, error: 'Course not found' },
        { status: 404 }
      )
    }

    if (!course.isPublished) {
      return NextResponse.json(
        { success: false, error: 'Course is not available for purchase' },
        { status: 400 }
      )
    }

    if ((course.price ?? 0) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Course is free. Use standard enrollment instead.' },
        { status: 400 }
      )
    }

    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId,
        },
      },
    })

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: 'You are already enrolled in this course' },
        { status: 400 }
      )
    }

    const url = request.nextUrl
    const origin = process.env.APP_URL || `${url.protocol}//${url.host}`
    const resolvedReturnUrl = returnUrl || `${origin}/courses/${courseId}/success`

    const metadataTimestamp = new Date().toISOString()

    // Create checkout session for course purchase
    const checkoutSession = await dodoPayments.createCheckoutSession({
      products: [{ productId: courseId, quantity }],
      customer: sanitizedCustomer,
      returnUrl: resolvedReturnUrl,
      metadata: {
        course_id: courseId,
        user_id: userId,
        course_title: course.title,
        source: 'gamelearn-platform',
        timestamp: metadataTimestamp,
      },
      discountCode,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        paymentId: checkoutSession.paymentId,
        returnUrl: resolvedReturnUrl,
        courseTitle: course.title,
      },
    })
  } catch (error) {
    console.error('Checkout creation failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}