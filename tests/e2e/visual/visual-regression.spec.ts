import { test, expect } from '@playwright/test'

/**
 * Visual Regression Testing
 * Captures screenshots of key pages and compares them against baselines
 * Run with: npm run test:e2e -- --grep @visual
 */

test.describe('Visual Regression Tests @visual', () => {
  // Configure viewport for consistent screenshots
  test.use({ viewport: { width: 1280, height: 720 } })

  test('homepage visual snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Wait for hero section to be visible
    await page.waitForSelector('h1, [role="heading"]', { timeout: 5000 })

    // Take full page screenshot
    await expect(page).toHaveScreenshot('homepage-fullpage.png', {
      fullPage: true,
      animations: 'disabled',
    })

    // Take above-the-fold screenshot
    await expect(page).toHaveScreenshot('homepage-hero.png', {
      animations: 'disabled',
    })
  })

  test('courses page visual snapshot', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    // Wait for course cards to load
    await page.waitForSelector('[role="article"], .course-card', { timeout: 5000 })

    // Take full page screenshot
    await expect(page).toHaveScreenshot('courses-page.png', {
      fullPage: true,
      animations: 'disabled',
    })

    // Screenshot first course card
    const firstCourse = page.locator('[role="article"]').first()
    if (await firstCourse.isVisible()) {
      await expect(firstCourse).toHaveScreenshot('course-card.png', {
        animations: 'disabled',
      })
    }
  })

  test('sign-in page visual snapshot', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')

    // Wait for sign-in form
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('sign-in-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('sign-up page visual snapshot', async ({ page }) => {
    await page.goto('/sign-up')
    await page.waitForLoadState('networkidle')

    // Wait for sign-up form
    await page.waitForTimeout(2000)

    await expect(page).toHaveScreenshot('sign-up-page.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('course detail page visual snapshot', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(1000)

      await expect(page).toHaveScreenshot('course-detail-page.png', {
        fullPage: true,
        animations: 'disabled',
      })
    }
  })

  test('navigation header visual snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const header = page.locator('header, nav').first()

    if (await header.isVisible()) {
      await expect(header).toHaveScreenshot('navigation-header.png', {
        animations: 'disabled',
      })
    }
  })

  test('footer visual snapshot', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    const footer = page.locator('footer').first()

    if (await footer.isVisible()) {
      await footer.scrollIntoViewIfNeeded()
      await expect(footer).toHaveScreenshot('footer.png', {
        animations: 'disabled',
      })
    }
  })

  test('mobile viewport - homepage', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('mobile viewport - courses page', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('courses-mobile.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('tablet viewport - homepage', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-tablet.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })

  test('dark mode visual snapshot', async ({ page }) => {
    await page.goto('/')

    // Look for dark mode toggle
    const darkModeToggle = page.getByRole('button', { name: /dark|theme|mode/i }).first()

    if (await darkModeToggle.isVisible()) {
      await darkModeToggle.click()
      await page.waitForTimeout(500)

      await expect(page).toHaveScreenshot('homepage-dark-mode.png', {
        fullPage: true,
        animations: 'disabled',
      })
    }
  })

  test('button states visual snapshot', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const enrollButton = page.getByRole('button', { name: /enroll|start|begin/i }).first()

    if (await enrollButton.isVisible()) {
      // Normal state
      await expect(enrollButton).toHaveScreenshot('button-normal.png')

      // Hover state
      await enrollButton.hover()
      await expect(enrollButton).toHaveScreenshot('button-hover.png')

      // Focus state
      await enrollButton.focus()
      await expect(enrollButton).toHaveScreenshot('button-focus.png')
    }
  })

  test('form inputs visual snapshot', async ({ page }) => {
    await page.goto('/sign-in')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    const emailInput = page.locator('input[type="email"]').first()

    if (await emailInput.isVisible()) {
      // Empty state
      await expect(emailInput).toHaveScreenshot('input-empty.png')

      // Filled state
      await emailInput.fill('user@example.com')
      await expect(emailInput).toHaveScreenshot('input-filled.png')

      // Focus state
      await emailInput.focus()
      await expect(emailInput).toHaveScreenshot('input-focused.png')
    }
  })

  test('loading states visual snapshot', async ({ page }) => {
    await page.goto('/courses')

    // Intercept API calls to keep loading state
    await page.route('**/api/**', route => {
      // Delay response to capture loading state
      setTimeout(() => route.continue(), 5000)
    })

    await page.reload()

    // Capture loading state
    const loadingIndicator = page.locator('[role="status"], .loading, .spinner').first()

    if (await loadingIndicator.isVisible({ timeout: 2000 })) {
      await expect(loadingIndicator).toHaveScreenshot('loading-state.png')
    }
  })

  test('error states visual snapshot', async ({ page }) => {
    // Visit a non-existent page
    await page.goto('/courses/non-existent-course-12345')
    await page.waitForLoadState('networkidle')

    // Look for error message
    const errorMessage = page.getByText(/error|not found|couldn't find/i).first()

    if (await errorMessage.isVisible()) {
      await expect(page).toHaveScreenshot('error-page.png', {
        animations: 'disabled',
      })
    }
  })

  test('modal/dialog visual snapshot', async ({ page }) => {
    await page.goto('/')

    // Look for a button that might open a modal
    const modalTrigger = page.getByRole('button', { name: /filter|settings|menu/i }).first()

    if (await modalTrigger.isVisible()) {
      await modalTrigger.click()
      await page.waitForTimeout(500)

      // Look for modal
      const modal = page.locator('[role="dialog"], .modal').first()

      if (await modal.isVisible()) {
        await expect(modal).toHaveScreenshot('modal-dialog.png')
      }
    }
  })

  test('dropdown/select visual snapshot', async ({ page }) => {
    await page.goto('/courses')

    // Look for select or dropdown
    const select = page.locator('select, [role="combobox"]').first()

    if (await select.isVisible()) {
      await expect(select).toHaveScreenshot('select-closed.png')

      // Open dropdown
      await select.click()
      await page.waitForTimeout(300)

      await expect(select).toHaveScreenshot('select-open.png')
    }
  })

  test('responsive images visual snapshot', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const courseImage = page.locator('img').first()

    if (await courseImage.isVisible()) {
      await expect(courseImage).toHaveScreenshot('course-image-desktop.png')
    }

    // Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    if (await courseImage.isVisible()) {
      await expect(courseImage).toHaveScreenshot('course-image-mobile.png')
    }
  })

  test('accessibility high contrast mode', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })

    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page).toHaveScreenshot('homepage-high-contrast.png', {
      fullPage: true,
      animations: 'disabled',
    })
  })
})
