import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { dodoPayments } from '@/lib/payments/dodo'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('x-dodo-signature') || ''

    // Verify webhook signature
    if (!dodoPayments.verifyWebhook(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { success: false, error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse webhook event
    const event = JSON.parse(body)

    // Handle the webhook event
    await dodoPayments.handleWebhook(event)

    console.log(`Processed webhook event: ${event.type}`)

    return NextResponse.json({ success: true, received: true })
  } catch (error) {
    console.error('Webhook processing failed:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Disable body size limit for webhooks
export const runtime = 'nodejs'
export const maxDuration = 30