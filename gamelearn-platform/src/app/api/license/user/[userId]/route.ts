import { NextRequest, NextResponse } from 'next/server'
import { licenseKeyService } from '@/lib/license/license-service'

interface RouteParams {
  params: {
    userId: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
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