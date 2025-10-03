/**
 * Input sanitization utilities
 * Protects against XSS attacks by sanitizing user-generated content
 */

import DOMPurify from 'isomorphic-dompurify'

// ============================================================================
// DOMPurify Configuration
// ============================================================================

/**
 * Strict sanitization config - removes all HTML
 */
const STRICT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
}

/**
 * Basic sanitization config - allows safe formatting tags only
 */
const BASIC_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
  KEEP_CONTENT: true,
}

/**
 * Rich text sanitization config - allows common rich text elements
 */
const RICH_TEXT_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: [
    // Text formatting
    'b', 'i', 'em', 'strong', 'u', 's', 'strike', 'del', 'mark', 'code', 'pre',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Paragraphs and breaks
    'p', 'br', 'hr',
    // Lists
    'ul', 'ol', 'li',
    // Links
    'a',
    // Quotes
    'blockquote', 'q',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Other
    'div', 'span',
  ],
  ALLOWED_ATTR: [
    'href', 'target', 'rel', // Links
    'class', // Styling
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  ALLOW_DATA_ATTR: false,
}

/**
 * Code sanitization config - preserves code blocks with syntax highlighting classes
 */
const CODE_CONFIG: DOMPurify.Config = {
  ALLOWED_TAGS: ['code', 'pre', 'span'],
  ALLOWED_ATTR: ['class'],
  KEEP_CONTENT: true,
}

// ============================================================================
// Sanitization Functions
// ============================================================================

/**
 * Sanitize HTML with strict settings (removes all HTML)
 * Use for user input that should not contain any HTML
 */
export function sanitizeStrict(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, STRICT_CONFIG)
}

/**
 * Sanitize HTML with basic formatting allowed
 * Use for simple user input like comments or descriptions
 */
export function sanitizeBasic(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, BASIC_CONFIG)
}

/**
 * Sanitize rich text content
 * Use for user-generated rich text content like blog posts or lesson content
 */
export function sanitizeRichText(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, RICH_TEXT_CONFIG)
}

/**
 * Sanitize code content
 * Use for code snippets with syntax highlighting
 */
export function sanitizeCode(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, CODE_CONFIG)
}

/**
 * Sanitize URL to prevent javascript: and data: URIs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''

  const trimmed = url.trim()

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file|about):/i
  if (dangerousProtocols.test(trimmed)) {
    return ''
  }

  // Allow only safe protocols
  const safeProtocols = /^(https?|mailto|tel):/i
  if (!safeProtocols.test(trimmed) && !trimmed.startsWith('/')) {
    return ''
  }

  return trimmed
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ''

  const trimmed = email.trim().toLowerCase()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  return emailRegex.test(trimmed) ? trimmed : ''
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''

  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special chars
    .replace(/\.{2,}/g, '.') // Remove multiple dots (directory traversal)
    .replace(/^\.+/, '') // Remove leading dots
    .substring(0, 255) // Limit length
}

// ============================================================================
// Input Validation
// ============================================================================

/**
 * Validate and sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return ''

  return query
    .trim()
    .substring(0, 200) // Limit length
    .replace(/[<>]/g, '') // Remove potential HTML tags
}

/**
 * Sanitize username (alphanumeric, underscore, hyphen only)
 */
export function sanitizeUsername(username: string): string {
  if (!username) return ''

  return username
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '')
    .substring(0, 30)
}

/**
 * Sanitize slug for URLs
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return ''

  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/[\s_]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 200)
}

// ============================================================================
// SQL Injection Prevention
// ============================================================================

/**
 * Escape special characters for LIKE queries
 * Prisma handles parameterization, but LIKE patterns need escaping
 */
export function escapeLikePattern(pattern: string): string {
  if (!pattern) return ''

  return pattern
    .replace(/\\/g, '\\\\') // Escape backslashes first
    .replace(/%/g, '\\%')   // Escape percent signs
    .replace(/_/g, '\\_')   // Escape underscores
}

/**
 * Sanitize order by field name to prevent SQL injection
 * Only allows alphanumeric characters and underscores
 */
