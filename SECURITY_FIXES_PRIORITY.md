# Security Fixes Priority List
## Critical Issues Requiring Immediate Attention

**Status:** 🔴 BLOCKING PRODUCTION DEPLOYMENT
**Review Date:** October 2, 2025

---

## 🚨 CRITICAL - Fix Before ANY Production Deployment

### 1. Code Execution Vulnerability
**File:** `/src/components/collaboration/code-editor.tsx:178`
**Risk:** Arbitrary JavaScript execution, potential XSS
**Effort:** 4 hours

**Current Code:**
```typescript
new Function(activeFile.content)
```

**Fix Required:**
```typescript
// Option 1: Remove feature entirely (quickest)
// Option 2: Use sandboxed Web Worker
const worker = new Worker('/code-execution-worker.js');
worker.postMessage({ code: activeFile.content });
```

---

### 2. XSS Vulnerability in Lesson Content
**File:** `/src/app/courses/[id]/lessons/[lessonId]/page.tsx:305-307`
**Risk:** Cross-site scripting, data theft
**Effort:** 2 hours

**Current Code:**
```typescript
<div dangerouslySetInnerHTML={{
  __html: currentLesson.content.replace(/\n/g, '<br>')
}} />
```

**Fix Required:**
```typescript
// Install: npm install isomorphic-dompurify
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(currentLesson.content.replace(/\n/g, '<br>'))
}} />
```

**Steps:**
1. `npm install isomorphic-dompurify`
2. Import DOMPurify in the component
3. Wrap all `dangerouslySetInnerHTML` with DOMPurify.sanitize()
4. Test with malicious input: `<img src=x onerror=alert(1)>`

---

## 🔴 HIGH PRIORITY - Fix Within 48 Hours

### 3. Remove Authentication Bypass
**File:** `/src/app/api/video/stream/route.ts:258-260`
**Risk:** Unauthorized access to premium content
**Effort:** 2 hours

**Action Required:**
```typescript
// REMOVE THIS CODE before production:
if (!userId && (process.env.NODE_ENV === 'development' || process.env.ENABLE_VIDEO_TEST === 'true')) {
  userId = 'test-user-123'
}

// Replace with:
if (!userId) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

**Deployment Check:**
- [ ] Remove `ENABLE_VIDEO_TEST` from production .env
- [ ] Add environment validation in CI/CD
- [ ] Test production build locally with `NODE_ENV=production`

---

### 4. Webhook Signature Verification
**File:** `/src/app/api/webhooks/clerk/route.ts`
**Risk:** Forged webhook requests
**Effort:** 1 hour

**Action Required:**
```typescript
const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!webhookSecret) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CLERK_WEBHOOK_SECRET required in production');
  }
  logger.warn('No webhook secret - accepting unsigned requests');
}
```

**Deployment Checklist:**
- [ ] Set `CLERK_WEBHOOK_SECRET` in Vercel environment
- [ ] Test webhook with invalid signature
- [ ] Monitor webhook verification failures

---

### 5. Implement Redis Rate Limiting
**File:** `/src/middleware.ts`
**Risk:** DDoS, brute force attacks
**Effort:** 4 hours

**Steps:**
1. Set up Upstash Redis (free tier available)
2. Install: `npm install @upstash/ratelimit @upstash/redis`
3. Replace in-memory rate limiting
4. Test rate limit enforcement

**Code:**
```typescript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '15 m'),
});
```

---

## 🟡 MEDIUM PRIORITY - Fix Within 1 Week

### 6. Add Database Indexes
**File:** `/prisma/schema.prisma`
**Impact:** 50-80% faster queries
**Effort:** 2 hours

**Required Indexes:**
```prisma
model Course {
  @@index([userId])
  @@index([published, createdAt])
}

model Enrollment {
  @@index([userId])
  @@index([courseId])
}

model LessonProgress {
  @@index([userId, lessonId])
}
```

**Migration Steps:**
1. Add indexes to schema
2. Run `npx prisma migrate dev --name add_indexes`
3. Run `npx prisma migrate deploy` in production
4. Monitor query performance

---

### 7. Strengthen CSP Headers
**File:** `/src/middleware.ts:93`
**Impact:** Better XSS protection
**Effort:** 3 hours

**Remove:**
```typescript
"script-src 'self' 'unsafe-inline' 'unsafe-eval'"
```

**Replace with nonce-based CSP:**
```typescript
const nonce = crypto.randomUUID();
response.headers.set('X-CSP-Nonce', nonce);

