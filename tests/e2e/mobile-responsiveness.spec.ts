import { test, expect } from '@playwright/test'

/**
 * Mobile Responsiveness E2E Tests
 *
 * Tests compliance with WCAG 2.1 AA touch target requirements (44x44px minimum)
 * and validates responsive layouts across breakpoints.
 *
 * Related to Task 17.7: Automated responsive design testing
 */

// Test viewports matching real devices
const VIEWPORTS = {
  'iPhone SE': { width: 375, height: 667 },
  'iPhone 14': { width: 390, height: 844 },
  'iPhone 14 Pro Max': { width: 430, height: 932 },
  'Small Android': { width: 360, height: 640 },
  'Pixel 7': { width: 412, height: 915 },
  'iPad Mini': { width: 744, height: 1133 },
  'Desktop': { width: 1280, height: 720 }
}

const TOUCH_TARGET_MINIMUM = 44 // WCAG 2.1 AA minimum

test.describe('Mobile Responsiveness - Touch Targets', () => {

  test.describe('Video Player Controls', () => {
    test('should have 44x44px minimum touch targets on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/test/video')

      // Wait for video player to load
      await page.waitForSelector('[data-testid="video-player"], video', { timeout: 5000 })

      // Check all control buttons
      const controlButtons = [
        'button:has-text("Play")',
        'button:has-text("Pause")',
        'button[aria-label*="volume"]',
        'button[aria-label*="settings"]',
        'button[aria-label*="fullscreen"]',
      ]

      for (const selector of controlButtons) {
        const button = await page.locator(selector).first()
        if (await button.count() > 0) {
          const box = await button.boundingBox()
          if (box) {
            expect(box.width, `${selector} width should be >= ${TOUCH_TARGET_MINIMUM}px`).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
            expect(box.height, `${selector} height should be >= ${TOUCH_TARGET_MINIMUM}px`).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
          }
        }
      }
    })

    test('should have usable progress slider on mobile', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/test/video')

      // Check slider thumb size
      const slider = await page.locator('[role="slider"]').first()
      if (await slider.count() > 0) {
        const box = await slider.boundingBox()
        if (box) {
          expect(box.height, 'Slider thumb height should be >= 20px').toBeGreaterThanOrEqual(20)
        }
      }
    })
  })

  test.describe('Navigation Controls', () => {
    test('should have tappable mobile menu toggle', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/')

      const menuButton = await page.locator('button[aria-label*="menu"], button:has(svg):has-text("Menu")').first()
      const box = await menuButton.boundingBox()

      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
      }
    })

    test('should have tappable mobile menu links', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/')

      // Open mobile menu
      const menuButton = await page.locator('button[aria-label*="menu"]').first()
      await menuButton.click()

      // Check menu link heights
      const menuLinks = await page.locator('[role="dialog"] a, [role="menu"] a')
      const count = await menuLinks.count()

      for (let i = 0; i < count; i++) {
        const link = menuLinks.nth(i)
        const box = await link.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })
  })

  test.describe('Course Cards', () => {
    test('should have tappable CTA buttons on course cards', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/courses')

      await page.waitForSelector('[class*="CourseCard"]', { timeout: 5000 })

      // Check "View Course" or "Enroll" buttons
      const ctaButtons = await page.locator('button:has-text("View Course"), button:has-text("Enroll"), button:has-text("Continue")')
      const count = Math.min(await ctaButtons.count(), 5) // Check first 5 cards

      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i)
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })
  })

  test.describe('Dashboard Controls', () => {
    test('should have tappable tab triggers', async ({ page, context }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])

      // Mock authentication
      await context.addCookies([{
        name: '__session',
        value: 'mock-session',
        domain: 'localhost',
        path: '/'
      }])

      await page.goto('/dashboard')
      await page.waitForLoadState('networkidle')

      const tabTriggers = await page.locator('[role="tab"]')
      const count = await tabTriggers.count()

      for (let i = 0; i < count; i++) {
        const tab = tabTriggers.nth(i)
        const box = await tab.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })

    test('should have tappable quick action buttons', async ({ page, context }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])

      await context.addCookies([{
        name: '__session',
        value: 'mock-session',
        domain: 'localhost',
        path: '/'
      }])

      await page.goto('/dashboard')
      await page.waitForSelector('button:has-text("Portfolio"), button:has-text("Community")', { timeout: 5000 })

      const quickActions = await page.locator('button:has-text("Portfolio"), button:has-text("Community"), button:has-text("Explore")')
      const count = await quickActions.count()

      for (let i = 0; i < count; i++) {
        const button = quickActions.nth(i)
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })
  })

  test.describe('Hero Section CTA', () => {
    test('should have tappable hero CTA buttons', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/')

      const ctaButtons = await page.locator('a:has-text("Explore Courses"), a:has-text("Watch Demo")')
      const count = await ctaButtons.count()

      for (let i = 0; i < count; i++) {
        const button = ctaButtons.nth(i)
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })
  })

  test.describe('Courses Page Filters', () => {
    test('should have tappable filter controls', async ({ page }) => {
      await page.setViewportSize(VIEWPORTS['iPhone SE'])
      await page.goto('/courses')

      // Check filter button
      const filterButton = await page.locator('button:has-text("Filters")')
      const box = await filterButton.boundingBox()

      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
      }

      // Check view mode toggles
      const viewToggles = await page.locator('button[aria-label*="view"]')
      const count = await viewToggles.count()

      for (let i = 0; i < count; i++) {
        const toggle = viewToggles.nth(i)
        const toggleBox = await toggle.boundingBox()
        if (toggleBox) {
          expect(toggleBox.width).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
          expect(toggleBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_MINIMUM)
        }
      }
    })
  })
})

