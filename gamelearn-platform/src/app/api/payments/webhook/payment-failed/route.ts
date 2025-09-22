import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const {
      paymentId,
      customer,
      amount,
      currency
    } = await request.json()

    console.log('Processing payment failure:', {
      paymentId,
      customer: customer.email,
      amount,
      currency
    })

    // Update payment record to failed status
    await prisma.payment.upsert({
      where: { dodoPaymentId: paymentId },
      create: {
        dodoPaymentId: paymentId,
        status: 'FAILED',
        amount,
        currency,
        metadata: {
          customer,
          failedAt: new Date().toISOString()
        }
      },
      update: {
        status: 'FAILED',
        metadata: {
          customer,
          failedAt: new Date().toISOString()
        }
      }
    })

    // TODO: Send email notification to customer about failed payment
    // This would integrate with email service (Resend, SendGrid, etc.)
    console.log(`Payment failed for customer ${customer.email}, notification should be sent`)

    return NextResponse.json({
      success: true,
      message: 'Payment failure processed successfully'
    })

  } catch (error) {
    console.error('Error processing payment failure:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment failure',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}