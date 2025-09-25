/**
 * Test Utilities and Helpers
 * Reusable functions for testing across the GameLearn platform
 */

import { Page, expect } from '@playwright/test';

// Test data constants
export const TEST_USERS = {
  STUDENT: {
    email: 'student@test.lazygamedevs.com',
    password: 'StudentPass123!',
    name: 'Test Student',
    role: 'STUDENT'
  },
  INSTRUCTOR: {
    email: 'instructor@test.lazygamedevs.com',
    password: 'InstructorPass123!',
    name: 'Test Instructor',
    role: 'INSTRUCTOR'
  },
  ADMIN: {
    email: 'admin@test.lazygamedevs.com',
    password: 'AdminPass123!',
    name: 'Test Admin',
    role: 'ADMIN'
  }
};

export const TEST_COURSES = {
  UNITY_FUNDAMENTALS: {
    id: 'unity-fundamentals',
    title: 'Unity Game Development Fundamentals',
    videoId: 'sample-unity-tutorial',
    price: 49.99
  },
  CSHARP_PROGRAMMING: {
    id: 'csharp-programming',
    title: 'C# Programming for Game Development',
    videoId: 'sample-csharp-tutorial',
    price: 39.99
  },
  PHYSICS_SIMULATION: {
    id: 'physics-simulation',
    title: 'Game Physics and Simulation',
    videoId: 'sample-physics-tutorial',
    price: 59.99
  }
};

// Authentication helpers
export class AuthHelper {
  constructor(private page: Page) {}

  async signIn(user: typeof TEST_USERS.STUDENT) {
    console.log(`🔐 Signing in as ${user.name} (${user.email})`);

    // Navigate to sign-in page
    await this.page.goto('/auth/signin');

    // Fill credentials
    await this.page.fill('input[type="email"], input[name="email"]', user.email);
    await this.page.fill('input[type="password"], input[name="password"]', user.password);

    // Submit form
    await this.page.click('button[type="submit"], button:has-text("Sign in")');

    // Wait for redirect
    await this.page.waitForURL('/', { timeout: 10000 });

    console.log('✅ Successfully signed in');
  }

  async signOut() {
    console.log('🚪 Signing out');

    // Look for sign-out button/link
    const signOutButton = this.page.locator('button:has-text("Sign out"), a:has-text("Sign out"), [data-testid="signout-button"]');

    if (await signOutButton.isVisible()) {
      await signOutButton.click();
      await this.page.waitForURL('/auth/signin', { timeout: 5000 });
      console.log('✅ Successfully signed out');
    } else {
      // Fallback: clear session manually
      await this.page.context().clearCookies();
      await this.page.evaluate(() => localStorage.clear());
      console.log('✅ Session cleared manually');
    }
  }

  async ensureAuthenticated(user: typeof TEST_USERS.STUDENT) {
    // Check if already authenticated
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/auth')) {
      // Try to access a protected resource
      await this.page.goto('/dashboard');

      if (this.page.url().includes('/auth')) {
        await this.signIn(user);
      }
    } else {
      await this.signIn(user);
    }
  }
}

// Video streaming helpers
export class VideoStreamingHelper {
  constructor(private page: Page) {}

  async navigateToVideoLesson(courseId: string, lessonNumber: number = 1) {
    console.log(`📹 Navigating to video lesson ${lessonNumber} in course ${courseId}`);
    await this.page.goto(`/course/${courseId}/lesson/${lessonNumber}`);
    await this.page.waitForLoadState('networkidle');
  }

  async findVideoPlayer() {
    const selectors = [
      'video',
      '[data-testid="video-player"]',
      '.video-player',
      '.react-player',
      'iframe[src*="video"]'
    ];

    for (const selector of selectors) {
      const element = this.page.locator(selector).first();
      if (await element.isVisible().catch(() => false)) {
        console.log(`✅ Video player found with selector: ${selector}`);
        return element;
      }
    }

    console.log('❌ Video player not found');
    return null;
  }

  async testVideoControls() {
    const player = await this.findVideoPlayer();
    if (!player) return false;

    console.log('🎮 Testing video controls...');

    // Test play/pause
    await player.click();
    await this.page.waitForTimeout(1000);

    // Test quality selector
    const qualityButton = this.page.locator('[data-testid="quality-selector"], button:has-text("Quality")');
    if (await qualityButton.isVisible().catch(() => false)) {
      await qualityButton.click();
      console.log('✅ Quality selector accessible');
    }

    // Test fullscreen
    const fullscreenButton = this.page.locator('[data-testid="fullscreen-button"], button[aria-label*="fullscreen"]');
    if (await fullscreenButton.isVisible().catch(() => false)) {
      await fullscreenButton.click();
      await this.page.waitForTimeout(500);
      await this.page.keyboard.press('Escape');
      console.log('✅ Fullscreen toggle works');
    }

    return true;
  }

