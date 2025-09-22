import { NextRequest, NextResponse } from 'next/server'
import { paymentConfig } from '@/lib/config/env'
import { mcp__dodopayments_api__create_products, mcp__dodopayments_api__list_products } from '@/lib/mcp/dodo-payments'

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
      name,
      description,
      price,
      tax_category = 'edtech',
      license_key_enabled = true,
      metadata = {}
    } = body

    if (!name) {
      return NextResponse.json(
        { error: 'name is required' },
        { status: 400 }
      )
    }

    if (!price || typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'price must be a positive number' },
        { status: 400 }
      )
    }

    // Create product using MCP API
    const product = await mcp__dodopayments_api__create_products({
      name,
      description,
      price: {
        type: 'one_time_price',
        currency: 'USD',
        price,
        tax_inclusive: true,
        purchasing_power_parity: false,
        discount: 0
      },
      tax_category,
      license_key_enabled,
      metadata
    })

    console.log('Created Dodo product:', {
      id: product.id,
      name: product.name
    })

    return NextResponse.json(product)

  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json(
      {
        error: 'Failed to create product',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify API key
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token || token !== paymentConfig.dodo.apiKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page_number = parseInt(searchParams.get('page_number') || '0')
    const page_size = parseInt(searchParams.get('page_size') || '10')
    const archived = searchParams.get('archived') === 'true'

    // List products using MCP API
    const products = await mcp__dodopayments_api__list_products({
      page_number,
      page_size,
      archived
    })

    console.log(`Retrieved ${products.items?.length || 0} Dodo products`)

    return NextResponse.json(products)

  } catch (error) {
    console.error('Error listing products:', error)
    return NextResponse.json(
      {
        error: 'Failed to list products',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}