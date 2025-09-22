import { NextRequest, NextResponse } from 'next/server'
import { paymentConfig } from '@/lib/config/env'
import { mcp__dodopayments_api__create_checkout_sessions } from '@/lib/mcp/dodo-payments'

export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== paymentConfig.dodo.apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    const {
      product_cart,
      customer,
      billing_currency = 'USD',
      return_url,
      discount_code,
      metadata,
      confirm = true
    } = body

    if (!product_cart || !Array.isArray(product_cart) || product_cart.length === 0) {
      return NextResponse.json(
        { error: 'product_cart is required and must be a non-empty array' },
        { status: 400 }
      )
    }

    if (!customer || !customer.name || !customer.email) {
      return NextResponse.json(
        { error: 'customer.name and customer.email are required' },
        { status: 400 }
      )
    }

    // Create checkout session using MCP API
    const session = await mcp__dodopayments_api__create_checkout_sessions({
      product_cart,
      customer,
      billing_currency,
      return_url,
      discount_code,
      metadata,
      confirm
    })

    console.log('Created Dodo checkout session:', {
      id: session.id,
      payment_id: session.payment_id
    })

    return NextResponse.json(session)

  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      {
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}