  async monitorStreamingRequests() {
    const requests: any[] = [];

    this.page.on('request', request => {
      const url = request.url();
      if (url.includes('/api/video/') || url.includes('.m3u8') || url.includes('.ts')) {
        requests.push({
          url,
          method: request.method(),
          timestamp: Date.now()
        });
      }
    });

    return {
      getRequests: () => requests,
      hasStreamingRequests: () => requests.length > 0,
      hasStreamApiCall: () => requests.some(req => req.url.includes('/api/video/stream')),
      hasHeartbeat: () => requests.some(req => req.url.includes('/api/video/heartbeat')),
      hasAnalytics: () => requests.some(req => req.url.includes('/api/video/analytics'))
    };
  }
}

// Course enrollment helpers
export class CourseHelper {
  constructor(private page: Page) {}

  async browseCourses() {
    console.log('🔍 Browsing course catalog...');
    await this.page.goto('/courses');
    await this.page.waitForLoadState('networkidle');
  }

  async enrollInCourse(courseId: string) {
    console.log(`📚 Enrolling in course: ${courseId}`);

    await this.page.goto(`/course/${courseId}`);

    // Look for enroll button
    const enrollButton = this.page.locator('button:has-text("Enroll"), button:has-text("Buy"), [data-testid="enroll-button"]');

    if (await enrollButton.isVisible()) {
      await enrollButton.click();

      // Handle potential payment flow
      await this.handlePaymentFlow();

      console.log('✅ Course enrollment completed');
      return true;
    } else {
      console.log('ℹ️ Already enrolled or enrollment not available');
      return false;
    }
  }

  private async handlePaymentFlow() {
    // Wait for payment form or redirect
    await this.page.waitForTimeout(2000);

    // Check if we're on a payment page
    const isPaymentPage = await this.page.locator('form[data-testid="payment-form"], input[name="cardNumber"]').isVisible().catch(() => false);

    if (isPaymentPage) {
      console.log('💳 Payment form detected - using test payment method');

      // Fill test payment details (if in test mode)
      await this.page.fill('input[name="cardNumber"]', '4242424242424242').catch(() => {});
      await this.page.fill('input[name="expiry"]', '12/25').catch(() => {});
      await this.page.fill('input[name="cvc"]', '123').catch(() => {});

      // Submit payment
      await this.page.click('button[type="submit"]:has-text("Pay"), button:has-text("Complete")').catch(() => {});

      // Wait for completion
      await this.page.waitForTimeout(3000);
    }
  }

  async verifyEnrollment(courseId: string) {
    await this.page.goto(`/course/${courseId}`);

    // Check for enrollment indicators
    const enrollmentIndicators = [
      'text=Enrolled',
      '[data-testid="enrolled-badge"]',
      'button:has-text("Continue Learning")',
      'button:has-text("Start Learning")'
    ];

    for (const selector of enrollmentIndicators) {
      if (await this.page.locator(selector).isVisible().catch(() => false)) {
        console.log('✅ Course enrollment verified');
        return true;
      }
    }

    console.log('❌ Course enrollment not verified');
    return false;
  }
}

// Progress tracking helpers
export class ProgressHelper {
  constructor(private page: Page) {}

  async checkLessonProgress(courseId: string, lessonNumber: number) {
    console.log(`📊 Checking progress for lesson ${lessonNumber} in course ${courseId}`);

    await this.page.goto(`/course/${courseId}`);

    // Look for progress indicators
    const progressSelectors = [
      `[data-testid="lesson-${lessonNumber}-progress"]`,
      `.lesson-${lessonNumber} .progress`,
      `[data-lesson="${lessonNumber}"] .progress-bar`
    ];

    for (const selector of progressSelectors) {
      const element = this.page.locator(selector);
      if (await element.isVisible().catch(() => false)) {
        const progressText = await element.textContent();
        console.log(`✅ Lesson progress found: ${progressText}`);
        return progressText;
      }
    }

    console.log('ℹ️ No progress indicator found');
    return null;
  }

