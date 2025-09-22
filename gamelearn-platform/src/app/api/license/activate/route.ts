import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { licenseKeyService } from '@/lib/license/license-service'

const activateLicenseSchema = z.object({
  key: z.string().min(1, 'License key is required'),
  userId: z.string().min(1, 'User ID is required'),
  instanceName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, userId, instanceName } = activateLicenseSchema.parse(body)

    const activatedLicense = await licenseKeyService.activateLicenseKey({
      key,
      userId,
      instanceName,
    })

    return NextResponse.json({
      success: true,
      data: {
        licenseKey: {
          id: activatedLicense.id,
          key: activatedLicense.key,
          status: activatedLicense.status,
          activationsCount: activatedLicense.activationsCount,
          activationsLimit: activatedLicense.activationsLimit,
          expiresAt: activatedLicense.expiresAt,
        },
        course: {
          id: activatedLicense.course.id,
          title: activatedLicense.course.title,
        },
        message: 'License key activated successfully. You now have access to the course.',
      },
    })
  } catch (error) {
    console.error('License activation failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'License activation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}