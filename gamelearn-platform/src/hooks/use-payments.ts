import { useState, useCallback } from 'react'
import { toast } from 'sonner'

export interface PaymentCustomer {
  name: string
  email: string
  phoneNumber?: string
}

export interface CheckoutSessionData {
  sessionId: string
  checkoutUrl: string
  paymentId: string
}

export interface PaymentStatus {
  paymentId: string
  status: 'succeeded' | 'failed' | 'cancelled' | 'processing' | 'requires_payment_method'
  amount: number
  currency: string
  customer: PaymentCustomer
  paymentMethod?: string
  createdAt: string
}

export function usePayments() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckoutSession = useCallback(async (
    courseId: string,
    customer: PaymentCustomer,
    options?: {
      quantity?: number
      returnUrl?: string
      discountCode?: string
    }
  ): Promise<CheckoutSessionData | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          courseId,
          customer,
          quantity: options?.quantity || 1,
          returnUrl: options?.returnUrl,
          discountCode: options?.discountCode,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to create checkout session')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`Payment Error: ${errorMessage}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getPaymentStatus = useCallback(async (paymentId: string): Promise<PaymentStatus | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/payments/status/${paymentId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to get payment status')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`Payment Status Error: ${errorMessage}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const redirectToCheckout = useCallback((checkoutUrl: string) => {
    // Redirect to Dodo Payments checkout page
    window.location.href = checkoutUrl
  }, [])

  const purchaseCourse = useCallback(async (
    courseId: string,
    customer: PaymentCustomer,
    options?: {
      quantity?: number
      discountCode?: string
    }
  ): Promise<void> => {
    const returnUrl = `${window.location.origin}/courses/${courseId}/success`

    const checkoutSession = await createCheckoutSession(courseId, customer, {
      ...options,
      returnUrl,
    })

    if (checkoutSession) {
      // Store payment info in localStorage for tracking
      localStorage.setItem('pending_payment', JSON.stringify({
        paymentId: checkoutSession.paymentId,
        courseId,
        customer,
        timestamp: new Date().toISOString(),
      }))

      redirectToCheckout(checkoutSession.checkoutUrl)
    }
  }, [createCheckoutSession, redirectToCheckout])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    isLoading,
    error,
    createCheckoutSession,
    getPaymentStatus,
    redirectToCheckout,
    purchaseCourse,
    clearError,
  }
}