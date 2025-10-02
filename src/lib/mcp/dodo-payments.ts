import { paymentConfig } from '@/lib/config/env'

// Types for Dodo Payments API responses
export interface DodoPaymentResponse {
  payment_id: string
  status: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_payment_method'
  total_amount: number
  currency: string
  customer: {
    customer_id: string
    name: string
    email: string
  }
  payment_method?: string
  payment_method_type?: string
  created_at: string
  metadata?: Record<string, any>
}

export interface DodoCheckoutSessionResponse {
  id: string
  url: string
  payment_id?: string
}

export interface DodoProductResponse {
  id: string
  name: string
  description?: string
  price: {
    type: string
    currency: string
    price: number
  }
  tax_category: string
  license_key_enabled?: boolean
  metadata?: Record<string, any>
}

export interface DodoCustomerResponse {
  customer_id: string
  name: string
  email: string
  phone_number?: string
  created_at: string
}

/**
 * Dodo Payments API client functions
 * Direct HTTP calls to Dodo Payments REST API
 */

export async function mcp__dodopayments_api__retrieve_payments(params: {
  payment_id: string
  jq_filter?: string
}): Promise<DodoPaymentResponse> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com' // Dodo uses same API for test/live with different keys

    const response = await fetch(`${baseUrl}/v1/payments/${params.payment_id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error retrieving payment from Dodo API:', error)
    throw new Error(`Failed to retrieve payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__create_checkout_sessions(params: {
  product_cart: Array<{
    product_id: string
    quantity: number
    amount?: number
  }>
  customer: {
    name: string
    email: string
    phone_number?: string
  }
  billing_currency: string
  return_url?: string
  discount_code?: string
  metadata?: Record<string, any>
  confirm: boolean
}): Promise<DodoCheckoutSessionResponse> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com'

    const response = await fetch(`${baseUrl}/v1/checkout/sessions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating checkout session with Dodo API:', error)
    throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__create_products(params: {
  name: string
  description?: string
  price: {
    type: 'one_time_price'
    currency: string
    price: number
    tax_inclusive: boolean
    purchasing_power_parity: boolean
    discount: number
  }
  tax_category: 'digital_products' | 'saas' | 'e_book' | 'edtech'
  license_key_enabled?: boolean
  metadata?: Record<string, any>
}): Promise<DodoProductResponse> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com'

    const response = await fetch(`${baseUrl}/v1/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating product with Dodo API:', error)
    throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__list_payments(params: {
  customer_id?: string
  status?: string
  created_at_gte?: string
  created_at_lte?: string
  page_number?: number
  page_size?: number
  jq_filter?: string
}): Promise<{ items: DodoPaymentResponse[] }> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com'

    const queryParams = new URLSearchParams()
    if (params.customer_id) queryParams.append('customer_id', params.customer_id)
    if (params.status) queryParams.append('status', params.status)
    if (params.created_at_gte) queryParams.append('created_at_gte', params.created_at_gte)
    if (params.created_at_lte) queryParams.append('created_at_lte', params.created_at_lte)
    if (params.page_number) queryParams.append('page_number', params.page_number.toString())
    if (params.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params.jq_filter) queryParams.append('jq_filter', params.jq_filter)

    const response = await fetch(`${baseUrl}/v1/payments?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error listing payments from Dodo API:', error)
    throw new Error(`Failed to list payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__create_customers(params: {
  name: string
  email: string
  phone_number?: string
}): Promise<DodoCustomerResponse> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com'

    const response = await fetch(`${baseUrl}/v1/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error creating customer with Dodo API:', error)
    throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__list_products(params: {
  page_number?: number
  page_size?: number
  archived?: boolean
}): Promise<{ items: DodoProductResponse[] }> {
  try {
    const apiKey = process.env.DODO_API_KEY
    const environment = process.env.DODO_ENVIRONMENT || 'test'
    const baseUrl = environment === 'live'
      ? 'https://api.dodopayments.com'
      : 'https://api.dodopayments.com'

    const queryParams = new URLSearchParams()
    if (params.page_number) queryParams.append('page_number', params.page_number.toString())
    if (params.page_size) queryParams.append('page_size', params.page_size.toString())
    if (params.archived !== undefined) queryParams.append('archived', params.archived.toString())

    const response = await fetch(`${baseUrl}/v1/products?${queryParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Dodo API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error listing products from Dodo API:', error)
    throw new Error(`Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

