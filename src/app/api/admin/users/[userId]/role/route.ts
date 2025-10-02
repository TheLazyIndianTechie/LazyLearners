import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { updateUserRole, hasRole, type ClerkUserRole } from '@/lib/clerk-utils'

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth()

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Only admins can change user roles
    const isAdmin = await hasRole('ADMIN')
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body

    if (!role || !['STUDENT', 'INSTRUCTOR', 'ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Valid role is required (STUDENT, INSTRUCTOR, ADMIN)' },
        { status: 400 }
      )
    }

    const success = await updateUserRole(params.userId, role as ClerkUserRole)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId: currentUserId } = auth()

    if (!currentUserId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Users can check their own role, admins can check any role
    const isAdmin = await hasRole('ADMIN')
    if (!isAdmin && currentUserId !== params.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const { clerkClient } = await import('@clerk/nextjs/server')
    const user = await clerkClient.users.getUser(params.userId)
    const role = (user.publicMetadata?.role as ClerkUserRole) || 'STUDENT'

    return NextResponse.json({
      userId: params.userId,
      role,
    })
  } catch (error) {
    console.error('Error getting user role:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}