# Vercel Production Deployment Guide

## Prerequisites

### Required Accounts and Services
- [ ] Vercel account with Pro plan (recommended for production)
- [ ] GitHub repository access
- [ ] Production database (PostgreSQL)
- [ ] Redis service (Upstash, Railway, or similar)
- [ ] Clerk account with production application
- [ ] Dodo Payments production account
- [ ] Domain name (optional, can use vercel.app subdomain)

### Required Files
- [ ] `.env.production.template` (provided)
- [ ] `vercel.json` (configured)
- [ ] `PRODUCTION_SECURITY_CHECKLIST.md` (provided)
- [ ] `PRODUCTION_DATABASE_SETUP.md` (provided)

## Step 1: Vercel Project Setup

### 1.1 Create Vercel Project
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Initialize project
cd gamelearn-platform
vercel

# Follow prompts:
# - Link to existing project: No
# - Project name: gamelearn-platform
# - Directory: ./
# - Override settings: No
```

### 1.2 Configure Project Settings
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings → General
4. Configure:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Install Command**: `npm install`
   - **Output Directory**: Default (`.next`)

## Step 2: Environment Variables Configuration

### 2.1 Production Environment Variables
Navigate to Project Settings → Environment Variables and add these variables:

#### Core Application (Required)
```env
NODE_ENV=production
APP_URL=https://your-production-domain.vercel.app
API_BASE_URL=https://your-production-domain.vercel.app/api
APP_NAME=GameLearn Platform by LazyGameDevs
COMPANY_NAME=LazyGameDevs
COMPANY_EMAIL=hello@lazygamedevs.com
SUPPORT_EMAIL=support@lazygamedevs.com
```

#### Database (Required)
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require&connection_limit=20
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=15000
```

#### Authentication (Required)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY
CLERK_SECRET_KEY=sk_live_YOUR_PRODUCTION_KEY
CLERK_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard
```

#### Security (Required)
```env
JWT_SECRET=YOUR_64_CHAR_JWT_SECRET_GENERATE_WITH_OPENSSL
ENCRYPTION_KEY=YOUR_32_CHAR_ENCRYPTION_KEY_GENERATE_WITH_OPENSSL
SESSION_TIMEOUT=3600
```

#### Redis (Required for Production)
```env
REDIS_URL=rediss://default:password@host:port
REDIS_CONNECT_TIMEOUT=10000
REDIS_COMMAND_TIMEOUT=5000
```

#### Payments (Required if ENABLE_PAYMENTS=true)
```env
DODO_API_KEY=YOUR_PRODUCTION_DODO_API_KEY
DODO_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_WEBHOOK_SECRET
DODO_ENVIRONMENT=live
```

#### Feature Flags
```env
ENABLE_COLLABORATION=true
ENABLE_WEBSOCKETS=true
ENABLE_CACHING=true
ENABLE_ANALYTICS=true
ENABLE_PAYMENTS=true
ENABLE_EMAIL=true
MAINTENANCE_MODE=false
```

#### Monitoring (Recommended)
```env
LOG_LEVEL=info
SENTRY_DSN=https://YOUR_SENTRY_DSN@sentry.io/PROJECT_ID
ENABLE_METRICS=true
```

#### Security Configuration
```env
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=900
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGINS=https://your-production-domain.vercel.app,https://lazygamedevs.com
```

### 2.2 Environment Variable Environments
Configure variables for different environments:
- **Production**: Live production values
- **Preview**: Staging/preview values (can use same as production for testing)
- **Development**: Development values (optional, uses local .env.local)

## Step 3: Domain Configuration

### 3.1 Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `learn.lazygamedevs.com`)
3. Configure DNS records as instructed by Vercel
4. Update environment variables with new domain:
   ```env
   APP_URL=https://learn.lazygamedevs.com
   API_BASE_URL=https://learn.lazygamedevs.com/api
   CORS_ORIGINS=https://learn.lazygamedevs.com,https://lazygamedevs.com
   ```

### 3.2 SSL Certificate
- Vercel automatically provisions SSL certificates
- Certificates auto-renew
- Verify HTTPS works after domain setup

## Step 4: External Service Configuration

### 4.1 Clerk Configuration
1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Update allowed origins:
   - Add production domain to allowed origins
   - Configure webhook endpoint: `https://your-domain.vercel.app/api/webhooks/clerk`
3. Update OAuth provider settings:
   - Google: Add production domain to authorized origins
   - GitHub: Update authorization callback URL
   - Microsoft: Configure production redirect URIs

### 4.2 Payment Provider Setup
#### Dodo Payments
1. Go to Dodo Payments dashboard
2. Configure webhook endpoint: `https://your-domain.vercel.app/api/webhooks/dodo`
3. Update API keys to production keys
4. Set environment to `live`

#### Alternative Payment Providers
```env
# Stripe (if using)
STRIPE_SECRET_KEY=sk_live_YOUR_STRIPE_SECRET
STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_STRIPE_KEY
STRIPE_WEBHOOK_SECRET=whsec_YOUR_STRIPE_WEBHOOK_SECRET

# PayPal (if using)
PAYPAL_CLIENT_ID=YOUR_PAYPAL_PRODUCTION_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_PAYPAL_PRODUCTION_SECRET
PAYPAL_WEBHOOK_ID=YOUR_PAYPAL_PRODUCTION_WEBHOOK_ID
```

