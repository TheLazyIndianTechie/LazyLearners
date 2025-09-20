'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { logger } from '@/lib/logger'
import { env, isProduction } from '@/lib/config/env'

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level?: 'page' | 'component' | 'critical'
  context?: Record<string, any>
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

// Error types for better categorization
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory = 'network' | 'validation' | 'auth' | 'permission' | 'server' | 'client' | 'unknown'

interface ErrorDetails {
  message: string
  stack?: string
  componentStack?: string
  severity: ErrorSeverity
  category: ErrorCategory
  recoverable: boolean
  userFriendlyMessage: string
}

// Main Error Boundary Component
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryCount = 0
  private maxRetries = 3

  constructor(props: ErrorBoundaryProps) {
    super(props)

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state to show error UI
    return {
      hasError: true,
      error,
      errorId: crypto.randomUUID()
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorDetails = this.categorizeError(error, errorInfo)
    const errorId = this.state.errorId || crypto.randomUUID()

    // Log the error
    logger.error('Error boundary caught error', error, {
      errorId,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
      context: this.props.context,
      severity: errorDetails.severity,
      category: errorDetails.category,
      recoverable: errorDetails.recoverable,
      retryCount: this.retryCount
    })

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Update state with error info
    this.setState({
      errorInfo,
      errorId
    })

    // Report to external services in production
    if (isProduction) {
      this.reportError(error, errorInfo, errorDetails, errorId)
    }
  }

  private categorizeError(error: Error, errorInfo: ErrorInfo): ErrorDetails {
    const message = error.message.toLowerCase()
    const stack = error.stack || ''

    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: 'medium',
        category: 'network',
        recoverable: true,
        userFriendlyMessage: 'Network connection issue. Please check your internet connection and try again.'
      }
    }

    // Authentication errors
    if (message.includes('unauthorized') || message.includes('auth') || message.includes('login')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: 'medium',
        category: 'auth',
        recoverable: true,
        userFriendlyMessage: 'Authentication issue. Please log in again.'
      }
    }

    // Permission errors
    if (message.includes('forbidden') || message.includes('permission') || message.includes('access denied')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: 'medium',
        category: 'permission',
        recoverable: false,
        userFriendlyMessage: 'You don\'t have permission to access this feature. Please contact support if you believe this is an error.'
      }
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid') || message.includes('required')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: 'low',
        category: 'validation',
        recoverable: true,
        userFriendlyMessage: 'Please check your input and try again.'
      }
    }

    // Server errors
    if (message.includes('500') || message.includes('server') || message.includes('internal')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: 'high',
        category: 'server',
        recoverable: true,
        userFriendlyMessage: 'A server error occurred. Our team has been notified and is working on a fix.'
      }
    }

    // React/Client errors
    if (stack.includes('react') || message.includes('render') || message.includes('component')) {
      return {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        severity: this.props.level === 'critical' ? 'critical' : 'medium',
        category: 'client',
        recoverable: true,
        userFriendlyMessage: 'Something went wrong while loading this content. Please try refreshing the page.'
      }
    }

    // Unknown errors
    return {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      severity: 'medium',
      category: 'unknown',
      recoverable: true,
      userFriendlyMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.'
    }
  }

  private async reportError(
    error: Error,
    errorInfo: ErrorInfo,
    errorDetails: ErrorDetails,
    errorId: string
  ) {
    try {
      // Report to Sentry if configured
      if (env.SENTRY_DSN && typeof window !== 'undefined') {
        // In a real implementation, you'd have Sentry SDK configured
        console.log('Would report to Sentry:', {
          error,
          errorInfo,
          errorDetails,
          errorId
        })
      }

      // Report to custom error endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          severity: errorDetails.severity,
          category: errorDetails.category,
          url: window.location.href,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          context: this.props.context
        })
      })
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError)
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      })

      logger.info('Error boundary retry attempted', {
        retryCount: this.retryCount,
        errorId: this.state.errorId
      })
    }
  }

  private handleReload = () => {
    window.location.reload()
  }

  private handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const errorDetails = this.categorizeError(this.state.error, this.state.errorInfo!)
      const canRetry = this.retryCount < this.maxRetries && errorDetails.recoverable

      return (
        <ErrorFallback
          error={this.state.error}
          errorDetails={errorDetails}
          errorId={this.state.errorId!}
          level={this.props.level || 'component'}
          canRetry={canRetry}
          retryCount={this.retryCount}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          onGoHome={this.handleGoHome}
        />
      )
    }

    return this.props.children
  }
}

