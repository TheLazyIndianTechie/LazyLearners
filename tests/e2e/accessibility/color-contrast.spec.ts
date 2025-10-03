import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Color Contrast - WCAG 2.1 AA Compliance Tests
 *
 * These tests verify that all color combinations meet WCAG 2.1 AA standards:
 * - Normal text: 4.5:1 contrast ratio minimum
 * - Large text (18pt+ or 14pt+ bold): 3:1 contrast ratio minimum
 * - UI components and graphical objects: 3:1 contrast ratio minimum
 *
 * Related Task: 18.1 - Audit and fix color contrast ratios
 */

test.describe('Color Contrast - WCAG 2.1 AA', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport to desktop for consistent testing
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should not have contrast violations on homepage', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
      .disableRules([
        // Disable rules that are not related to color contrast
        'duplicate-id',
        'landmark-one-main',
        'region',
      ])
      .analyze();

    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n[${violation.id}] ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Help: ${violation.help}`);
        console.log(`Affected nodes: ${violation.nodes.length}`);
        violation.nodes.forEach((node, index) => {
          console.log(`  ${index + 1}. ${node.html.substring(0, 100)}...`);
          console.log(`     Selector: ${node.target.join(', ')}`);
          console.log(`     Message: ${node.failureSummary}`);
        });
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have contrast violations on courses page', async ({ page }) => {
    await page.goto('/courses');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
      .disableRules(['duplicate-id', 'landmark-one-main', 'region'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations on courses page:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n[${violation.id}] ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Affected nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have contrast violations on dashboard', async ({ page }) => {
    // Note: This test may need authentication to access dashboard
    // Skip if not authenticated, or set up test user authentication
    await page.goto('/dashboard');

    const response = await page.waitForLoadState('networkidle');

    // Check if redirected to login
    if (page.url().includes('/sign-in')) {
      test.skip('Dashboard requires authentication');
      return;
    }

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
      .disableRules(['duplicate-id', 'landmark-one-main', 'region'])
      .analyze();

    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations on dashboard:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`\n[${violation.id}] ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        console.log(`Affected nodes: ${violation.nodes.length}`);
      });
    }

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have accessible buttons with proper contrast', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Test primary buttons
    const primaryButtons = page.locator('button:not([disabled])').first();

    const buttonScanResults = await new AxeBuilder({ page })
      .include(primaryButtons)
      .withTags(['wcag2aa', 'wcag21aa'])
      .analyze();

    expect(buttonScanResults.violations).toEqual([]);
  });

  test('should have accessible form inputs with proper contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for any input fields
    const inputs = page.locator('input');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      const inputScanResults = await new AxeBuilder({ page })
        .include('input')
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      expect(inputScanResults.violations).toEqual([]);
    }
  });

  test('should have accessible disabled states', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Check for disabled buttons
    const disabledButtons = page.locator('button[disabled]');
    const disabledCount = await disabledButtons.count();

    if (disabledCount > 0) {
      const disabledScanResults = await new AxeBuilder({ page })
        .include('button[disabled]')
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      // Disabled elements should still meet 3:1 contrast ratio for UI components
      expect(disabledScanResults.violations).toEqual([]);
    }
  });

  test('should have accessible focus indicators', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Test focus indicators on interactive elements
    const buttons = page.locator('button:not([disabled])');
    const buttonCount = await buttons.count();

    if (buttonCount > 0) {
      // Focus on first button
      await buttons.first().focus();

      // Check focus indicator visibility
      const focusScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      expect(focusScanResults.violations).toEqual([]);
    }
  });

  test('should have accessible links with proper contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check for links
    const links = page.locator('a');
    const linkCount = await links.count();

    if (linkCount > 0) {
      const linkScanResults = await new AxeBuilder({ page })
        .include('a')
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      expect(linkScanResults.violations).toEqual([]);
    }
  });

  test('should not have contrast violations in navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Test navigation area
    const nav = page.locator('nav');
    const navCount = await nav.count();

    if (navCount > 0) {
      const navScanResults = await new AxeBuilder({ page })
        .include('nav')
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      if (navScanResults.violations.length > 0) {
        console.log('Navigation accessibility violations:');
        navScanResults.violations.forEach((violation) => {
          console.log(`\n[${violation.id}] ${violation.description}`);
          console.log(`Impact: ${violation.impact}`);
        });
      }

      expect(navScanResults.violations).toEqual([]);
    }
  });

  test('should have accessible badges with proper contrast', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Check for badge elements
    const badges = page.locator('[data-slot="badge"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      const badgeScanResults = await new AxeBuilder({ page })
        .include('[data-slot="badge"]')
        .withTags(['wcag2aa', 'wcag21aa'])
        .analyze();

      if (badgeScanResults.violations.length > 0) {
        console.log('Badge accessibility violations:');
        badgeScanResults.violations.forEach((violation) => {
          console.log(`\n[${violation.id}] ${violation.description}`);
          console.log(`Impact: ${violation.impact}`);
        });
      }

      expect(badgeScanResults.violations).toEqual([]);
    }
  });

  test('should meet contrast requirements for text on backgrounds', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Run comprehensive color-contrast check
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    if (contrastResults.violations.length > 0) {
      console.log('Color contrast violations:');
      contrastResults.violations.forEach((violation) => {
        console.log(`\n[${violation.id}] ${violation.description}`);
        console.log(`Impact: ${violation.impact}`);
        violation.nodes.forEach((node, index) => {
          console.log(`\n  ${index + 1}. ${node.html.substring(0, 150)}...`);
          console.log(`     Expected: 4.5:1 for normal text, 3:1 for large text`);
          console.log(`     ${node.failureSummary}`);
        });
      });
    }

    expect(contrastResults.violations).toEqual([]);
  });
});

