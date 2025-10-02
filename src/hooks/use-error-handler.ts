'use client'

import { useCallback, useState } from 'react'
import { errorHandler, categorizeError, type ErrorHandlerOptions } from '@/lib/error-handling'
import { logger } from '@/lib/logger'

interface UseErrorHandlerReturn {
  error: Error | null
  isError: boolean
  errorId: string | null
  clearError: () => void
  handleError: (error: Error, options?: ErrorHandlerOptions) => void
  handleAsyncError: <T>(
    asyncFn: () => Promise<T>,
    options?: ErrorHandlerOptions
  ) => Promise<T | null>
  retry: (() => void) | null
  isRetrying: boolean
}

interface UseErrorHandlerOptions extends ErrorHandlerOptions {
  onError?: (error: Error) => void
  enableRetry?: boolean
  maxRetries?: number
  retryDelay?: number
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}): UseErrorHandlerReturn {
  const [error, setError] = useState<Error | null>(null)
  const [errorId, setErrorId] = useState<string | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFailedFunction, setLastFailedFunction] = useState<(() => Promise<any>) | null>(null)

  const {
    onError,
    enableRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
    ...errorOptions
  } = options

  const clearError = useCallback(() => {
    setError(null)
    setErrorId(null)
    setRetryCount(0)
    setLastFailedFunction(null)
    setIsRetrying(false)
  }, [])

  const handleError = useCallback((error: Error, options: ErrorHandlerOptions = {}) => {
    const id = crypto.randomUUID()
    const { category, severity, retryable } = categorizeError(error)

    // Set local error state
    setError(error)
    setErrorId(id)

    // Log the error through our error handler
    errorHandler.handleError(error, {
      ...errorOptions,
      ...options,
      context: {
        ...errorOptions.context,
        ...options.context,
        errorId: id,
        component: 'react-hook',
        category,
        severity,
        retryable
      }
    })

    // Call custom error handler if provided
    if (onError) {
      try {
        onError(error)
      } catch (handlerError) {
        logger.error('Custom error handler failed', handlerError as Error, {
          originalError: error.message,
          errorId: id
        })
      }
    }

    // Set up retry if error is retryable and retry is enabled
    if (enableRetry && retryable && retryCount < maxRetries) {
      // Store the function for retry (this would need to be set by handleAsyncError)
      // The retry logic is handled in the retry function below
    }
  }, [errorOptions, onError, enableRetry, maxRetries, retryCount])

  const handleAsyncError = useCallback(async <T>(
    asyncFn: () => Promise<T>,
    options: ErrorHandlerOptions = {}
  ): Promise<T | null> => {
    try {
      setIsRetrying(false)
      const result = await asyncFn()

      // Clear error state on success
      if (error) {
        clearError()
      }

      return result
    } catch (err) {
      const error = err as Error

      // Store the function for potential retry
      if (enableRetry) {
        setLastFailedFunction(() => asyncFn)
      }

      handleError(error, options)
      return null
    }
  }, [error, clearError, enableRetry, handleError])

  const retry = useCallback(async () => {
    if (!lastFailedFunction || !enableRetry || retryCount >= maxRetries) {
      return
    }

    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      // Wait before retrying (exponential backoff)
      const delay = retryDelay * Math.pow(2, retryCount)
      await new Promise(resolve => setTimeout(resolve, delay))

      logger.info('Retrying failed operation', {
        errorId,
        retryAttempt: retryCount + 1,
        maxRetries,
        delay
      })

      const result = await lastFailedFunction()

      // Success - clear error state
      clearError()

      return result
    } catch (err) {
      const error = err as Error

      if (retryCount + 1 >= maxRetries) {
        // Max retries reached
        handleError(error, {
          context: {
            finalRetryAttempt: true,
            totalRetries: retryCount + 1
          }
        })
        setLastFailedFunction(null)
      } else {
        // Update error but keep retry function available
        handleError(error, {
          context: {
            retryAttempt: retryCount + 1,
            maxRetries
          }
        })
      }
    } finally {
      setIsRetrying(false)
    }
  }, [
    lastFailedFunction,
    enableRetry,
    retryCount,
    maxRetries,
    retryDelay,
    errorId,
    clearError,
    handleError
  ])

  return {
    error,
    isError: error !== null,
    errorId,
    clearError,
    handleError,
    handleAsyncError,
    retry: enableRetry && lastFailedFunction && retryCount < maxRetries ? retry : null,
    isRetrying
  }
}

// Specialized hooks for common scenarios

export function useAsyncOperation<T>(
  operation: () => Promise<T>,
  dependencies: any[] = [],
  options: UseErrorHandlerOptions = {}
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)

  const errorHandler = useErrorHandler({
    ...options,
    enableRetry: true
  })

  const execute = useCallback(async () => {
    setLoading(true)
    setData(null)

    const result = await errorHandler.handleAsyncError(operation, {
      context: { operation: 'async-operation' }
    })

    if (result !== null) {
      setData(result)
    }

    setLoading(false)
    return result
  }, [operation, errorHandler])

  const retry = useCallback(async () => {
    if (errorHandler.retry) {
      setLoading(true)
      const result = await errorHandler.retry()
      if (result !== null) {
        setData(result)
      }
      setLoading(false)
      return result
    }
  }, [errorHandler.retry])

  return {
    data,
    loading,
    execute,
    retry: errorHandler.retry ? retry : null,
    isRetrying: errorHandler.isRetrying,
    error: errorHandler.error,
    isError: errorHandler.isError,
    clearError: errorHandler.clearError
  }
}

export function useFormErrorHandler(options: UseErrorHandlerOptions = {}) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const errorHandler = useErrorHandler({
    ...options,
    onError: (error) => {
      // Handle validation errors specially for forms
      if (error.name === 'ValidationError' && 'field' in error) {
        setFieldErrors(prev => ({
          ...prev,
          [error.field as string]: error.message
        }))
      }

      options.onError?.(error)
    }
  })

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllFieldErrors = useCallback(() => {
    setFieldErrors({})
  }, [])

  return {
    ...errorHandler,
    fieldErrors,
    clearFieldError,
    clearAllFieldErrors,
    hasFieldErrors: Object.keys(fieldErrors).length > 0
  }
}

// Error boundary hook for manual error boundaries
export function useErrorBoundary() {
  const [error, setError] = useState<Error | null>(null)

  const resetError = useCallback(() => {
    setError(null)
  }, [])

  const captureError = useCallback((error: Error) => {
    setError(error)
  }, [])

  if (error) {
    throw error
  }

  return {
    captureError,
    resetError
  }
}