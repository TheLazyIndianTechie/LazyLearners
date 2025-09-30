# Clerk Production Application Setup Guide

This comprehensive guide walks you through setting up a production Clerk application with OAuth providers for the LazyGameDevs GameLearn Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Production Instance Creation](#production-instance-creation)
3. [Domain Configuration](#domain-configuration)
4. [OAuth Provider Setup](#oauth-provider-setup)
5. [Environment Variables](#environment-variables)
6. [Webhook Configuration](#webhook-configuration)
7. [Security Configuration](#security-configuration)
8. [Deployment Checklist](#deployment-checklist)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting the production setup, ensure you have:

- ✅ A domain you own (e.g., `lazygamedevs.com`)
- ✅ Ability to add DNS records to your domain
- ✅ Existing Clerk development instance
- ✅ Google Developer Account for OAuth
- ✅ GitHub account for OAuth
- ✅ Production hosting environment (Vercel recommended)

## Production Instance Creation

### Step 1: Create Production Instance

1. **Navigate to Clerk Dashboard**
   - Go to [Clerk Dashboard](https://dashboard.clerk.com/)
   - Ensure you're in your development instance

2. **Create Production Instance**
   - Click the **Development** dropdown at the top
   - Select **Create production instance**
   - Choose whether to clone your development settings or start fresh
   - **Recommended**: Clone development settings for consistency

3. **Important Note**
   > ⚠️ **Security Notice**: SSO connections, Integrations, and Paths settings do NOT copy over for security reasons. You'll need to reconfigure these manually.

### Step 2: Configure Production Keys

1. **Access API Keys**
   - Navigate to **API Keys** in the Clerk Dashboard
   - Note the production keys:
     - **Publishable Key**: `pk_live_...`
     - **Secret Key**: `sk_live_...`

2. **Save Keys Securely**
   - Store these keys in your environment variables
   - Never commit these to version control

## Domain Configuration

### Step 1: Set Up Domain

1. **Add Your Domain**
   - In Clerk Dashboard, go to **Domains**
   - Add your production domain (e.g., `lazygamedevs.com`)
   - Choose subdomain for authentication:
     - Option 1: `accounts.lazygamedevs.com` (recommended)
     - Option 2: Use your main domain

### Step 2: DNS Configuration

1. **Required DNS Records**
   - Clerk will provide specific DNS records to add
   - Typically CNAME records pointing to Clerk's infrastructure
   - **Example**:
     ```
     accounts.lazygamedevs.com CNAME → accounts.clerk.com
     ```

2. **DNS Propagation**
   - Allow up to 48 hours for DNS propagation
   - Use tools like `dig` to verify:
     ```bash
     dig accounts.lazygamedevs.com
     ```

### Step 3: SSL Certificate Deployment

1. **Certificate Issuance**
   - Clerk uses LetsEncrypt or Google Trust Services
   - Automatic certificate provisioning
   - Monitor progress in Clerk Dashboard

2. **CAA Records Check**
   - If certificate issuance is stuck, check for CAA records:
     ```bash
     dig lazygamedevs.com +short CAA
     ```
   - Remove restrictive CAA records if present

## OAuth Provider Setup

### Google OAuth Configuration

#### Step 1: Google Cloud Console Setup

1. **Create/Select Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project or select existing one
   - Name: "LazyGameDevs GameLearn Platform"

2. **Enable OAuth Consent Screen**
   - Navigate to **APIs & Services > OAuth consent screen**
   - Choose **External** user type
   - Fill in application information:
     - **App name**: "LazyGameDevs GameLearn Platform"
     - **User support email**: `support@lazygamedevs.com`
     - **App domain**: `https://lazygamedevs.com`
     - **Developer contact**: `hello@lazygamedevs.com`

3. **Create OAuth Credentials**
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth client ID**
   - Application type: **Web application**
   - Name: "LazyGameDevs Production"

4. **Configure Authorized Origins**
   ```
   https://lazygamedevs.com
   https://www.lazygamedevs.com
   https://accounts.lazygamedevs.com
   ```

5. **Configure Redirect URIs**
   - Get the authorized redirect URI from Clerk Dashboard
   - Typically: `https://accounts.lazygamedevs.com/v1/oauth_callback/google`

6. **Publishing Status**
   - **CRITICAL**: Set status to "In production"
   - Without this, users will see OAuth warnings
   - Submit for verification if required by Google

#### Step 2: Configure in Clerk

1. **Add Google Connection**
   - Clerk Dashboard > **SSO connections**
   - **Add connection > For all users**
   - Provider: **Google**
   - Toggle on **Use custom credentials**

2. **Enter Credentials**
   - **Client ID**: From Google Cloud Console
   - **Client Secret**: From Google Cloud Console
   - **Scopes**: `profile email` (default)

3. **Test Connection**
   - Use Clerk's test feature
   - Verify with actual Google account

### GitHub OAuth Configuration

#### Step 1: GitHub App Setup

1. **Access GitHub Settings**
   - Go to [GitHub Developer Settings](https://github.com/settings/apps)
   - Select **OAuth Apps**

2. **Create OAuth App**
   - Click **New OAuth app**
   - Application details:
     - **App name**: "LazyGameDevs GameLearn Platform"
     - **Homepage URL**: `https://lazygamedevs.com`
     - **App description**: "Authentication for LazyGameDevs GameLearn Platform"

3. **Authorization Callback URL**
   - Get from Clerk Dashboard (SSO connections > GitHub)
   - Typically: `https://accounts.lazygamedevs.com/v1/oauth_callback/github`

4. **Generate Client Secret**
   - After creation, generate client secret
   - Save both Client ID and Client Secret securely

#### Step 2: Configure in Clerk

1. **Add GitHub Connection**
   - Clerk Dashboard > **SSO connections**
   - **Add connection > For all users**
   - Provider: **GitHub**
   - Toggle on **Use custom credentials**

2. **Enter Credentials**
   - **Client ID**: From GitHub OAuth app
   - **Client Secret**: From GitHub OAuth app

3. **Test Connection**
   - Use Clerk's test feature
   - Verify with actual GitHub account

### Optional OAuth Providers

#### LinkedIn Configuration
1. **LinkedIn Developer Console**
   - Create app at [LinkedIn Developers](https://www.linkedin.com/developers/)
   - Add redirect URI from Clerk Dashboard
   - Configure OAuth scopes: `r_liteprofile r_emailaddress`

#### Discord Configuration
1. **Discord Developer Portal**
   - Create app at [Discord Developer Portal](https://discord.com/developers/applications)
   - Add redirect URI from Clerk Dashboard
   - Configure OAuth scopes: `identify email`

## Environment Variables

### Development vs Production

#### Development Environment Variables
```env
# Development Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

#### Production Environment Variables
```env
# Production Clerk Configuration
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."
```

### Complete Production Configuration

```env
# =============================================================================
# CLERK PRODUCTION CONFIGURATION
# =============================================================================

# Clerk Authentication (Production)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_bGF6eWdhbWVkZXZzLmdyZWF0LXBlbmd1aW4tNzguY2xlcmsuYWNjb3VudHMuZGV2JA"
CLERK_SECRET_KEY="sk_live_abcdef123456789..."

# Clerk URLs (Production)
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/dashboard"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/dashboard"

# Clerk Domain Configuration
NEXT_PUBLIC_CLERK_DOMAIN="accounts.lazygamedevs.com"

# Webhook Configuration
CLERK_WEBHOOK_SECRET="whsec_production_secret_here"

# Security Configuration
CLERK_JWT_KEY="-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...
-----END PUBLIC KEY-----"

# =============================================================================
# APPLICATION CONFIGURATION
# =============================================================================

# Application URLs
APP_URL="https://lazygamedevs.com"
API_BASE_URL="https://lazygamedevs.com/api"
NEXT_PUBLIC_APP_URL="https://lazygamedevs.com"

# Domain Configuration
PRODUCTION_DOMAIN="lazygamedevs.com"
AUTH_DOMAIN="accounts.lazygamedevs.com"

# =============================================================================
# SECURITY SETTINGS
# =============================================================================

# Authorized Parties (Security)
CLERK_AUTHORIZED_PARTIES="https://lazygamedevs.com,https://www.lazygamedevs.com"

# CORS Configuration
CORS_ORIGINS="https://lazygamedevs.com,https://www.lazygamedevs.com,https://accounts.lazygamedevs.com"

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=100
```

### Environment Variable Security

1. **Never Commit Secrets**
   - Add `.env*` to `.gitignore`
   - Use hosting platform environment variables

2. **Secret Management**
   ```bash
   # Generate secure secrets
   openssl rand -base64 32  # For general secrets
   openssl rand -hex 32     # For webhook secrets
   ```

3. **Hosting Platform Configuration**
   - **Vercel**: Project Settings > Environment Variables
   - **AWS**: Systems Manager Parameter Store
   - **Azure**: App Service Configuration

## Webhook Configuration

### Step 1: Webhook Endpoint Setup

1. **Create Webhook Endpoint**
   - Clerk Dashboard > **Webhooks**
   - **Add Endpoint**
   - **Endpoint URL**: `https://lazygamedevs.com/api/webhooks/clerk`

2. **Select Events**
   ```
   ✅ user.created
   ✅ user.updated
   ✅ user.deleted
   ✅ session.created
   ✅ session.ended
   ```

3. **Save Signing Secret**
   - Copy the signing secret from webhook settings
   - Add to environment variables as `CLERK_WEBHOOK_SECRET`

### Step 2: Webhook Handler Implementation

```typescript
// app/api/webhooks/clerk/route.ts
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { WebhookEvent } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  // Get the headers
  const headerPayload = headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occured -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET || '');

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occured', {
      status: 400
    });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);

  // Handle specific events
  if (evt.type === 'user.created') {
    // Sync user to database
    // Send welcome email
    // Initialize user preferences
  }

  if (evt.type === 'user.updated') {
    // Update user in database
    // Sync profile changes
  }

  if (evt.type === 'user.deleted') {
    // Clean up user data
    // Cancel subscriptions
  }

  return new Response('', { status: 200 });
}
```

### Step 3: Middleware Configuration

```typescript
// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',  // Important: Make webhook route public
  '/api/health',
])

export default clerkMiddleware((auth, req) => {
  if (isPublicRoute(req)) return
  auth().protect()
}, {
  // Production security configuration
  authorizedParties: [
    'https://lazygamedevs.com',
    'https://www.lazygamedevs.com'
  ]
})

export const config = {
  matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
}
```

## Security Configuration

### Step 1: Authorized Parties

```typescript
// Configure authorized parties for security
clerkMiddleware({
  authorizedParties: [
    'https://lazygamedevs.com',
    'https://www.lazygamedevs.com',
    process.env.PRODUCTION_DOMAIN
  ]
})
```

### Step 2: Content Security Policy (CSP)

```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline' https://clerk.clerk.com;
      connect-src 'self' https://api.clerk.com https://clerk.clerk.com;
      img-src 'self' data: https://img.clerk.com https://images.clerk.dev;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data:;
    `.replace(/\s{2,}/g, ' ').trim()
  }
]

module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}
```

### Step 3: Rate Limiting

```typescript
// lib/rate-limit.ts
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function rateLimit(identifier: string) {
  const result = await redis.incr(identifier)

  if (result === 1) {
    await redis.expire(identifier, 60) // 1 minute window
  }

  return result > 10 // Max 10 requests per minute
}
```

## Deployment Checklist

### Pre-Deployment Verification

- [ ] **Domain Configuration**
  - [ ] DNS records configured and propagated
  - [ ] SSL certificates issued
  - [ ] Domain verification in Clerk Dashboard

- [ ] **OAuth Providers**
  - [ ] Google OAuth app published to production
  - [ ] GitHub OAuth app configured
  - [ ] All redirect URIs updated to production domains
  - [ ] OAuth credentials added to Clerk Dashboard

- [ ] **Environment Variables**
  - [ ] Production Clerk keys configured
  - [ ] Webhook secrets configured
  - [ ] All required environment variables set
  - [ ] No development keys in production

- [ ] **Security Configuration**
  - [ ] Authorized parties configured
  - [ ] CSP headers configured
  - [ ] Rate limiting enabled
  - [ ] CORS origins configured

- [ ] **Webhook Configuration**
  - [ ] Webhook endpoints created
  - [ ] Event subscriptions configured
  - [ ] Webhook handlers tested
  - [ ] Webhook routes marked as public

### Deployment Steps

1. **Deploy Application**
   ```bash
   # Deploy to Vercel
   vercel --prod

   # Or deploy to other platforms
   npm run build
   npm run start
   ```

2. **Verify Deployment**
   - [ ] Application loads without errors
   - [ ] Authentication flows work
   - [ ] OAuth providers functional
   - [ ] Webhooks receiving events
   - [ ] DNS resolution working

3. **Post-Deployment Testing**
   - [ ] Test user registration
   - [ ] Test OAuth sign-in (Google, GitHub)
   - [ ] Test webhook events
   - [ ] Test error handling
   - [ ] Test rate limiting

### Certificate Deployment

1. **Deploy Certificates**
   - In Clerk Dashboard, complete all required steps
   - Click **Deploy certificates** button
   - Monitor deployment progress

2. **Verify SSL**
   ```bash
   # Test SSL certificate
   curl -I https://accounts.lazygamedevs.com

   # Check certificate details
   openssl s_client -connect accounts.lazygamedevs.com:443
   ```

## Troubleshooting

### Common Issues

#### 1. DNS Propagation Issues

**Problem**: Domain not resolving or certificate issues

**Solutions**:
```bash
# Check DNS propagation
dig accounts.lazygamedevs.com
nslookup accounts.lazygamedevs.com 8.8.8.8

# Cloudflare users: Set DNS to "DNS only" mode
# Disable orange cloud proxy for auth subdomain
```

#### 2. OAuth Redirect URI Mismatch

**Problem**: OAuth providers showing redirect URI errors

**Solutions**:
- Verify redirect URIs in OAuth provider settings
- Ensure exact match (including https://)
- Check for trailing slashes
- Wait for DNS propagation

**Google OAuth URIs**:
```
https://accounts.lazygamedevs.com/v1/oauth_callback/google
```

**GitHub OAuth URIs**:
```
https://accounts.lazygamedevs.com/v1/oauth_callback/github
```

#### 3. Webhook Verification Failures

**Problem**: Webhooks failing verification

**Solutions**:
```typescript
// Ensure webhook secret is correct
const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
if (!WEBHOOK_SECRET) {
  throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
}

// Check webhook URL in Clerk Dashboard
// Ensure route is public in middleware
// Verify svix headers are being received
```

#### 4. Environment Variable Issues

**Problem**: Authentication not working in production

**Solutions**:
- Verify production keys are used (pk_live_, sk_live_)
- Check environment variables in hosting platform
- Ensure no development keys in production
- Restart application after environment changes

#### 5. CORS Errors

**Problem**: Cross-origin request errors

**Solutions**:
```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://accounts.lazygamedevs.com',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
        ],
      },
    ]
  },
}
```

### Debug Tools

#### 1. Clerk Dashboard Tools

- **Webhooks > Message Attempts**: View webhook delivery status
- **Events**: Monitor authentication events
- **Sessions**: Debug active sessions
- **Users**: Manage user accounts

#### 2. Browser Developer Tools

```javascript
// Check Clerk client status
window.Clerk?.client
window.Clerk?.session
window.Clerk?.user

// Debug authentication state
console.log('Auth state:', window.Clerk?.loaded, window.Clerk?.isLoaded);
```

#### 3. Server-Side Debugging

```typescript
// Add debug logging
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const { userId, sessionId } = auth();
  console.log('Auth debug:', { userId, sessionId });

  // Check environment
  console.log('Environment:', {
    publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
    hasSecretKey: !!process.env.CLERK_SECRET_KEY
  });
}
```

### Performance Optimization

#### 1. Preload Clerk Components

```typescript
// _app.tsx or layout.tsx
import { ClerkProvider } from '@clerk/nextjs'

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        baseTheme: 'light', // or 'dark'
        variables: {
          // Custom styling
        }
      }}
    >
      {children}
    </ClerkProvider>
  )
}
```

#### 2. Optimize Webhook Processing

```typescript
// Use background processing for heavy operations
export async function POST(req: NextRequest) {
  const evt = await verifyWebhook(req);

  // Quick response
  const response = new Response('OK', { status: 200 });

  // Process in background
  processWebhookAsync(evt);

  return response;
}

