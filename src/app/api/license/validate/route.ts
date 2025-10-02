import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { licenseKeyService } from '@/lib/license/license-service'

const validateLicenseSchema = z.object({
  key: z.string().min(1, 'License key is required'),
  userId: z.string().min(1, 'User ID is required'),
  courseId: z.string().min(1, 'Course ID is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, userId, courseId } = validateLicenseSchema.parse(body)

    const validation = await licenseKeyService.validateLicenseKey({
      key,
      userId,
      courseId,
    })

    return NextResponse.json({
      success: true,
      data: {
        valid: validation.valid,
        reason: validation.reason,
        licenseKey: validation.licenseKey
          ? {
              id: validation.licenseKey.id,
              key: validation.licenseKey.key,
              status: validation.licenseKey.status,
              activationsCount: validation.licenseKey.activationsCount,
              activationsLimit: validation.licenseKey.activationsLimit,
              expiresAt: validation.licenseKey.expiresAt,
              course: validation.licenseKey.course,
            }
          : null,
      },
    })
  } catch (error) {
    console.error('License validation failed:', error)

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
        error: 'License validation failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}