import { NextRequest, NextResponse } from 'next/server'
import { dodoPayments } from '@/lib/payments/dodo'

interface RouteParams {
  params: {
    paymentId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { paymentId } = params

    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Payment ID is required' },
        { status: 400 }
      )
    }

    // Get payment status from Dodo Payments
    const payment = await dodoPayments.getPayment(paymentId)

    return NextResponse.json({
      success: true,
      data: {
        paymentId: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        customer: payment.customer,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
      },
    })
  } catch (error) {
    console.error('Payment status check failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get payment status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}