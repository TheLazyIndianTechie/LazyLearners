import { NextRequest, NextResponse } from 'next/server'
import { auth } from "@clerk/nextjs/server"

import { licenseKeyService } from '@/lib/license/license-service'


interface RouteParams {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check - users can only access their own license keys or admins can access any
    const { userId: authUserId, sessionClaims } = await auth()

    if (!authUserId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const targetUserId = params.userId

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Authorization check - users can only access their own license keys unless they're admin
    const role = (sessionClaims as any)?.metadata?.role || (sessionClaims as any)?.publicMetadata?.role || 'STUDENT'

    if (targetUserId !== authUserId && role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access your own license keys.' },
        { status: 403 }
      )
    }

    const licenseKeys = await licenseKeyService.getUserLicenseKeys(targetUserId)

    return NextResponse.json({
      success: true,
      data: {
        licenseKeys: licenseKeys.map((license) => ({
          id: license.id,
          key: license.key,
          status: license.status,
          activationsCount: license.activationsCount,
          activationsLimit: license.activationsLimit,
          expiresAt: license.expiresAt,
          createdAt: license.createdAt,
          course: license.course,
          payment: license.payment,
        })),
      },
    })
  } catch (error) {
    console.error('Failed to get user license keys:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get license keys',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}