import { NextRequest, NextResponse } from 'next/server'
import { paymentConfig } from '@/lib/config/env'

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== paymentConfig.dodo.apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { paymentId } = params

    // Use actual MCP Dodo Payments tool
    const { mcp__dodopayments_api__retrieve_payments } = await import('@/lib/mcp/dodo-payments')

    const payment = await mcp__dodopayments_api__retrieve_payments({
      payment_id: paymentId,
      jq_filter: '.{payment_id: .payment_id, status: .status, total_amount: .total_amount, currency: .currency, customer: .customer, payment_method: .payment_method, payment_method_type: .payment_method_type, created_at: .created_at, metadata: .metadata}'
    })

    console.log('Retrieved Dodo payment:', payment)
    return NextResponse.json(payment)

  } catch (error) {
    console.error('Error in MCP payments API:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve payment',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}