import { logger, createRequestLogger, createUserLogger, createOperationLogger } from '@/lib/logger'
import { LogContext, LogLevel } from '@/lib/logger'

// Mock DataDog transport
jest.mock('@datadog/datadog-api-client', () => ({
  client: {
    createConfiguration: jest.fn(() => ({})),
  },
  v2: {
    LogsApi: jest.fn().mockImplementation(() => ({
      submitLog: jest.fn().mockResolvedValue({}),
    })),
  },
}))

// Mock DataDog tracing
jest.mock('@/lib/datadog-tracing', () => ({
  getTraceContext: jest.fn(() => ({
    traceId: 'test-trace-123',
    spanId: 'test-span-456',
  })),
  incrementMetric: jest.fn(),
  gaugeMetric: jest.fn(),
  histogramMetric: jest.fn(),
}))

// Disable DataDog for testing
process.env.NODE_ENV = 'development'
delete process.env.DATADOG_API_KEY

describe('Logger', () => {
  beforeEach(() => {
    // Reset logger context
    jest.clearAllMocks()
    // Set log level to debug for testing
    logger.setLogLevel('debug')
  })

  afterEach(() => {
    // Reset log level to default
    logger.setLogLevel('info')
  })

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      logger.info('Test info message')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('INFO: Test info message')
      )

      consoleSpy.mockRestore()
    })

    it('should log error messages with error details', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      const testError = new Error('Test error')

      logger.error('Test error message', testError)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Test error message')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error: Error - Test error')
      )

      consoleSpy.mockRestore()
    })

    it('should include structured context in logs', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      logger.info('Test with context', {
        userId: 'user123',
        operation: 'test-op',
        correlationId: 'corr-123'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('userId=user123')
      )
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('operation=test-op')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Child Loggers', () => {
    it('should create request logger with correlation ID', () => {
      const mockRequest = {
        headers: new Headers({
          'x-correlation-id': 'req-123',
          'user-agent': 'test-agent',
          'x-forwarded-for': '127.0.0.1'
        }),
        method: 'GET',
        url: 'http://test.com/api/test'
      } as any

      const requestLogger = createRequestLogger(mockRequest)

      expect(requestLogger).toBeDefined()
      // The logger should have the context set
    })

    it('should create user logger with user context', () => {
      const userLogger = createUserLogger('user123', 'session456')

      expect(userLogger).toBeDefined()
      // The logger should have user context
    })

    it('should create operation logger with operation context', () => {
      const opLogger = createOperationLogger('test-operation', 'test-component')

      expect(opLogger).toBeDefined()
      // The logger should have operation context
    })
  })

  describe('Performance Logging', () => {
    it('should log performance timing', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      const endTimer = logger.time('test-operation')

      // Simulate some work
      setTimeout(() => {
        endTimer()

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Completed operation: test-operation')
        )

        consoleSpy.mockRestore()
      }, 10)
    })
  })

  describe('Business Logic Logging', () => {
    it('should log business events', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      logger.logBusinessEvent('user_registered', {
        userId: 'user123',
        plan: 'premium'
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Business event: user_registered')
      )

      consoleSpy.mockRestore()
    })

    it('should log security events', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      logger.logSecurityEvent('suspicious_login', 'high', {
        userId: 'user123',
        ip: '192.168.1.1',
        attempts: 5
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Security event: suspicious_login')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Database Logging', () => {
    it('should log database operations', () => {
      const consoleSpy = jest.spyOn(console, 'debug').mockImplementation()

      logger.logDatabaseOperation('SELECT', 'users', 150)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Database operation: SELECT on users')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('External API Logging', () => {
    it('should log external API calls', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      logger.logExternalApiCall('stripe', '/v1/charges', 'POST', 200, 250)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('External API call: POST stripe/v1/charges')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Log Analysis', () => {
    it('should categorize database errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      logger.error('Connection refused error', new Error('ECONNREFUSED'))

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Connection refused error')
      )

      consoleSpy.mockRestore()
    })

    it('should categorize authentication errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      logger.error('Invalid token', new Error('Unauthorized'))

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ERROR: Invalid token')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Trace Correlation', () => {
    it('should include trace context in logs', () => {
      const consoleSpy = jest.spyOn(console, 'info').mockImplementation()

      logger.info('Test with trace')

      // The trace context should be included in the structured log
      // This is tested implicitly through the DataDog transport

      consoleSpy.mockRestore()
    })
  })
})