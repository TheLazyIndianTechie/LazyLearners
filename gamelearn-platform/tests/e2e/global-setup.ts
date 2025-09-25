import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log('🔧 Setting up E2E test environment...');

  // Ensure the development server is ready
  try {
    await page.goto(config.webServer?.url || 'http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Development server is ready');
  } catch (error) {
    console.error('❌ Failed to connect to development server:', error);
    throw error;
  }

  // Set up test data if needed
  try {
    // In a real setup, you might seed the database with test data
    console.log('📊 Test data setup complete');
  } catch (error) {
    console.error('❌ Test data setup failed:', error);
    throw error;
  }

  await browser.close();
  console.log('🎬 E2E test environment ready!');
}

export default globalSetup;