# Visual Regression Testing Guide

## Overview

Visual regression testing helps detect unintended visual changes in the UI by comparing screenshots against baseline images. This ensures UI consistency and catches visual bugs early.

## Setup

### Installation

Playwright includes built-in screenshot comparison. No additional dependencies required.

```bash
npm install --save-dev @playwright/test
```

### Running Visual Tests

```bash
# Run all visual tests
npm run test:e2e -- --grep @visual

# Update baseline screenshots
npm run test:e2e -- --grep @visual --update-snapshots

# Run specific visual test
npm run test:e2e tests/e2e/visual/visual-regression.spec.ts
```

## Test Structure

Visual regression tests are located in `tests/e2e/visual/` and follow this pattern:

```typescript
test('component visual snapshot', async ({ page }) => {
  await page.goto('/page')
  await page.waitForLoadState('networkidle')

  // Take screenshot and compare with baseline
  await expect(page).toHaveScreenshot('component-name.png', {
    fullPage: true,
    animations: 'disabled',
  })
})
```

## Screenshot Options

### Full Page Screenshots

```typescript
await expect(page).toHaveScreenshot('page.png', {
  fullPage: true,
  animations: 'disabled',
})
```

### Element Screenshots

```typescript
const element = page.locator('.component')
await expect(element).toHaveScreenshot('element.png')
```

### Custom Configuration

```typescript
await expect(page).toHaveScreenshot('page.png', {
  fullPage: true,
  animations: 'disabled',
  mask: [page.locator('.dynamic-content')], // Hide dynamic content
  maxDiffPixels: 100, // Allow small differences
  threshold: 0.2, // Sensitivity threshold (0-1)
})
```

## Best Practices

### 1. Disable Animations

Always disable animations for consistent screenshots:

```typescript
{
  animations: 'disabled'
}
```

### 2. Wait for Network Idle

Ensure page is fully loaded:

```typescript
await page.waitForLoadState('networkidle')
```

### 3. Hide Dynamic Content

Mask timestamps, counters, or other dynamic elements:

```typescript
{
  mask: [
    page.locator('.timestamp'),
    page.locator('.counter')
  ]
}
```

### 4. Use Consistent Viewports

Set viewport size for reproducible screenshots:

```typescript
test.use({ viewport: { width: 1280, height: 720 } })
```

### 5. Test Multiple Viewports

Test desktop, tablet, and mobile:

```typescript
test('mobile snapshot', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  // ... take screenshot
})
```

## Managing Baselines

### Creating Initial Baselines

Run tests with `--update-snapshots` flag:

```bash
npm run test:e2e -- --grep @visual --update-snapshots
```

Baseline images are stored in `tests/e2e/visual/*.spec.ts-snapshots/`

### Updating Baselines

When intentional UI changes are made:

1. Review visual diff in test report
2. Confirm changes are expected
3. Update baselines: `npm run test:e2e -- --grep @visual --update-snapshots`
4. Commit updated baseline images to git

### Reviewing Failures

When visual tests fail:

1. Check test report: `npx playwright show-report`
2. Review diff images in `test-results/`
3. Determine if change is intentional or a regression
4. Update baselines if intentional, fix code if regression

## CI/CD Integration

### GitHub Actions

```yaml
- name: Run visual regression tests
  run: npm run test:e2e -- --grep @visual

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: visual-test-results
    path: playwright-report/
```

### Baseline Management in CI

- Store baselines in git repository
- Run tests against committed baselines
- Fail CI if screenshots don't match
- Update baselines in separate PR after review

## Test Coverage

Current visual regression tests cover:

- **Pages**: Homepage, Courses, Sign-in, Sign-up, Course Detail
- **Components**: Navigation, Footer, Course Cards, Buttons, Forms
- **States**: Loading, Error, Hover, Focus, Filled
- **Viewports**: Desktop (1280x720), Tablet (768x1024), Mobile (375x667)
- **Themes**: Light mode, Dark mode, High contrast
- **Interactive Elements**: Modals, Dropdowns, Buttons

## Troubleshooting

### Flaky Visual Tests

**Problem**: Tests fail intermittently with small differences

**Solutions**:
- Increase `maxDiffPixels` threshold
- Mask dynamic content
- Ensure animations are disabled
- Add longer wait times for content loading

### Font Rendering Differences

**Problem**: Screenshots differ across environments due to font rendering

**Solutions**:
- Use consistent OS for CI/CD
- Install exact font versions
- Use web fonts instead of system fonts
- Increase pixel difference threshold

### Large Diffs from Minor Changes

**Problem**: Small CSS changes cause large visual diffs

**Solutions**:
- Test smaller components individually
- Mask non-critical areas
- Adjust threshold settings
- Split tests into focused scenarios

## Maintenance

### Regular Reviews

- Review visual test coverage quarterly
- Update tests when UI components change
- Remove tests for deprecated components
- Add tests for new critical UI elements

### Baseline Hygiene

- Keep baselines in version control
- Document baseline updates in commit messages
- Review visual changes in PR reviews
- Clean up old/unused baseline images

## Tools and Resources

- **Playwright Visual Comparisons**: https://playwright.dev/docs/test-snapshots
- **Percy (Alternative)**: https://percy.io/
- **Applitools (Alternative)**: https://applitools.com/
- **Chromatic (Alternative)**: https://www.chromatic.com/

## Example Workflow

1. **Develop Feature**: Create new UI component
2. **Add Visual Test**: Write screenshot test for component
3. **Create Baseline**: Run test with `--update-snapshots`
4. **Commit**: Add baseline images to git
5. **CI Check**: Tests run automatically on PR
6. **Review**: Check visual diffs in PR review
7. **Deploy**: Merge when visual tests pass

## Metrics

Track these metrics to measure visual testing effectiveness:

- Number of visual regressions caught
- False positive rate
- Test execution time
- Coverage of critical UI paths
- Time to investigate visual failures
