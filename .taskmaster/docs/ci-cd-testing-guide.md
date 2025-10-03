# CI/CD Testing Integration Guide

## Overview

This guide covers the comprehensive automated testing setup in GitHub Actions for the LazyGameDevs platform. The CI/CD pipeline includes unit tests, integration tests, E2E tests, visual regression tests, accessibility tests, performance tests, and load tests.

## GitHub Actions Workflows

### 1. Main Test Suite Workflow (`.github/workflows/test.yml`)

Runs on every push to `main` or `develop` branches and on all pull requests.

**Jobs:**
- **Lint & Type Check**: ESLint and TypeScript type checking
- **Unit Tests**: Jest unit tests for utilities and API routes
- **Integration Tests**: Database integration tests with PostgreSQL
- **Critical Path Tests**: Tests for critical user journeys (video streaming, payments)
- **E2E Tests**: Playwright end-to-end tests
- **Visual Regression Tests**: Screenshot comparison tests
- **Accessibility Tests**: WCAG 2.1 AA compliance tests
- **Security Audit**: npm audit and dependency checks
- **Test Summary**: Aggregates all test results

**Execution Time**: ~20-30 minutes total (jobs run in parallel)

### 2. Performance & Load Tests Workflow (`.github/workflows/performance.yml`)

Runs weekly on Sunday at 2 AM UTC or manually via workflow dispatch.

**Jobs:**
- **Video Performance Tests**: Video streaming performance metrics
- **Load Tests**: k6 load testing with concurrent users
- **Lighthouse Performance**: Web performance audit
- **Performance Summary**: Aggregates performance results

**Execution Time**: ~30-45 minutes total

## Workflow Triggers

### Automatic Triggers

**Main Test Suite**:
```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  workflow_dispatch:
```

**Performance Tests**:
```yaml
on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday
  workflow_dispatch:
```

### Manual Triggers

Trigger workflows manually from GitHub Actions UI:

1. Go to **Actions** tab in GitHub repository
2. Select workflow from left sidebar
3. Click **Run workflow** button
4. Select branch and options (if available)
5. Click **Run workflow**

## Required GitHub Secrets

Configure these secrets in **Settings ’ Secrets and variables ’ Actions**:

### Essential Secrets

```
CLERK_PUBLISHABLE_KEY       # Clerk authentication publishable key
CLERK_SECRET_KEY            # Clerk authentication secret key
```

### Optional Secrets

```
CODECOV_TOKEN              # Codecov coverage reporting token
LHCI_GITHUB_APP_TOKEN     # Lighthouse CI GitHub app token
```

## Test Job Breakdown

### Lint & Type Check

**Purpose**: Ensure code quality and TypeScript correctness

**Steps**:
1. Checkout code
2. Setup Node.js 20.x
3. Install dependencies
4. Run ESLint
5. Run TypeScript compiler (no emit)

**Pass Criteria**: No linting errors, no type errors

### Unit Tests

**Purpose**: Test individual functions and utilities

**Environment**:
- Node.js 20.x
- SQLite (in-memory Prisma client)

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Generate Prisma Client
5. Run `npm run test:unit`
6. Upload coverage to Codecov

**Coverage**:
- `src/__tests__/unit/lib/sanitize.test.ts` - Sanitization utilities
- `src/__tests__/unit/api/health.test.ts` - Health check API
- `src/__tests__/unit/api/enrollment.test.ts` - Enrollment API

**Pass Criteria**: All tests pass, >70% coverage

### Integration Tests

**Purpose**: Test API routes with real database

**Environment**:
- Node.js 20.x
- PostgreSQL 15
- Seeded test database

**Steps**:
1. Checkout code
2. Setup Node.js
3. Start PostgreSQL service
4. Install dependencies
5. Generate Prisma Client
6. Apply database migrations
7. Run `npm run test:integration`
8. Upload coverage to Codecov

**Coverage**:
- `src/__tests__/integration/payment-enrollment-flow.test.ts` - Full payment to enrollment flow

**Pass Criteria**: All integration tests pass

