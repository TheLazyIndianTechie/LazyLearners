import { z } from "zod"

// Common validation schemas
export const uuidSchema = z.string().uuid("Invalid ID format")

// Error reporting schema
export const errorReportingSchema = z.object({
  errorId: z.string().uuid("Invalid error ID format"),
  message: z.string().min(1).max(1000, "Error message too long"),
  stack: z.string().max(5000, "Stack trace too long").optional(),
  componentStack: z.string().max(5000, "Component stack too long").optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["network", "validation", "auth", "permission", "server", "client", "unknown"]),
  url: z.string().url("Invalid URL").optional(),
  userAgent: z.string().max(500, "User agent too long").optional(),
  timestamp: z.string().datetime("Invalid timestamp format"),
  context: z.record(z.any()).optional()
})

export const paginationSchema = z.object({
  page: z
    .number()
    .min(1, "Page must be at least 1")
    .max(1000, "Page cannot exceed 1000")
    .default(1),
  limit: z
    .number()
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
  sortBy: z
    .string()
    .max(50, "Sort field name too long")
    .optional(),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Sort order must be 'asc' or 'desc'" }),
    })
    .default("desc"),
})

export const searchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(255, "Search query too long")
    .transform((val) => val.trim()),
  category: z
    .string()
    .max(50, "Category name too long")
    .optional(),
  tags: z
    .array(z.string().max(30, "Tag too long"))
    .max(10, "Too many tags")
    .optional(),
  minPrice: z
    .number()
    .min(0, "Minimum price cannot be negative")
    .optional(),
  maxPrice: z
    .number()
    .min(0, "Maximum price cannot be negative")
    .optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"], {
      errorMap: () => ({ message: "Invalid difficulty level" }),
    })
    .optional(),
  engine: z
    .enum(["unity", "unreal", "godot", "construct", "gamemaker", "custom", "web_technologies", "other"], {
      errorMap: () => ({ message: "Invalid game engine" }),
    })
    .optional(),
})

// Progress validation
export const progressUpdateSchema = z.object({
  lessonId: z
    .string()
    .uuid("Invalid lesson ID"),
  progress: z
    .number()
    .min(0, "Progress cannot be negative")
    .max(100, "Progress cannot exceed 100"),
  timeSpent: z
    .number()
    .min(0, "Time spent cannot be negative")
    .max(86400, "Time spent cannot exceed 24 hours")
    .default(0),
})

// File upload validation
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename too long")
    .regex(/^[^<>:"/\\|?*]+$/, "Filename contains invalid characters"),
  contentType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, "Invalid content type"),
  size: z
    .number()
    .min(1, "File size must be greater than 0")
    .max(100 * 1024 * 1024, "File size cannot exceed 100MB"), // 100MB limit
})

// Contact/feedback validation
export const contactSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  email: z
    .string()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  subject: z
    .string()
    .min(5, "Subject must be at least 5 characters")
    .max(200, "Subject must be less than 200 characters"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message must be less than 2000 characters"),
  type: z
    .enum(["support", "feedback", "bug_report", "feature_request", "other"], {
      errorMap: () => ({ message: "Invalid contact type" }),
    })
    .default("support"),
})

// Environment validation
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  DATABASE_URL: z.string().url("Invalid database URL"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required"),
  CLERK_WEBHOOK_SECRET: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  REDIS_URL: z.string().url("Invalid Redis URL").optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  AWS_S3_BUCKET: z.string().optional(),
  SENTRY_DSN: z.string().url("Invalid Sentry DSN").optional(),
})

// Rate limiting
export const rateLimitSchema = z.object({
  identifier: z.string().min(1, "Identifier is required"),
  limit: z.number().min(1, "Limit must be at least 1"),
  window: z.number().min(1000, "Window must be at least 1 second"),
})

// Webhook validation
export const webhookEventSchema = z.object({
  id: z.string().min(1, "Event ID is required"),
  type: z.string().min(1, "Event type is required"),
  data: z.record(z.any()),
  timestamp: z.number().min(0, "Timestamp must be positive"),
  signature: z.string().min(1, "Signature is required"),
})

// API response validation
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z
    .object({
      message: z.string(),
      code: z.string().optional(),
      details: z.any().optional(),
    })
    .optional(),
  meta: z
    .object({
      pagination: paginationSchema.optional(),
      correlationId: z.string().uuid().optional(),
      timestamp: z.string().datetime().optional(),
    })
    .optional(),
})

// Validation helper types
export type PaginationInput = z.infer<typeof paginationSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type ProgressUpdateInput = z.infer<typeof progressUpdateSchema>
export type FileUploadInput = z.infer<typeof fileUploadSchema>
export type ContactInput = z.infer<typeof contactSchema>
export type EnvInput = z.infer<typeof envSchema>
export type RateLimitInput = z.infer<typeof rateLimitSchema>
export type WebhookEventInput = z.infer<typeof webhookEventSchema>
export type ApiResponseInput = z.infer<typeof apiResponseSchema>