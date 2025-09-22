import { NextRequest, NextResponse } from 'next/server'
import { dodoPayments } from '@/lib/payments/dodo'
import { paymentConfig } from '@/lib/config/env'

export async function POST(request: NextRequest) {
  try {
    // Only allow in development/test environment
    if (paymentConfig.dodo.environment === 'live') {
      return NextResponse.json(
        { error: 'Test endpoint not available in production' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action, ...params } = body

    let result: any

    switch (action) {
      case 'create_product':
        result = await dodoPayments.createProduct({
          name: params.name || 'Test Game Development Course',
          description: params.description || 'A test course for game development',
          price: params.price || 2999, // $29.99
          currency: 'USD',
          taxCategory: 'edtech',
          licenseKeyEnabled: true,
          metadata: {
            test: true,
            duration: '8 hours',
            level: 'beginner'
          }
        })
        break

      case 'list_products':
        result = await dodoPayments.listProducts()
        break

      case 'create_checkout':
        if (!params.productId) {
          throw new Error('productId is required for checkout creation')
        }
        result = await dodoPayments.createCheckoutSession({
          products: [{
            productId: params.productId,
            quantity: 1
          }],
          customer: {
            name: params.customerName || 'Test User',
            email: params.customerEmail || 'test@gamelearn.dev'
          },
          returnUrl: params.returnUrl || 'http://localhost:3000/purchase/success',
          metadata: {
            test: true,
            courseId: 'course_test_123',
            userId: 'user_test_456'
          }
        })
        break

      case 'get_payment':
        if (!params.paymentId) {
          throw new Error('paymentId is required for payment retrieval')
        }
        result = await dodoPayments.getPayment(params.paymentId)
        break

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in Dodo integration test:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Dodo Payments Integration Test Endpoint',
    availableActions: [
      'create_product',
      'list_products',
      'create_checkout',
      'get_payment'
    ],
    usage: 'POST with { "action": "action_name", ...params }',
    environment: paymentConfig.dodo.environment
  })
}