### Critical Path Tests

**Purpose**: Test critical business flows

**Environment**:
- Node.js 20.x
- PostgreSQL 15
- Seeded database

**Steps**:
1. Checkout code
2. Setup Node.js
3. Start PostgreSQL service
4. Install dependencies
5. Generate Prisma Client
6. Apply migrations
7. Seed database
8. Run `npm run test:critical`
9. Upload coverage

**Coverage**:
- Video streaming access control
- Payment processing
- License key validation
- Enrollment flows

**Pass Criteria**: All critical path tests pass

### E2E Tests

**Purpose**: Test complete user journeys in browser

**Environment**:
- Node.js 20.x
- PostgreSQL 15
- Playwright with Chromium
- Built Next.js application

**Steps**:
1. Checkout code
2. Setup Node.js
3. Start PostgreSQL service
4. Install dependencies
5. Install Playwright browsers
6. Generate Prisma Client
7. Apply migrations
8. Seed database
9. Build application
10. Run `npm run test:e2e`
11. Upload Playwright report
12. Upload test results

**Coverage**:
- `tests/e2e/user-journeys/course-enrollment-journey.spec.ts`
- `tests/e2e/user-journeys/video-watching-journey.spec.ts`
- `tests/e2e/user-journeys/authentication-journey.spec.ts`
- `tests/e2e/user-journeys/quiz-taking-journey.spec.ts`

**Pass Criteria**: All E2E tests pass

**Artifacts**: Playwright HTML report, screenshots, videos (on failure)

### Visual Regression Tests

**Purpose**: Detect unintended UI changes

**Environment**:
- Same as E2E tests
- Baseline screenshots stored in git

**Steps**:
1-9. Same as E2E tests
10. Run `npm run test:e2e -- --grep @visual`
11. Upload visual test results and baseline snapshots

**Coverage**:
- Homepage (desktop, tablet, mobile)
- Courses page (all viewports)
- Course detail pages
- Navigation and footer components
- Button states (normal, hover, focus)
- Form inputs
- Dark mode
- High contrast mode

**Pass Criteria**: Screenshots match baselines

**Artifacts**: Visual diffs, baseline snapshots

### Accessibility Tests

**Purpose**: Ensure WCAG 2.1 AA compliance

**Environment**:
- Same as E2E tests
- axe-core accessibility scanner

**Steps**:
1-9. Same as E2E tests
10. Run `npm run test:e2e -- --grep @accessibility`
11. Upload accessibility report

**Coverage**:
- Color contrast
- Keyboard navigation
- Screen reader compatibility
- ARIA attributes
- Semantic HTML

**Pass Criteria**: No WCAG violations

**Artifacts**: Accessibility audit report

### Security Audit

**Purpose**: Identify vulnerable dependencies

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run `npm audit --audit-level moderate`
5. Run `npx audit-ci --moderate`

**Pass Criteria**: No moderate or higher vulnerabilities

### Video Performance Tests

**Purpose**: Measure video streaming performance

**Environment**:
- Same as E2E tests
- Chrome DevTools Protocol enabled

**Steps**:
1-9. Same as E2E tests
10. Run `npm run test:e2e -- --grep @performance`
11. Upload performance report

**Metrics**:
- Video initial load time (<5s)
- Buffering time (<3s)
- Time to first frame (<3s)
- Quality switching time (<2s)
- Seek performance (<1s)
- Frame drop rate (<5%)
- Network bandwidth usage

**Pass Criteria**: All performance metrics within thresholds

### Load Tests

**Purpose**: Test concurrent user load

**Environment**:
- Node.js 20.x
- k6 load testing tool
- PostgreSQL (Docker)
- Running Next.js application

**Steps**:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Install k6
5. Start PostgreSQL in Docker
6. Wait for database
7. Generate Prisma Client
8. Apply migrations
9. Seed database
10. Build application
11. Start application
12. Wait for health check
13. Run k6 load tests
14. Upload results
15. Stop application and database

