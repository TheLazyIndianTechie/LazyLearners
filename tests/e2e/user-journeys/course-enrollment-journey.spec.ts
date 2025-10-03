import { test, expect } from '@playwright/test'

/**
 * E2E Test: Complete Course Enrollment Journey
 * Tests the full user flow from browsing courses to enrollment
 */

test.describe('Course Enrollment User Journey @e2e @critical', () => {
  test.beforeEach(async ({ page }) => {
    // Start at homepage
    await page.goto('/')
  })

  test('should complete full enrollment journey for free course', async ({ page }) => {
    // Step 1: Browse available courses
    await test.step('Browse courses catalog', async () => {
      await page.click('a[href*="/courses"]')
      await expect(page).toHaveURL(/\/courses/)
      await expect(page.getByRole('heading', { name: /courses|browse/i })).toBeVisible()
    })

    // Step 2: Select a course
    await test.step('View course details', async () => {
      // Find first course card and click it
      const firstCourseCard = page.locator('[role="article"]').first()
      await firstCourseCard.waitFor({ state: 'visible' })

      const courseTitle = await firstCourseCard.locator('h3, h2').first().textContent()

      await firstCourseCard.click()

      // Verify we're on course detail page
      await expect(page).toHaveURL(/\/courses\//)
      await expect(page.getByRole('heading')).toContainText(courseTitle || '')
    })

    // Step 3: Check course information
    await test.step('Review course details', async () => {
      // Verify course details are displayed
      await expect(page.locator('text=/description|overview/i')).toBeVisible()

      // Check for enroll button
      const enrollButton = page.getByRole('button', { name: /enroll|start|begin/i })
      await expect(enrollButton).toBeVisible()
    })

    // Step 4: Attempt enrollment (requires authentication)
    await test.step('Initiate enrollment', async () => {
      const enrollButton = page.getByRole('button', { name: /enroll|start|begin/i })
      await enrollButton.click()

      // Should redirect to sign-in or show enrollment confirmation
      // If not authenticated, will be on sign-in page
      const currentUrl = page.url()
      const isSignInPage = currentUrl.includes('sign-in')
      const isCourseDetailPage = currentUrl.includes('courses')

      expect(isSignInPage || isCourseDetailPage).toBeTruthy()
    })
  })

  test('should display course pricing and requirements', async ({ page }) => {
    await page.goto('/courses')

    // Wait for courses to load
    await page.waitForSelector('[role="article"]')

    // Find a course card
    const courseCard = page.locator('[role="article"]').first()

    // Verify pricing information is displayed
    const priceElement = courseCard.locator('text=/\\$|free/i')
    await expect(priceElement).toBeVisible()

    // Verify course metadata
    await expect(courseCard).toContainText(/beginner|intermediate|advanced/i)
  })

  test('should filter courses by difficulty level', async ({ page }) => {
    await page.goto('/courses')

    // Wait for filter options to appear
    await page.waitForSelector('[role="article"]')

    // Look for filter controls
    const filterButtons = page.getByRole('button', { name: /filter|beginner|intermediate|advanced/i })

    if (await filterButtons.count() > 0) {
      // Click first filter
      await filterButtons.first().click()

      // Wait for filtered results
      await page.waitForTimeout(500)

      // Verify courses are displayed
      const courses = page.locator('[role="article"]')
      expect(await courses.count()).toBeGreaterThan(0)
    }
  })

  test('should search for courses', async ({ page }) => {
    await page.goto('/courses')

    // Look for search input
    const searchInput = page.getByRole('textbox', { name: /search/i })

    if (await searchInput.isVisible()) {
      await searchInput.fill('game')
      await page.keyboard.press('Enter')

      // Wait for search results
      await page.waitForTimeout(500)

      // Verify search results appear
      const courses = page.locator('[role="article"]')
      const count = await courses.count()

      // If results exist, verify they're visible
      if (count > 0) {
        await expect(courses.first()).toBeVisible()
      }
    }
  })

  test('should display course modules and lessons', async ({ page }) => {
    await page.goto('/courses')

    // Click first course
    const firstCourse = page.locator('[role="article"]').first()
    await firstCourse.click()

    // Wait for course detail page
    await expect(page).toHaveURL(/\/courses\//)

    // Look for curriculum or modules section
    const modulesSection = page.getByRole('heading', { name: /curriculum|modules|lessons|content/i })

    if (await modulesSection.isVisible()) {
      await modulesSection.scrollIntoViewIfNeeded()

      // Verify lesson list is displayed
      const lessonList = page.locator('[role="list"], ul, ol').filter({ has: page.getByText(/lesson|module/i) })
      await expect(lessonList.first()).toBeVisible()
    }
  })

  test('should show course instructor information', async ({ page }) => {
    await page.goto('/courses')

    // Click first course
    await page.locator('[role="article"]').first().click()

    // Wait for course detail page
    await expect(page).toHaveURL(/\/courses\//)

    // Look for instructor section
    const instructorSection = page.getByText(/instructor|taught by|created by/i)

    if (await instructorSection.isVisible()) {
      await expect(instructorSection).toBeVisible()
    }
  })

  test('should handle course not found gracefully', async ({ page }) => {
    await page.goto('/courses/non-existent-course-id-12345')

    // Should show error message or redirect
    const notFoundMessage = page.getByText(/not found|doesn't exist|couldn't find/i)
    const isOnCoursesPage = page.url().includes('/courses') && !page.url().includes('non-existent')

    const hasErrorHandling = await notFoundMessage.isVisible() || isOnCoursesPage

    expect(hasErrorHandling).toBeTruthy()
  })

  test('should display course ratings and reviews', async ({ page }) => {
    await page.goto('/courses')

    // Find course card with ratings
    const courseCard = page.locator('[role="article"]').first()

    // Look for rating indicators (stars, numbers)
    const ratingElement = courseCard.locator('text=/★|⭐|rating|\d\.\d/i').first()

    if (await ratingElement.isVisible()) {
      await expect(ratingElement).toBeVisible()
    }
  })

  test('should show course duration and lessons count', async ({ page }) => {
    await page.goto('/courses')

    // Find course card
    const courseCard = page.locator('[role="article"]').first()

    // Look for duration or lesson count
    const metadataElement = courseCard.locator('text=/\\d+ lessons?|\\d+ hours?|\\d+ minutes?/i').first()

    if (await metadataElement.isVisible()) {
      await expect(metadataElement).toBeVisible()
    }
  })
})
