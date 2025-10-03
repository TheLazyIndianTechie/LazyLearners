# Automated Accessibility Testing Guide

## Overview

This guide provides instructions for integrating automated accessibility testing into the GameLearn platform to ensure ongoing WCAG 2.1 AA compliance.

## Testing Tools

### 1. axe-core (Recommended)

**Installation:**
```bash
npm install --save-dev @axe-core/react jest-axe
```

**Usage in Jest Tests:**
```typescript
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { CourseCard } from '@/components/course/course-card'

expect.extend(toHaveNoViolations)

describe('CourseCard Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<CourseCard course={mockCourse} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

### 2. Playwright Accessibility Testing

**Installation:**
```bash
npm install --save-dev @axe-core/playwright
```

**Usage in E2E Tests:**
```typescript
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Course Page Accessibility', () => {
  test('should not have accessibility violations', async ({ page }) => {
    await page.goto('/courses/123')

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    expect(accessibilityScanResults.violations).toEqual([])
  })
})
```

### 3. ESLint Plugin for JSX Accessibility

**Installation:**
```bash
npm install --save-dev eslint-plugin-jsx-a11y
```

**Configuration (.eslintrc.json):**
```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:jsx-a11y/recommended"
  ],
  "plugins": ["jsx-a11y"],
  "rules": {
    "jsx-a11y/anchor-is-valid": "error",
    "jsx-a11y/aria-props": "error",
    "jsx-a11y/aria-proptypes": "error",
    "jsx-a11y/aria-unsupported-elements": "error",
    "jsx-a11y/heading-has-content": "error",
    "jsx-a11y/img-redundant-alt": "error",
    "jsx-a11y/label-has-associated-control": "error",
    "jsx-a11y/no-redundant-roles": "error"
  }
}
```

## Continuous Integration

### GitHub Actions Workflow

Create `.github/workflows/accessibility.yml`:

```yaml
name: Accessibility Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run accessibility unit tests
        run: npm run test:a11y

      - name: Build application
        run: npm run build

      - name: Run Playwright accessibility tests
        run: npm run test:e2e:a11y

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-test-results
          path: test-results/
```

### Package.json Scripts

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test:a11y": "jest --testPathPattern=a11y",
    "test:e2e:a11y": "playwright test --grep @a11y",
    "lint:a11y": "eslint . --ext .tsx,.ts --rule 'jsx-a11y/*: error'"
  }
}
```

## Test Coverage Requirements

### Critical Components (100% Coverage)
- Form inputs and validation
- Navigation components
- Modal dialogs
- Video player controls
- Course enrollment flow
- Checkout process

### High Priority (80% Coverage)
- Course cards
- Lesson navigation
- Dashboard components
- Instructor tools

### Medium Priority (60% Coverage)
- Marketing pages
- Static content pages
- Footer components

## Automated Test Examples

### Component Test: Form Accessibility

```typescript
// src/__tests__/a11y/checkout-form.a11y.test.tsx
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import CheckoutPage from '@/app/checkout/page'

expect.extend(toHaveNoViolations)

describe('Checkout Form Accessibility', () => {
  it('should have properly labeled form inputs', async () => {
    const { container } = render(<CheckoutPage />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should announce validation errors to screen readers', async () => {
    const { container } = render(<CheckoutPage />)

    // Check for aria-live regions
    const liveRegions = container.querySelectorAll('[aria-live]')
    expect(liveRegions.length).toBeGreaterThan(0)
  })

  it('should have proper ARIA labels on all inputs', async () => {
    const { container } = render(<CheckoutPage />)
    const inputs = container.querySelectorAll('input')

    inputs.forEach(input => {
      const hasLabel =
        input.hasAttribute('aria-label') ||
        input.hasAttribute('aria-labelledby') ||
        container.querySelector(`label[for="${input.id}"]`)

      expect(hasLabel).toBeTruthy()
    })
  })
})
```

### E2E Test: Keyboard Navigation

