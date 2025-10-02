import { paymentConfig } from '@/lib/config/env'

export interface DodoProduct {
  id: string
  name: string
  description?: string
  price: number
  currency: string
  taxCategory: 'digital_products' | 'saas' | 'e_book' | 'edtech'
  licenseKeyEnabled?: boolean
  metadata?: Record<string, any>
}

export interface DodoCustomer {
  id?: string
  name: string
  email: string
  phoneNumber?: string
}

export interface DodoPayment {
  id: string
  status: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_payment_method'
  amount: number
  currency: string
  customer: DodoCustomer
  paymentMethod?: string
  createdAt: string
  metadata?: Record<string, any>
}

export interface DodoCheckoutSession {
  id: string
  url: string
  paymentId: string
}

export interface CreateCheckoutSessionParams {
  products: Array<{
    productId: string
    quantity: number
    amount?: number // For pay-what-you-want products
  }>
  customer: DodoCustomer
  returnUrl?: string
  metadata?: Record<string, any>
  discountCode?: string
}

export interface CreateProductParams {
  name: string
  description?: string
  price: number
  currency: string
  taxCategory: DodoProduct['taxCategory']
  licenseKeyEnabled?: boolean
  metadata?: Record<string, any>
}

/**
 * Dodo Payments Service
 * Provides typed interface for Dodo Payments integration with LMS features
 */
export class DodoPaymentsService {
  private apiKey: string
  private environment: 'test' | 'live'

  constructor() {
    if (!paymentConfig.dodo.apiKey) {
      throw new Error('DODO_API_KEY is required')
    }

    this.apiKey = paymentConfig.dodo.apiKey
    this.environment = paymentConfig.dodo.environment
  }

