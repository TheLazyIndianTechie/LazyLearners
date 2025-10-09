const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // If using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

   // Transform ES modules
   transformIgnorePatterns: [
     'node_modules/(?!(next-auth|@auth|\\@clerk|jose|msgpackr|@clerk/backend)/)',
   ],

   // Module name mapping for path aliases
   moduleNameMapper: {
     '^@/(.*)$': '<rootDir>/src/$1',
     '^msgpackr$': '<rootDir>/__mocks__/msgpackr.js',
     '^@clerk/backend$': '<rootDir>/__mocks__/@clerk/backend.js',
   },

  // Test patterns
  testMatch: [
    '<rootDir>/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)',
    '<rootDir>/src/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],

  // Collect coverage from
  collectCoverageFrom: [
    'src/**/*.(js|jsx|ts|tsx)',
    '!src/**/*.d.ts',
    '!src/**/*.stories.@(js|jsx|ts|tsx)',
    '!src/**/__tests__/**',
    '!src/**/__mocks__/**',
    '!src/**/node_modules/**',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html'],

  // Transform files
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Setup files to run before each test
  setupFiles: ['<rootDir>/jest.env.js'],

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

   // Test timeout
   testTimeout: 30000,

   // Max workers for parallel testing
   maxWorkers: 2,

   // Force exit to prevent hanging
   forceExit: true,

   // Detect open handles
   detectOpenHandles: true,

  // Verbose output
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)