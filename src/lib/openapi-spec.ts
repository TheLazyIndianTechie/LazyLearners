/**
 * OpenAPI 3.0 Specification Generator
 * Generates comprehensive API documentation for all endpoints
 */

export interface OpenAPISpec {
  openapi: string
  info: {
    title: string
    version: string
    description: string
    contact?: {
      name: string
      email: string
      url: string
    }
    license?: {
      name: string
      url: string
    }
  }
  servers: Array<{
    url: string
    description: string
  }>
  paths: Record<string, any>
  components: {
    schemas: Record<string, any>
    securitySchemes: Record<string, any>
    responses: Record<string, any>
    parameters: Record<string, any>
  }
  security: Array<Record<string, string[]>>
  tags: Array<{
    name: string
    description: string
  }>
}

/**
 * Generate complete OpenAPI specification
 */
export function generateOpenAPISpec(): OpenAPISpec {
  return {
    openapi: '3.0.3',
    info: {
      title: 'GameLearn Platform API',
      version: '1.0.0',
      description: `
# GameLearn Platform API Documentation

A comprehensive game development Learning Management System (LMS) API built with Next.js 15 and TypeScript.

## Features

- **Authentication**: Clerk-based authentication with multi-role support
- **Courses**: Full course management with modules and lessons
- **Payments**: Dodo Payments integration with license keys
- **Video Streaming**: Adaptive bitrate video streaming
- **Progress Tracking**: User progress and completion tracking
- **Forum**: Community discussion forums
- **Portfolio**: Student project portfolios

## Rate Limiting

All API endpoints are rate-limited. Rate limit information is provided in response headers:

- \`X-RateLimit-Limit\`: Maximum requests allowed
- \`X-RateLimit-Remaining\`: Requests remaining in current window
- \`X-RateLimit-Reset\`: Timestamp when the limit resets
- \`Retry-After\`: Seconds to wait before retrying (when rate limited)

## Authentication

Most endpoints require authentication via Clerk. Include the session token in requests:

\`\`\`
Authorization: Bearer <session_token>
\`\`\`

## Response Format

All responses follow a standard format:

### Success Response
\`\`\`json
{
  "success": true,
  "data": { },
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  },
  "requestId": "uuid",
  "timestamp": "2025-01-03T10:00:00.000Z"
}
\`\`\`

### Error Response
\`\`\`json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "details": {},
    "timestamp": "2025-01-03T10:00:00.000Z",
    "requestId": "uuid"
  }
}
\`\`\`
      `,
      contact: {
        name: 'GameLearn Platform Support',
        email: 'support@gamelearn.dev',
        url: 'https://gamelearn.dev',
      },
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    paths: {
      ...getAuthPaths(),
      ...getCoursePaths(),
      ...getEnrollmentPaths(),
      ...getProgressPaths(),
      ...getPaymentPaths(),
      ...getVideoPaths(),
      ...getForumPaths(),
      ...getPortfolioPaths(),
      ...getHealthPaths(),
    },
    components: {
      schemas: getSchemas(),
      securitySchemes: {
        ClerkAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk session token',
        },
      },
      responses: getCommonResponses(),
      parameters: getCommonParameters(),
    },
    security: [{ ClerkAuth: [] }],
    tags: [
      { name: 'Authentication', description: 'User authentication endpoints' },
      { name: 'Courses', description: 'Course management' },
      { name: 'Enrollment', description: 'Course enrollment' },
      { name: 'Progress', description: 'User progress tracking' },
      { name: 'Payments', description: 'Payment processing' },
      { name: 'Video', description: 'Video streaming' },
      { name: 'Forum', description: 'Community forums' },
      { name: 'Portfolio', description: 'Student portfolios' },
      { name: 'Health', description: 'API health and monitoring' },
    ],
  }
}

// ============================================================================
// Path Definitions
// ============================================================================