  async verifyCourseCompletion(courseId: string) {
    await this.page.goto(`/course/${courseId}`);

    const completionIndicators = [
      'text=Course Completed',
      '[data-testid="course-completed"]',
      '.completion-badge',
      'text=100%'
    ];

    for (const selector of completionIndicators) {
      if (await this.page.locator(selector).isVisible().catch(() => false)) {
        console.log('🎉 Course completion verified');
        return true;
      }
    }

    return false;
  }
}

// API testing helpers
export class APITestHelper {
  constructor(private page: Page) {}

  async testVideoStreamingAPI(videoId: string, courseId?: string) {
    console.log(`🔧 Testing video streaming API for ${videoId}`);

    const url = `/api/video/stream?videoId=${videoId}${courseId ? `&courseId=${courseId}` : ''}`;
    const response = await this.page.request.get(url);

    const data = await response.json().catch(() => ({}));

    return {
      status: response.status(),
      success: response.ok(),
      data,
      hasSessionId: data.data?.sessionId !== undefined,
      hasStreamUrl: data.data?.streamUrl !== undefined || data.data?.manifestUrl !== undefined,
      hasPlayerConfig: data.data?.playerConfig !== undefined
    };
  }

  async testVideoHeartbeat(sessionId: string) {
    console.log(`💓 Testing video heartbeat for session ${sessionId}`);

    const response = await this.page.request.post('/api/video/heartbeat', {
      data: {
        sessionId,
        currentPosition: 300,
        bufferHealth: 10,
        quality: '720p',
        isPlaying: true
      }
    });

    const data = await response.json().catch(() => ({}));

    return {
      status: response.status(),
      success: response.ok(),
      data
    };
  }

  async testVideoAnalytics(sessionId: string, eventType: string = 'play') {
    console.log(`📊 Testing video analytics for session ${sessionId}`);

    const response = await this.page.request.post('/api/video/analytics', {
      data: {
        sessionId,
        eventType,
        position: 300,
        metadata: { quality: '720p' }
      }
    });

    return {
      status: response.status(),
      success: response.ok(),
      data: await response.json().catch(() => ({}))
    };
  }
}

// Performance testing helpers
export class PerformanceHelper {
  constructor(private page: Page) {}

  async measurePageLoadTime(url: string) {
    const startTime = Date.now();
    await this.page.goto(url, { waitUntil: 'networkidle' });
    const loadTime = Date.now() - startTime;

    console.log(`⚡ Page load time for ${url}: ${loadTime}ms`);
    return loadTime;
  }

  async measureVideoStartTime(courseId: string, lessonNumber: number = 1) {
    await this.page.goto(`/course/${courseId}/lesson/${lessonNumber}`);

    const startTime = Date.now();
    const videoHelper = new VideoStreamingHelper(this.page);
    const player = await videoHelper.findVideoPlayer();

    if (player) {
      await player.click(); // Start playing

      // Wait for video to actually start (look for playing state)
      await this.page.waitForFunction(() => {
        const video = document.querySelector('video');
        return video && !video.paused && video.currentTime > 0;
      }, { timeout: 10000 }).catch(() => console.log('Video start detection timed out'));

      const startupTime = Date.now() - startTime;
      console.log(`🎬 Video startup time: ${startupTime}ms`);
      return startupTime;
    }

    return null;
  }
}

// Assertion helpers
export class AssertionHelper {
  static async expectVideoPlayerToBeVisible(page: Page) {
    const videoHelper = new VideoStreamingHelper(page);
    const player = await videoHelper.findVideoPlayer();
    expect(player).not.toBeNull();
    return player;
  }

  static async expectUserToBeAuthenticated(page: Page) {
    // Should not be on auth pages
    expect(page.url()).not.toContain('/auth/signin');
    expect(page.url()).not.toContain('/login');

    // Should have user indicator in UI
    const userIndicators = [
      '[data-testid="user-menu"]',
      'button:has-text("Profile")',
      'text=Welcome',
      '[data-testid="user-avatar"]'
    ];

    let found = false;
    for (const selector of userIndicators) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }

    expect(found).toBe(true);
  }

  static async expectCourseToBeAccessible(page: Page, courseId: string) {
    await page.goto(`/course/${courseId}`);

    // Should not redirect to auth
    expect(page.url()).toContain(courseId);

    // Should show course content
    const courseContent = page.locator('h1, [data-testid="course-title"], .course-content');
    await expect(courseContent.first()).toBeVisible();
  }
}

// Export all helpers
export {
  AuthHelper,
  VideoStreamingHelper,
  CourseHelper,
  ProgressHelper,
  APITestHelper,
  PerformanceHelper,
  AssertionHelper
};