import { NextRequest, NextResponse } from 'next/server'
import { licenseKeyService } from '@/lib/license/license-service'
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

interface RouteParams {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Authentication check - users can only access their own license keys or admins can access any
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Authorization check - users can only access their own license keys unless they're admin
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. You can only access your own license keys.' },
        { status: 403 }
      )
    }

    const licenseKeys = await licenseKeyService.getUserLicenseKeys(userId)

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