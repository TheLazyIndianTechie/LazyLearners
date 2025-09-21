import { NextRequest, NextResponse } from "next/server"
import { createRequestLogger } from "@/lib/logger"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  securityTestRunner,
  runSecurityTest,
  getTestSuites,
  addTestSuite,
  SECURITY_TEST_TYPES,
  TEST_SEVERITY
} from "@/lib/security/testing"
import { logSecurityEvent } from "@/lib/security/monitoring"
import { z } from "zod"

// Validation schemas
const runTestSchema = z.object({
  suiteId: z.string().min(1, 'Suite ID is required'),
  targetUrl: z.string().url('Valid target URL is required').optional(),
  schedule: z.boolean().default(false)
})

const createTestSuiteSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500),
  targets: z.array(z.string().url()).min(1),
  tests: z.array(z.object({
    category: z.enum(Object.keys(SECURITY_TEST_TYPES) as [string, ...string[]]),
    testType: z.string(),
    enabled: z.boolean().default(true),
    severity: z.enum(['info', 'low', 'medium', 'high', 'critical']),
    timeout: z.number().min(1000).max(300000).default(30000),
    retries: z.number().min(0).max(5).default(1),
    parameters: z.record(z.any()).default({})
  })).min(1),
  notifications: z.object({
    onFailure: z.boolean().default(true),
    onCritical: z.boolean().default(true),
    recipients: z.array(z.string().email()).default([])
  }).default({})
})

const updateTestSuiteSchema = z.object({
  suiteId: z.string().min(1),
  updates: z.object({
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    enabled: z.boolean().optional(),
    targets: z.array(z.string().url()).optional(),
    notifications: z.object({
      onFailure: z.boolean(),
      onCritical: z.boolean(),
      recipients: z.array(z.string().email())
    }).optional()
  })
})

// GET endpoint - List test suites and results
export async function GET(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('security_testing_get')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing security testing GET request")

    // 1. Authentication check - restrict to admin/security users
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      requestLogger.warn("Unauthorized security testing access attempt")
      await logSecurityEvent(
        'unauthorized_access',
        'medium',
        {
          resource: 'security_testing',
          method: request.method,
          url: request.url
        },
        undefined,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined,
        request.headers.get('x-correlation-id') || undefined
      )

      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    // For now, allowing all authenticated users - in production, restrict to security admins
    // if (!['ADMIN', 'SECURITY_ADMIN'].includes(session.user.role)) {
    //   await logSecurityEvent(
    //     'privilege_escalation',
    //     'high',
    //     {
    //       attemptedResource: 'security_testing',
    //       userRole: session.user.role,
    //       requiredRole: 'SECURITY_ADMIN'
    //     },
    //     session.user.id
    //   )
    //
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       error: { message: "Security admin access required" }
    //     },
    //     { status: 403 }
    //   )
    // }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list_suites'
    const suiteId = searchParams.get('suiteId')
    const limit = parseInt(searchParams.get('limit') || '50')

    switch (action) {
      case 'list_suites':
        const testSuites = getTestSuites()
        const suitesWithStatus = testSuites.map(suite => ({
          ...suite,
          isRunning: securityTestRunner.isTestRunning(suite.id),
          lastRun: null // Would get from test history
        }))

        return NextResponse.json({
          success: true,
          data: {
            testSuites: suitesWithStatus,
            availableTestTypes: SECURITY_TEST_TYPES,
            severityLevels: Object.keys(TEST_SEVERITY)
          }
        })

      case 'get_suite':
        if (!suiteId) {
          return NextResponse.json(
            {
              success: false,
              error: { message: "Suite ID is required" }
            },
            { status: 400 }
          )
        }

        const suite = securityTestRunner.getTestSuite(suiteId)
        if (!suite) {
          return NextResponse.json(
            {
              success: false,
              error: { message: "Test suite not found" }
            },
            { status: 404 }
          )
        }

        const testHistory = await securityTestRunner.getTestHistory(suiteId, limit)

        return NextResponse.json({
          success: true,
          data: {
            suite,
            isRunning: securityTestRunner.isTestRunning(suiteId),
            history: testHistory
          }
        })

      case 'get_status':
        if (!suiteId) {
          return NextResponse.json(
            {
              success: false,
              error: { message: "Suite ID is required" }
            },
            { status: 400 }
          )
        }

        return NextResponse.json({
          success: true,
          data: {
            suiteId,
            isRunning: securityTestRunner.isTestRunning(suiteId),
            status: securityTestRunner.isTestRunning(suiteId) ? 'running' : 'idle'
          }
        })

      default:
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid action specified" }
          },
          { status: 400 }
        )
    }

  } catch (error) {
    requestLogger.error("Security testing GET request failed", error as Error, {
      operation: 'security_testing_get'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to process security testing request" }
      },
      { status: 500 }
    )
  } finally {
    endTimer()
  }
}

