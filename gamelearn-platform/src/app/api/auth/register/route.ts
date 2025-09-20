import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"
import { ZodError } from "zod"
import { createRequestLogger } from "@/lib/logger"

export async function POST(request: NextRequest) {
  const requestLogger = createRequestLogger(request)
  const endTimer = requestLogger.time('user_registration')

  try {
    requestLogger.logRequest(request)
    requestLogger.info("Starting user registration process")

    const body = await request.json()

    // Validate input using Zod schema
    const validatedData = registerSchema.parse(body)
    requestLogger.debug("Input validation successful")

    const { name, email, password, role } = validatedData

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      requestLogger.warn("Registration attempt with existing email", {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2') // Mask email for privacy
      })

      endTimer()
      return NextResponse.json(
        {
          success: false,
          error: { message: "User already exists with this email" }
        },
        { status: 400 }
      )
    }

    requestLogger.debug("No existing user found, proceeding with registration")

    // Hash password
    const hashStart = Date.now()
    const hashedPassword = await bcrypt.hash(password, 12)
    const hashDuration = Date.now() - hashStart

    requestLogger.debug("Password hashed successfully", {
      hashDuration
    })

    // Create user
    const dbStart = Date.now()
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
    })
    const dbDuration = Date.now() - dbStart

    requestLogger.logDatabaseOperation('CREATE', 'user', dbDuration, {
      userId: user.id,
      role: user.role
    })

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    requestLogger.logBusinessEvent('user_registered', {
      userId: user.id,
      email: email.replace(/(.{2}).*(@.*)/, '$1***$2'),
      role: user.role
    })

    requestLogger.info("User registration completed successfully", {
      userId: user.id
    })

    endTimer()
    return NextResponse.json(
      {
        success: true,
        data: { user: userWithoutPassword },
        meta: {
          correlationId: request.headers.get("x-correlation-id") || undefined,
          timestamp: new Date().toISOString()
        }
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      requestLogger.warn("Registration validation failed", {
        validationErrors: error.errors
      })

      endTimer()
      return NextResponse.json(
        {
          success: false,
          error: {
            message: "Validation failed",
            details: error.errors
          }
        },
        { status: 400 }
      )
    }

    requestLogger.error("Registration process failed", error as Error, {
      operation: 'user_registration'
    })

    endTimer()
    return NextResponse.json(
      {
        success: false,
        error: { message: "Internal server error" }
      },
      { status: 500 }
    )
  }
}