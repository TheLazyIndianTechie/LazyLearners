# Testing Guide - GameLearn Platform

**"Test the user journey, not just the code"** - Our testing approach prioritizes end-to-end user experiences to catch integration issues early.

## Quick Start

### 1. Install Dependencies
```bash
# Install Playwright for E2E testing
npm install -D @playwright/test
npx playwright install
```

### 2. Run Tests
```bash
# Run all tests
npm test

# Run critical tests (fast feedback)
npm run test:critical

# Run with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## Testing Philosophy & Strategy

### Testing Pyramid
```
    /\
   /  \  E2E Tests (20%)
  /____\  Integration Tests (30%)
 /      \ Unit Tests (50%)
```

**Coverage Goals**: 70%+ overall (functions, lines, branches)

### Core Technologies
- **Jest**: JavaScript testing with mocking and assertions
- **React Testing Library**: Component testing focused on user interactions
- **Playwright**: End-to-end testing across browsers
- **ts-jest**: TypeScript support

## Test Structure

```
src/__tests__/
├── setup/                    # Test utilities
│   └── test-utils.tsx
├── unit/                     # Isolated component tests
│   ├── api/
│   ├── components/
│   └── lib/
├── integration/              # Multi-component workflows
│   └── video-streaming-workflow.test.ts
└── critical/                 # Critical user journeys
    └── video-streaming-user-journey.test.ts

tests/e2e/                    # Playwright E2E tests
└── user-journeys/
    └── video-streaming.spec.ts
```

## Critical User Journeys

### 1. Video Streaming Journey (CRITICAL)
**Test Flow**:
1. User browses course catalog
2. User signs in/creates account
3. User enrolls in course
4. User clicks "Watch Video"
5. Video player loads streaming manifest
6. Video starts playing
7. Progress is tracked
8. Analytics are recorded

**Test Files**:
- `tests/e2e/user-journeys/video-streaming.spec.ts`
- `src/__tests__/critical/video-streaming-user-journey.test.ts`

### 2. Course Enrollment Journey
1. Browse course catalog
2. View course details
3. Initiate enrollment
4. Complete payment
5. Access course content
6. Track progress

### 3. Instructor Content Management
1. Instructor login
2. Create/edit course
3. Upload videos
4. Manage course content
5. View analytics

## Test Commands

### Development Workflow
```bash
# Before committing
npm run test:critical
npm run lint

# Run specific test types
npm run test:unit              # Unit tests only
npm run test:integration       # Integration tests only
npm run test:e2e              # E2E tests
npm run test:video-streaming  # Video-specific tests

# Watch mode (development)
npm run test:watch

# Debug E2E tests
npm run test:e2e:ui
npm run test:e2e:debug
```

### CI/CD Pipeline
```bash
# Pre-commit hooks
npm run test:critical

# Pull Request validation
npm run test:full-suite

# Pre-deployment
npm run test:smoke
npm run test:performance
```

## Key Test Scenarios

### Video Processing Tests
```typescript
// Video file validation
test('should validate file format', async () => {
  // Test video submission
});

test('should reject unsupported formats', async () => {
  // Test format validation
});

// Job management
test('should get job status', async () => {
  // Test job tracking
});
```

### Video Streaming Tests
```typescript
// Session management
test('should create streaming session successfully', async () => {
  // Test session creation
});

test('should enforce concurrent session limits', async () => {
  // Test access control
});

// Heartbeat processing
test('should process valid heartbeat', async () => {
  // Test heartbeat system
});
```

### API Endpoint Tests
All API routes are tested for:
- All HTTP methods (GET, POST, PUT, DELETE)
- Authentication and authorization
- Input validation and error handling
- Response structure and status codes

### React Component Tests
Components tested for:
- User interactions (click, input, etc.)
- State management
- Props handling
- Error states
- Accessibility

## Test Utilities

### Custom Testing Helpers
```typescript
// Create mock video file
const videoFile = createMockVideoFile({
  name: 'test-video.mp4',
  size: 1024 * 1024 * 100, // 100MB
});

// Create mock user session
const session = createMockSession({
  user: { role: 'INSTRUCTOR' }
});

// Create mock streaming session
const streamingSession = createMockStreamingSession({
  duration: 1800,
  quality: '720p'
});