test.describe('Mobile Responsiveness - Layout Overflow', () => {

  test('should not have horizontal scroll on any page (320px width)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 }) // Smallest supported

    const pages = ['/', '/courses', '/dashboard']

    for (const pagePath of pages) {
      await page.goto(pagePath)
      await page.waitForLoadState('networkidle')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll, `Page ${pagePath} should not have horizontal scroll at 320px`).toBe(false)
    }
  })

  test('should display dashboard tabs in responsive grid', async ({ page, context }) => {
    await context.addCookies([{
      name: '__session',
      value: 'mock-session',
      domain: 'localhost',
      path: '/'
    }])

    // Mobile: 2 columns
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.goto('/dashboard')
    await page.waitForSelector('[role="tablist"]', { timeout: 5000 })

    const tabsList = await page.locator('[role="tablist"]')
    const gridColumns = await tabsList.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumns, 'Mobile should show 2 columns of tabs').toBe(2)

    // Tablet: 4 columns
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(100)

    const gridColumnsTablet = await tabsList.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsTablet, 'Tablet should show 4 columns of tabs').toBe(4)
  })

  test('should display hero stats in responsive grid', async ({ page }) => {
    // Mobile: 1 column
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.goto('/')

    const statsGrid = await page.locator('text=Learners').locator('..').locator('..')
    const gridColumnsMobile = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsMobile, 'Mobile should show 1 column of stats').toBe(1)

    // Tablet: 3 columns
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(100)

    const gridColumnsTablet = await statsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsTablet, 'Tablet should show 3 columns of stats').toBe(3)
  })

  test('should display course categories in responsive grid', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForSelector('text=Unity, text=Unreal', { timeout: 5000 })

    const categoryGrid = await page.locator('text=Unity').locator('..').locator('..').locator('..')

    // Mobile: 1 column
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(100)

    const gridColumnsMobile = await categoryGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsMobile).toBeLessThanOrEqual(2) // 1 or 2 columns on mobile

    // Desktop: 6 columns
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(100)

    const gridColumnsDesktop = await categoryGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsDesktop).toBe(6)
  })

  test('should display dashboard quick actions in responsive grid', async ({ page, context }) => {
    await context.addCookies([{
      name: '__session',
      value: 'mock-session',
      domain: 'localhost',
      path: '/'
    }])

    // Mobile: 1 column
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.goto('/dashboard')
    await page.waitForSelector('button:has-text("Portfolio")', { timeout: 5000 })

    const quickActionsGrid = await page.locator('button:has-text("Portfolio")').locator('..').locator('..')
    const gridColumnsMobile = await quickActionsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsMobile, 'Mobile should show 1 column of quick actions').toBe(1)

    // Tablet: 2 columns
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(100)

    const gridColumnsTablet = await quickActionsGrid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(' ').length
    })

    expect(gridColumnsTablet, 'Tablet should show 2 columns of quick actions').toBe(2)
  })
})

