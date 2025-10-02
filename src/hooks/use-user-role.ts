import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'

export type UserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

export function useUserRole() {
  const { user, isSignedIn } = useUser()
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isSignedIn && user) {
      const userRole = (user.publicMetadata?.role as UserRole) || 'STUDENT'
      setRole(userRole)
      setLoading(false)
    } else if (!isSignedIn) {
      setLoading(false)
    }
  }, [isSignedIn, user])

  const hasRole = (requiredRole: UserRole): boolean => {
    if (!isSignedIn) return false

    const roleHierarchy = {
      'ADMIN': 3,
      'INSTRUCTOR': 2,
      'STUDENT': 1,
    }

    return roleHierarchy[role] >= roleHierarchy[requiredRole]
  }

  const isStudent = () => hasRole('STUDENT')
  const isInstructor = () => hasRole('INSTRUCTOR')
  const isAdmin = () => hasRole('ADMIN')

  const updateRole = async (userId: string, newRole: UserRole): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        // If updating current user, refresh the role
        if (userId === user?.id) {
          setRole(newRole)
        }
        return true
      }
      return false
    } catch (error) {
      console.error('Error updating user role:', error)
      return false
    }
  }

  const getUserRole = async (userId: string): Promise<UserRole | null> => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`)
      if (response.ok) {
        const data = await response.json()
        return data.role
      }
      return null
    } catch (error) {
      console.error('Error getting user role:', error)
      return null
    }
  }

  return {
    role,
    loading,
    isSignedIn,
    hasRole,
    isStudent,
    isInstructor,
    isAdmin,
    updateRole,
    getUserRole,
  }
}