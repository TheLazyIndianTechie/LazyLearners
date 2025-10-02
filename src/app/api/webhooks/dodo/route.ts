import { NextRequest, NextResponse } from 'next/server'
import { dodoPayments } from '@/lib/payments/dodo'
import { headers } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    // Get the raw body as text for signature verification
    const body = await request.text()
    const headersList = headers()
    const signature = headersList.get('x-dodo-signature') || headersList.get('dodo-signature') || ''

    // Verify webhook signature
    if (!dodoPayments.verifyWebhook(body, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the webhook payload
    const event = JSON.parse(body)

    console.log('Received Dodo webhook event:', {
      type: event.type,
      id: event.id || 'unknown',
      timestamp: new Date().toISOString()
    })

    // Handle the webhook event
    await dodoPayments.handleWebhook(event)

    // Return success response
    return NextResponse.json({ received: true, status: 'processed' })

  } catch (error) {
    console.error('Error processing Dodo webhook:', error)

    // Return error response
    return NextResponse.json(
      {
        error: 'Webhook processing failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Optional: Handle GET requests for webhook verification during setup
export async function GET() {
  return NextResponse.json({
    message: 'Dodo Payments webhook endpoint is active',
    timestamp: new Date().toISOString()
  })
}