import { test, expect } from '@playwright/test'

/**
 * Performance Testing for Video Streaming
 * Tests video loading time, buffering, and playback performance
 * Run with: npm run test:e2e -- --grep @performance
 */

test.describe('Video Streaming Performance Tests @performance @critical', () => {
  test('should measure video initial load time', async ({ page }) => {
    const startTime = Date.now()

    // Navigate to a course
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()
      await page.waitForLoadState('networkidle')

      // Start watching video
      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        const videoLoadStart = Date.now()
        await startButton.click()

        // Wait for video element to appear
        const video = page.locator('video').first()
        await video.waitFor({ state: 'visible', timeout: 10000 })

        const videoLoadEnd = Date.now()
        const loadTime = videoLoadEnd - videoLoadStart

        console.log(`Video load time: ${loadTime}ms`)

        // Video should load within 5 seconds
        expect(loadTime).toBeLessThan(5000)
      }
    }
  })

  test('should measure video buffering time', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        const video = page.locator('video').first()

        if (await video.isVisible({ timeout: 10000 })) {
          // Monitor buffering through readyState
          const bufferingStart = Date.now()

          // Wait for video to be ready to play
          await page.waitForFunction(
            () => {
              const video = document.querySelector('video')
              return video && video.readyState >= 3 // HAVE_FUTURE_DATA or greater
            },
            { timeout: 10000 }
          )

          const bufferingEnd = Date.now()
          const bufferTime = bufferingEnd - bufferingStart

          console.log(`Video buffering time: ${bufferTime}ms`)

          // Buffering should complete within 3 seconds
          expect(bufferTime).toBeLessThan(3000)
        }
      }
    }
  })

  test('should track video playback performance metrics', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        const video = page.locator('video').first()

        if (await video.isVisible({ timeout: 10000 })) {
          // Get video performance metrics
          const metrics = await page.evaluate(() => {
            const video = document.querySelector('video')
            if (!video) return null

            return {
              readyState: video.readyState,
              networkState: video.networkState,
              buffered: video.buffered.length > 0 ? {
                start: video.buffered.start(0),
                end: video.buffered.end(0)
              } : null,
              duration: video.duration,
              currentTime: video.currentTime,
              paused: video.paused,
            }
          })

          console.log('Video metrics:', metrics)

          expect(metrics).toBeDefined()
          if (metrics) {
            // Video should be in a playable state
            expect(metrics.readyState).toBeGreaterThanOrEqual(2) // HAVE_CURRENT_DATA or better
          }
        }
      }
    }
  })

  test('should measure time to first frame', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        const clickTime = Date.now()
        await startButton.click()

        // Wait for video element
        const video = page.locator('video').first()
        await video.waitFor({ state: 'visible', timeout: 10000 })

        // Wait for first frame to be available
        await page.waitForFunction(
          () => {
            const video = document.querySelector('video')
            return video && video.readyState >= 2 // HAVE_CURRENT_DATA
          },
          { timeout: 10000 }
        )

        const firstFrameTime = Date.now()
        const timeToFirstFrame = firstFrameTime - clickTime

        console.log(`Time to first frame: ${timeToFirstFrame}ms`)

        // First frame should appear within 3 seconds
        expect(timeToFirstFrame).toBeLessThan(3000)
      }
    }
  })

  test('should measure quality switching performance', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        // Wait for video to load
        await page.waitForTimeout(2000)

        // Look for quality/settings button
        const settingsButton = page.getByRole('button', { name: /settings|quality|⚙/i }).first()

        if (await settingsButton.isVisible()) {
          const switchStart = Date.now()

          await settingsButton.click()
          await page.waitForTimeout(300)

          // Look for quality option
          const qualityOption = page.getByText(/\d+p|720p|1080p|auto/i).first()

          if (await qualityOption.isVisible()) {
            await qualityOption.click()

            // Wait for quality switch to complete
            await page.waitForTimeout(1000)

            const switchEnd = Date.now()
            const switchTime = switchEnd - switchStart

            console.log(`Quality switch time: ${switchTime}ms`)

            // Quality switch should complete within 2 seconds
            expect(switchTime).toBeLessThan(2000)
          }
        }
      }
    }
  })

  test('should monitor network bandwidth usage', async ({ page }) => {
    // Enable network monitoring
    const client = await page.context().newCDPSession(page)
    await client.send('Network.enable')

    const dataTransferred: number[] = []

    client.on('Network.dataReceived', (params) => {
      if (params.dataLength > 0) {
        dataTransferred.push(params.dataLength)
      }
    })

    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        // Let video play for a few seconds
        await page.waitForTimeout(5000)

        const totalData = dataTransferred.reduce((sum, val) => sum + val, 0)
        const totalMB = totalData / (1024 * 1024)

        console.log(`Data transferred: ${totalMB.toFixed(2)} MB`)

        // Monitor that data transfer is happening
        expect(totalData).toBeGreaterThan(0)
      }
    }
  })

  test('should measure seek performance', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        const video = page.locator('video').first()

        if (await video.isVisible({ timeout: 10000 })) {
          // Wait for video to be playable
          await page.waitForTimeout(2000)

          // Find progress bar/slider
          const progressBar = page.locator('[role="slider"], input[type="range"]').first()

          if (await progressBar.isVisible()) {
            const seekStart = Date.now()

            // Seek to middle of video
            await progressBar.click({ position: { x: 100, y: 5 } })

            // Wait for seek to complete
            await page.waitForFunction(
              () => {
                const video = document.querySelector('video')
                return video && !video.seeking
              },
              { timeout: 5000 }
            )

            const seekEnd = Date.now()
            const seekTime = seekEnd - seekStart

            console.log(`Seek time: ${seekTime}ms`)

            // Seeking should complete within 1 second
            expect(seekTime).toBeLessThan(1000)
          }
        }
      }
    }
  })

  test('should track dropped frames', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        const video = page.locator('video').first()

        if (await video.isVisible({ timeout: 10000 })) {
          // Play video
          await page.click('button[aria-label*="play" i], button[aria-label*="pause" i]')

          // Let video play for 5 seconds
          await page.waitForTimeout(5000)

          // Check for dropped frames
          const quality = await page.evaluate(() => {
            const video = document.querySelector('video')
            if (!video) return null

            // @ts-ignore - getVideoPlaybackQuality might not be in types
            const playbackQuality = video.getVideoPlaybackQuality ? video.getVideoPlaybackQuality() : null

            return playbackQuality ? {
              totalVideoFrames: playbackQuality.totalVideoFrames,
              droppedVideoFrames: playbackQuality.droppedVideoFrames,
              corruptedVideoFrames: playbackQuality.corruptedVideoFrames || 0,
            } : null
          })

          console.log('Video quality metrics:', quality)

          if (quality) {
            const dropRate = quality.droppedVideoFrames / quality.totalVideoFrames

            console.log(`Frame drop rate: ${(dropRate * 100).toFixed(2)}%`)

            // Less than 5% dropped frames is acceptable
            expect(dropRate).toBeLessThan(0.05)
          }
        }
      }
    }
  })

  test('should measure initial buffering before playback', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        const video = page.locator('video').first()

        if (await video.isVisible({ timeout: 10000 })) {
          // Measure time until video can play through without buffering
          const bufferStart = Date.now()

          await page.waitForFunction(
            () => {
              const video = document.querySelector('video')
              return video && video.readyState === 4 // HAVE_ENOUGH_DATA
            },
            { timeout: 10000 }
          )

          const bufferEnd = Date.now()
          const initialBufferTime = bufferEnd - bufferStart

          console.log(`Initial buffer time: ${initialBufferTime}ms`)

          // Initial buffering should complete within 5 seconds
          expect(initialBufferTime).toBeLessThan(5000)
        }
      }
    }
  })

  test('should verify video heartbeat API performance', async ({ page }) => {
    await page.goto('/courses')
    await page.waitForLoadState('networkidle')

    const firstCourse = page.locator('[role="article"]').first()

    if (await firstCourse.isVisible({ timeout: 5000 })) {
      await firstCourse.click()

      const startButton = page.getByRole('button', { name: /start|begin|watch|play/i }).first()

      if (await startButton.isVisible()) {
        await startButton.click()

        // Monitor network requests for heartbeat
        const heartbeatRequests: any[] = []

        page.on('request', (request) => {
          if (request.url().includes('/api/video/heartbeat')) {
            heartbeatRequests.push({
              url: request.url(),
              method: request.method(),
              timestamp: Date.now(),
            })
          }
        })

        // Wait for video to play
        await page.waitForTimeout(10000)

        console.log(`Heartbeat requests sent: ${heartbeatRequests.length}`)

        // Heartbeat should be sent periodically
        expect(heartbeatRequests.length).toBeGreaterThan(0)
      }
    }
  })
})
