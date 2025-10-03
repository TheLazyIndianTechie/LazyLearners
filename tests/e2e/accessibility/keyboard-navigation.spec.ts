import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Accessibility - Keyboard Navigation @a11y', () => {
  test('should have no accessibility violations on home page', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should navigate with keyboard through main navigation', async ({ page }) => {
    await page.goto('/')

    // Press Tab to navigate through elements
    await page.keyboard.press('Tab')

    // Verify skip link appears first
    const skipLink = page.getByText(/skip to main content/i)
    await expect(skipLink).toBeFocused()

    // Activate skip link with Enter
    await page.keyboard.press('Enter')

    // Verify focus moved to main content
    const mainContent = page.locator('main')
    await expect(mainContent).toBeFocused()
  })

  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/courses')

    // Look for a button that opens a modal (adjust selector based on actual implementation)
    const modalTrigger = page.getByRole('button', { name: /filter/i }).first()

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()

      // Get all focusable elements in the dialog
      const dialog = page.locator('[role="dialog"]')
      await expect(dialog).toBeVisible()

      const focusableElements = await dialog.locator(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).count()

      if (focusableElements > 0) {
        // Tab through all elements
        for (let i = 0; i <= focusableElements; i++) {
          await page.keyboard.press('Tab')
        }

        // Focus should cycle back to first element in dialog
        const firstButton = dialog.locator('button, [href], input').first()
        await expect(firstButton).toBeFocused()

        // Test Escape key closes dialog
        await page.keyboard.press('Escape')
        await expect(dialog).not.toBeVisible()
      }
    }
  })

  test('should support keyboard navigation in forms', async ({ page }) => {
    await page.goto('/sign-in')

    // Tab to email field
    await page.keyboard.press('Tab')
    const emailInput = page.getByLabel(/email/i)
    await expect(emailInput).toBeFocused()

    // Type in email
    await page.keyboard.type('test@example.com')

    // Tab to next field
    await page.keyboard.press('Tab')

    // Should be on password field
    const passwordInput = page.getByLabel(/password/i)
    await expect(passwordInput).toBeFocused()
  })

  test('should announce form errors to screen readers', async ({ page }) => {
    await page.goto('/sign-in')

    // Try to submit empty form
    const submitButton = page.getByRole('button', { name: /sign in/i })
    await submitButton.click()

    // Check for error announcements
    const errorRegion = page.locator('[role="alert"], [aria-live="assertive"]')
    await expect(errorRegion).toBeVisible()
  })
})
