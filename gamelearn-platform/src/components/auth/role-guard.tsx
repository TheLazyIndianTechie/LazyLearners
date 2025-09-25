"use client"

import { useUserRole, type UserRole } from '@/hooks/use-user-role'
import { ReactNode } from 'react'
import { SiteLayout } from '@/components/layout/site-layout'

interface RoleGuardProps {
  children: ReactNode
  requiredRole: UserRole
  fallback?: ReactNode
  redirect?: string
}

export function RoleGuard({
  children,
  requiredRole,
  fallback,
  redirect
}: RoleGuardProps) {
  const { hasRole, loading, isSignedIn } = useUserRole()

  if (loading) {
    return (
      <SiteLayout>
        <div className="container py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (!isSignedIn) {
    if (redirect) {
      window.location.href = `/sign-in?redirect_url=${encodeURIComponent(redirect)}`
      return null
    }

    return fallback || (
      <SiteLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Authentication Required</h1>
            <p className="text-muted-foreground mb-4">
              You need to sign in to access this page.
            </p>
            <a
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Sign In
            </a>
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (!hasRole(requiredRole)) {
    return fallback || (
      <SiteLayout>
        <div className="container py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page. Required role: {requiredRole}
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return <>{children}</>
}