### 4.3 Database Setup
Follow the `PRODUCTION_DATABASE_SETUP.md` guide to:
1. Set up production PostgreSQL database
2. Configure SSL connections
3. Set up connection pooling
4. Configure backups
5. Apply database migrations

### 4.4 Redis Setup
Recommended providers:
- **Upstash**: Redis for serverless applications
- **Railway**: Simple PostgreSQL and Redis hosting
- **Redis Cloud**: Managed Redis service

Configuration:
```env
REDIS_URL=rediss://default:password@host:port
```

## Step 5: Deployment Process

### 5.1 Initial Deployment
```bash
# Deploy to production
vercel --prod

# Or deploy specific branch
vercel --prod --target production
```

### 5.2 Deployment Verification
1. **Health Check**: Visit `/api/health`
2. **Authentication**: Test sign-in/sign-up flow
3. **Database**: Verify data persistence
4. **Payments**: Test payment flow (with test amounts)
5. **Video Streaming**: Test video access
6. **API Endpoints**: Test critical API routes

### 5.3 Database Migration
```bash
# Run migrations on production database
npx prisma migrate deploy

# Seed production database (if needed)
npm run db:seed
```

## Step 6: Monitoring and Logging

### 6.1 Vercel Analytics
1. Enable Vercel Analytics in project settings
2. Monitor Core Web Vitals
3. Track user engagement metrics

### 6.2 Error Monitoring
#### Sentry Setup
1. Create Sentry project
2. Add DSN to environment variables
3. Configure error tracking thresholds

#### Log Monitoring
```bash
# View deployment logs
vercel logs --follow

# View function logs
vercel logs --function api/courses/[id]/route.ts
```

### 6.3 Performance Monitoring
1. **Vercel Speed Insights**: Automatic performance tracking
2. **Database Monitoring**: Use database provider dashboards
3. **Redis Monitoring**: Monitor cache hit rates
4. **API Monitoring**: Track response times and error rates

## Step 7: Security Configuration

### 7.1 Security Headers
Configured in `vercel.json`:
- Content Security Policy
- X-Frame-Options
- X-Content-Type-Options
- Strict Transport Security

### 7.2 Rate Limiting
Middleware automatically applies rate limiting:
- API routes: 200 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Payments: 10 attempts per 15 minutes

### 7.3 CORS Configuration
```env
CORS_ORIGINS=https://your-production-domain.vercel.app,https://lazygamedevs.com
```

## Step 8: Backup and Recovery

### 8.1 Database Backups
- Configure automated daily backups
- Test backup restoration procedures
- Document recovery processes

### 8.2 Environment Variable Backup
1. Export environment variables from Vercel dashboard
2. Store securely in password manager
3. Document which variables are critical

### 8.3 Code Backup
- Ensure code is backed up in GitHub
- Tag production releases
- Maintain deployment rollback procedures

## Step 9: Production Checklist

### Pre-Deployment
- [ ] All environment variables configured
- [ ] Database migrations tested
- [ ] External services configured
- [ ] Security review completed
- [ ] Performance testing completed
- [ ] Monitoring configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Authentication flow working
- [ ] Payment processing working
- [ ] Video streaming working
- [ ] Monitoring receiving data
- [ ] Error tracking configured
- [ ] SSL certificate active
- [ ] Custom domain working (if configured)

## Troubleshooting

### Common Issues

#### Build Failures
```bash
# Check build logs
vercel logs --build

# Common fixes:
# - Verify all environment variables are set
# - Check TypeScript compilation errors
# - Ensure all dependencies are in package.json
```

#### Database Connection Issues
```bash
# Test database connection
npx prisma db pull

# Common fixes:
# - Verify DATABASE_URL format
# - Check SSL requirements
# - Verify database user permissions
```

#### Authentication Issues
```bash
# Check Clerk configuration
# - Verify publishable key is public
# - Check webhook secret is set
# - Verify allowed origins include production domain
```

#### Payment Processing Issues
```bash
# Check payment provider configuration
# - Verify webhook endpoints are correct
# - Check API keys are production keys
# - Test webhook signature verification
```

### Emergency Procedures

#### Rollback Deployment
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote [deployment-url]
```

#### Enable Maintenance Mode
```env
MAINTENANCE_MODE=true
```

#### Database Recovery
Follow procedures in `PRODUCTION_DATABASE_SETUP.md`

## Performance Optimization

### 1. Vercel Configuration
- **Regions**: Configured for global distribution (iad1, fra1, sin1)
- **Function Duration**: Extended for payment and video operations
- **Caching**: Static assets cached for 1 year

### 2. Database Optimization
- Connection pooling enabled
- Proper indexes configured
- Query optimization monitoring

### 3. Redis Caching
- Session data cached
- API responses cached where appropriate
- Cache invalidation strategies implemented

## Support and Maintenance

### Regular Tasks
- **Weekly**: Review error logs and performance metrics
- **Monthly**: Security updates and dependency updates
- **Quarterly**: Security audit and performance review

### Contact Information
- **DevOps Team**: devops@lazygamedevs.com
- **Security Team**: security@lazygamedevs.com
- **Support Team**: support@lazygamedevs.com

### Documentation Updates
- Update this guide after each production deployment
- Document any configuration changes
- Maintain runbook for common operations

---

**Last Updated**: Production deployment preparation
**Next Review**: After first production deployment
**Owner**: DevOps Team, LazyGameDevs