// Error Fallback Component
interface ErrorFallbackProps {
  error: Error
  errorDetails: ErrorDetails
  errorId: string
  level: 'page' | 'component' | 'critical'
  canRetry: boolean
  retryCount: number
  onRetry: () => void
  onReload: () => void
  onGoHome: () => void
}

function ErrorFallback({
  error,
  errorDetails,
  errorId,
  level,
  canRetry,
  retryCount,
  onRetry,
  onReload,
  onGoHome
}: ErrorFallbackProps) {
  const isFullPage = level === 'page' || level === 'critical'

  const containerClasses = isFullPage
    ? "min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    : "flex items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200"

  const iconColor = errorDetails.severity === 'critical' ? 'text-red-500' :
                   errorDetails.severity === 'high' ? 'text-orange-500' :
                   errorDetails.severity === 'medium' ? 'text-yellow-500' : 'text-blue-500'

  return (
    <div className={containerClasses}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {/* Error Icon */}
          <div className={`mx-auto h-12 w-12 ${iconColor}`}>
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
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          {/* Error Title */}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            {level === 'critical' ? 'Critical Error' :
             level === 'page' ? 'Page Error' : 'Something went wrong'}
          </h2>

          {/* User-friendly Message */}
          <p className="mt-2 text-sm text-gray-600">
            {errorDetails.userFriendlyMessage}
          </p>

          {/* Error ID for support */}
          <p className="mt-4 text-xs text-gray-400">
            Error ID: {errorId}
          </p>

          {/* Technical Details (only in development) */}
          {!isProduction && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 whitespace-pre-wrap">
                <div><strong>Message:</strong> {error.message}</div>
                {error.stack && (
                  <div className="mt-2">
                    <strong>Stack:</strong>
                    <pre className="mt-1 whitespace-pre-wrap">{error.stack}</pre>
                  </div>
                )}
                <div className="mt-2">
                  <strong>Category:</strong> {errorDetails.category} |
                  <strong> Severity:</strong> {errorDetails.severity} |
                  <strong> Recoverable:</strong> {errorDetails.recoverable ? 'Yes' : 'No'}
                </div>
                {retryCount > 0 && (
                  <div className="mt-1">
                    <strong>Retry Attempts:</strong> {retryCount}
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {canRetry && (
            <button
              onClick={onRetry}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          )}

          {isFullPage && (
            <>
              <button
                onClick={onReload}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Reload Page
              </button>

              <button
                onClick={onGoHome}
                className="group relative w-full flex justify-center py-2 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Homepage
              </button>
            </>
          )}
        </div>

        {/* Support Contact */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            If this problem persists, please{' '}
            <a
              href="mailto:support@gamelearn.com"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              contact support
            </a>{' '}
            with the error ID above.
          </p>
        </div>
      </div>
    </div>
  )
}

// Convenience wrapper components
export function PageErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="page" {...props}>
      {children}
    </ErrorBoundary>
  )
}

export function ComponentErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="component" {...props}>
      {children}
    </ErrorBoundary>
  )
}

export function CriticalErrorBoundary({ children, ...props }: Omit<ErrorBoundaryProps, 'level'>) {
  return (
    <ErrorBoundary level="critical" {...props}>
      {children}
    </ErrorBoundary>
  )
}