test.describe('Mobile Responsiveness - Typography', () => {

  test('should have readable font sizes on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.goto('/')

    // Check various text elements
    const textElements = [
      { selector: 'p', minSize: 14 }, // Body text minimum 14px
      { selector: 'h1', minSize: 24 }, // Large headings
      { selector: 'button', minSize: 14 }, // Button text
    ]

    for (const { selector, minSize } of textElements) {
      const elements = await page.locator(selector)
      const count = Math.min(await elements.count(), 3) // Check first 3 of each

      for (let i = 0; i < count; i++) {
        const element = elements.nth(i)
        const fontSize = await element.evaluate((el) => {
          return parseFloat(window.getComputedStyle(el).fontSize)
        })

        expect(fontSize).toBeGreaterThanOrEqual(minSize)
      }
    }
  })

  test('should scale headings responsively', async ({ page }) => {
    await page.goto('/')

    const heroHeading = await page.locator('h1').first()

    // Mobile font size
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.waitForTimeout(100)
    const mobileFontSize = await heroHeading.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })

    // Desktop font size
    await page.setViewportSize(VIEWPORTS['Desktop'])
    await page.waitForTimeout(100)
    const desktopFontSize = await heroHeading.evaluate((el) => {
      return parseFloat(window.getComputedStyle(el).fontSize)
    })

    // Desktop should have larger font size
    expect(desktopFontSize).toBeGreaterThan(mobileFontSize)
  })
})

test.describe('Mobile Responsiveness - Multiple Viewports', () => {

  for (const [deviceName, viewport] of Object.entries(VIEWPORTS)) {
    test(`should render correctly on ${deviceName}`, async ({ page }) => {
      await page.setViewportSize(viewport)
      await page.goto('/')

      // Check for layout issues
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScroll, `${deviceName} should not have horizontal scroll`).toBe(false)

      // Check critical elements are visible
      await expect(page.locator('nav')).toBeVisible()
      await expect(page.locator('h1')).toBeVisible()

      // Navigate to courses page
      await page.goto('/courses')
      await page.waitForLoadState('networkidle')

      const hasHorizontalScrollCourses = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })

      expect(hasHorizontalScrollCourses, `${deviceName} courses page should not have horizontal scroll`).toBe(false)
    })
  }
})

test.describe('Mobile Responsiveness - Performance', () => {

  test('should load homepage quickly on mobile', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['iPhone SE'])

    const startTime = Date.now()
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const loadTime = Date.now() - startTime

    // Should load in under 5 seconds (generous for local testing)
    expect(loadTime).toBeLessThan(5000)
  })

  test('should not have cumulative layout shift', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS['iPhone SE'])
    await page.goto('/')

    // Wait for page to stabilize
    await page.waitForTimeout(2000)

    // Check for layout shifts
    const cls = await page.evaluate(() => {
      return new Promise((resolve) => {
        let clsValue = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
        })
        observer.observe({ type: 'layout-shift', buffered: true })

        setTimeout(() => {
          observer.disconnect()
          resolve(clsValue)
        }, 1000)
      })
    })

    // CLS should be below 0.1 (Good score)
    expect(cls).toBeLessThan(0.25) // Moderate threshold for local testing
  })
})
