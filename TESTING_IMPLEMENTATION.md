# Testing Implementation Guide

## Immediate Actions - Run These Tests Now

### 1. Install Testing Dependencies

```bash
cd gamelearn-platform

# Install Playwright for E2E testing
npm install -D @playwright/test

# Install Playwright browsers
npx playwright install
```

### 2. Run the Critical Video Streaming Test

This validates that the missing GET method issue is fixed:

```bash
# Make the validation script executable
chmod +x scripts/validate-video-streaming-fix.js

# Ensure your dev server is running in another terminal
npm run dev

# Then run the validation script
node scripts/validate-video-streaming-fix.js
```

**Expected Output:**
```
🚀 GameLearn Platform - Video Streaming Validation
🔗 Testing against: http://localhost:3000
⏰ Started at: 2024-01-XX...

🔧 CRITICAL VALIDATION: Video Streaming API Endpoints
============================================================

📋 Testing: GET /api/video/stream (THE MISSING METHOD)
✅ PASS: Status 200 (OK)
   Response structure: success=true
   Session ID present: true
   Stream URL present: true

📋 Testing: POST /api/video/stream
✅ PASS: Status 201 (Created)

🎬 WORKFLOW VALIDATION: Complete Video Streaming Journey
============================================================

1️⃣ Creating video streaming session...
✅ Session creation: 201
   Session ID: session-abc123...

2️⃣ Getting streaming manifest with session...
✅ Manifest retrieval: 200
   Stream URL: Present
   Player config: Present

🎉 VALIDATION PASSED - Video streaming fix is working!
```

### 3. Run Unit Tests for Video Streaming

```bash
# Run the critical video streaming tests we created
npm run test:critical

# Run all video streaming related tests
npm run test:video-streaming

# Run with coverage to see what we're testing
npm run test:coverage
```

### 4. Run E2E Tests (If Playwright is installed)

```bash
# Run E2E tests in headless mode
npm run test:e2e

# Run E2E tests with browser visible (for debugging)
npm run test:e2e:headed

# Run specific user journey tests
npm run test:user-journey
```

### 5. Quick Manual Validation

Open these URLs in your browser while the dev server is running:

1. **Homepage**: http://localhost:3000
2. **Video API Test**: http://localhost:3000/api/video/stream?videoId=sample-unity-tutorial
   - Should return JSON with `success: true` and streaming data
   - Should NOT return "Method not allowed" (405 error)
3. **Course Page**: http://localhost:3000/course/unity-fundamentals/lesson/1
   - Should load without errors
   - Look for video player element

---

## Building Your Testing Practice

### Daily Development Workflow

1. **Before committing code:**
```bash
npm run test:critical
npm run lint
```

2. **Before creating a Pull Request:**
```bash
npm run test:full-suite
```

3. **Before deploying:**
```bash
npm run test:smoke
node scripts/validate-video-streaming-fix.js
```

### Weekly Quality Checks

1. **Run comprehensive E2E tests:**
```bash
npm run test:e2e
```

2. **Check test coverage:**
```bash
npm run test:coverage
```

3. **Performance validation:**
```bash
npm run test:performance
```

---

## Troubleshooting Common Issues

### If Video Streaming Validation Fails

**Problem**: `❌ CRITICAL FAILURE: Method GET not implemented!`
**Solution**:
1. Check that the GET method is exported in `/api/video/stream/route.ts`
2. Restart your development server
3. Clear browser cache

**Problem**: `ECONNREFUSED` error
**Solution**:
1. Make sure dev server is running: `npm run dev`
2. Check if port 3000 is available
3. Verify the correct base URL

### If E2E Tests Fail

**Problem**: Playwright browser installation issues
**Solution**:
```bash
npx playwright install --with-deps
```

**Problem**: Tests timeout waiting for elements
**Solution**:
1. Check if the UI components exist
2. Increase timeout in playwright.config.ts
3. Add better waiting conditions

### If Unit Tests Fail

**Problem**: Module import errors
**Solution**:
1. Check Jest configuration in `jest.config.js`
2. Verify TypeScript paths in `tsconfig.json`
3. Clear Jest cache: `npm test -- --clearCache`

