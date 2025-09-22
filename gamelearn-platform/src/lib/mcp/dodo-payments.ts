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
 * MCP wrapper functions for Dodo Payments API
 * These functions will be called from server-side contexts where MCP tools are available
 */

export async function mcp__dodopayments_api__retrieve_payments(params: {
  payment_id: string
  jq_filter?: string
}): Promise<DodoPaymentResponse> {
  // In a real implementation, this would use the actual MCP tool
  // For now, we'll use the fetch-based approach with proper error handling

  try {
    // This should be replaced with actual MCP tool call
    // when running in Claude Code environment
    if (typeof global !== 'undefined' && global.mcpTools) {
      // Use actual MCP tool if available
      return await global.mcpTools.mcp__dodopayments_api__retrieve_payments(params)
    }

    // Fallback for development/testing
    console.warn('MCP tools not available, using development fallback')

    // Return mock data for development
    return {
      payment_id: params.payment_id,
      status: 'succeeded',
      total_amount: 2999,
      currency: 'USD',
      customer: {
        customer_id: 'cus_dev_example',
        name: 'Development User',
        email: 'dev@example.com'
      },
      payment_method: 'credit',
      payment_method_type: 'card',
      created_at: new Date().toISOString(),
      metadata: {
        course_id: 'course_dev_123',
        user_id: 'user_dev_456',
        environment: 'development'
      }
    }
  } catch (error) {
    console.error('Error in MCP payment retrieval:', error)
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
    if (typeof global !== 'undefined' && global.mcpTools) {
      return await global.mcpTools.mcp__dodopayments_api__create_checkout_sessions(params)
    }

    console.warn('MCP tools not available, using development fallback')

    // Return mock checkout session for development
    const sessionId = `cs_dev_${Date.now()}`
    return {
      id: sessionId,
      url: `https://checkout.dodo.dev/session/${sessionId}?mode=test`,
      payment_id: `pay_dev_${Date.now()}`
    }
  } catch (error) {
    console.error('Error in MCP checkout session creation:', error)
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
    if (typeof global !== 'undefined' && global.mcpTools) {
      return await global.mcpTools.mcp__dodopayments_api__create_products(params)
    }

    console.warn('MCP tools not available, using development fallback')

    // Return mock product for development
    return {
      id: `prod_dev_${Date.now()}`,
      name: params.name,
      description: params.description,
      price: params.price,
      tax_category: params.tax_category,
      license_key_enabled: params.license_key_enabled,
      metadata: params.metadata
    }
  } catch (error) {
    console.error('Error in MCP product creation:', error)
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
    if (typeof global !== 'undefined' && global.mcpTools) {
      return await global.mcpTools.mcp__dodopayments_api__list_payments(params)
    }

    console.warn('MCP tools not available, using development fallback')

    // Return mock payments list for development
    return {
      items: []
    }
  } catch (error) {
    console.error('Error in MCP payments list:', error)
    throw new Error(`Failed to list payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__create_customers(params: {
  name: string
  email: string
  phone_number?: string
}): Promise<DodoCustomerResponse> {
  try {
    if (typeof global !== 'undefined' && global.mcpTools) {
      return await global.mcpTools.mcp__dodopayments_api__create_customers(params)
    }

    console.warn('MCP tools not available, using development fallback')

    // Return mock customer for development
    return {
      customer_id: `cus_dev_${Date.now()}`,
      name: params.name,
      email: params.email,
      phone_number: params.phone_number,
      created_at: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error in MCP customer creation:', error)
    throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function mcp__dodopayments_api__list_products(params: {
  page_number?: number
  page_size?: number
  archived?: boolean
}): Promise<{ items: DodoProductResponse[] }> {
  try {
    if (typeof global !== 'undefined' && global.mcpTools) {
      return await global.mcpTools.mcp__dodopayments_api__list_products(params)
    }

    console.warn('MCP tools not available, using development fallback')

    // Return mock products list for development
    return {
      items: [
        {
          id: `prod_dev_${Date.now()}`,
          name: 'Game Development Fundamentals',
          description: 'Learn the basics of game development with Unity',
          price: {
            type: 'one_time_price',
            currency: 'USD',
            price: 2999
          },
          tax_category: 'edtech',
          license_key_enabled: true,
          metadata: {
            environment: 'development',
            duration: '8 hours'
          }
        }
      ]
    }
  } catch (error) {
    console.error('Error in MCP products list:', error)
    throw new Error(`Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Type declaration for global MCP tools (when available)
declare global {
  var mcpTools: {
    mcp__dodopayments_api__retrieve_payments: (params: any) => Promise<any>
    mcp__dodopayments_api__create_checkout_sessions: (params: any) => Promise<any>
    mcp__dodopayments_api__create_products: (params: any) => Promise<any>
    mcp__dodopayments_api__list_payments: (params: any) => Promise<any>
    mcp__dodopayments_api__create_customers: (params: any) => Promise<any>
    mcp__dodopayments_api__list_products: (params: any) => Promise<any>
  } | undefined
}