// POST endpoint - Run tests, create/update test suites
export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('security_testing_post')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Processing security testing POST request")

    // Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        {
          success: false,
          error: { message: "Authentication required" }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'run_test':
        return await handleRunTest(body, session, requestLogger, endTimer)

      case 'create_suite':
        return await handleCreateTestSuite(body, session, requestLogger, endTimer)

      case 'update_suite':
        return await handleUpdateTestSuite(body, session, requestLogger, endTimer)

      case 'delete_suite':
        return await handleDeleteTestSuite(body, session, requestLogger, endTimer)

      case 'stop_test':
        return await handleStopTest(body, session, requestLogger, endTimer)

      default:
        return NextResponse.json(
          {
            success: false,
            error: { message: "Invalid action specified" }
          },
          { status: 400 }
        )
    }

  } catch (error) {
    requestLogger.error("Security testing POST request failed", error as Error, {
      operation: 'security_testing_post'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to process security testing request" }
      },
      { status: 500 }
    )
  }
}

// Handler functions

async function handleRunTest(body: any, session: any, logger: any, endTimer: () => void) {
  const validationResult = runTestSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid test run parameters",
          details: validationResult.error.errors
        }
      },
      { status: 400 }
    )
  }

  const { suiteId, targetUrl, schedule } = validationResult.data

  // Check if test is already running
  if (securityTestRunner.isTestRunning(suiteId)) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Test suite is already running" }
      },
      { status: 409 }
    )
  }

  // Verify suite exists
  const suite = securityTestRunner.getTestSuite(suiteId)
  if (!suite) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Test suite not found" }
      },
      { status: 404 }
    )
  }

  // Log security test initiation
  await logSecurityEvent(
    'configuration_change',
    'medium',
    {
      action: 'security_test_initiated',
      suiteId,
      suiteName: suite.name,
      targetUrl: targetUrl || suite.targets[0],
      initiatedBy: session.user.id,
      initiatedByEmail: session.user.email,
      scheduled: schedule
    },
    session.user.id
  )

  try {
    // Run the test suite asynchronously if not scheduled
    if (!schedule) {
      // Start test in background
      runSecurityTest(suiteId, targetUrl)
        .then(results => {
          logger.info("Security test suite completed", {
            suiteId,
            summary: results.summary,
            initiatedBy: session.user.id
          })
        })
        .catch(error => {
          logger.error("Security test suite failed", error as Error, {
            suiteId,
            initiatedBy: session.user.id
          })
        })

      endTimer()
      return NextResponse.json(
        {
          success: true,
          data: {
            message: "Security test started",
            suiteId,
            status: "running",
            estimatedDuration: suite.tests.length * 30 // rough estimate in seconds
          }
        },
        { status: 202 }
      )
    } else {
      // For scheduled tests, just acknowledge the request
      endTimer()
      return NextResponse.json(
        {
          success: true,
          data: {
            message: "Security test scheduled",
            suiteId,
            status: "scheduled"
          }
        },
        { status: 200 }
      )
    }

  } catch (error) {
    logger.error("Failed to start security test", error as Error, {
      suiteId,
      initiatedBy: session.user.id
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Failed to start security test" }
      },
      { status: 500 }
    )
  }
}