**Load Profile**:
- Ramp up: 2 min to 10 users
- Scale: 5 min to 50 users
- Peak: 5 min to 100 users
- Sustained: 2 min at 100 users
- Ramp down: 2 min to 0 users

**Scenarios**:
- Homepage load
- Course catalog browsing
- API health checks
- Course detail pages
- Video streaming
- Authentication
- Enrollment API

**Thresholds**:
- p95 response time < 500ms
- p99 response time < 1000ms
- Failed requests < 1%
- Error rate < 10%

**Pass Criteria**: All thresholds met

**Artifacts**: k6 JSON results

### Lighthouse Performance

**Purpose**: Web performance audit

**Environment**:
- Node.js 20.x
- Lighthouse CI
- Built Next.js application

**Steps**:
1. Checkout code
2. Setup Node.js
3. Setup database
4. Install dependencies
5. Generate Prisma Client
6. Apply migrations
7. Seed database
8. Build application
9. Start application
10. Wait for health check
11. Run Lighthouse CI
12. Upload results

**Metrics**:
- Performance score
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Time to Interactive (TTI)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

**Pass Criteria**: Performance score > 90 (goal)

**Artifacts**: Lighthouse HTML reports

## Local Testing Before Push

### Quick Validation

```bash
# Run linting
npm run lint

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

### Full Local Test Suite

```bash
# Install dependencies
npm ci

# Generate Prisma Client
npx prisma generate

# Apply database migrations
npx prisma db push

# Seed database
npm run db:seed

# Run all tests
npm run test:full-suite
```

### E2E Tests Locally

```bash
# Install Playwright browsers (first time only)
npx playwright install --with-deps chromium

# Build application
npm run build

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Visual Regression Tests Locally

```bash
# Create initial baselines (first time)
npm run test:e2e -- --grep @visual --update-snapshots

# Run visual tests
npm run test:e2e -- --grep @visual

# View Playwright report
npx playwright show-report
```

### Load Tests Locally

```bash
# Install k6 (macOS)
brew install k6

# Run load tests
k6 run tests/load/load-test-scenarios.js

# Run with custom VUs and duration
k6 run --vus 20 --duration 30s tests/load/load-test-scenarios.js
```

## Viewing Test Results

### GitHub Actions UI

1. Go to **Actions** tab in repository
2. Click on workflow run
3. View individual job logs
4. Download artifacts (reports, screenshots, videos)

### Artifacts Available

**E2E Tests**:
- `playwright-report` - HTML report with screenshots and videos
- `e2e-test-results` - Raw test results

**Visual Regression**:
- `visual-regression-results` - Baseline snapshots and diffs

**Accessibility**:
- `accessibility-report` - Playwright HTML report with axe results

**Performance**:
- `video-performance-report` - Performance metrics
- `load-test-results` - k6 JSON results
- `lighthouse-results` - Lighthouse HTML reports

### Codecov Dashboard

View coverage reports at: `https://codecov.io/gh/YOUR_ORG/YOUR_REPO`

Coverage is tracked by flags:
- `unit` - Unit test coverage
- `integration` - Integration test coverage
- `critical` - Critical path test coverage

## CI/CD Best Practices

### 1. Run Tests Locally First

Always run tests locally before pushing:

```bash
npm run lint && npm run test:unit && npm run test:integration
```

### 2. Fix Failing Tests Immediately

Don't merge PRs with failing tests. Treat test failures as critical bugs.

### 3. Update Visual Baselines Intentionally

When UI changes are intentional:

1. Review visual diffs in PR
2. Update baselines locally: `npm run test:e2e -- --grep @visual --update-snapshots`
3. Commit updated baseline images
4. Document UI changes in PR description

### 4. Monitor Performance Trends

Check performance test results weekly to catch regressions early.

### 5. Keep Dependencies Updated

Regularly update dependencies and fix security vulnerabilities:

```bash
npm audit
npm audit fix
```

### 6. Use Branch Protection

Configure branch protection rules:

- Require status checks to pass before merging
- Require up-to-date branches before merging
- Require review from code owners

## Troubleshooting CI/CD Issues

