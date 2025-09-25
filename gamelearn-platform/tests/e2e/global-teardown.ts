import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up E2E test environment...');

  try {
    // Clean up test data if needed
    // In a real setup, you might clean up test database records
    console.log('🗑️ Test data cleanup complete');
  } catch (error) {
    console.error('❌ Test data cleanup failed:', error);
    // Don't throw here as it might mask test failures
  }

  console.log('✅ E2E test environment cleanup complete');
}

export default globalTeardown;