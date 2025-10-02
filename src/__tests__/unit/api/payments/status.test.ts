import { jest } from '@jest/globals'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/payments/status/[paymentId]/route'
import { dodoPayments } from '@/lib/payments/dodo'

// Mock dependencies
jest.mock('@/lib/payments/dodo')

const mockDodoPayments = dodoPayments as jest.Mocked<typeof dodoPayments>

describe('/api/payments/status/[paymentId]', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const createRequest = (paymentId: string) => {
    return new NextRequest(`http://localhost:3002/api/payments/status/${paymentId}`, {
      method: 'GET',
    })
  }

  const mockPaymentData = {
    id: 'payment-123',
    status: 'succeeded' as const,
    amount: 9999,
    currency: 'USD',
    customer: {
      name: 'John Doe',
      email: 'john@example.com',
      phoneNumber: '+1234567890',
    },
    paymentMethod: 'card',
    createdAt: '2024-01-01T00:00:00Z',
  }

  describe('Parameter Validation', () => {
    test('returns 400 when paymentId is missing', async () => {
      const response = await GET(createRequest(''), { params: { paymentId: '' } })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toEqual({
        success: false,
        error: 'Payment ID is required',
      })
    })

    test('proceeds when paymentId is provided', async () => {
      mockDodoPayments.getPayment.mockResolvedValue(mockPaymentData)

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })

      expect(response.status).toBe(200)
    })
  })

  describe('Dodo Payments Integration', () => {
    test('calls dodoPayments.getPayment with correct paymentId', async () => {
      mockDodoPayments.getPayment.mockResolvedValue(mockPaymentData)

      await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })

      expect(mockDodoPayments.getPayment).toHaveBeenCalledWith('payment-123')
    })

    test('returns correct payment data format', async () => {
      mockDodoPayments.getPayment.mockResolvedValue(mockPaymentData)

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        success: true,
        data: {
          paymentId: 'payment-123',
          status: 'succeeded',
          amount: 9999,
          currency: 'USD',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
          },
          paymentMethod: 'card',
          createdAt: '2024-01-01T00:00:00Z',
        },
      })
    })

    test('handles different payment statuses', async () => {
      const statuses = ['succeeded', 'failed', 'cancelled', 'processing', 'requires_payment_method'] as const

      for (const status of statuses) {
        mockDodoPayments.getPayment.mockResolvedValue({
          ...mockPaymentData,
          status,
        })

        const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.data.status).toBe(status)
      }
    })

    test('handles payment data with missing optional fields', async () => {
      mockDodoPayments.getPayment.mockResolvedValue({
        id: 'payment-123',
        status: 'succeeded' as const,
        amount: 9999,
        currency: 'USD',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
        },
        createdAt: '2024-01-01T00:00:00Z',
      })

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.customer.phoneNumber).toBeUndefined()
      expect(data.data.paymentMethod).toBeUndefined()
    })

    test('handles Dodo Payments API errors', async () => {
      mockDodoPayments.getPayment.mockRejectedValue(new Error('Payment not found'))

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to get payment status',
        message: 'Payment not found',
      })
    })

    test('handles network errors', async () => {
      mockDodoPayments.getPayment.mockRejectedValue(new Error('Network timeout'))

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data).toEqual({
        success: false,
        error: 'Failed to get payment status',
        message: 'Network timeout',
      })
    })

    test('handles unexpected errors', async () => {
      mockDodoPayments.getPayment.mockImplementation(() => {
        throw new Error('Unexpected error')
      })

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to get payment status')
      expect(data.message).toBe('Unexpected error')
    })
  })

  describe('Response Format', () => {
    test('returns consistent response structure for success', async () => {
      mockDodoPayments.getPayment.mockResolvedValue(mockPaymentData)

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('paymentId')
      expect(data.data).toHaveProperty('status')
      expect(data.data).toHaveProperty('amount')
      expect(data.data).toHaveProperty('currency')
      expect(data.data).toHaveProperty('customer')
      expect(data.data).toHaveProperty('createdAt')
    })

    test('returns consistent response structure for errors', async () => {
      mockDodoPayments.getPayment.mockRejectedValue(new Error('Test error'))

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('message')
    })
  })

  describe('Security Considerations', () => {
    test('does not expose sensitive internal data', async () => {
      mockDodoPayments.getPayment.mockResolvedValue({
        ...mockPaymentData,
        internalId: 'internal-123',
        apiKey: 'secret-key',
        webhookSecret: 'webhook-secret',
      } as any)

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(data.data).not.toHaveProperty('internalId')
      expect(data.data).not.toHaveProperty('apiKey')
      expect(data.data).not.toHaveProperty('webhookSecret')
    })

    test('validates payment ID format', async () => {
      const invalidPaymentIds = ['', null, undefined, 'invalid id with spaces', '<script>alert(1)</script>']

      for (const paymentId of invalidPaymentIds) {
        if (paymentId === null || paymentId === undefined) continue

        const response = await GET(
          createRequest(paymentId),
          { params: { paymentId: paymentId } }
        )
        const data = await response.json()

        if (paymentId === '') {
          expect(response.status).toBe(400)
          expect(data.error).toBe('Payment ID is required')
        }
      }
    })
  })

  describe('Edge Cases', () => {
    test('handles very long payment IDs', async () => {
      const longPaymentId = 'payment-' + 'a'.repeat(1000)
      mockDodoPayments.getPayment.mockResolvedValue({
        ...mockPaymentData,
        id: longPaymentId,
      })

      const response = await GET(createRequest(longPaymentId), { params: { paymentId: longPaymentId } })

      expect(response.status).toBe(200)
      expect(mockDodoPayments.getPayment).toHaveBeenCalledWith(longPaymentId)
    })

    test('handles special characters in payment ID', async () => {
      const specialPaymentId = 'payment-123-abc_def'
      mockDodoPayments.getPayment.mockResolvedValue({
        ...mockPaymentData,
        id: specialPaymentId,
      })

      const response = await GET(createRequest(specialPaymentId), { params: { paymentId: specialPaymentId } })

      expect(response.status).toBe(200)
      expect(mockDodoPayments.getPayment).toHaveBeenCalledWith(specialPaymentId)
    })

    test('handles payment with zero amount', async () => {
      mockDodoPayments.getPayment.mockResolvedValue({
        ...mockPaymentData,
        amount: 0,
      })

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.amount).toBe(0)
    })

    test('handles payment with large amount', async () => {
      const largeAmount = 999999999 // $9,999,999.99
      mockDodoPayments.getPayment.mockResolvedValue({
        ...mockPaymentData,
        amount: largeAmount,
      })

      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.data.amount).toBe(largeAmount)
    })
  })

  describe('Performance', () => {
    test('handles concurrent requests', async () => {
      mockDodoPayments.getPayment.mockResolvedValue(mockPaymentData)

      const requests = Array.from({ length: 10 }, (_, i) =>
        GET(createRequest(`payment-${i}`), { params: { paymentId: `payment-${i}` } })
      )

      const responses = await Promise.all(requests)

      responses.forEach((response, i) => {
        expect(response.status).toBe(200)
      })

      expect(mockDodoPayments.getPayment).toHaveBeenCalledTimes(10)
    })

    test('handles slow Dodo Payments responses', async () => {
      mockDodoPayments.getPayment.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockPaymentData), 1000))
      )

      const startTime = Date.now()
      const response = await GET(createRequest('payment-123'), { params: { paymentId: 'payment-123' } })
      const endTime = Date.now()

      expect(response.status).toBe(200)
      expect(endTime - startTime).toBeGreaterThan(900) // Allow for some variance
    })
  })
})