### Tests Pass Locally But Fail in CI

**Possible Causes**:
- Environment differences (Node version, OS)
- Missing environment variables
- Database state differences
- Timing issues in tests

**Solutions**:
- Check Node version matches CI (`NODE_VERSION: '20.x'`)
- Verify all required secrets are configured
- Add proper wait conditions in tests
- Use `waitForLoadState('networkidle')` in E2E tests

### Flaky Visual Regression Tests

**Symptoms**: Visual tests fail intermittently with small pixel differences

**Solutions**:
- Increase `maxDiffPixels` threshold in screenshot config
- Disable animations: `animations: 'disabled'`
- Mask dynamic content (timestamps, counters)
- Ensure consistent viewport sizes
- Add longer wait times for content loading

### E2E Tests Timeout

**Symptoms**: Tests fail with timeout errors

**Solutions**:
- Increase test timeout: `timeout-minutes: 30`
- Add `await page.waitForLoadState('networkidle')`
- Check database seeding completed
- Verify application started successfully

### Load Tests Fail

**Symptoms**: k6 tests exceed thresholds

**Solutions**:
- Check application logs for errors
- Review database query performance
- Check resource limits (CPU, memory)
- Reduce number of concurrent VUs
- Optimize slow API endpoints

### Security Audit Failures

**Symptoms**: npm audit finds vulnerabilities

**Solutions**:
```bash
# Review vulnerabilities
npm audit

# Fix automatically if possible
npm audit fix

# Fix with breaking changes (careful!)
npm audit fix --force

# Update specific package
npm update package-name
```

## Performance Optimization

### Database Optimization

```javascript
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 30
  connection_limit = 20
}
```

Add indexes for frequently queried fields:

```prisma
model Course {
  id    String @id @default(cuid())
  title String

  @@index([title])
}
```

### Caching Strategy

Enable Redis caching for tests:

```env
ENABLE_CACHING=true
REDIS_URL=redis://localhost:6379
```

### Parallel Test Execution

Playwright runs tests in parallel by default. Configure workers:

```javascript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : undefined,
})
```

## Monitoring and Alerts

### GitHub Actions Notifications

Configure email notifications:

1. Go to **Settings ’ Notifications**
2. Enable **Actions** notifications
3. Choose notification frequency

### Slack Integration

Set up Slack notifications for failed workflows:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
    payload: |
      {
        "text": "Test suite failed on ${{ github.ref }}"
      }
```

### Status Badges

Add status badges to README:

```markdown
![Test Suite](https://github.com/YOUR_ORG/YOUR_REPO/workflows/Test%20Suite/badge.svg)
![Performance Tests](https://github.com/YOUR_ORG/YOUR_REPO/workflows/Performance%20%26%20Load%20Tests/badge.svg)
```

## Maintenance

### Regular Tasks

**Weekly**:
- Review performance test results
- Check for security vulnerabilities
- Update dependencies

**Monthly**:
- Review and update test coverage
- Clean up old artifacts
- Optimize slow tests

**Quarterly**:
- Review and update visual baselines
- Audit test suite effectiveness
- Remove obsolete tests

### Updating Workflows

When updating workflows:

1. Test changes in feature branch first
2. Review workflow logs carefully
3. Document breaking changes
4. Update this guide if needed

## Additional Resources

- **GitHub Actions Documentation**: https://docs.github.com/en/actions
- **Playwright Documentation**: https://playwright.dev/docs/intro
- **k6 Documentation**: https://k6.io/docs/
- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Lighthouse CI**: https://github.com/GoogleChrome/lighthouse-ci
- **Codecov**: https://docs.codecov.com/

## Summary

The LazyGameDevs CI/CD pipeline provides comprehensive automated testing:

 **8 test job types** in main workflow
 **3 performance job types** in performance workflow
 **Parallel execution** for faster feedback
 **Artifact uploads** for debugging
 **Coverage reporting** via Codecov
 **Security audits** on every build
 **Weekly performance monitoring**

All tests must pass before merging to `main` or `develop` branches.
