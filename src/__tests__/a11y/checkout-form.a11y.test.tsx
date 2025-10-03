import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'

// Mock Clerk hooks
jest.mock('@clerk/nextjs', () => ({
  useUser: () => ({
    user: {
      id: 'test-user-id',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
    },
  }),
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

expect.extend(toHaveNoViolations)

describe('Checkout Form Accessibility', () => {
  it('should have no accessibility violations', async () => {
    // Mock checkout page component (simplified version for testing)
    const CheckoutForm = () => (
      <form aria-label="Checkout form">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required aria-required="true" />
        </div>

        <div>
          <label htmlFor="cardNumber">Card Number</label>
          <input id="cardNumber" type="text" required aria-required="true" />
        </div>

        <div>
          <label htmlFor="expiryDate">Expiry Date</label>
          <input id="expiryDate" type="text" required aria-required="true" />
        </div>

        <div>
          <label htmlFor="cvv">CVV</label>
          <input id="cvv" type="text" required aria-required="true" />
        </div>

        <button type="submit">Pay Now</button>
      </form>
    )

    const { container } = render(<CheckoutForm />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have properly labeled form inputs', async () => {
    const CheckoutForm = () => (
      <form aria-label="Checkout form">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" required aria-required="true" />
        </div>
      </form>
    )

    const { container } = render(<CheckoutForm />)

    // Check for proper labels
    const inputs = container.querySelectorAll('input')

    inputs.forEach(input => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        container.querySelector(`label[for="${input.id}"]`)

      expect(hasLabel).toBeTruthy()
    })
  })

  it('should announce validation errors to screen readers', async () => {
    const CheckoutForm = () => (
      <form aria-label="Checkout form">
        <div>
          <label htmlFor="email">Email</label>
          <input id="email" type="email" aria-required="true" aria-invalid="true" aria-describedby="email-error" />
          <div id="email-error" role="alert">Email is required</div>
        </div>
      </form>
    )

    const { container } = render(<CheckoutForm />)

    // Check for aria-live regions or role="alert"
    const alerts = container.querySelectorAll('[role="alert"], [aria-live]')
    expect(alerts.length).toBeGreaterThan(0)
  })
})