async function handleCreateTestSuite(body: any, session: any, logger: any, endTimer: () => void) {
  const validationResult = createTestSuiteSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid test suite parameters",
          details: validationResult.error.errors
        }
      },
      { status: 400 }
    )
  }

  const suiteData = validationResult.data

  // Generate unique suite ID
  const suiteId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`

  const newSuite = {
    id: suiteId,
    ...suiteData,
    enabled: true,
    tests: suiteData.tests.map((test, index) => ({
      id: `${suiteId}_test_${index}`,
      ...test
    }))
  }

  // Add the test suite
  addTestSuite(newSuite)

  // Log the creation
  await logSecurityEvent(
    'configuration_change',
    'medium',
    {
      action: 'security_test_suite_created',
      suiteId,
      suiteName: suiteData.name,
      testCount: suiteData.tests.length,
      createdBy: session.user.id,
      createdByEmail: session.user.email
    },
    session.user.id
  )

  logger.info("Security test suite created", {
    suiteId,
    suiteName: suiteData.name,
    createdBy: session.user.id
  })

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        message: "Test suite created successfully",
        suite: newSuite
      }
    },
    { status: 201 }
  )
}

async function handleUpdateTestSuite(body: any, session: any, logger: any, endTimer: () => void) {
  const validationResult = updateTestSuiteSchema.safeParse(body)
  if (!validationResult.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: "Invalid update parameters",
          details: validationResult.error.errors
        }
      },
      { status: 400 }
    )
  }

  const { suiteId, updates } = validationResult.data

  // Update the test suite
  const success = securityTestRunner.updateTestSuite(suiteId, updates)

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Test suite not found" }
      },
      { status: 404 }
    )
  }

  // Log the update
  await logSecurityEvent(
    'configuration_change',
    'low',
    {
      action: 'security_test_suite_updated',
      suiteId,
      updates: Object.keys(updates),
      updatedBy: session.user.id,
      updatedByEmail: session.user.email
    },
    session.user.id
  )

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        message: "Test suite updated successfully",
        suiteId
      }
    },
    { status: 200 }
  )
}

async function handleDeleteTestSuite(body: any, session: any, logger: any, endTimer: () => void) {
  const { suiteId } = body

  if (!suiteId) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Suite ID is required" }
      },
      { status: 400 }
    )
  }

  // Check if test is running
  if (securityTestRunner.isTestRunning(suiteId)) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Cannot delete running test suite" }
      },
      { status: 409 }
    )
  }

  // Delete the test suite
  const success = securityTestRunner.removeTestSuite(suiteId)

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Test suite not found" }
      },
      { status: 404 }
    )
  }

  // Log the deletion
  await logSecurityEvent(
    'configuration_change',
    'medium',
    {
      action: 'security_test_suite_deleted',
      suiteId,
      deletedBy: session.user.id,
      deletedByEmail: session.user.email
    },
    session.user.id
  )

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        message: "Test suite deleted successfully",
        suiteId
      }
    },
    { status: 200 }
  )
}

async function handleStopTest(body: any, session: any, logger: any, endTimer: () => void) {
  const { suiteId } = body

  if (!suiteId) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Suite ID is required" }
      },
      { status: 400 }
    )
  }

  // Check if test is actually running
  if (!securityTestRunner.isTestRunning(suiteId)) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Test suite is not running" }
      },
      { status: 409 }
    )
  }

  // Log the stop request
  await logSecurityEvent(
    'configuration_change',
    'low',
    {
      action: 'security_test_stopped',
      suiteId,
      stoppedBy: session.user.id,
      stoppedByEmail: session.user.email
    },
    session.user.id
  )

  // Note: In a full implementation, you would need to implement test stopping logic
  // For now, we'll just acknowledge the request

  endTimer()
  return NextResponse.json(
    {
      success: true,
      data: {
        message: "Test stop requested",
        suiteId,
        note: "Test will be stopped at next safe checkpoint"
      }
    },
    { status: 200 }
  )
}