const csp = [
  "script-src 'self' 'nonce-${nonce}' https://js.stripe.com",
  // Remove 'unsafe-inline' and 'unsafe-eval'
];
```

---

### 8. File Upload Validation
**File:** `/src/app/api/uploads/route.ts`
**Risk:** Malware upload, storage exhaustion
**Effort:** 3 hours

**Required Validations:**
1. File type validation (magic numbers, not extensions)
2. File size limits (10MB max)
3. Virus scanning integration
4. Secure storage outside web root

---

## 🟢 PERFORMANCE OPTIMIZATIONS

### 9. Fix N+1 Query Problems
**Files:** Multiple API routes
**Impact:** 80% faster API responses
**Effort:** 4 hours

**Bad Pattern:**
```typescript
const courses = await prisma.course.findMany();
for (const course of courses) {
  const modules = await prisma.module.findMany({ where: { courseId: course.id } });
}
```

**Good Pattern:**
```typescript
const courses = await prisma.course.findMany({
  include: { modules: { include: { lessons: true } } }
});
```

---

### 10. Implement Redis Caching
**Impact:** 70% reduced database load
**Effort:** 6 hours

**Priority Caching:**
1. Course catalog (5min TTL)
2. User enrollments (10min TTL)
3. Video metadata (1hr TTL)

---

## Quick Wins Checklist

**Can be done in under 1 hour each:**

- [ ] Remove all `console.log()` statements in production code
- [ ] Add `.env.production` validation script
- [ ] Enable TypeScript strict mode
- [ ] Run `npm audit fix`
- [ ] Add error boundary to all major pages
- [ ] Implement proper loading states
- [ ] Add request ID correlation for debugging

---

## Pre-Production Deployment Checklist

### Environment Variables
- [ ] `CLERK_WEBHOOK_SECRET` configured
- [ ] `ENCRYPTION_KEY` set (32+ characters)
- [ ] `REDIS_URL` configured
- [ ] `ENABLE_VIDEO_TEST` removed or set to `false`
- [ ] `NODE_ENV=production`

### Security
- [ ] XSS vulnerability fixed (DOMPurify)
- [ ] Code execution vulnerability fixed
- [ ] Authentication bypass removed
- [ ] Webhook verification implemented
- [ ] Rate limiting active

### Performance
- [ ] Database indexes created
- [ ] Redis caching implemented
- [ ] N+1 queries fixed
- [ ] CDN configured for static assets

### Testing
- [ ] Security scan passed (OWASP ZAP)
- [ ] Load test completed (100+ concurrent users)
- [ ] All critical paths tested
- [ ] Video streaming tested in production-like environment

### Monitoring
- [ ] Sentry/error tracking configured
- [ ] Performance monitoring active
- [ ] Database query logging enabled
- [ ] Rate limit alerts configured

---

## Estimated Timeline

**Sprint 1 (Days 1-3): Critical Fixes**
- Day 1: Fix XSS and code execution vulnerabilities
- Day 2: Remove auth bypass, add webhook verification
- Day 3: Implement Redis rate limiting

**Sprint 2 (Days 4-7): High Priority**
- Day 4-5: Add database indexes and test performance
- Day 6: Strengthen CSP headers
- Day 7: File upload validation

**Sprint 3 (Days 8-10): Performance**
- Day 8-9: Fix N+1 queries and implement caching
- Day 10: Load testing and optimization

**Total: 10 business days (2 weeks)**

---

## Contact & Resources

**Security Questions:** Escalate to security team
**Performance Issues:** Check with DevOps team
**Deployment Blockers:** Alert project lead immediately

**Useful Commands:**
```bash
# Test production build locally
npm run build && NODE_ENV=production npm start

# Run security audit
npm audit
npx snyk test

# Check for unused dependencies
npx depcheck

# Analyze bundle size
npx @next/bundle-analyzer
```

---

**Last Updated:** October 2, 2025
**Review Status:** Awaiting implementation
**Sign-off Required:** Security Lead, Tech Lead, DevOps
