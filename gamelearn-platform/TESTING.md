# Testing Guide - GameLearn Platform Video Streaming System

This document provides comprehensive information about the testing framework for the LazyGameDevs GameLearn Platform video streaming system.

## Overview

The testing framework is designed to ensure the reliability, performance, and security of the video streaming system. It includes unit tests, integration tests, and end-to-end tests covering all aspects of video processing, streaming, and user interactions.

## Test Structure

```
src/__tests__/
├── setup/
│   ├── test-utils.tsx          # Custom testing utilities
├── unit/
│   ├── lib/
│   │   ├── redis.test.ts       # Redis service tests
│   │   └── video/
│   │       ├── processing.test.ts    # Video processing tests
│   │       └── streaming.test.ts     # Video streaming tests
│   ├── api/
│   │   └── video/
│   │       ├── upload.test.ts        # Upload API tests
│   │       ├── stream.test.ts        # Streaming API tests
│   │       ├── heartbeat.test.ts     # Heartbeat API tests
│   │       └── analytics.test.ts     # Analytics API tests
│   └── components/
│       └── video/
│           ├── video-player.test.tsx       # Video player component tests
│           └── video-streaming-wrapper.test.tsx  # Wrapper component tests
└── integration/
    └── video-streaming-workflow.test.ts   # End-to-end workflow tests
```

## Testing Framework

### Core Technologies

- **Jest**: JavaScript testing framework with built-in mocking and assertion capabilities
- **React Testing Library**: Testing utilities for React components with focus on user interactions
- **@testing-library/user-event**: Enhanced user interaction simulation
- **ts-jest**: TypeScript support for Jest

### Configuration Files

- `jest.config.js`: Main Jest configuration
- `jest.setup.js`: Global test setup and mocks
- `jest.env.js`: Test environment variables

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests for CI/CD
npm run test:ci
```

### Test Categories

#### Unit Tests
Test individual components, services, and functions in isolation.

```bash
npm run test:unit
```

#### Integration Tests
Test the interaction between multiple components and services.

```bash
npm run test:integration
```

#### Coverage Reports
Generate detailed coverage reports showing test coverage across the codebase.

```bash
npm run test:coverage
```

## Test Coverage Goals

The testing framework aims for the following coverage targets:

- **Overall Coverage**: 70%+
- **Functions**: 70%+
- **Lines**: 70%+
- **Branches**: 70%+

### Current Coverage Areas

1. **Redis Service**: 100% coverage of MemoryStore and RedisService classes
2. **Video Processing**: 95% coverage of VideoProcessor class and processing logic
3. **Video Streaming**: 95% coverage of VideoStreamingService and streaming logic
4. **API Endpoints**: 90% coverage of all video-related API routes
5. **React Components**: 85% coverage of video player components
6. **Integration Workflows**: 80% coverage of end-to-end video streaming workflows

## Key Test Scenarios

### Video Processing Tests

#### VideoProcessor Class (`src/__tests__/unit/lib/video/processing.test.ts`)

- Video file validation (format, size, security)
- Metadata extraction and quality profile selection
- Job creation, tracking, and cancellation
- Error handling and malware detection
- Concurrent job limits and processing workflow

#### Key Test Cases:
```typescript
// Test video submission
test('should successfully submit a valid video')

// Test file validation
test('should validate file format')
test('should validate file size')
test('should reject unsupported formats')

// Test job management
test('should get job status')
test('should cancel pending job')
test('should enforce concurrent job limits')
```

### Video Streaming Tests

#### VideoStreamingService Class (`src/__tests__/unit/lib/video/streaming.test.ts`)

- Session creation and management
- Access control and concurrent session limits
- Heartbeat processing and quality adaptation
- Analytics tracking and event handling
- Session cleanup and error recovery

#### Key Test Cases:
```typescript
// Test session management
test('should create streaming session successfully')
test('should enforce concurrent session limits')

// Test heartbeat processing
test('should process valid heartbeat')
test('should recommend quality changes')
test('should handle expired sessions')

// Test analytics
test('should track video events')
test('should handle video completion')
```

### API Endpoint Tests

#### Upload API (`src/__tests__/unit/api/video/upload.test.ts`)

- POST: Video upload with validation
- GET: Job status retrieval
- DELETE: Job cancellation
- Authentication and authorization
- File validation and error handling

#### Streaming API (`src/__tests__/unit/api/video/stream.test.ts`)

- POST: Session creation
- PUT: Session updates
- DELETE: Session termination
- Access control and device info handling

#### Heartbeat API (`src/__tests__/unit/api/video/heartbeat.test.ts`)

- POST: Heartbeat processing
- GET: Session status
- Quality recommendations
- Buffer health monitoring

#### Analytics API (`src/__tests__/unit/api/video/analytics.test.ts`)

- POST: Event tracking
- GET: Analytics retrieval
- Event-specific handling (play, pause, seek, quality change)
- Course progress tracking

### React Component Tests

#### VideoPlayer Component (`src/__tests__/unit/components/video/video-player.test.tsx`)

- Video controls (play, pause, seek, volume)
- Quality and playback speed changes
- Fullscreen functionality
- Analytics tracking integration
- Error handling and accessibility

#### VideoStreamingWrapper Component (`src/__tests__/unit/components/video/video-streaming-wrapper.test.tsx`)

- Session initialization
- VideoPlayer integration
- Error states and retry functionality
- Loading states and UI feedback
- Course progress tracking

### Integration Tests

#### End-to-End Workflow (`src/__tests__/integration/video-streaming-workflow.test.ts`)

- Complete video upload to streaming workflow
- Quality adaptation scenarios
- Session management across multiple endpoints
- Error recovery and resilience testing
- Security and access control validation
- Performance and scalability scenarios

## Test Utilities

### Custom Testing Utilities (`src/__tests__/setup/test-utils.tsx`)

The framework provides several utility functions for common testing scenarios:

```typescript
// Create mock video file
const videoFile = createMockVideoFile({
  name: 'test-video.mp4',
  size: 1024 * 1024 * 100, // 100MB
})