function getAuthPaths() {
  return {
    '/api/webhooks/clerk': {
      post: {
        tags: ['Authentication'],
        summary: 'Clerk webhook handler',
        description: 'Handles Clerk authentication webhooks for user sync',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  type: { type: 'string', example: 'user.created' },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Webhook processed successfully' },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  }
}

function getCoursePaths() {
  return {
    '/api/courses': {
      get: {
        tags: ['Courses'],
        summary: 'List courses',
        description: 'Get paginated list of courses with filtering',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/PageSizeParam' },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Filter by category',
          },
          {
            name: 'difficulty',
            in: 'query',
            schema: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
            description: 'Filter by difficulty',
          },
          {
            name: 'published',
            in: 'query',
            schema: { type: 'boolean' },
            description: 'Filter by published status',
          },
        ],
        responses: {
          200: {
            description: 'List of courses',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Course' },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
      post: {
        tags: ['Courses'],
        summary: 'Create course',
        description: 'Create a new course (instructor only)',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/CreateCourseInput' },
            },
          },
        },
        responses: {
          201: {
            description: 'Course created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Course' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
        },
      },
    },
    '/api/courses/{id}': {
      get: {
        tags: ['Courses'],
        summary: 'Get course details',
        description: 'Get detailed course information including modules and lessons',
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
            description: 'Course ID',
          },
        ],
        responses: {
          200: {
            description: 'Course details',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/CourseDetails' },
                      },
                    },
                  ],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  }
}

function getEnrollmentPaths() {
  return {
    '/api/enrollment': {
      post: {
        tags: ['Enrollment'],
        summary: 'Enroll in course',
        description: 'Enroll authenticated user in a course',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId'],
                properties: {
                  courseId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Enrollment created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: { $ref: '#/components/schemas/Enrollment' },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
  }
}

function getProgressPaths() {
  return {
    '/api/progress': {
      post: {
        tags: ['Progress'],
        summary: 'Update progress',
        description: 'Update user progress for a lesson',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId', 'lessonId', 'completed'],
                properties: {
                  courseId: { type: 'string' },
                  lessonId: { type: 'string' },
                  completed: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Progress updated',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  }
}

function getPaymentPaths() {
  return {
    '/api/payments/checkout': {
      post: {
        tags: ['Payments'],
        summary: 'Create checkout session',
        description: 'Initialize payment checkout for a course',
        security: [{ ClerkAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['courseId'],
                properties: {
                  courseId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Checkout session created',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/SuccessResponse' },
                    {
                      type: 'object',
                      properties: {
                        data: {
                          type: 'object',
                          properties: {
                            checkoutUrl: { type: 'string' },
                            paymentId: { type: 'string' },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  }
}

function getVideoPaths() {
  return {
    '/api/video/stream': {
      get: {
        tags: ['Video'],
        summary: 'Stream video',
        description: 'Stream lesson video with access control',
        security: [{ ClerkAuth: [] }],
        parameters: [
          {
            name: 'lessonId',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Video stream',
            content: {
              'video/mp4': {
                schema: { type: 'string', format: 'binary' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
          403: { $ref: '#/components/responses/Forbidden' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  }
}

function getForumPaths() {
  return {
    '/api/forum/posts': {
      get: {
        tags: ['Forum'],
        summary: 'List forum posts',
        description: 'Get paginated list of forum posts',
        parameters: [
          { $ref: '#/components/parameters/PageParam' },
          { $ref: '#/components/parameters/PageSizeParam' },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'List of forum posts',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
        },
      },
    },
  }
}

function getPortfolioPaths() {
  return {
    '/api/portfolio': {
      get: {
        tags: ['Portfolio'],
        summary: 'Get user portfolio',
        description: 'Get authenticated user portfolio',
        security: [{ ClerkAuth: [] }],
        responses: {
          200: {
            description: 'User portfolio',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' },
              },
            },
          },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  }
}

function getHealthPaths() {
  return {
    '/api/health': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        description: 'Check API health status',
        security: [],
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'healthy' },
                    timestamp: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
  }
}

// ============================================================================
// Schema Definitions
// ============================================================================

function getSchemas() {
  return {
    SuccessResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { type: 'object' },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            pageSize: { type: 'number' },
            total: { type: 'number' },
            totalPages: { type: 'number' },
          },
        },
        requestId: { type: 'string', format: 'uuid' },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
    ErrorResponse: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' },
            path: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    Course: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string' },
        thumbnail: { type: 'string', nullable: true },
        price: { type: 'number' },
        published: { type: 'boolean' },
        category: { type: 'string' },
        difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        duration: { type: 'number', description: 'Duration in minutes' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
    CourseDetails: {
      allOf: [
        { $ref: '#/components/schemas/Course' },
        {
          type: 'object',
          properties: {
            instructor: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                email: { type: 'string' },
              },
            },
            modules: {
              type: 'array',
              items: { $ref: '#/components/schemas/Module' },
            },
          },
        },
      ],
    },
    Module: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        description: { type: 'string', nullable: true },
        order: { type: 'number' },
        duration: { type: 'number' },
        lessons: {
          type: 'array',
          items: { $ref: '#/components/schemas/Lesson' },
        },
      },
    },
    Lesson: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        title: { type: 'string' },
        type: { type: 'string', enum: ['VIDEO', 'READING', 'QUIZ', 'INTERACTIVE', 'PROJECT'] },
        order: { type: 'number' },
        duration: { type: 'number' },
        videoUrl: { type: 'string', nullable: true },
      },
    },
    Enrollment: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        userId: { type: 'string' },
        courseId: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'] },
        enrolledAt: { type: 'string', format: 'date-time' },
        completedAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
    CreateCourseInput: {
      type: 'object',
      required: ['title', 'description', 'category', 'difficulty', 'price'],
      properties: {
        title: { type: 'string', minLength: 3, maxLength: 200 },
        description: { type: 'string', minLength: 10 },
        category: { type: 'string' },
        difficulty: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
        price: { type: 'number', minimum: 0 },
        thumbnail: { type: 'string', nullable: true },
      },
    },
  }
}

// ============================================================================
// Common Responses
// ============================================================================

function getCommonResponses() {
  return {
    BadRequest: {
      description: 'Bad request - validation error',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request data',
              details: [
                {
                  field: 'title',
                  message: 'Title is required',
                },
              ],
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
    },
    Unauthorized: {
      description: 'Authentication required',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'AUTHENTICATION_ERROR',
              message: 'Authentication required',
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
    },
    Forbidden: {
      description: 'Insufficient permissions',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'AUTHORIZATION_ERROR',
              message: 'Insufficient permissions',
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
    },
    NotFound: {
      description: 'Resource not found',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Resource not found',
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
    },
    Conflict: {
      description: 'Resource conflict',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'CONFLICT',
              message: 'Resource already exists',
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
    },
    RateLimitExceeded: {
      description: 'Rate limit exceeded',
      content: {
        'application/json': {
          schema: { $ref: '#/components/schemas/ErrorResponse' },
          example: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Rate limit exceeded. Please try again later.',
              details: { retryAfter: 60 },
              timestamp: '2025-01-03T10:00:00.000Z',
              requestId: 'abc-123',
            },
          },
        },
      },
      headers: {
        'Retry-After': {
          description: 'Seconds to wait before retrying',
          schema: { type: 'integer' },
        },
      },
    },
  }
}

// ============================================================================
// Common Parameters
// ============================================================================

function getCommonParameters() {
  return {
    PageParam: {
      name: 'page',
      in: 'query',
      description: 'Page number (1-indexed)',
      schema: {
        type: 'integer',
        minimum: 1,
        default: 1,
      },
    },
    PageSizeParam: {
      name: 'pageSize',
      in: 'query',
      description: 'Number of items per page',
      schema: {
        type: 'integer',
        minimum: 1,
        maximum: 100,
        default: 20,
      },
    },
  }
}
