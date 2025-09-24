import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Email notification function (placeholder for email service integration)
async function sendPaymentFailureNotification(email: string, paymentData: {
  paymentId: string
  amount: number
  currency: string
  customerName?: string
}) {
  // This would integrate with your email service (Resend, SendGrid, etc.)
  // For now, just log the notification
  console.log('Sending payment failure notification:', {
    to: email,
    subject: 'Payment Failed - LazyGameDevs',
    data: paymentData
  })

  // Example email content:
  // Subject: Payment Processing Issue - LazyGameDevs
  // Body: We encountered an issue processing your payment of ${amount/100} ${currency}
  //       Please try again or contact support@lazygamedevs.com

  return Promise.resolve() // Placeholder - would return actual email send result
}

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

    // Send email notification to customer about failed payment
    try {
      await sendPaymentFailureNotification(customer.email, {
        paymentId,
        amount,
        currency,
        customerName: customer.name
      })
    } catch (emailError) {
      console.error('Failed to send payment failure notification:', emailError)
      // Don't fail the webhook processing if email fails
    }

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