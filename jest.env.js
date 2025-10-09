// Jest environment setup for test environment variables

// Set test environment
process.env.NODE_ENV = 'test'

// Database URLs for testing
process.env.DATABASE_URL = 'file:./test.db'
process.env.REDIS_URL = 'redis://localhost:6379/test'

// Authentication configuration
process.env.CLERK_SECRET_KEY = 'sk_test_dummy_clerk_secret_key'
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_dummy_clerk_publishable_key'
process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_clerk_webhook'

// Application URLs
process.env.APP_URL = 'http://localhost:3000'
process.env.CDN_URL = 'https://test-cdn.lazygamedevs.com'

// Video processing configuration
process.env.VIDEO_STORAGE_PATH = '/tmp/test-videos'
process.env.VIDEO_CDN_URL = 'https://test-cdn.lazygamedevs.com/videos'

// Security configuration
process.env.ENCRYPTION_KEY = 'test-encryption-key-32-characters'
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-32-chars-length-for-security-requirements'

// Feature flags for testing
process.env.ENABLE_VIDEO_PROCESSING = 'true'
process.env.ENABLE_DRM = 'false'
process.env.ENABLE_ANALYTICS = 'true'

// Log level
process.env.LOG_LEVEL = 'error'

// Disable external services in tests
process.env.DISABLE_TELEMETRY = 'true'
process.env.DISABLE_EXTERNAL_APIS = 'true'