// Wait for async operations
await waitForAsync(100);
```

## Test Categories & Tags

### @smoke Tests
Essential functionality - run before every deployment:
- User can sign in
- Course catalog loads
- Video streaming works
- Payment processing works

### @regression Tests
Prevent bugs from reoccurring - run with every PR:
- All API endpoints have required HTTP methods
- Video streaming works across devices
- Payment flows handle edge cases

### @critical Tests
High-impact scenarios - run multiple times daily:
- Complete video streaming workflow
- Payment processing end-to-end
- User authentication flow

### @performance Tests
Platform performance - run weekly and before releases:
- Page load times < 3 seconds
- Video startup time < 5 seconds
- API response times < 500ms

## Quality Gates

### Commit Level
- ✅ Critical tests pass
- ✅ No linting errors
- ✅ Type checking passes

### Pull Request Level
- ✅ All tests pass
- ✅ Code coverage > 70%
- ✅ No security vulnerabilities
- ✅ Performance benchmarks met

### Deployment Level
- ✅ Smoke tests pass
- ✅ Integration tests pass
- ✅ E2E tests pass in staging
- ✅ Manual QA approval

## Mocking Strategy

### Global Mocks
- **Next.js APIs**: Router, navigation, server components
- **Authentication**: NextAuth session management
- **External Services**: Redis, file system, network requests
- **Browser APIs**: Video element, fullscreen, device APIs

### API Mocking
```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: {...} })
});
```

## Performance Testing

### Key Metrics
- **Page Load Time**: < 3 seconds
- **Video Start Time**: < 5 seconds
- **API Response Time**: < 500ms
- **Time to Interactive**: < 5 seconds

### Load Testing
```bash
# Use Artillery.io for load testing
npm install -g artillery

# Run load test
artillery run load-test-video.yml
```

## Accessibility Testing

### Automated Checks
- Color contrast ratios (WCAG 2.1 AA)
- Keyboard navigation
- Screen reader compatibility
- ARIA label validation

### Manual Checks
- Tab order logical
- Video captions available
- Form labels clear
- Error messages descriptive

## Security Testing

### Automated Scans
- Dependency vulnerability scanning
- OWASP Top 10 validation
- Authentication bypass attempts
- SQL injection testing

### Manual Testing
- Session management validation
- Authorization boundary testing
- Input validation verification
- File upload security

## Test Data Management

### Test Users
```typescript
const TEST_USERS = {
  STUDENT: { email: 'student@test.com', role: 'STUDENT' },
  INSTRUCTOR: { email: 'instructor@test.com', role: 'INSTRUCTOR' },
  ADMIN: { email: 'admin@test.com', role: 'ADMIN' }
};
```

### Test Courses
```typescript
const TEST_COURSES = {
  UNITY_FUNDAMENTALS: {
    id: 'unity-fundamentals',
    videoId: 'sample-unity-tutorial'
  }
};
```

## Troubleshooting

### Common Issues

**Timer-related Tests**
```typescript
jest.useFakeTimers();
```

**Async Operations**
```typescript
await waitFor(() => expect(element).toBeInTheDocument());
```

**Module Mocking**
```typescript
jest.doMock('./module', () => ({ default: mockImpl }));
```

### Debug Techniques
1. Test isolation: `npm test -- specific.test.ts`
2. Console logging in tests
3. Check coverage reports: `npm run test:coverage`
4. Verify mock calls: `expect(mockFn).toHaveBeenCalledWith(...)`

## Best Practices

### Writing Tests
1. **Test Behavior, Not Implementation**: Focus on user-facing functionality
2. **Use Descriptive Test Names**: Clearly describe what is being tested
3. **Arrange-Act-Assert Pattern**: Structure tests consistently
4. **Mock External Dependencies**: Isolate units under test
5. **Test Error Conditions**: Ensure robust error handling

### Test Organization
1. **Group Related Tests**: Use `describe` blocks
2. **Setup and Teardown**: Use `beforeEach` and `afterEach`
3. **Shared Test Data**: Create reusable mock data
4. **Consistent Naming**: Follow naming conventions

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm run test:full-suite

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
```

## Test Effectiveness Metrics

Track these metrics to improve testing:
- **Bug Escape Rate**: Bugs found in production vs tests
- **Test Execution Time**: Optimize for developer productivity
- **Coverage Trends**: Maintain or improve over time
- **Flaky Test Rate**: Keep below 5%

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

---

**Remember**: The goal is to catch issues early and ensure a seamless user experience!
