# Dodo Payments Production Setup Guide

This comprehensive guide walks you through setting up Dodo Payments for production deployment on the LazyGameDevs GameLearn Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Dodo Payments Account Setup](#dodo-payments-account-setup)
3. [Production Account Activation](#production-account-activation)
4. [API Key Management](#api-key-management)
5. [Product Configuration](#product-configuration)
6. [Webhook Configuration](#webhook-configuration)
7. [Environment Variables](#environment-variables)
8. [Testing Checklist](#testing-checklist)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the production setup, ensure you have:

- ✅ Business registration documents (for production approval)
- ✅ Bank account for payment settlements
- ✅ GST registration (if applicable in India)
- ✅ Production domain configured and deployed
- ✅ SSL certificate enabled on your domain
- ✅ Clerk authentication configured

## Dodo Payments Account Setup

### Step 1: Create Dodo Payments Account

1. **Sign Up for Dodo Payments**
   - Visit [Dodo Payments](https://dodopayments.com/)
   - Click **Sign Up** or **Get Started**
   - Choose account type: **Business**

2. **Complete Initial Registration**
   ```
   Required Information:
   - Business Name: "LazyGameDevs"
   - Business Email: "hello@lazygamedevs.com"
   - Contact Phone: Your business phone
   - Business Address: Your registered address
   - Business Type: "EdTech" or "SaaS"
   ```

3. **Verify Email Address**
   - Check your email inbox
   - Click verification link
   - Complete email verification

### Step 2: Business Verification

1. **Submit Business Documents**
   - PAN Card (India)
   - GST Certificate (if applicable)
   - Business Registration Certificate
   - Bank Account Statement
   - Address Proof

2. **KYC Process**
   - Upload required documents via dashboard
   - Wait for verification (typically 2-3 business days)
   - Respond to any verification emails promptly

3. **Bank Account Verification**
   - Add bank account details
   - Complete micro-deposit verification
   - Set up automatic settlement preferences

## Production Account Activation

### Step 1: Test Environment Setup

1. **Access Test Environment**
   - Login to Dodo Payments Dashboard
   - Navigate to **Settings > API Keys**
   - Note your test API keys:
     - Test API Key: `test_sk_...`
     - Test Publishable Key: `test_pk_...`

2. **Configure Test Environment**
   ```env
   # Test Configuration
   DODO_API_KEY="test_sk_your_test_key_here"
   DODO_WEBHOOK_SECRET="whsec_test_your_webhook_secret"
   DODO_ENVIRONMENT="test"
   ```

3. **Test Payment Integration**
   - Create test products
   - Complete test transactions
   - Verify webhook delivery
   - Test license key generation

### Step 2: Production Activation

1. **Complete Production Checklist**
   - [ ] Business verification completed
   - [ ] Bank account verified
   - [ ] Test transactions successful
   - [ ] Webhook handling verified
   - [ ] Terms of Service accepted
   - [ ] Privacy Policy configured

2. **Request Production Access**
   - Navigate to **Settings > Production Access**
   - Click **Request Production Access**
   - Complete production questionnaire:
     ```
     Business Model: "EdTech - Online Course Sales"
     Average Transaction Value: "$10 - $500"
     Expected Monthly Volume: "Specify your estimate"
     Payment Methods Needed: "UPI, Cards, Net Banking"
     ```

3. **Production Approval**
   - Wait for Dodo Payments team review
   - Typical approval time: 3-5 business days
   - Monitor email for approval notification

### Step 3: Production API Keys

1. **Generate Production Keys**
   - After approval, navigate to **Settings > API Keys**
   - Switch to **Production** tab
   - Generate production API keys:
     - Production API Key: `live_sk_...`
     - Production Publishable Key: `live_pk_...`

2. **Secure Key Storage**
   ```bash
   # Generate secure webhook secret
   openssl rand -hex 32

   # Store keys securely
   # NEVER commit these to version control
   ```

3. **Configure Production Environment**
   ```env
   # Production Configuration
   DODO_API_KEY="live_sk_your_production_key_here"
   DODO_WEBHOOK_SECRET="whsec_production_your_webhook_secret"
   DODO_ENVIRONMENT="live"
   ```

## API Key Management

### Key Types and Usage

#### 1. Secret API Key
- **Format**: `live_sk_...` (production) or `test_sk_...` (test)
- **Usage**: Server-side operations only
- **Security**: NEVER expose in client-side code
- **Used for**:
  - Creating products
  - Creating checkout sessions
  - Retrieving payment information
  - Managing customers

#### 2. Publishable Key
- **Format**: `live_pk_...` (production) or `test_pk_...` (test)
- **Usage**: Client-side integration (if needed)
- **Security**: Safe to expose in frontend code
- **Used for**:
  - Client-side payment form initialization
  - Public API calls

### Key Rotation Best Practices

1. **Regular Rotation Schedule**
   ```
   Recommended Schedule:
   - Development keys: Every 6 months
   - Production keys: Every 12 months
   - Immediate rotation if compromised
   ```

2. **Rotation Procedure**
   ```bash
   # Step 1: Generate new keys in Dodo Dashboard
   # Step 2: Update environment variables
   # Step 3: Deploy updated configuration
   # Step 4: Verify functionality
   # Step 5: Revoke old keys after 24-48 hours
   ```

3. **Key Compromise Protocol**
   - Immediately revoke compromised key
   - Generate new key
   - Update production environment
   - Deploy emergency update
   - Audit recent transactions
   - Monitor for suspicious activity

## Product Configuration

### Step 1: Create Products in Dodo Dashboard

1. **Navigate to Products**
   - Dashboard > **Products**
   - Click **Create Product**

2. **Product Configuration**
   ```
   Product Type: "Digital Product" or "EdTech"

   Product Details:
   - Name: "Game Development Fundamentals"
   - Description: "Complete Unity game development course"
   - Price: 4999 (in smallest currency unit: ₹49.99)
   - Currency: "INR" or "USD"
   - Tax Category: "edtech" or "digital_products"
   ```

3. **Enable License Keys**
   - Toggle **License Key Enabled**: ON
   - License Key Format: Custom (if needed)
   - License Key Prefix: "GD-" (optional)

4. **Configure Tax Settings**
   ```
   For India:
   - GST Applicable: Yes/No
   - Tax Category: "edtech" (exempt from GST)
   - Tax Rate: 0% or 18% (depending on category)
   ```

### Step 2: Programmatic Product Creation

```typescript
// Create product via API
import { dodoPayments } from '@/lib/payments/dodo'

const product = await dodoPayments.createProduct({
  name: 'Game Development Fundamentals',
  description: 'Complete Unity game development course',
  price: 4999, // ₹49.99 in paisa
  currency: 'INR',
  taxCategory: 'edtech',
  licenseKeyEnabled: true,
  metadata: {
    courseId: 'course_123',
    duration: '40 hours',
    level: 'beginner'
  }
})
```

### Step 3: Product Validation

1. **Test Product in Dashboard**
   - Navigate to Products
   - Verify product appears correctly
   - Test price display
   - Verify tax calculations

2. **Test via API**
   ```bash
   # List all products
   curl -X GET https://api.dodopayments.com/v1/products \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## Webhook Configuration

### Step 1: Configure Webhook Endpoint

1. **Access Webhook Settings**
   - Dashboard > **Developers > Webhooks**
   - Click **Add Endpoint**

2. **Endpoint Configuration**
   ```
   Endpoint URL: https://lazygamedevs.com/api/webhooks/dodo

   Description: "GameLearn Platform - Payment Events"

   Events to Subscribe:
   ✅ payment.succeeded
   ✅ payment.failed
   ✅ payment.cancelled
   ✅ license_key.created
   ✅ subscription.created
   ✅ subscription.active
   ✅ subscription.cancelled
   ✅ refund.created
   ```

3. **Save Webhook Secret**
   - After creation, copy webhook signing secret
   - Format: `whsec_...`
   - Add to environment variables

### Step 2: Webhook Implementation

The webhook handler is already implemented at:
```
gamelearn-platform/src/app/api/webhooks/dodo/route.ts
```

Key features:
- ✅ Signature verification
- ✅ Event type handling
- ✅ Payment success processing
- ✅ License key generation
- ✅ Error handling and logging

### Step 3: Test Webhook Delivery

1. **Use Dodo Dashboard Test Tool**
   - Navigate to Webhooks
   - Click **Send Test Event**
   - Select event type: `payment.succeeded`
   - Verify successful delivery

2. **Local Testing with ngrok**
   ```bash
   # Install ngrok
   npm install -g ngrok

   # Start local dev server
   cd gamelearn-platform
   npm run dev

   # Expose local server
   ngrok http 3000

   # Update webhook URL in Dodo Dashboard
   # https://your-ngrok-url.ngrok.io/api/webhooks/dodo
   ```

3. **Webhook Verification Script**
   ```typescript
   // Test webhook signature verification
   import { dodoPayments } from '@/lib/payments/dodo'

   const payload = JSON.stringify({
     type: 'payment.succeeded',
     data: { /* payment data */ }
   })

   const signature = 'sha256=...'
   const isValid = dodoPayments.verifyWebhook(payload, signature)
   console.log('Webhook valid:', isValid)
   ```

### Step 4: Monitor Webhook Events

1. **Dashboard Monitoring**
   - Navigate to **Webhooks > Event Logs**
   - Monitor delivery status
   - View failed events
   - Retry failed webhooks

2. **Application Logging**
   - Check application logs for webhook events
   - Monitor payment processing success rate
   - Alert on webhook failures

## Environment Variables

### Complete Production Configuration

```env
# =============================================================================
# DODO PAYMENTS PRODUCTION CONFIGURATION
# =============================================================================

# Dodo Payments (Primary Payment Processor)
DODO_API_KEY="live_sk_your_production_api_key_here"
DODO_WEBHOOK_SECRET="whsec_production_webhook_secret_here"
DODO_ENVIRONMENT="live"

# Enable payment processing
ENABLE_PAYMENTS=true

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# Application URLs (Production)
APP_URL="https://lazygamedevs.com"
API_BASE_URL="https://lazygamedevs.com/api"
NEXT_PUBLIC_APP_URL="https://lazygamedevs.com"

# =============================================================================
# SECURITY CONFIGURATION
# =============================================================================

# CORS Configuration
CORS_ORIGINS="https://lazygamedevs.com,https://www.lazygamedevs.com"

# Rate Limiting for Payment Endpoints
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=100

# Encryption for sensitive data
ENCRYPTION_KEY="your-32-char-encryption-key-here"

# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================

# Production PostgreSQL database
DATABASE_URL="postgresql://user:password@host:5432/gamelearn_production"

# Connection pool settings
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# =============================================================================
# MONITORING & LOGGING
# =============================================================================

# Log level (info for production)
LOG_LEVEL=info

# Error tracking
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"

# Enable application metrics
ENABLE_METRICS=true
```

### Environment Variable Security

1. **Hosting Platform Configuration**

   **Vercel:**
   ```bash
   # Set environment variables via Vercel CLI
   vercel env add DODO_API_KEY production
   vercel env add DODO_WEBHOOK_SECRET production
   vercel env add DODO_ENVIRONMENT production

   # Or via Vercel Dashboard:
   # Project Settings > Environment Variables
   ```

2. **Validation Script**
   ```typescript
   // Verify required environment variables
   import { paymentConfig } from '@/lib/config/env'

   if (!paymentConfig.dodo.apiKey) {
     throw new Error('DODO_API_KEY is required')
   }

   if (!paymentConfig.dodo.webhookSecret) {
     throw new Error('DODO_WEBHOOK_SECRET is required')
   }

   if (paymentConfig.dodo.environment !== 'live') {
     console.warn('WARNING: Not using live environment')
   }
   ```

## Testing Checklist

### Pre-Production Testing

#### 1. Test Environment Validation
- [ ] Test API keys working
- [ ] Test products created successfully
- [ ] Test checkout session creation
- [ ] Test payment flow end-to-end
- [ ] Test webhook delivery
- [ ] Test license key generation
- [ ] Test payment failure scenarios

#### 2. Integration Testing
```bash
# Run comprehensive integration tests
cd gamelearn-platform
npm run test:integration
```

#### 3. Manual Testing Scenarios

**Scenario 1: Successful Payment**
- [ ] User browses courses
- [ ] User clicks "Purchase Course"
- [ ] Checkout session created
- [ ] User redirected to payment page
- [ ] Payment completed successfully
- [ ] Webhook received and processed
- [ ] License key generated
- [ ] Course access granted
- [ ] User redirected to success page
- [ ] Confirmation email sent

**Scenario 2: Failed Payment**
- [ ] User initiates payment
- [ ] Payment fails (insufficient funds, etc.)
- [ ] Webhook received
- [ ] User notified of failure
- [ ] No course access granted
- [ ] Error logged properly

**Scenario 3: Cancelled Payment**
- [ ] User initiates payment
- [ ] User cancels during checkout
- [ ] User redirected to cancel page
- [ ] No charges applied
- [ ] No course access granted

### Production Testing Checklist

#### 1. Post-Deployment Validation
- [ ] Production API keys configured
- [ ] Production webhook endpoint active
- [ ] SSL certificate valid
- [ ] Domain DNS configured correctly
- [ ] All environment variables set

#### 2. Live Transaction Testing
```
Test with Real Payment Methods:
- [ ] Test with UPI payment
- [ ] Test with Credit Card
- [ ] Test with Debit Card
- [ ] Test with Net Banking
- [ ] Test with International Card (if supported)
```

#### 3. Webhook Verification
- [ ] Webhook endpoint receiving events
- [ ] Signature verification working
- [ ] Events processing correctly
- [ ] License keys generating
- [ ] Course access granting properly

#### 4. Error Handling
- [ ] Test with invalid API key
- [ ] Test with network timeouts
- [ ] Test webhook signature failure
- [ ] Test duplicate payment handling
- [ ] Test refund processing

### Automated Testing

```typescript
// Example integration test
describe('Dodo Payments Integration', () => {
  it('should create checkout session', async () => {
    const session = await dodoPayments.createCheckoutSession({
      products: [{
        productId: 'prod_test',
        quantity: 1
      }],
      customer: {
        name: 'Test User',
        email: 'test@example.com'
      },
      returnUrl: 'https://lazygamedevs.com/payment/success'
    })

    expect(session).toHaveProperty('id')
    expect(session).toHaveProperty('url')
    expect(session.url).toContain('dodopayments.com')
  })

  it('should verify webhook signature', () => {
    const payload = JSON.stringify({ type: 'payment.succeeded' })
    const signature = generateTestSignature(payload)

    const isValid = dodoPayments.verifyWebhook(payload, signature)
    expect(isValid).toBe(true)
  })
})
```

## Security Best Practices

### 1. API Key Security

**DO:**
- ✅ Store API keys in environment variables
- ✅ Use different keys for test and production
- ✅ Rotate keys regularly (at least annually)
- ✅ Revoke compromised keys immediately
- ✅ Use secret management services (AWS Secrets Manager, etc.)

**DON'T:**
- ❌ Commit API keys to version control
- ❌ Expose API keys in client-side code
- ❌ Share API keys via email or chat
- ❌ Use production keys in development
- ❌ Store keys in plain text files

### 2. Webhook Security

```typescript
// Always verify webhook signatures
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-dodo-signature')

  // CRITICAL: Verify signature before processing
  if (!dodoPayments.verifyWebhook(body, signature)) {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 401 }
    )
  }

  // Process webhook only after verification
  const event = JSON.parse(body)
  await dodoPayments.handleWebhook(event)
}
```

### 3. Payment Amount Validation

```typescript
// Always validate payment amounts
async function validatePaymentAmount(
  courseId: string,
  receivedAmount: number
): Promise<boolean> {
  // Get expected price from database
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { price: true }
  })

  // Verify amount matches (allow for minor rounding differences)
  const expectedAmount = Math.round(course.price * 100) // Convert to smallest unit
  const difference = Math.abs(expectedAmount - receivedAmount)

  return difference < 10 // Allow ±0.10 difference for rounding
}
```

### 4. Idempotency Handling

```typescript
// Prevent duplicate payment processing
async function processPayment(paymentId: string) {
  // Check if payment already processed
  const existingPayment = await prisma.payment.findUnique({
    where: { dodoPaymentId: paymentId }
  })

  if (existingPayment) {
    console.log(`Payment ${paymentId} already processed`)
    return existingPayment
  }

  // Process payment only if not already processed
  return await createPaymentRecord(paymentId)
}
```

### 5. Rate Limiting

```typescript
// Implement rate limiting for payment endpoints
import { rateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  // Rate limit: 10 payment attempts per hour
  const isRateLimited = await rateLimit(`payment:${ip}`, 10, 3600)

  if (isRateLimited) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  // Process payment
}
```

### 6. Data Encryption

```typescript
// Encrypt sensitive payment data
import { encrypt, decrypt } from '@/lib/crypto'

// Before storing in database
const encryptedData = encrypt(JSON.stringify({
  paymentMethod: payment.paymentMethod,
  last4: payment.card?.last4,
  customerEmail: payment.customer.email
}))

await prisma.payment.create({
  data: {
    id: payment.id,
    encryptedDetails: encryptedData,
    // ... other fields
  }
})
```

### 7. Audit Logging

```typescript
// Log all payment-related actions
import { auditLog } from '@/lib/security/audit'

await auditLog.create({
  action: 'PAYMENT_PROCESSED',
  userId: userId,
  resourceType: 'Payment',
  resourceId: payment.id,
  details: {
    amount: payment.amount,
    currency: payment.currency,
    courseId: payment.metadata.courseId,
    status: 'succeeded'
  },
  ipAddress: request.headers.get('x-forwarded-for'),
  userAgent: request.headers.get('user-agent')
})
```

## Troubleshooting

### Common Issues

#### 1. Webhook Signature Verification Failing

**Problem**: Webhooks failing with "Invalid signature" error

**Solutions**:
```typescript
// Debug webhook signature verification
export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('x-dodo-signature')

  console.log('Webhook Debug:', {
    bodyLength: body.length,
    signatureReceived: !!signature,
    signatureFormat: signature?.substring(0, 10),
    webhookSecretConfigured: !!process.env.DODO_WEBHOOK_SECRET
  })

  // Verify signature
  const isValid = dodoPayments.verifyWebhook(body, signature)

  if (!isValid) {
    console.error('Signature verification failed:', {
      expectedSecret: process.env.DODO_WEBHOOK_SECRET?.substring(0, 10),
      receivedSignature: signature
    })
  }
}
```

**Common Causes**:
- Incorrect webhook secret in environment variables
- Body parsing modifying the raw payload
- Missing signature header
- Signature format mismatch

#### 2. Payment Session Creation Failing

**Problem**: Checkout session creation returns errors

**Solutions**:
```typescript
try {
  const session = await dodoPayments.createCheckoutSession({
    products: [{ productId: 'prod_123', quantity: 1 }],
    customer: { name: 'Test', email: 'test@example.com' },
    returnUrl: 'https://lazygamedevs.com/success'
  })
} catch (error) {
  console.error('Checkout session error:', {
    error: error.message,
    apiKey: process.env.DODO_API_KEY?.substring(0, 10),
    environment: process.env.DODO_ENVIRONMENT
  })

  // Check specific error types
  if (error.message.includes('product')) {
    console.error('Invalid product ID - check product exists')
  }
  if (error.message.includes('unauthorized')) {
    console.error('Invalid API key - check DODO_API_KEY')
  }
}
```

#### 3. License Key Not Generating

**Problem**: Payment succeeds but license key not generated

**Solutions**:
1. **Check Product Configuration**
   - Verify `license_key_enabled` is true in product settings
   - Check Dodo Dashboard product configuration

2. **Verify Webhook Processing**
   ```typescript
   // Check webhook event handling
   private async handlePaymentSucceeded(payment: DodoPayment) {
     console.log('Processing payment succeeded:', {
       paymentId: payment.id,
       courseId: payment.metadata?.course_id,
       licenseKeyEnabled: payment.metadata?.license_key_enabled
     })

     // Ensure license key creation is triggered
   }
   ```

3. **Check Database Records**
   ```sql
   -- Verify payment record exists
   SELECT * FROM "Payment" WHERE "dodoPaymentId" = 'pay_xxx';

   -- Check for license key
   SELECT * FROM "LicenseKey" WHERE "paymentId" = 'payment_id';
   ```

#### 4. Payment Status Not Updating

**Problem**: Payment status stuck in "processing"

**Solutions**:
1. **Manual Status Check**
   ```typescript
   // Retrieve payment status from Dodo
   const payment = await dodoPayments.getPayment(paymentId)
   console.log('Current status:', payment.status)

   // Update local database
   await prisma.payment.update({
     where: { dodoPaymentId: paymentId },
     data: { status: payment.status }
   })
   ```

2. **Webhook Retry**
   - Check Dodo Dashboard webhook event logs
   - Manually retry failed webhook events
   - Verify webhook endpoint is accessible

#### 5. API Rate Limiting

**Problem**: Getting 429 Too Many Requests errors

**Solutions**:
```typescript
// Implement exponential backoff
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000 // Exponential backoff
        console.log(`Rate limited, retrying in ${delay}ms...`)
        await new Promise(resolve => setTimeout(resolve, delay))
        continue
      }
      throw error
    }
  }
  throw new Error('Max retries exceeded')
}

