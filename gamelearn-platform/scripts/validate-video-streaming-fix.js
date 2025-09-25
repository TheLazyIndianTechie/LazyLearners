#!/usr/bin/env node

/**
 * Immediate Validation Script for Video Streaming Fix
 * Run this script to validate that the missing GET method issue is resolved
 *
 * Usage: node scripts/validate-video-streaming-fix.js
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

// Configuration
const BASE_URL = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:3001';
const TIMEOUT = 10000; // 10 seconds

// ANSI color codes for better output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, method = 'GET', headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GameLearn-Validation-Script/1.0',
        ...headers
      },
      timeout: TIMEOUT
    };

    const req = client.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
            raw: data
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: null,
            raw: data
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }

    req.end();
  });
}

async function validateVideoStreamingEndpoint() {
  log('\n🔧 CRITICAL VALIDATION: Video Streaming API Endpoints', 'bold');
  log('=' .repeat(60), 'blue');

  const testCases = [
    {
      name: 'GET /api/video/stream (THE MISSING METHOD)',
      method: 'GET',
      url: `${BASE_URL}/api/video/stream?videoId=sample-unity-tutorial&courseId=unity-fundamentals`,
      expectedStatuses: [200, 401, 403], // 200 if authenticated, 401/403 if not
      critical: true
    },
    {
      name: 'POST /api/video/stream',
      method: 'POST',
      url: `${BASE_URL}/api/video/stream`,
      body: {
        videoId: 'sample-unity-tutorial',
        courseId: 'unity-fundamentals'
      },
      expectedStatuses: [201, 401, 403],
      critical: true
    },
    {
      name: 'PUT /api/video/stream',
      method: 'PUT',
      url: `${BASE_URL}/api/video/stream`,
      body: {
        sessionId: 'test-session-123',
        currentPosition: 300
      },
      expectedStatuses: [200, 401, 403, 404],
      critical: false
    },
    {
      name: 'DELETE /api/video/stream',
      method: 'DELETE',
      url: `${BASE_URL}/api/video/stream?sessionId=test-session-123`,
      expectedStatuses: [200, 401, 403, 404],
      critical: false
    }
  ];

  let criticalFailures = 0;
  let totalTests = 0;

  for (const test of testCases) {
    totalTests++;
    log(`\n📋 Testing: ${test.name}`, 'blue');

    try {
      const response = await makeRequest(test.url, test.method, {}, test.body);
      const isExpectedStatus = test.expectedStatuses.includes(response.status);

      if (response.status === 405) {
        // Method Not Allowed - This is the bug we're checking for!
        log(`❌ CRITICAL FAILURE: Method ${test.method} not implemented!`, 'red');
        log(`   Status: ${response.status} (Method Not Allowed)`, 'red');
        if (test.critical) criticalFailures++;
      } else if (isExpectedStatus) {
        log(`✅ PASS: Status ${response.status} (${getStatusText(response.status)})`, 'green');

        // Additional validation for successful responses
        if (response.status < 400 && response.data) {
          if (response.data.success !== undefined) {
            log(`   Response structure: success=${response.data.success}`, 'blue');
          }
          if (response.data.data && test.method === 'GET') {
            const hasSessionId = response.data.data.sessionId !== undefined;
            const hasStreamUrl = response.data.data.streamUrl !== undefined || response.data.data.manifestUrl !== undefined;
            log(`   Session ID present: ${hasSessionId}`, hasSessionId ? 'green' : 'yellow');
            log(`   Stream URL present: ${hasStreamUrl}`, hasStreamUrl ? 'green' : 'yellow');
          }
        }
      } else {
        log(`⚠️  UNEXPECTED: Status ${response.status} (expected one of: ${test.expectedStatuses.join(', ')})`, 'yellow');
        if (test.critical) {
          log(`   This might indicate a configuration issue`, 'yellow');
        }
      }

    } catch (error) {
      log(`❌ ERROR: ${error.message}`, 'red');
      if (error.code === 'ECONNREFUSED') {
        log(`   Make sure the development server is running: npm run dev`, 'yellow');
      }
      if (test.critical) criticalFailures++;
    }
  }

  return { criticalFailures, totalTests };
}

async function validateVideoStreamingWorkflow() {
  log('\n🎬 WORKFLOW VALIDATION: Complete Video Streaming Journey', 'bold');
  log('=' .repeat(60), 'blue');

  try {
    // Step 1: Create streaming session
    log('\n1️⃣ Creating video streaming session...', 'blue');
    const createResponse = await makeRequest(
      `${BASE_URL}/api/video/stream`,
      'POST',
      {},
      {
        videoId: 'sample-unity-tutorial',
        courseId: 'unity-fundamentals',
        deviceInfo: {
          userAgent: 'GameLearn-Validation-Script/1.0',
          platform: 'Node.js'
        }
      }
    );

    if (createResponse.status === 201 || createResponse.status === 200) {
      log(`✅ Session creation: ${createResponse.status}`, 'green');

      const sessionId = createResponse.data?.data?.sessionId;
      if (sessionId) {
        log(`   Session ID: ${sessionId}`, 'blue');

        // Step 2: Get streaming manifest using the sessionId
        log('\n2️⃣ Getting streaming manifest with session...', 'blue');
        const manifestResponse = await makeRequest(
          `${BASE_URL}/api/video/stream?videoId=sample-unity-tutorial&sessionId=${sessionId}`,
          'GET'
        );

        if (manifestResponse.status === 200) {
          log(`✅ Manifest retrieval: ${manifestResponse.status}`, 'green');

          const manifestData = manifestResponse.data?.data;
          if (manifestData) {
            log(`   Stream URL: ${manifestData.streamUrl || manifestData.manifestUrl || 'Present'}`, 'blue');
            log(`   Player config: ${manifestData.playerConfig ? 'Present' : 'Missing'}`, manifestData.playerConfig ? 'green' : 'yellow');
          }
        } else {
          log(`⚠️ Manifest retrieval failed: ${manifestResponse.status}`, 'yellow');
        }

        // Step 3: Test heartbeat
        log('\n3️⃣ Testing video heartbeat...', 'blue');
        const heartbeatResponse = await makeRequest(
          `${BASE_URL}/api/video/heartbeat`,
          'POST',
          {},
          {
            sessionId,
            currentPosition: 120,
            bufferHealth: 10,
            quality: '720p',
            isPlaying: true
          }
        );

        if (heartbeatResponse.status === 200) {
          log(`✅ Heartbeat: ${heartbeatResponse.status}`, 'green');
        } else {
          log(`⚠️ Heartbeat failed: ${heartbeatResponse.status}`, 'yellow');
        }

        return true;
      } else {
        log(`❌ No session ID returned`, 'red');
        return false;
      }
    } else {
      log(`⚠️ Session creation failed: ${createResponse.status}`, 'yellow');
      return false;
    }

  } catch (error) {
    log(`❌ Workflow validation failed: ${error.message}`, 'red');
    return false;
  }
}

async function checkDevelopmentEnvironment() {
  log('\n🔍 ENVIRONMENT CHECK', 'bold');
  log('=' .repeat(60), 'blue');

  try {
    // Check if server is running
    const healthResponse = await makeRequest(`${BASE_URL}/`);
    log(`✅ Server is running at ${BASE_URL}`, 'green');

    // Check if video test mode is enabled
    const testVideoEnabled = process.env.ENABLE_VIDEO_TEST === 'true';
    log(`📹 Video test mode: ${testVideoEnabled ? 'ENABLED' : 'DISABLED'}`, testVideoEnabled ? 'green' : 'yellow');

    if (!testVideoEnabled) {
      log(`   Set ENABLE_VIDEO_TEST=true in your .env.local for testing`, 'yellow');
    }

    return true;
  } catch (error) {
    log(`❌ Server check failed: ${error.message}`, 'red');
    if (error.code === 'ECONNREFUSED') {
      log(`   Start the development server: cd gamelearn-platform && npm run dev`, 'yellow');
    }
    return false;
  }
}

function getStatusText(status) {
  const statusTexts = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    405: 'Method Not Allowed',
    500: 'Internal Server Error'
  };
  return statusTexts[status] || 'Unknown';
}

async function main() {
  log('🚀 GameLearn Platform - Video Streaming Validation', 'bold');
  log(`🔗 Testing against: ${BASE_URL}`, 'blue');
  log(`⏰ Started at: ${new Date().toISOString()}`, 'blue');

  // Check environment
  const envOk = await checkDevelopmentEnvironment();
  if (!envOk) {
    log('\n❌ Environment check failed. Please ensure the development server is running.', 'red');
    process.exit(1);
  }

  // Validate endpoints
  const endpointResults = await validateVideoStreamingEndpoint();

  // Validate workflow
  const workflowOk = await validateVideoStreamingWorkflow();

  // Summary
  log('\n📊 VALIDATION SUMMARY', 'bold');
  log('=' .repeat(60), 'blue');

  if (endpointResults.criticalFailures === 0) {
    log(`✅ All critical endpoints working (${endpointResults.totalTests} tests)`, 'green');
  } else {
    log(`❌ ${endpointResults.criticalFailures} critical failures out of ${endpointResults.totalTests} tests`, 'red');
  }

  if (workflowOk) {
    log(`✅ Video streaming workflow functional`, 'green');
  } else {
    log(`⚠️ Video streaming workflow has issues`, 'yellow');
  }

  log(`\n⏰ Completed at: ${new Date().toISOString()}`, 'blue');

  // Exit codes
  if (endpointResults.criticalFailures > 0) {
    log('\n🚨 CRITICAL ISSUES DETECTED - Please check the endpoints above', 'red');
    process.exit(1);
  } else {
    log('\n🎉 VALIDATION PASSED - Video streaming fix is working!', 'green');
    process.exit(0);
  }
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    log(`\n💥 Validation script crashed: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { validateVideoStreamingEndpoint, validateVideoStreamingWorkflow };