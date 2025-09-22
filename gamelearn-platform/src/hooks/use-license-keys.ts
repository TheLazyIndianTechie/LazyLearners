import { useState, useCallback, useEffect } from 'react'
import { toast } from 'sonner'

export interface LicenseKey {
  id: string
  key: string
  status: 'ACTIVE' | 'EXPIRED' | 'DISABLED' | 'REVOKED'
  activationsCount: number
  activationsLimit?: number
  expiresAt?: string
  createdAt: string
  course: {
    id: string
    title: string
    thumbnail?: string
    category: string
    difficulty: string
    duration: number
  }
  payment?: {
    id: string
    status: string
    amount: number
    currency: string
    createdAt: string
  }
}

export interface LicenseValidation {
  valid: boolean
  reason?: string
  licenseKey?: Partial<LicenseKey>
}

export function useLicenseKeys(userId?: string) {
  const [licenseKeys, setLicenseKeys] = useState<LicenseKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateLicenseKey = useCallback(async (
    key: string,
    userId: string,
    courseId: string
  ): Promise<LicenseValidation | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/license/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, userId, courseId }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to validate license key')
      }

      return result.data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`License Validation Error: ${errorMessage}`)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const activateLicenseKey = useCallback(async (
    key: string,
    userId: string,
    instanceName?: string
  ): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/license/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, userId, instanceName }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to activate license key')
      }

      toast.success(result.data.message || 'License key activated successfully!')

      // Refresh license keys if we have a userId
      if (userId) {
        await fetchUserLicenseKeys(userId)
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`License Activation Error: ${errorMessage}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUserLicenseKeys = useCallback(async (userId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/license/user/${userId}`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to fetch license keys')
      }

      setLicenseKeys(result.data.licenseKeys)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      toast.error(`Error loading license keys: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const hasActiveLicense = useCallback((courseId: string): boolean => {
    return licenseKeys.some(
      (license) =>
        license.course.id === courseId &&
        license.status === 'ACTIVE' &&
        (!license.expiresAt || new Date(license.expiresAt) > new Date())
    )
  }, [licenseKeys])

  const getLicenseForCourse = useCallback((courseId: string): LicenseKey | null => {
    return (
      licenseKeys.find(
        (license) =>
          license.course.id === courseId &&
          license.status === 'ACTIVE' &&
          (!license.expiresAt || new Date(license.expiresAt) > new Date())
      ) || null
    )
  }, [licenseKeys])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-fetch license keys when userId is provided
  useEffect(() => {
    if (userId) {
      fetchUserLicenseKeys(userId)
    }
  }, [userId, fetchUserLicenseKeys])

  return {
    licenseKeys,
    isLoading,
    error,
    validateLicenseKey,
    activateLicenseKey,
    fetchUserLicenseKeys,
    hasActiveLicense,
    getLicenseForCourse,
    clearError,
  }
}