// Usage
const payment = await retryWithBackoff(() =>
  dodoPayments.getPayment(paymentId)
)
```

### Debug Tools

#### 1. Payment Dashboard Monitor

```typescript
// Create dashboard endpoint to monitor payments
export async function GET() {
  const recentPayments = await prisma.payment.findMany({
    take: 20,
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { email: true } },
      course: { select: { title: true } }
    }
  })

  return NextResponse.json({
    payments: recentPayments,
    stats: {
      total: recentPayments.length,
      succeeded: recentPayments.filter(p => p.status === 'succeeded').length,
      failed: recentPayments.filter(p => p.status === 'failed').length,
      processing: recentPayments.filter(p => p.status === 'processing').length
    }
  })
}
```

#### 2. Webhook Event Logger

```typescript
// Log all webhook events for debugging
export async function POST(request: NextRequest) {
  const body = await request.text()

  // Store webhook event for debugging
  await prisma.webhookEvent.create({
    data: {
      provider: 'dodo',
      eventType: JSON.parse(body).type,
      payload: body,
      signature: request.headers.get('x-dodo-signature'),
      receivedAt: new Date()
    }
  })

  // Process webhook
  // ...
}
```

#### 3. Test Mode Toggle

```typescript
// Easy switch between test and production
const isDevelopment = process.env.NODE_ENV === 'development'
const dodoEnvironment = isDevelopment ? 'test' : 'live'

