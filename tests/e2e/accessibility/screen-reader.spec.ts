import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Screen Reader Announcements @a11y', () => {
  test('should have proper ARIA landmarks on main page', async ({ page }) => {
    await page.goto('/')

    // Check for navigation landmark
    const nav = page.locator('[role="navigation"], nav')
    await expect(nav.first()).toBeVisible()

    // Check for main landmark
    const main = page.locator('[role="main"], main')
    await expect(main).toBeVisible()

    // Check for contentinfo landmark (footer)
    const footer = page.locator('[role="contentinfo"], footer')
    await expect(footer).toBeVisible()
  })

  test('should have accessible course cards', async ({ page }) => {
    await page.goto('/courses')

    // Get first course card
    const courseCard = page.locator('[role="article"]').first()

    if (await courseCard.isVisible()) {
      // Check for heading
      const heading = courseCard.locator('h2, h3, h4')
      await expect(heading.first()).toBeVisible()

      // Check for link with descriptive text
      const link = courseCard.locator('a')
      const ariaLabel = await link.first().getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel?.length).toBeGreaterThan(5)
    }
  })

  test('should announce loading states', async ({ page }) => {
    await page.goto('/courses')

    // Look for loading announcement
    const loadingRegion = page.locator('[aria-live="polite"]')

    // If loading state exists, it should be announced
    if (await loadingRegion.count() > 0) {
      await expect(loadingRegion.first()).toBeAttached()
    }
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')

    // Get all headings
    const headings = page.locator('h1, h2, h3, h4, h5, h6')
    const count = await headings.count()

    expect(count).toBeGreaterThan(0)

    // Should have exactly one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)

    // Check heading levels don't skip (e.g., h2 shouldn't be followed by h4)
    const headingLevels = await headings.evaluateAll(elements =>
      elements.map(el => parseInt(el.tagName.charAt(1)))
    )

    for (let i = 1; i < headingLevels.length; i++) {
      const diff = headingLevels[i] - headingLevels[i - 1]
      // Headings should not skip more than one level
      expect(diff).toBeLessThanOrEqual(1)
    }
  })

  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should have accessible buttons with proper labels', async ({ page }) => {
    await page.goto('/')

    const buttons = page.locator('button')
    const count = await buttons.count()

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i)

      // Each button should have either:
      // 1. Text content, or
      // 2. aria-label, or
      // 3. aria-labelledby
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const ariaLabelledby = await button.getAttribute('aria-labelledby')

      const hasAccessibleName =
        (text && text.trim().length > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        (ariaLabelledby && ariaLabelledby.length > 0)

      expect(hasAccessibleName).toBeTruthy()
    }
  })

  test('should have accessible form inputs', async ({ page }) => {
    await page.goto('/sign-in')

    const inputs = page.locator('input')
    const count = await inputs.count()

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const type = await input.getAttribute('type')

      // Skip hidden inputs
      if (type === 'hidden') continue

      // Each visible input should have a label
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledby = await input.getAttribute('aria-labelledby')

      const hasLabel =
        (id && await page.locator(`label[for="${id}"]`).count() > 0) ||
        (ariaLabel && ariaLabel.length > 0) ||
        (ariaLabelledby && ariaLabelledby.length > 0)

      expect(hasLabel).toBeTruthy()
    }
  })
})