```typescript
// tests/e2e/a11y/keyboard-navigation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Keyboard Navigation @a11y', () => {
  test('should navigate video player with keyboard shortcuts', async ({ page }) => {
    await page.goto('/courses/123/lessons/1')

    // Focus video player
    await page.keyboard.press('Tab')

    // Test play/pause
    await page.keyboard.press('Space')
    await expect(page.locator('[aria-label="Pause"]')).toBeVisible()

    // Test fullscreen
    await page.keyboard.press('f')
    await expect(page).toHaveScreenshot('video-fullscreen.png')
  })

  test('should trap focus in modal dialogs', async ({ page }) => {
    await page.goto('/courses')

    // Open modal
    await page.click('button:has-text("Filter")')

    // Tab through all focusable elements
    const focusableCount = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      const focusable = modal?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      return focusable?.length || 0
    })

    // Press Tab focusableCount + 1 times
    for (let i = 0; i <= focusableCount; i++) {
      await page.keyboard.press('Tab')
    }

    // Focus should return to first element in modal
    const firstFocusable = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      return modal?.querySelector('button, [href], input')?.textContent
    })

    const currentFocus = await page.evaluate(() => document.activeElement?.textContent)
    expect(currentFocus).toBe(firstFocusable)
  })
})
```

### E2E Test: Screen Reader Announcements

```typescript
// tests/e2e/a11y/screen-reader.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Screen Reader Announcements @a11y', () => {
  test('should announce form errors', async ({ page }) => {
    await page.goto('/checkout')

    // Submit form with empty fields
    await page.click('button:has-text("Pay")')

    // Check for error announcement
    const errorRegion = page.locator('[role="alert"], [aria-live="assertive"]')
    await expect(errorRegion).toBeVisible()
    await expect(errorRegion).toContainText(/required/i)
  })

  test('should announce loading states', async ({ page }) => {
    await page.goto('/courses')

    // Check for loading announcement
    const loadingRegion = page.locator('[aria-live="polite"]')
    await expect(loadingRegion).toContainText(/loading/i)
  })
})
```

## Pre-commit Hooks

Use Husky to run accessibility checks before commits:

**Installation:**
```bash
npm install --save-dev husky lint-staged
npx husky install
```

**Configuration (.husky/pre-commit):**
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint:a11y
npm run test:a11y
```

## Accessibility Monitoring Dashboard

### Setup Lighthouse CI

```bash
npm install --save-dev @lhci/cli
```

**Configuration (lighthouserc.js):**
```javascript
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000', 'http://localhost:3000/courses'],
      numberOfRuns: 3,
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
```

## Best Practices

1. **Run tests locally before committing**
   ```bash
   npm run test:a11y
   npm run lint:a11y
   ```

2. **Review automated test failures immediately**
   - Accessibility violations should block PR merges
   - Treat a11y bugs with same priority as functional bugs

3. **Combine automated and manual testing**
   - Automated tests catch ~40% of accessibility issues
   - Manual testing with screen readers is still essential

4. **Update tests when adding new components**
   - Every new interactive component needs a11y tests
   - Add tests before or during feature development

5. **Monitor accessibility scores over time**
   - Track Lighthouse accessibility scores
   - Set up alerts for score drops

## Common Issues and Fixes

### Missing ARIA Labels
```typescript
// ❌ Bad
<button><Settings /></button>

// ✅ Good
<button aria-label="Settings"><Settings aria-hidden="true" /></button>
```

### Missing Form Labels
```typescript
// ❌ Bad
<Input placeholder="Email" />

// ✅ Good
<Label htmlFor="email">Email</Label>
<Input id="email" placeholder="you@example.com" />
```

### Color Contrast Issues
```typescript
// ❌ Bad - Fails WCAG AA (3:1)
<div className="text-gray-400 bg-gray-300">Low contrast text</div>

// ✅ Good - Passes WCAG AA (4.5:1)
<div className="text-gray-900 bg-gray-100">High contrast text</div>
```

## Resources

- [axe-core Documentation](https://github.com/dequelabs/axe-core)
- [jest-axe](https://github.com/nickcolley/jest-axe)
- [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm/tree/develop/packages/playwright)
- [eslint-plugin-jsx-a11y](https://github.com/jsx-eslint/eslint-plugin-jsx-a11y)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Web Content Accessibility Guidelines (WCAG) 2.1](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: Task 18.8 - Automated Accessibility Testing Integration
