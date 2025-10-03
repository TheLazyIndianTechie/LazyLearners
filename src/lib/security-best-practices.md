# Security Best Practices

This document outlines security best practices implemented in the GameLearn Platform and guidelines for developers.

## Table of Contents

- [SQL Injection Prevention](#sql-injection-prevention)
- [XSS Prevention](#xss-prevention)
- [CSRF Protection](#csrf-protection)
- [Authentication Security](#authentication-security)
- [Input Validation](#input-validation)
- [File Upload Security](#file-upload-security)
- [API Security](#api-security)
- [Security Headers](#security-headers)

## SQL Injection Prevention

### Prisma Automatic Protection

**Prisma ORM automatically prevents SQL injection** through parameterized queries. All query parameters are sanitized and escaped.

✅ **SAFE - Prisma automatically parameterizes:**
```typescript
// User input is automatically sanitized
const user = await prisma.user.findFirst({
  where: {
    email: userInput // ✅ Safe - Prisma handles escaping
  }
})

// Dynamic filters are safe
const courses = await prisma.course.findMany({
  where: {
    category: req.query.category, // ✅ Safe
    difficulty: req.query.difficulty // ✅ Safe
  }
})
```

❌ **AVOID - Raw queries without parameters:**
```typescript
// ❌ DANGEROUS - Direct string interpolation
await prisma.$queryRaw`SELECT * FROM users WHERE email = '${userInput}'`

// ✅ SAFE - Use parameterized raw queries
await prisma.$queryRaw`SELECT * FROM users WHERE email = ${userInput}`
```

### Best Practices

1. **Always use Prisma's type-safe query builders**
   ```typescript
   // ✅ Good
   const result = await prisma.course.findMany({
     where: { published: true }
   })
   ```

2. **For LIKE queries, use the sanitization utility**
   ```typescript
   import { escapeLikePattern } from '@/lib/sanitize'

   const searchTerm = escapeLikePattern(userInput)
   const results = await prisma.course.findMany({
     where: {
       title: {
         contains: searchTerm // ✅ Safe with escaping
       }
     }
   })
   ```

3. **Whitelist ORDER BY fields**
   ```typescript
   import { sanitizeOrderByField } from '@/lib/sanitize'

   const allowedFields = ['createdAt', 'title', 'price']
   const sortField = sanitizeOrderByField(req.query.sort, allowedFields)

   const courses = await prisma.course.findMany({
     orderBy: { [sortField]: 'desc' }
   })
   ```

4. **Never construct raw SQL from user input**
   ```typescript
   // ❌ NEVER DO THIS
   const query = `SELECT * FROM users WHERE name = '${userName}'`
   await prisma.$executeRawUnsafe(query)

   // ✅ Use Prisma's query builder instead
   await prisma.user.findMany({
     where: { name: userName }
   })
   ```

## XSS Prevention

### Input Sanitization

**Always sanitize user input before storing or displaying.**

```typescript
import { sanitizeRichText, sanitizeBasic, sanitizeStrict } from '@/lib/sanitize'

// For rich text content (blog posts, lessons)
const sanitizedContent = sanitizeRichText(userInput)

// For basic formatted text (comments, descriptions)
const sanitizedComment = sanitizeBasic(userInput)

// For plain text only (usernames, titles)
const sanitizedTitle = sanitizeStrict(userInput)
```

### Output Encoding

React automatically escapes output, but be careful with:

1. **dangerouslySetInnerHTML**
   ```typescript
   // ❌ DANGEROUS
   <div dangerouslySetInnerHTML={{ __html: userInput }} />

   // ✅ SAFE - Sanitize first
   import { sanitizeRichText } from '@/lib/sanitize'
   <div dangerouslySetInnerHTML={{ __html: sanitizeRichText(userInput) }} />
   ```

2. **URLs in href attributes**
   ```typescript
   import { sanitizeUrl } from '@/lib/sanitize'

   // ✅ SAFE
   <a href={sanitizeUrl(userProvidedUrl)}>Link</a>
   ```

3. **innerHTML/outerHTML**
   ```typescript
   // ❌ DANGEROUS
   element.innerHTML = userInput

   // ✅ SAFE
   element.textContent = userInput
   ```

### Content Security Policy

The application implements a strict CSP in `next.config.ts`:

- Scripts: Only from self and trusted CDNs (Clerk)
- Styles: Self and inline (with nonce in production)
- Images: Self, data URIs, and HTTPS
- No inline event handlers allowed
- No eval() or Function() constructor

## CSRF Protection

### Using CSRF Tokens

**All state-changing operations require CSRF tokens.**

1. **In Server Components (Forms)**
   ```typescript
   import { createCsrfFormProps } from '@/lib/csrf'

   export default async function MyForm() {
     const { csrfToken } = await createCsrfFormProps()

     return (
       <form action="/api/submit" method="POST">
         <input type="hidden" name="csrfToken" value={csrfToken} />
         {/* form fields */}
       </form>
     )
   }
   ```

2. **In API Routes**
   ```typescript
   import { validateCsrfToken } from '@/lib/csrf'
   import { createErrorResponse } from '@/lib/api-response'

   export async function POST(request: NextRequest) {
     if (!await validateCsrfToken(request)) {
       return createErrorResponse(
         { code: 'CSRF_ERROR', message: 'Invalid CSRF token' },
         { status: 403 }
       )
     }

     // Process request
   }
   ```

3. **In Client-Side Requests**
   ```typescript
   // Add CSRF token to headers
   fetch('/api/submit', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'x-csrf-token': csrfToken
     },
     body: JSON.stringify(data)
   })
   ```

### SameSite Cookies

All cookies use `SameSite=Strict` for additional CSRF protection.

## Authentication Security

### Clerk Integration

Authentication is handled by Clerk with:

- OAuth providers (Google, GitHub)
- Multi-factor authentication support
- Session management
- Automatic token rotation

### Session Security

```typescript
import { auth } from '@clerk/nextjs'

export async function GET() {
  const { userId } = await auth()

  if (!userId) {
    return createAuthenticationErrorResponse()
  }

  // User is authenticated
}
```

### Rate Limiting for Auth

```typescript
import { authRateLimiter } from '@/lib/rate-limiter'

// Protect login/signup endpoints
const { allowed } = await authRateLimiter.check(identifier)

if (!allowed) {
  return createRateLimitErrorResponse()
}
```

## Input Validation

### Zod Schemas

**Always validate input with Zod schemas.**

```typescript
import { z } from 'zod'
import { handleZodError } from '@/lib/api-response'

const CreateCourseSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  price: z.number().min(0),
  category: z.string(),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = CreateCourseSchema.parse(body)

    // Data is validated and type-safe
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error)
    }
    throw error
  }
}
```

### Sanitization After Validation

```typescript
import { sanitizeObject } from '@/lib/sanitize'

// Validate structure
const data = CreateCourseSchema.parse(body)

// Sanitize content
const sanitizedData = sanitizeObject(data, sanitizeBasic)

// Now safe to use
await prisma.course.create({ data: sanitizedData })
```

## File Upload Security

### Validation Checklist

1. **File Extension Whitelist**
   ```typescript
   import { validateFileExtension } from '@/lib/sanitize'

   const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'pdf']
   if (!validateFileExtension(filename, allowedExtensions)) {
     throw new Error('Invalid file type')
   }
   ```

2. **MIME Type Validation**
   ```typescript
   import { validateMimeType } from '@/lib/sanitize'

   const allowedTypes = ['image/*', 'video/mp4', 'application/pdf']
   if (!validateMimeType(file.type, allowedTypes)) {
     throw new Error('Invalid file type')
   }
   ```

3. **File Size Limits**
   ```typescript
   const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
   if (file.size > MAX_FILE_SIZE) {
     throw new Error('File too large')
   }
   ```

4. **Filename Sanitization**
   ```typescript
   import { sanitizeFilename } from '@/lib/sanitize'

   const safeFilename = sanitizeFilename(file.name)
   ```

5. **Virus Scanning** (Production)
   ```typescript
   // Use ClamAV or similar service
   const isSafe = await scanFileForViruses(fileBuffer)
   if (!isSafe) {
     throw new Error('File contains malware')
   }
   ```

## API Security

### Rate Limiting

```typescript
import { apiRateLimiter, getRateLimitIdentifier } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  const identifier = getRateLimitIdentifier(request)
  const { allowed, result } = await apiRateLimiter.check(identifier)

  if (!allowed) {
    return createRateLimitErrorResponse({ retryAfter: result.resetIn })
  }

  // Process request
}
```

### Request Validation

1. **Method Validation**
   ```typescript
   import { validateMethod } from '@/lib/api-response'

   const error = validateMethod(request, ['POST', 'GET'])
   if (error) return error
   ```

2. **Content-Type Validation**
   ```typescript
   const contentType = request.headers.get('content-type')
   if (!contentType?.includes('application/json')) {
     return createErrorResponse({
       code: 'INVALID_CONTENT_TYPE',
       message: 'Content-Type must be application/json'
     }, { status: 400 })
   }
   ```

3. **Request Size Limits**
   ```typescript
   const MAX_BODY_SIZE = 10 * 1024 * 1024 // 10MB
   const contentLength = request.headers.get('content-length')
   if (contentLength && parseInt(contentLength) > MAX_BODY_SIZE) {
     return createErrorResponse({
       code: 'PAYLOAD_TOO_LARGE',
       message: 'Request body too large'
     }, { status: 413 })
   }
   ```

### API Key Security

If using API keys:

```typescript
// Store hashed API keys
import { createHash } from 'crypto'

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

// Validate with constant-time comparison
function validateApiKey(provided: string, stored: string): boolean {
  const providedHash = hashApiKey(provided)
  return constantTimeCompare(providedHash, stored)
}
```

## Security Headers

### Implemented Headers

The application sets these security headers in `next.config.ts`:

1. **Content-Security-Policy**: Prevents XSS and data injection
2. **Strict-Transport-Security**: Forces HTTPS (2-year max-age)
3. **X-Frame-Options**: DENY (prevents clickjacking)
4. **X-Content-Type-Options**: nosniff (prevents MIME sniffing)
5. **X-XSS-Protection**: 1; mode=block (legacy XSS protection)
6. **Referrer-Policy**: strict-origin-when-cross-origin
7. **Permissions-Policy**: Restricts browser features

### Verifying Headers

Test with:
```bash
curl -I https://your-domain.com
```

Or use online tools:
- [Security Headers](https://securityheaders.com/)
- [Mozilla Observatory](https://observatory.mozilla.org/)

## Security Checklist

### Development

- [ ] All user input is validated with Zod
- [ ] All user input is sanitized before storage
- [ ] No raw SQL queries with user input
- [ ] CSRF tokens on all state-changing forms
- [ ] Rate limiting on all API endpoints
- [ ] File uploads are validated
- [ ] Sensitive data is encrypted
- [ ] Secrets are in environment variables
- [ ] Error messages don't leak sensitive info

### Deployment

- [ ] HTTPS is enforced
- [ ] Security headers are configured
- [ ] HSTS is enabled with preload
- [ ] CSP is configured correctly
- [ ] Database has strong password
- [ ] API keys are rotated regularly
- [ ] Logs don't contain sensitive data
- [ ] Dependency vulnerabilities are fixed
- [ ] Security monitoring is enabled

### Monitoring

- [ ] Failed authentication attempts are logged
- [ ] Rate limit violations are tracked
- [ ] Unusual API patterns are detected
- [ ] File upload attempts are monitored
- [ ] CSRF token failures are logged

## Security Incident Response

### If Security Issue is Discovered

1. **Assess Severity**
   - Critical: Data breach, RCE, authentication bypass
   - High: XSS, CSRF, privilege escalation
   - Medium: Information disclosure, DoS
   - Low: Minor configuration issues

2. **Immediate Actions**
   - Isolate affected systems
   - Revoke compromised credentials
   - Enable additional logging
   - Document everything

3. **Remediation**
   - Deploy fix to production ASAP
   - Rotate API keys and secrets
   - Audit related systems
   - Review access logs

4. **Post-Incident**
   - Conduct security review
   - Update security documentation
   - Train team on lessons learned
   - Implement additional controls

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Clerk Security](https://clerk.com/docs/security/overview)
- [Node.js Security Checklist](https://blog.risingstack.com/node-js-security-checklist/)

## Contact

For security concerns, contact: security@gamelearn.dev

**DO NOT** publicly disclose security vulnerabilities. Use responsible disclosure.