console.log(`Using Dodo environment: ${dodoEnvironment}`)
```

## Support and Resources

### Documentation Links

- [Dodo Payments API Documentation](https://docs.dodopayments.com/)
- [Webhook Event Reference](https://docs.dodopayments.com/webhooks)
- [Payment Methods Guide](https://docs.dodopayments.com/payment-methods)
- [License Key System](https://docs.dodopayments.com/license-keys)
- [Security Best Practices](https://docs.dodopayments.com/security)

### Support Channels

- **Email Support**: support@dodopayments.com
- **Dashboard Help**: Built-in support chat
- **Community Forum**: [Dodo Payments Community](https://community.dodopayments.com/)

### Emergency Contacts

- **Payment Issues**: support@dodopayments.com
- **Security Concerns**: security@dodopayments.com
- **Integration Support**: developers@dodopayments.com

## Compliance and Legal

### PCI DSS Compliance

Dodo Payments is PCI DSS compliant. As a merchant:
- ✅ Never store card numbers
- ✅ Never store CVV/CVC
- ✅ Use Dodo's hosted checkout (recommended)
- ✅ Follow security best practices

### Data Privacy

1. **Customer Data Handling**
   - Collect only necessary information
   - Comply with GDPR/applicable privacy laws
   - Implement data retention policies
   - Provide data deletion on request

2. **Privacy Policy Requirements**
   - Disclose payment processor (Dodo Payments)
   - Explain data collection and usage
   - Detail data sharing with third parties
   - Provide contact information

### Tax Compliance

1. **GST Registration (India)**
   - Register for GST if applicable
   - Configure GST rates in Dodo Dashboard
   - Issue GST-compliant invoices

2. **International Taxes**
   - Research tax obligations for international sales
   - Configure appropriate tax categories
   - Consult with tax professional

---

**Last Updated**: September 30, 2025
**Version**: 1.0.0
**Maintained by**: LazyGameDevs Team