---

## Test Writing Guidelines

### Writing Good Unit Tests

```typescript
// Good: Test specific functionality with clear expectations
test('GET /api/video/stream returns valid streaming manifest', async () => {
  const response = await request(app).get('/api/video/stream?videoId=test');

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.sessionId).toBeDefined();
  expect(response.body.data.streamUrl).toBeDefined();
});

// Bad: Vague test without clear purpose
test('video endpoint works', async () => {
  const response = await request(app).get('/api/video/stream');
  expect(response).toBeTruthy();
});
```

### Writing Good E2E Tests

```typescript
// Good: Test complete user journey
test('User can watch video after enrolling in course', async ({ page }) => {
  await page.goto('/course/unity-fundamentals');
  await page.click('button:has-text("Enroll")');
  await page.click('text=Lesson 1');

  const video = await page.waitForSelector('video');
  await expect(video).toBeVisible();

  await video.click(); // Start playing
  await expect(page.locator('[data-testid="video-playing"]')).toBeVisible();
});

// Bad: Testing implementation details
test('API endpoint returns correct response structure', async ({ page }) => {
  const response = await page.request.get('/api/video/stream');
  // This should be a unit test, not E2E
});
```

---

## Advanced Testing Scenarios

### Testing Video Streaming Under Load

```bash
# Use Artillery.io for load testing (install first)
npm install -g artillery

# Create load test configuration
cat > load-test-video.yml << EOF
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Video streaming load test"
    requests:
      - get:
          url: "/api/video/stream?videoId=sample-unity-tutorial"
EOF

# Run load test
artillery run load-test-video.yml
```

### Testing Across Different Network Conditions

```typescript
// In Playwright E2E test
test('Video streaming works on slow network', async ({ page }) => {
  // Simulate slow 3G
  await page.context().route('**/*', route => {
    route.continue({
      // Add delay to simulate slow network
    });
  });

  await page.goto('/course/unity-fundamentals/lesson/1');
  const video = await page.waitForSelector('video', { timeout: 30000 });
  await expect(video).toBeVisible();
});
```

### Database Integration Testing

```typescript
// Test with real database
describe('Video Progress Tracking', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  test('Progress is persisted correctly', async () => {
    // Test actual database operations
  });
});
```

---

## Continuous Integration Setup

### GitHub Actions Workflow

```yaml
# .github/workflows/tests.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Validate video streaming
        run: npm run dev & sleep 10 && node scripts/validate-video-streaming-fix.js
```

---

## Test Data Management

### Setting Up Test Data

```typescript
// tests/fixtures/test-data.ts
export const TEST_USERS = {
  STUDENT: {
    email: 'student@test.com',
    password: 'TestPass123!',
    role: 'STUDENT'
  }
};

export const TEST_COURSES = {
  UNITY_BASICS: {
    id: 'unity-fundamentals',
    videoId: 'sample-unity-tutorial'
  }
};
```

### Database Seeding for Tests

```typescript
// Setup test database with known data
beforeAll(async () => {
  await prisma.user.create({
    data: TEST_USERS.STUDENT
  });

  await prisma.course.create({
    data: TEST_COURSES.UNITY_BASICS
  });
});
```

---

## Monitoring Test Health

### Test Metrics to Track

1. **Test Coverage**: Should be > 70%
2. **Test Execution Time**: E2E tests < 10 minutes
3. **Flaky Test Rate**: < 5%
4. **Test Failure Rate**: < 2% on main branch

### Regular Test Maintenance

1. **Weekly**: Review failed tests and fix flaky ones
2. **Monthly**: Update test data and scenarios
3. **Quarterly**: Review test strategy effectiveness
4. **Per Feature**: Add tests for new functionality

---

## Next Steps

1. **Install Playwright**: `npm install -D @playwright/test`
2. **Run validation script**: `node scripts/validate-video-streaming-fix.js`
3. **Execute critical tests**: `npm run test:critical`
4. **Set up CI/CD pipeline** with test automation
5. **Train team** on testing best practices

Remember: **The goal is to catch issues like the missing GET method before users encounter them!**