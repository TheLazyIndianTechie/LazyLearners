import { jest } from '@jest/globals'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { PurchaseButton } from '@/components/payments/purchase-button'
import { usePayments } from '@/hooks/use-payments'

// Mock dependencies
jest.mock('@clerk/nextjs')
jest.mock('sonner')
jest.mock('@/hooks/use-payments')

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>
const mockToast = toast as jest.MockedObject<typeof toast>
const mockUsePayments = usePayments as jest.MockedFunction<typeof usePayments>

// Mock payment hook implementation
const createMockPaymentHook = (overrides = {}) => ({
  isLoading: false,
  error: null,
  createCheckoutSession: jest.fn(),
  getPaymentStatus: jest.fn(),
  redirectToCheckout: jest.fn(),
  purchaseCourse: jest.fn(),
  clearError: jest.fn(),
  ...overrides,
})

describe('Payment Flow Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()

    // Setup default mocks
    mockUseAuth.mockReturnValue({
      getToken: jest.fn().mockResolvedValue('mock-token'),
      isSignedIn: true,
      userId: 'user-123',
      isLoaded: true,
    } as any)

    mockToast.error = jest.fn()
    mockToast.success = jest.fn()

    mockUsePayments.mockReturnValue(createMockPaymentHook())

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })

    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: {
        href: '',
        origin: 'http://localhost:3002',
      },
      writable: true,
    })
  })

  describe('PurchaseButton Component', () => {
    const defaultProps = {
      courseId: 'course-123',
      courseName: 'Test Course',
      price: 9999, // $99.99 in cents
      currency: 'USD',
    }

    test('renders purchase button with correct price formatting', () => {
      render(<PurchaseButton {...defaultProps} />)

      expect(screen.getByText(/Buy Now - \$99\.99/)).toBeInTheDocument()
    })

    test('opens modal when purchase button is clicked', async () => {
      render(<PurchaseButton {...defaultProps} />)

      const button = screen.getByText(/Buy Now/)
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Purchase Course')).toBeInTheDocument()
        expect(screen.getByText(/You're about to purchase "Test Course"/)).toBeInTheDocument()
      })
    })

    test('displays form fields in modal', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Discount Code/)).toBeInTheDocument()
      })
    })

    test('validates required fields before purchase', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const payButton = screen.getByText(/Pay \$99\.99/)
        expect(payButton).toBeDisabled()
      })
    })

    test('enables pay button when required fields are filled', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/)
        const emailInput = screen.getByLabelText(/Email Address/)

        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

        const payButton = screen.getByText(/Pay \$99\.99/)
        expect(payButton).not.toBeDisabled()
      })
    })

    test('shows validation error for missing required fields', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const payButton = screen.getByText(/Pay \$99\.99/)
        fireEvent.click(payButton)

        expect(mockToast.error).toHaveBeenCalledWith('Please fill in your name and email')
      })
    })

    test('calls purchaseCourse with correct parameters', async () => {
      const mockPurchaseCourse = jest.fn()
      mockUsePayments.mockReturnValue(createMockPaymentHook({
        purchaseCourse: mockPurchaseCourse,
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/)
        const emailInput = screen.getByLabelText(/Email Address/)
        const phoneInput = screen.getByLabelText(/Phone Number/)
        const discountInput = screen.getByLabelText(/Discount Code/)

        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } })
        fireEvent.change(phoneInput, { target: { value: '+1234567890' } })
        fireEvent.change(discountInput, { target: { value: 'DISCOUNT10' } })

        const payButton = screen.getByText(/Pay \$99\.99/)
        fireEvent.click(payButton)

        expect(mockPurchaseCourse).toHaveBeenCalledWith(
          'course-123',
          {
            name: 'John Doe',
            email: 'john@example.com',
            phoneNumber: '+1234567890',
          },
          {
            discountCode: 'DISCOUNT10',
            courseName: 'Test Course',
          }
        )
      })
    })

    test('shows loading state during purchase', async () => {
      mockUsePayments.mockReturnValue(createMockPaymentHook({
        isLoading: true,
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        expect(screen.getByText(/Processing.../)).toBeInTheDocument()
        expect(screen.getByLabelText(/Full Name/)).toBeDisabled()
        expect(screen.getByLabelText(/Email Address/)).toBeDisabled()
      })
    })

    test('displays error message when payment fails', async () => {
      const errorMessage = 'Payment failed: Insufficient funds'
      mockUsePayments.mockReturnValue(createMockPaymentHook({
        error: errorMessage,
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })
    })

    test('clears error when modal is closed', async () => {
      const mockClearError = jest.fn()
      mockUsePayments.mockReturnValue(createMockPaymentHook({
        error: 'Some error',
        clearError: mockClearError,
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel')
        fireEvent.click(cancelButton)

        expect(mockClearError).toHaveBeenCalled()
      })
    })
  })

  describe('usePayments Hook Integration', () => {
    test('createCheckoutSession includes authentication token', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            sessionId: 'session-123',
            checkoutUrl: 'https://checkout.dodo.com/123',
            paymentId: 'payment-123',
            returnUrl: 'http://localhost:3002/courses/course-123/success',
          },
        }),
      })
      global.fetch = mockFetch

      // Test the actual hook implementation
      const { createCheckoutSession } = jest.requireActual('@/hooks/use-payments').usePayments()

      await createCheckoutSession('course-123', {
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        body: JSON.stringify({
          courseId: 'course-123',
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
          },
          quantity: 1,
          returnUrl: undefined,
          discountCode: undefined,
        }),
      })
    })

    test('getPaymentStatus includes authentication token', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: {
            paymentId: 'payment-123',
            status: 'succeeded',
            amount: 9999,
            currency: 'USD',
          },
        }),
      })
      global.fetch = mockFetch

      const { getPaymentStatus } = jest.requireActual('@/hooks/use-payments').usePayments()

      await getPaymentStatus('payment-123')

      expect(mockFetch).toHaveBeenCalledWith('/api/payments/status/payment-123', {
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })
    })

    test('stores payment information in localStorage during purchase', async () => {
      const mockSetItem = jest.fn()
      Object.defineProperty(window, 'localStorage', {
        value: { setItem: mockSetItem },
        writable: true,
      })

      const mockCreateCheckoutSession = jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        checkoutUrl: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
        returnUrl: 'http://localhost:3002/courses/course-123/success',
      })

      mockUsePayments.mockReturnValue(createMockPaymentHook({
        createCheckoutSession: mockCreateCheckoutSession,
        redirectToCheckout: jest.fn(),
      }))

      const { purchaseCourse } = jest.requireActual('@/hooks/use-payments').usePayments()

      await purchaseCourse('course-123', {
        name: 'John Doe',
        email: 'john@example.com',
      }, {
        courseName: 'Test Course',
      })

      expect(mockSetItem).toHaveBeenCalledWith(
        'pending_payment',
        expect.stringContaining('"paymentId":"payment-123"')
      )
    })

    test('redirects to checkout URL after successful session creation', async () => {
      const mockCreateCheckoutSession = jest.fn().mockResolvedValue({
        sessionId: 'session-123',
        checkoutUrl: 'https://checkout.dodo.com/123',
        paymentId: 'payment-123',
      })

      const mockRedirectToCheckout = jest.fn()

      mockUsePayments.mockReturnValue(createMockPaymentHook({
        createCheckoutSession: mockCreateCheckoutSession,
        redirectToCheckout: mockRedirectToCheckout,
      }))

      const { purchaseCourse } = jest.requireActual('@/hooks/use-payments').usePayments()

      await purchaseCourse('course-123', {
        name: 'John Doe',
        email: 'john@example.com',
      })

      expect(mockRedirectToCheckout).toHaveBeenCalledWith('https://checkout.dodo.com/123')
    })
  })

  describe('Error Handling', () => {
    test('handles network errors gracefully', async () => {
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'))
      global.fetch = mockFetch

      mockUsePayments.mockReturnValue(createMockPaymentHook({
        createCheckoutSession: jest.fn().mockRejectedValue(new Error('Network error')),
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/)
        const emailInput = screen.getByLabelText(/Email Address/)

        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

        const payButton = screen.getByText(/Pay \$99\.99/)
        fireEvent.click(payButton)
      })

      // Should handle error gracefully without crashing
      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Network error'))
    })

    test('handles API errors with proper status codes', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          success: false,
          error: 'Unauthorized',
        }),
      })
      global.fetch = mockFetch

      mockUsePayments.mockReturnValue(createMockPaymentHook({
        createCheckoutSession: jest.fn().mockRejectedValue(new Error('Unauthorized')),
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/)
        const emailInput = screen.getByLabelText(/Email Address/)

        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'john@example.com' } })

        const payButton = screen.getByText(/Pay \$99\.99/)
        fireEvent.click(payButton)
      })

      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'))
    })

    test('handles validation errors from server', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({
          success: false,
          error: 'Invalid request data',
          details: [
            { field: 'email', message: 'Invalid email format' },
          ],
        }),
      })
      global.fetch = mockFetch

      mockUsePayments.mockReturnValue(createMockPaymentHook({
        createCheckoutSession: jest.fn().mockRejectedValue(new Error('Invalid request data')),
      }))

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Full Name/)
        const emailInput = screen.getByLabelText(/Email Address/)

        fireEvent.change(nameInput, { target: { value: 'John Doe' } })
        fireEvent.change(emailInput, { target: { value: 'invalid-email' } })

        const payButton = screen.getByText(/Pay \$99\.99/)
        fireEvent.click(payButton)
      })

      expect(mockToast.error).toHaveBeenCalledWith(expect.stringContaining('Invalid request data'))
    })
  })

  describe('Accessibility', () => {
    test('button has proper ARIA attributes', () => {
      render(<PurchaseButton {...defaultProps} />)

      const button = screen.getByRole('button', { name: /Buy Now/ })
      expect(button).toBeInTheDocument()
    })

    test('modal has proper ARIA attributes', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
        expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
      })
    })

    test('form inputs have proper labels', async () => {
      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        expect(screen.getByLabelText(/Full Name/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Phone Number/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Discount Code/)).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Design', () => {
    test('modal adapts to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<PurchaseButton {...defaultProps} />)

      fireEvent.click(screen.getByText(/Buy Now/))

      await waitFor(() => {
        const modal = screen.getByRole('dialog')
        expect(modal).toHaveClass('sm:max-w-md')
      })
    })
  })
})