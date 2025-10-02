import { auth, clerkClient } from '@clerk/nextjs/server'
import { UserRole } from '@prisma/client'

export type ClerkUserRole = 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'

export async function getCurrentUser() {
  const { userId } = auth()

  if (!userId) {
    return null
  }

  const user = await clerkClient.users.getUser(userId)
  return user
}

export async function getCurrentUserRole(): Promise<ClerkUserRole> {
  const user = await getCurrentUser()

  if (!user) {
    return 'STUDENT'
  }

  return (user.publicMetadata?.role as ClerkUserRole) || 'STUDENT'
}

export async function updateUserRole(userId: string, role: ClerkUserRole) {
  try {
    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...await clerkClient.users.getUser(userId).then(u => u.publicMetadata),
        role,
      },
    })
    return true
  } catch (error) {
    console.error('Error updating user role:', error)
    return false
  }
}

export async function hasRole(requiredRole: ClerkUserRole): Promise<boolean> {
  const currentRole = await getCurrentUserRole()

  // Role hierarchy: ADMIN > INSTRUCTOR > STUDENT
  const roleHierarchy = {
    'ADMIN': 3,
    'INSTRUCTOR': 2,
    'STUDENT': 1,
  }

  return roleHierarchy[currentRole] >= roleHierarchy[requiredRole]
}

export async function isInstructor(): Promise<boolean> {
  return await hasRole('INSTRUCTOR')
}

export async function isAdmin(): Promise<boolean> {
  return await hasRole('ADMIN')
}

export function getClerkUserData(user: any) {
  return {
    id: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || '',
    name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || null,
    firstName: user.firstName,
    lastName: user.lastName,
    image: user.imageUrl,
    role: (user.publicMetadata?.role as ClerkUserRole) || 'STUDENT',
  }
}