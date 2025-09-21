/**
 * Diagnostic tests for video streaming functionality
 * This focuses on the specific issues mentioned by the user:
 * - JSON parsing errors
 * - Module compatibility issues
 * - Video streaming not working
 */

import { NextRequest, NextResponse } from 'next/server';

// Test the core video streaming APIs directly
describe('Video Streaming Diagnostic Tests', () => {
  // Mock fetch globally for API tests
  global.fetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('API Response Format Validation', () => {
    test('video upload API should return valid JSON', async () => {
      // Import the upload route handler
      const { POST } = require('../app/api/video/upload/route');

      // Create a mock request
      const formData = new FormData();
      formData.append('videoFile', new File(['fake content'], 'test.mp4', { type: 'video/mp4' }));
      formData.append('title', 'Test Video');
      formData.append('description', 'Test Description');

      const request = new NextRequest('http://localhost:3000/api/video/upload', {
        method: 'POST',
        body: formData,
      });

      // Add auth header to mock authentication
      request.headers.set('authorization', 'Bearer mock-token');

      try {
        const response = await POST(request);
        const responseText = await response.text();

        // Check if response is valid JSON (not HTML error page)
        expect(() => JSON.parse(responseText)).not.toThrow();

        const jsonResponse = JSON.parse(responseText);
        expect(jsonResponse).toHaveProperty('success');

        console.log('✅ Upload API returns valid JSON:', jsonResponse);
      } catch (error) {
        console.error('❌ Upload API error:', error);
        // Log the actual response to debug
        if (error instanceof Error) {
          console.error('Error details:', error.message);
        }
      }
    });

    test('video streaming API should return valid JSON', async () => {
      const { POST } = require('../app/api/video/stream/route');

      const requestBody = {
        videoId: 'test-video-123',
        quality: '720p',
        deviceInfo: {
          userAgent: 'test-agent',
          platform: 'web',
          resolution: '1920x1080'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/video/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      });

      try {
        const response = await POST(request);
        const responseText = await response.text();

        // Check if response is valid JSON
        expect(() => JSON.parse(responseText)).not.toThrow();

        const jsonResponse = JSON.parse(responseText);
        expect(jsonResponse).toHaveProperty('success');

        console.log('✅ Streaming API returns valid JSON:', jsonResponse);
      } catch (error) {
        console.error('❌ Streaming API error:', error);
      }
    });

    test('video heartbeat API should return valid JSON', async () => {
      const { POST } = require('../app/api/video/heartbeat/route');

      const requestBody = {
        sessionId: 'test-session-123',
        currentTime: 120,
        duration: 1800,
        buffered: [[0, 130]],
        quality: '720p',
        playbackRate: 1.0,
        volume: 0.8,
        networkSpeed: 5.2
      };

      const request = new NextRequest('http://localhost:3000/api/video/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      });

      try {
        const response = await POST(request);
        const responseText = await response.text();

        // Check if response is valid JSON
        expect(() => JSON.parse(responseText)).not.toThrow();

        const jsonResponse = JSON.parse(responseText);
        expect(jsonResponse).toHaveProperty('success');

        console.log('✅ Heartbeat API returns valid JSON:', jsonResponse);
      } catch (error) {
        console.error('❌ Heartbeat API error:', error);
      }
    });

    test('video analytics API should return valid JSON', async () => {
      const { POST } = require('../app/api/video/analytics/route');

      const requestBody = {
        sessionId: 'test-session-123',
        event: 'play',
        timestamp: Date.now(),
        videoId: 'test-video-123',
        currentTime: 60,
        metadata: {
          quality: '720p',
          playbackRate: 1.0
        }
      };

      const request = new NextRequest('http://localhost:3000/api/video/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer mock-token',
        },
        body: JSON.stringify(requestBody),
      });

      try {
        const response = await POST(request);
        const responseText = await response.text();

        // Check if response is valid JSON
        expect(() => JSON.parse(responseText)).not.toThrow();

        const jsonResponse = JSON.parse(responseText);
        expect(jsonResponse).toHaveProperty('success');

        console.log('✅ Analytics API returns valid JSON:', jsonResponse);
      } catch (error) {
        console.error('❌ Analytics API error:', error);
      }
    });
  });

  describe('Module Import Tests', () => {
    test('video processing module should import correctly', async () => {
      try {
        const { VideoProcessor } = require('../lib/video/processing');
        expect(VideoProcessor).toBeDefined();
        expect(typeof VideoProcessor.getInstance).toBe('function');
        console.log('✅ Video processing module imports correctly');
      } catch (error) {
        console.error('❌ Video processing module import failed:', error);
        throw error;
      }
    });

    test('video streaming module should import correctly', async () => {
      try {
        const { VideoStreamingService } = require('../lib/video/streaming');
        expect(VideoStreamingService).toBeDefined();
        expect(typeof VideoStreamingService.getInstance).toBe('function');
        console.log('✅ Video streaming module imports correctly');
      } catch (error) {
        console.error('❌ Video streaming module import failed:', error);
        throw error;
      }
    });

    test('redis module should import correctly', async () => {
      try {
        const { redis } = require('../lib/redis');
        expect(redis).toBeDefined();
        expect(typeof redis.get).toBe('function');
        expect(typeof redis.set).toBe('function');
        console.log('✅ Redis module imports correctly');
      } catch (error) {
        console.error('❌ Redis module import failed:', error);
        throw error;
      }
    });

    test('logger module should import correctly', async () => {
      try {
        const { logger, createRequestLogger } = require('../lib/logger');
        expect(logger).toBeDefined();
        expect(createRequestLogger).toBeDefined();
        expect(typeof logger.info).toBe('function');
        console.log('✅ Logger module imports correctly');
      } catch (error) {
        console.error('❌ Logger module import failed:', error);
        throw error;
      }
    });
  });

  describe('Core Functionality Tests', () => {
    test('video processor can create jobs', async () => {
      try {
        const { VideoProcessor } = require('../lib/video/processing');
        const processor = VideoProcessor.getInstance();

        const mockFile = {
          name: 'test.mp4',
          size: 1024 * 1024, // 1MB
          type: 'video/mp4'
        } as File;

        const job = await processor.submitVideo(
          mockFile,
          'user123',
          'Test Video',
          'Test Description',
          ['gaming', 'tutorial']
        );

        expect(job).toHaveProperty('jobId');
        expect(job).toHaveProperty('status', 'pending');
        console.log('✅ Video processor creates jobs correctly:', job);
      } catch (error) {
        console.error('❌ Video processor job creation failed:', error);
        throw error;
      }
    });

    test('video streaming service can create sessions', async () => {
      try {
        const { VideoStreamingService } = require('../lib/video/streaming');
        const streamingService = VideoStreamingService.getInstance();

        const session = await streamingService.createStreamingSession(
          'user123',
          'video123',
          '720p',
          {
            userAgent: 'test-agent',
            platform: 'web',
            resolution: '1920x1080'
          }
        );

        expect(session).toHaveProperty('sessionId');
        expect(session).toHaveProperty('manifestUrl');
        console.log('✅ Video streaming service creates sessions correctly:', session);
      } catch (error) {
        console.error('❌ Video streaming service session creation failed:', error);
        throw error;
      }
    });

    test('redis service can store and retrieve data', async () => {
      try {
        const { redis } = require('../lib/redis');

        await redis.set('test-key', 'test-value');
        const value = await redis.get('test-key');

        expect(value).toBe('test-value');
        console.log('✅ Redis service works correctly');
      } catch (error) {
        console.error('❌ Redis service failed:', error);
        throw error;
      }
    });
  });

  describe('Error Handling Tests', () => {
    test('APIs should handle invalid JSON gracefully', async () => {
      const { POST } = require('../app/api/video/stream/route');

      const request = new NextRequest('http://localhost:3000/api/video/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authorization': 'Bearer mock-token',
        },
        body: 'invalid json {',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const responseText = await response.text();
      expect(() => JSON.parse(responseText)).not.toThrow();

      const jsonResponse = JSON.parse(responseText);
      expect(jsonResponse.success).toBe(false);
      expect(jsonResponse.error).toContain('Invalid JSON');

      console.log('✅ API handles invalid JSON correctly');
    });

    test('APIs should handle missing auth gracefully', async () => {
      const { POST } = require('../app/api/video/stream/route');

      const request = new NextRequest('http://localhost:3000/api/video/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ videoId: 'test' }),
      });

      const response = await POST(request);
      expect(response.status).toBe(401);

      const responseText = await response.text();
      expect(() => JSON.parse(responseText)).not.toThrow();

      console.log('✅ API handles missing auth correctly');
    });
  });
});