test.describe('Color Contrast - Specific Components', () => {
  test('primary button contrast (coral on dark)', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    const primaryButton = page.locator('button[data-slot="button"]').first();

    if (await primaryButton.count() > 0) {
      const buttonResults = await new AxeBuilder({ page })
        .include(primaryButton)
        .withRules(['color-contrast'])
        .analyze();

      expect(buttonResults.violations).toEqual([]);
    }
  });

  test('secondary button contrast (forest on dark)', async ({ page }) => {
    await page.goto('/courses');
    await page.waitForLoadState('networkidle');

    // Look for secondary variant buttons
    const secondaryButtons = page.locator('button').filter({ hasText: /secondary/i });

    if (await secondaryButtons.count() > 0) {
      const buttonResults = await new AxeBuilder({ page })
        .include(secondaryButtons.first())
        .withRules(['color-contrast'])
        .analyze();

      expect(buttonResults.violations).toEqual([]);
    }
  });

  test('input placeholder contrast', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const inputs = page.locator('input[placeholder]');

    if (await inputs.count() > 0) {
      const inputResults = await new AxeBuilder({ page })
        .include('input[placeholder]')
        .withRules(['color-contrast'])
        .analyze();

      expect(inputResults.violations).toEqual([]);
    }
  });
});

test.describe('Color Contrast - Dark Mode Specific', () => {
  test('should maintain contrast in dark mode', async ({ page }) => {
    await page.goto('/');

    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Platform uses dark mode by default
    const contrastResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    if (contrastResults.violations.length > 0) {
      console.log('Dark mode color contrast violations:');
      contrastResults.violations.forEach((violation) => {
        console.log(`\n[${violation.id}] ${violation.description}`);
        violation.nodes.forEach((node, index) => {
          console.log(`  ${index + 1}. ${node.target.join(', ')}`);
          console.log(`     ${node.failureSummary}`);
        });
      });
    }

    expect(contrastResults.violations).toEqual([]);
  });
});
