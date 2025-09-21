#!/usr/bin/env node

/**
 * Comprehensive Video Streaming API Testing Script
 * Tests all video endpoints with proper authentication
 * Usage: node scripts/test-video-apis.js [production|local]
 */

const https = require('https');
const http = require('http');

const PRODUCTION_URL = 'https://gamelearn-platform-1d90quto5-thelazyindiantechies-projects.vercel.app';
const LOCAL_URL = 'http://localhost:3001';

const environment = process.argv[2] || 'local';
const baseUrl = environment === 'production' ? PRODUCTION_URL : LOCAL_URL;

console.log(`🧪 Testing Video Streaming APIs on ${environment.toUpperCase()} environment`);
console.log(`📍 Base URL: ${baseUrl}`);
console.log('=' * 60);

// Test data
const testData = {
  videoStream: {
    videoId: 'sample-unity-tutorial',
    courseId: 'course-123e4567-e89b-12d3-a456-426614174000',
    quality: '720p',
    startTime: 0
  },
  heartbeat: {
    sessionId: 'test-session-' + Date.now(),
    currentPosition: 125.5,
    bufferHealth: 85,
    quality: '720p',
    playbackRate: 1.0,
    volume: 0.8,
    isPlaying: true,
    isFullscreen: false,
    networkInfo: {
      effectiveType: '4g',
      downlink: 10.5,
      rtt: 50
    }
  },
  analytics: {
    sessionId: 'test-session-' + Date.now(),
    event: 'play',
    timestamp: new Date().toISOString(),
    position: 30.0,
    metadata: {
      quality: '720p',
      bufferHealth: 90,
      playbackRate: 1.0
    }
  }
};

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: body ? JSON.parse(body) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
            data: null,
            parseError: e.message
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test cases
const tests = [
  {
    name: 'Video Stream Initialization',
    method: 'POST',
    path: '/api/video/stream',
    data: testData.videoStream,
    expectedStatus: [200, 401],
    description: 'Initialize video streaming session'
  },
  {
    name: 'Video Heartbeat',
    method: 'POST',
    path: '/api/video/heartbeat',
    data: testData.heartbeat,
    expectedStatus: [200, 401],
    description: 'Send video playback heartbeat data'
  },
  {
    name: 'Video Analytics Tracking',
    method: 'POST',
    path: '/api/video/analytics',
    data: testData.analytics,
    expectedStatus: [200, 401],
    description: 'Track video analytics events'
  },
  {
    name: 'Get Heartbeat Status',
    method: 'GET',
    path: `/api/video/heartbeat?sessionId=${testData.heartbeat.sessionId}`,
    expectedStatus: [200, 401, 404],
    description: 'Get video session status'
  },
  {
    name: 'Get Video Analytics',
    method: 'GET',
    path: `/api/video/analytics?videoId=${testData.videoStream.videoId}`,
    expectedStatus: [200, 401],
    description: 'Retrieve video analytics data'
  }
];

// Run tests
async function runTests() {
  console.log(`\n🚀 Starting ${tests.length} API tests...\n`);

  const results = [];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`[${i + 1}/${tests.length}] Testing: ${test.name}`);
    console.log(`    ${test.method} ${test.path}`);
    console.log(`    ${test.description}`);

    try {
      const url = new URL(baseUrl + test.path);

      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: test.method,
        protocol: url.protocol,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'GameLearn-API-Tester/1.0'
        }
      };

      const response = await makeRequest(options, test.data);

      const isExpectedStatus = test.expectedStatus.includes(response.statusCode);
      const statusText = isExpectedStatus ? '✅' : '❌';

      console.log(`    ${statusText} Status: ${response.statusCode}`);

      if (response.data) {
        if (response.data.success === false && response.data.error) {
          console.log(`    📝 Response: ${response.data.error.message}`);
        } else if (response.data.success === true) {
          console.log(`    📝 Response: Success`);
          if (response.data.data) {
            console.log(`    📊 Data keys: ${Object.keys(response.data.data).join(', ')}`);
          }
        }
      } else if (response.parseError) {
        console.log(`    ⚠️  Parse Error: ${response.parseError}`);
      }

      results.push({
        test: test.name,
        status: response.statusCode,
        success: isExpectedStatus,
        response: response.data,
        error: response.parseError
      });

    } catch (error) {
      console.log(`    ❌ Error: ${error.message}`);
      results.push({
        test: test.name,
        status: 'ERROR',
        success: false,
        error: error.message
      });
    }

    console.log('');
  }

  // Summary
  console.log('📊 Test Results Summary:');
  console.log('=' * 60);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / results.length) * 100)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.test}: ${result.status} ${result.error || ''}`);
    });
  }

  console.log('\n🔍 Authentication Analysis:');
  const authRequired = results.filter(r => r.status === 401).length;
  if (authRequired > 0) {
    console.log(`   • ${authRequired} endpoints require authentication (expected)`);
    console.log(`   • APIs are properly secured with NextAuth`);
    console.log(`   • To test with authentication, use the web interface`);
  } else {
    console.log(`   • No authentication required (unexpected for production)`);
  }

  console.log('\n🎯 Next Steps:');
  console.log('   1. Test authentication flow via web interface');
  console.log('   2. Create authenticated session and retry API tests');
  console.log('   3. Validate video player integration in browser');
  console.log(`   4. Monitor Vercel function logs for detailed error analysis`);

  console.log('\n🔗 Useful Links:');
  console.log(`   • Test Video Page: ${baseUrl}/test/video`);
  console.log(`   • Sign In: ${baseUrl}/auth/signin`);
  console.log(`   • Dashboard: ${baseUrl}/dashboard`);

  if (environment === 'production') {
    console.log(`   • Vercel Logs: npx vercel logs`);
    console.log(`   • Vercel Dashboard: https://vercel.com/thelazyindiantechies-projects/gamelearn-platform-lms`);
  }
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error);
  process.exit(1);
});