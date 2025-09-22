import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { dodoPayments } from '@/lib/payments/dodo'

const createCheckoutSchema = z.object({
  courseId: z.string(),
  quantity: z.number().min(1).default(1),
  customer: z.object({
    name: z.string(),
    email: z.string().email(),
    phoneNumber: z.string().optional(),
  }),
  returnUrl: z.string().url().optional(),
  discountCode: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { courseId, quantity, customer, returnUrl, discountCode } = createCheckoutSchema.parse(body)

    // Create checkout session for course purchase
    const checkoutSession = await dodoPayments.createCheckoutSession({
      products: [{ productId: courseId, quantity }],
      customer,
      returnUrl: returnUrl || `${process.env.APP_URL}/courses/${courseId}/success`,
      metadata: {
        courseId,
        source: 'gamelearn-platform',
        timestamp: new Date().toISOString(),
      },
      discountCode,
    })

    return NextResponse.json({
      success: true,
      data: {
        sessionId: checkoutSession.id,
        checkoutUrl: checkoutSession.url,
        paymentId: checkoutSession.paymentId,
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