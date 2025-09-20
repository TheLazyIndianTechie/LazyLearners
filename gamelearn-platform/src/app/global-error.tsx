'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the critical error
    logger.fatal('Global error boundary triggered', error, {
      digest: error.digest,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : undefined,
      timestamp: new Date().toISOString(),
      isGlobalError: true
    })
  }, [error])

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-red-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              {/* Critical Error Icon */}
              <div className="mx-auto h-20 w-20 text-red-600">
                <svg
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-full h-full"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>

              {/* Critical Error Title */}
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-red-900">
                Critical Error
              </h1>

              {/* Error Message */}
              <p className="mt-4 text-lg text-red-700">
                A critical error has occurred that prevented the application from functioning properly.
              </p>

              <p className="mt-2 text-sm text-red-600">
                Our engineering team has been automatically notified and is investigating the issue.
              </p>

              {/* Error ID */}
              {error.digest && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                  <p className="text-xs text-red-800">
                    <strong>Error ID:</strong> {error.digest}
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Please include this ID when contacting support.
                  </p>
                </div>
              )}

              {/* Development Error Details */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-left">
                  <h3 className="text-sm font-medium text-red-800 mb-2">
                    Development Error Details:
                  </h3>
                  <p className="text-sm text-red-700 font-mono break-all">
                    {error.message}
                  </p>
                  {error.stack && (
                    <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap overflow-auto max-h-40">
                      {error.stack}
                    </pre>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={reset}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Try to Recover
              </button>

              <button
                onClick={() => {
                  // Clear any stored state that might be causing issues
                  if (typeof window !== 'undefined') {
                    localStorage.clear()
                    sessionStorage.clear()
                    window.location.reload()
                  }
                }}
                className="group relative w-full flex justify-center py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Clear Cache & Reload
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/'
                  }
                }}
                className="group relative w-full flex justify-center py-2 px-4 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Go to Homepage
              </button>
            </div>

            {/* Emergency Contact */}
            <div className="text-center border-t border-red-200 pt-4">
              <p className="text-sm text-red-700 mb-2">
                <strong>Need immediate assistance?</strong>
              </p>
              <div className="space-y-1">
                <a
                  href="mailto:emergency@gamelearn.com"
                  className="block text-sm font-medium text-red-600 hover:text-red-500"
                >
                  emergency@gamelearn.com
                </a>
                <a
                  href="tel:+1-555-GAMELEARN"
                  className="block text-sm font-medium text-red-600 hover:text-red-500"
                >
                  +1 (555) GAME-LEARN
                </a>
              </div>
            </div>

            {/* Status Page Link */}
            <div className="text-center">
              <p className="text-xs text-red-500">
                Check our{' '}
                <a
                  href="https://status.gamelearn.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-red-600 hover:text-red-500 underline"
                >
                  status page
                </a>{' '}
                for any ongoing incidents.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}