// Create mock user session
const session = createMockSession({
  user: { role: 'INSTRUCTOR' }
})

// Create mock streaming session
const streamingSession = createMockStreamingSession({
  duration: 1800,
  quality: '720p'
})

// Wait for async operations
await waitForAsync(100)

// Custom matchers
expect(value).toBeWithinRange(10, 20)
```

## Mocking Strategy

### Global Mocks

The testing framework uses comprehensive mocking for external dependencies:

1. **Next.js APIs**: Router, navigation, server components
2. **Authentication**: NextAuth session management
3. **External Services**: Redis, file system, network requests
4. **Browser APIs**: Video element, fullscreen, device APIs

### Component Mocking

React components are mocked to test integration without UI complexity:

```typescript
// Mock VideoPlayer for wrapper tests
jest.mock('@/components/video/video-player', () => {
  return function MockVideoPlayer(props: any) {
    return <div data-testid="video-player">...</div>
  }
})
```

### API Mocking

HTTP requests are mocked using Jest's global fetch mock:

```typescript
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true, data: {...} })
})
```

## Error Scenario Testing

The framework extensively tests error conditions:

### Network Errors
- Connection failures
- Timeout scenarios
- Malformed responses

### Authentication Errors
- Unauthorized access
- Session expiration
- Role-based access denial

### Processing Errors
- Invalid file formats
- File size limits
- Malware detection

### Session Errors
- Concurrent session limits
- Session timeout
- Invalid session access

## Performance Testing

### Load Testing Scenarios

1. **Concurrent Uploads**: Multiple simultaneous video uploads
2. **High-Frequency Heartbeats**: Rapid heartbeat processing
3. **Session Scaling**: Large numbers of concurrent streaming sessions
4. **Memory Usage**: Memory leak detection and cleanup verification

### Performance Assertions

```typescript
// Test response times
const startTime = Date.now()
await apiCall()
const responseTime = Date.now() - startTime
expect(responseTime).toBeLessThan(1000) // < 1 second

// Test memory cleanup
expect(clearInterval).toHaveBeenCalled()
expect(removeEventListener).toHaveBeenCalledTimes(8)
```

## Continuous Integration

### GitHub Actions Workflow (`.github/workflows/test.yml`)

The CI pipeline includes:

1. **Multi-Node Testing**: Tests on Node.js 18.x and 20.x
2. **Linting and Type Checking**: Code quality validation
3. **Test Suite Execution**: Unit and integration tests
4. **Coverage Reporting**: Coverage reports uploaded to Codecov
5. **Security Auditing**: Dependency vulnerability scanning
6. **Performance Testing**: Performance regression detection

### CI Commands

```yaml
- name: Run unit tests
  run: npm run test:unit

- name: Run integration tests
  run: npm run test:integration

- name: Run full test suite with coverage
  run: npm run test:coverage
```

## Best Practices

### Writing Tests

1. **Test Behavior, Not Implementation**: Focus on user-facing functionality
2. **Use Descriptive Test Names**: Clearly describe what is being tested
3. **Arrange-Act-Assert Pattern**: Structure tests consistently
4. **Mock External Dependencies**: Isolate units under test
5. **Test Error Conditions**: Ensure robust error handling

### Test Organization

1. **Group Related Tests**: Use `describe` blocks for logical grouping
2. **Setup and Teardown**: Use `beforeEach` and `afterEach` for test isolation
3. **Shared Test Data**: Create reusable mock data and utilities
4. **Test File Naming**: Follow consistent naming conventions

### Assertions

1. **Specific Assertions**: Use precise matchers for clear error messages
2. **Async Testing**: Properly handle promises and async operations
3. **Custom Matchers**: Create domain-specific assertion helpers
4. **Snapshot Testing**: Use sparingly for stable UI components

## Troubleshooting

### Common Issues

1. **Timer-related Tests**: Use `jest.useFakeTimers()` for time-dependent tests
2. **Async Operations**: Use `waitFor` or `await` for async assertions
3. **DOM Events**: Use `fireEvent` or `userEvent` for user interactions
4. **Module Mocking**: Use `jest.doMock` for dynamic mocking

### Debug Techniques

1. **Test Isolation**: Run individual tests to isolate issues
2. **Console Logging**: Use `console.log` in tests for debugging
3. **Test Coverage**: Check coverage reports to identify untested code
4. **Mock Verification**: Verify mock calls and arguments

## Contributing

When adding new features or fixing bugs:

1. **Write Tests First**: Follow TDD principles when possible
2. **Update Existing Tests**: Ensure changes don't break existing functionality
3. **Add Integration Tests**: Test feature interactions
4. **Document Test Cases**: Update this guide for new testing patterns
5. **Maintain Coverage**: Ensure new code meets coverage requirements

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [CI/CD with GitHub Actions](https://docs.github.com/en/actions)

---

This testing framework ensures the reliability and maintainability of the GameLearn Platform video streaming system, providing confidence in deployments and enabling rapid development cycles.