async function processWebhookAsync(evt: WebhookEvent) {
  // Heavy database operations
  // Email sending
  // Third-party API calls
}
```

## Additional Resources

### Documentation Links

- [Clerk Production Deployment Guide](https://clerk.com/docs/guides/development/deployment/production)
- [Google OAuth Setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/google)
- [GitHub OAuth Setup](https://clerk.com/docs/guides/configure/auth-strategies/social-connections/github)
- [Clerk Webhooks Guide](https://clerk.com/docs/guides/development/webhooks/syncing)
- [Environment Variables Reference](https://clerk.com/docs/guides/development/clerk-environment-variables)

### Community Support

- [Clerk Discord Community](https://discord.com/invite/b5rXHjAg7A)
- [Clerk GitHub Issues](https://github.com/clerk/javascript/issues)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/clerk)

### Security Best Practices

1. **Regular Security Reviews**
   - Audit OAuth applications quarterly
   - Rotate secrets annually
   - Monitor webhook logs
   - Review user permissions

2. **Monitoring and Alerting**
   - Set up webhook failure alerts
   - Monitor authentication error rates
   - Track unusual login patterns
   - Log security events

3. **Backup and Recovery**
   - Document OAuth application settings
   - Backup webhook configurations
   - Maintain environment variable inventory
   - Test disaster recovery procedures

---

**Last Updated**: September 30, 2024
**Version**: 1.0.0
**Maintained by**: LazyGameDevs Team