export function sanitizeOrderByField(field: string, allowedFields: string[]): string {
  if (!field) return allowedFields[0] || 'id'

  const sanitized = field.replace(/[^a-zA-Z0-9_]/g, '')

  return allowedFields.includes(sanitized) ? sanitized : allowedFields[0] || 'id'
}

// ============================================================================
// Object Sanitization
// ============================================================================

/**
 * Recursively sanitize all string values in an object
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  sanitizer: (value: string) => string = sanitizeBasic
): T {
  const result: any = Array.isArray(obj) ? [] : {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizer(value)
    } else if (value !== null && typeof value === 'object') {
      result[key] = sanitizeObject(value, sanitizer)
    } else {
      result[key] = value
    }
  }

  return result
}

// ============================================================================
// File Upload Sanitization
// ============================================================================

/**
 * Validate file extension against whitelist
 */
export function validateFileExtension(
  filename: string,
  allowedExtensions: string[]
): boolean {
  const ext = filename.split('.').pop()?.toLowerCase()
  return ext ? allowedExtensions.includes(ext) : false
}

/**
 * Validate MIME type against whitelist
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[]
): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      // Wildcard matching (e.g., "image/*")
      const prefix = type.slice(0, -2)
      return mimeType.startsWith(prefix)
    }
    return mimeType === type
  })
}

/**
 * Sanitize uploaded file metadata
 */
export function sanitizeFileMetadata(metadata: {
  filename: string
  mimeType: string
  size: number
}): {
  filename: string
  mimeType: string
  size: number
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(metadata.filename)
  if (!sanitizedFilename) {
    errors.push('Invalid filename')
  }

  // Validate MIME type format
  const mimeTypeRegex = /^[a-z]+\/[a-z0-9\-\+\.]+$/i
  if (!mimeTypeRegex.test(metadata.mimeType)) {
    errors.push('Invalid MIME type')
  }

  // Validate size
  const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
  if (metadata.size <= 0 || metadata.size > MAX_FILE_SIZE) {
    errors.push('Invalid file size')
  }

  return {
    filename: sanitizedFilename,
    mimeType: metadata.mimeType.toLowerCase(),
    size: metadata.size,
    isValid: errors.length === 0,
    errors,
  }
}

// ============================================================================
// Content Security
// ============================================================================

/**
 * Remove potentially dangerous HTML attributes
 */
export function removeDangerousAttributes(html: string): string {
  const dangerousAttrs = ['onclick', 'onload', 'onerror', 'onmouseover', 'onfocus', 'onblur']
  let sanitized = html

  dangerousAttrs.forEach(attr => {
    const regex = new RegExp(`\\s${attr}\\s*=\\s*["'][^"']*["']`, 'gi')
    sanitized = sanitized.replace(regex, '')
  })

  return sanitized
}

/**
 * Strip all HTML tags from input
 */
export function stripHtml(input: string): string {
  if (!input) return ''
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], KEEP_CONTENT: true })
}

/**
 * Sanitize markdown content (removes HTML but keeps markdown)
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return ''

  // First strip HTML
  const noHtml = stripHtml(markdown)

  // Then allow basic markdown syntax (no further sanitization needed)
  return noHtml
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if string contains potential XSS patterns
 */
export function containsXssPatterns(input: string): boolean {
  if (!input) return false

  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /vbscript:/i,
    /data:text\/html/i,
  ]

  return xssPatterns.some(pattern => pattern.test(input))
}

/**
 * Sanitize content based on content type
 */
export function sanitizeByType(
  content: string,
  type: 'strict' | 'basic' | 'richtext' | 'code' | 'markdown'
): string {
  switch (type) {
    case 'strict':
      return sanitizeStrict(content)
    case 'basic':
      return sanitizeBasic(content)
    case 'richtext':
      return sanitizeRichText(content)
    case 'code':
      return sanitizeCode(content)
    case 'markdown':
      return sanitizeMarkdown(content)
    default:
      return sanitizeBasic(content)
  }
}