  /**
   * Create a new product (course) in Dodo Payments
   */
  async createProduct(params: CreateProductParams): Promise<DodoProduct> {
    try {
      // Call Dodo Payments MCP API route
      const response = await fetch('/api/mcp/dodo/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: params.name,
          description: params.description,
          price: params.price,
          tax_category: params.taxCategory,
          license_key_enabled: params.licenseKeyEnabled || false,
          metadata: params.metadata || {}
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create product: ${response.statusText}`)
      }

      const product = await response.json()

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price?.price || params.price,
        currency: product.price?.currency || params.currency,
        taxCategory: product.tax_category,
        licenseKeyEnabled: product.license_key_enabled,
        metadata: product.metadata
      }
    } catch (error) {
      console.error('Error creating Dodo product:', error)
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create a checkout session for course purchase
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<DodoCheckoutSession> {
    try {
      // Call Dodo Payments MCP API route
      const response = await fetch('/api/mcp/dodo/checkout-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          product_cart: params.products.map(product => ({
            product_id: product.productId,
            quantity: product.quantity,
            amount: product.amount
          })),
          customer: {
            name: params.customer.name,
            email: params.customer.email,
            phone_number: params.customer.phoneNumber
          },
          billing_currency: 'USD',
          return_url: params.returnUrl,
          discount_code: params.discountCode,
          metadata: params.metadata || {},
          confirm: true
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.statusText}`)
      }

      const session = await response.json()

      return {
        id: session.id,
        url: session.url,
        paymentId: session.payment_id || session.id
      }
    } catch (error) {
      console.error('Error creating Dodo checkout session:', error)
      throw new Error(`Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get payment details by ID
   */
  async getPayment(paymentId: string): Promise<DodoPayment> {
    try {
      const response = await fetch(`/api/mcp/dodo/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get payment: ${response.statusText}`)
      }

      const payment = await response.json()

      return {
        id: payment.payment_id,
        status: payment.status,
        amount: payment.total_amount,
        currency: payment.currency,
        customer: {
          id: payment.customer.customer_id,
          name: payment.customer.name,
          email: payment.customer.email
        },
        paymentMethod: payment.payment_method,
        createdAt: payment.created_at,
        metadata: payment.metadata || {}
      }
    } catch (error) {
      console.error('Error fetching Dodo payment:', error)
      throw new Error(`Failed to get payment: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get customer details by ID
   */
  async getCustomer(customerId: string): Promise<DodoCustomer> {
    try {
      const response = await fetch(`/api/mcp/dodo/customers/${customerId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to get customer: ${response.statusText}`)
      }

      const customer = await response.json()
      return customer
    } catch (error) {
      console.error('Error fetching Dodo customer:', error)
      throw new Error(`Failed to get customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Create or update customer
   */
  async createCustomer(customer: Omit<DodoCustomer, 'id'>): Promise<DodoCustomer> {
    try {
      const response = await fetch('/api/mcp/dodo/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(customer)
      })

      if (!response.ok) {
        throw new Error(`Failed to create customer: ${response.statusText}`)
      }

      const createdCustomer = await response.json()
      return createdCustomer
    } catch (error) {
      console.error('Error creating Dodo customer:', error)
      throw new Error(`Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List all products (courses)
   */
  async listProducts(): Promise<DodoProduct[]> {
    try {
      const response = await fetch('/api/mcp/dodo/products', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to list products: ${response.statusText}`)
      }

      const result = await response.json()
      const products = result.items || []

      // Transform products to match our interface
      return products.map((product: any) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price?.price || 0,
        currency: product.price?.currency || 'USD',
        taxCategory: product.tax_category,
        licenseKeyEnabled: product.license_key_enabled,
        metadata: product.metadata
      }))
    } catch (error) {
      console.error('Error listing Dodo products:', error)
      throw new Error(`Failed to list products: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * List payments with filtering
   */
  async listPayments(filters?: {
    customerId?: string
    status?: DodoPayment['status']
    createdAfter?: Date
    createdBefore?: Date
  }): Promise<DodoPayment[]> {
    try {
      const params = new URLSearchParams()
      if (filters?.customerId) params.append('customer_id', filters.customerId)
      if (filters?.status) params.append('status', filters.status)
      if (filters?.createdAfter) params.append('created_at_gte', filters.createdAfter.toISOString())
      if (filters?.createdBefore) params.append('created_at_lte', filters.createdBefore.toISOString())

      const response = await fetch(`/api/mcp/dodo/payments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to list payments: ${response.statusText}`)
      }

      const result = await response.json()
      return result.items || []
    } catch (error) {
      console.error('Error listing Dodo payments:', error)
      throw new Error(`Failed to list payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhook(payload: string, signature: string): boolean {
    if (!paymentConfig.dodo.webhookSecret) {
      throw new Error('DODO_WEBHOOK_SECRET is required for webhook verification')
    }

    try {
      // Dodo Payments uses HMAC-SHA256 for webhook signature verification
      const crypto = require('crypto')
      const expectedSignature = crypto
        .createHmac('sha256', paymentConfig.dodo.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex')

      // Compare signatures using constant-time comparison to prevent timing attacks
      const providedSignature = signature.replace('sha256=', '')
      return crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      )
    } catch (error) {
      console.error('Error verifying webhook signature:', error)
      return false
    }
  }

  /**
   * Handle webhook events for course access management
   */
  async handleWebhook(event: any): Promise<void> {
    switch (event.type) {
      case 'payment.succeeded':
        await this.handlePaymentSucceeded(event.data)
        break
      case 'payment.failed':
        await this.handlePaymentFailed(event.data)
        break
      case 'subscription.active':
        await this.handleSubscriptionActive(event.data)
        break
      case 'license_key.created':
        await this.handleLicenseKeyCreated(event.data)
        break
      default:
        console.log(`Unhandled webhook event: ${event.type}`)
    }
  }

  private async handlePaymentSucceeded(payment: DodoPayment): Promise<void> {
    try {
      console.log(`Payment succeeded: ${payment.id} for customer ${payment.customer.id}`)

      // Extract course information from payment metadata
      const courseId = payment.metadata?.course_id
      const userId = payment.metadata?.user_id

      if (!courseId || !userId) {
        console.error('Missing course_id or user_id in payment metadata')
        return
      }

      // Create license key and grant course access via API
      const response = await fetch('/api/payments/webhook/payment-succeeded', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          courseId,
          userId,
          amount: payment.amount,
          currency: payment.currency,
          customer: payment.customer
        })
      })

      if (!response.ok) {
        throw new Error(`Failed to process payment success: ${response.statusText}`)
      }

      console.log(`Successfully granted course access for payment ${payment.id}`)
    } catch (error) {
      console.error('Error handling payment succeeded:', error)
    }
  }

  private async handlePaymentFailed(payment: DodoPayment): Promise<void> {
    try {
      console.log(`Payment failed: ${payment.id} for customer ${payment.customer.id}`)

      // Notify customer about failed payment via API
      const response = await fetch('/api/payments/webhook/payment-failed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: payment.id,
          customer: payment.customer,
          amount: payment.amount,
          currency: payment.currency
        })
      })

      if (!response.ok) {
        console.error(`Failed to process payment failure notification: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error handling payment failed:', error)
    }
  }

  private async handleSubscriptionActive(subscription: any): Promise<void> {
    try {
      console.log(`Subscription active: ${subscription.id}`)

      // Grant subscription-based course access
      const response = await fetch('/api/payments/webhook/subscription-active', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      })

      if (!response.ok) {
        console.error(`Failed to process subscription activation: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error handling subscription active:', error)
    }
  }

  private async handleLicenseKeyCreated(licenseKey: any): Promise<void> {
    try {
      console.log(`License key created: ${licenseKey.key}`)

      // Send license key to customer via email
      const response = await fetch('/api/payments/webhook/license-key-created', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(licenseKey)
      })

      if (!response.ok) {
        console.error(`Failed to send license key email: ${response.statusText}`)
      }
    } catch (error) {
      console.error('Error handling license key created:', error)
    }
  }
}

// Singleton instance
export const dodoPayments = new DodoPaymentsService()