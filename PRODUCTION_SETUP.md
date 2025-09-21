# Production Environment Setup Guide

## Current Status
✅ **Vercel Deployment**: Successfully deployed to production
🔗 **Production URL**: https://gamelearn-platform-k6t2ug2a1-thelazyindiantechies-projects.vercel.app
🔗 **Vercel Dashboard**: https://vercel.com/thelazyindiantechies-projects/gamelearn-platform-lms/settings

## Required External Services

### 1. PostgreSQL Database Setup

**Recommended Providers (from Vercel Marketplace):**
- **Neon** (Recommended): Serverless PostgreSQL with generous free tier
- **Supabase**: PostgreSQL with additional features
- **PlanetScale**: MySQL-compatible serverless database
- **Prisma**: Instant Serverless Postgres

**Setup Steps:**
1. Go to [Vercel Marketplace Storage](https://vercel.com/marketplace/category/storage)
2. Choose a provider (Neon recommended for PostgreSQL)
3. Click "Add Integration" and follow the setup wizard
4. This will automatically configure `DATABASE_URL` environment variable

**Manual Configuration (if not using Vercel Postgres):**
```bash
# Example DATABASE_URL format
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"
```

### 2. Redis Setup

**Recommended Providers (from Vercel Marketplace):**
- **Upstash** (Recommended): Serverless Redis with REST API
- **Redis** (Alternative): Serverless Redis service

**Setup Steps:**
1. Go to [Vercel Marketplace Storage](https://vercel.com/marketplace/category/storage)
2. Search for "Redis" or choose "Upstash"
3. Click "Add Integration" and follow the setup wizard
4. This will automatically configure Redis environment variables

**Manual Configuration (if not using Vercel KV):**
```bash
# Example Redis configuration
REDIS_URL="redis://username:password@host:port"
# Or for Upstash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### 3. Required Environment Variables

Configure these in [Vercel Dashboard > Settings > Environment Variables](https://vercel.com/thelazyindiantechies-projects/gamelearn-platform-lms/settings/environment-variables):

```bash
# Database (Auto-configured with Vercel Postgres)
DATABASE_URL=postgresql://...

# Redis (Auto-configured with Vercel KV)
REDIS_URL=redis://...

# Authentication (Required for NextAuth)
NEXTAUTH_SECRET=your-random-secret-key-here
NEXTAUTH_URL=https://gamelearn-platform-k6t2ug2a1-thelazyindiantechies-projects.vercel.app

# JWT & Encryption (Required for security)
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-32-char-encryption-key-here

# OAuth Providers (Optional, for social login)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Email (Optional, for transactional emails)
EMAIL_SERVER=smtp://username:password@smtp.example.com:587
EMAIL_FROM=noreply@lazygamedevs.com

# File Storage (Optional, for video uploads)
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
```

## Quick Setup Commands

### Option 1: Using Vercel Integrations (Recommended)
1. Visit the Vercel dashboard settings page
2. Add integrations for Postgres and KV (Redis)
3. Set remaining environment variables manually

### Option 2: Manual Environment Setup
```bash
# Set critical environment variables
npx vercel env add NEXTAUTH_SECRET production
npx vercel env add NEXTAUTH_URL production
npx vercel env add JWT_SECRET production
npx vercel env add ENCRYPTION_KEY production

# Set database and Redis URLs
npx vercel env add DATABASE_URL production
npx vercel env add REDIS_URL production
```

### Option 3: Using External Providers

**Neon PostgreSQL Setup:**
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to `DATABASE_URL`

**Upstash Redis Setup:**
1. Sign up at [upstash.com](https://upstash.com)
2. Create a new Redis database
3. Copy the REST URL and token

## Database Migration

After configuring the database, run migrations:

```bash
# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Seed initial data (optional)
npx prisma db seed
```

## Testing Production Setup

After configuration:

1. **Test Homepage**: Visit the production URL
2. **Test Authentication**: Try signing up/logging in
3. **Test Video APIs**: Use authenticated requests to test video streaming
4. **Monitor Logs**: Check Vercel function logs for any errors

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is set with a strong random value
- [ ] `JWT_SECRET` is set with a strong random value
- [ ] `ENCRYPTION_KEY` is exactly 32 characters long
- [ ] Database connection uses SSL (`sslmode=require`)
- [ ] Redis connection is secured with authentication
- [ ] All secrets are environment variables, not hardcoded
- [ ] Production URLs are configured correctly

## Monitoring & Maintenance

- **Vercel Analytics**: Monitor performance and usage
- **Database Monitoring**: Track query performance and connections
- **Redis Monitoring**: Monitor cache hit rates and memory usage
- **Error Tracking**: Set up Sentry or similar for error monitoring
- **Uptime Monitoring**: Set up health checks for critical endpoints

## Support & Troubleshooting

**Common Issues:**
1. **500 Server Error**: Check environment variables are set correctly
2. **Database Connection**: Verify DATABASE_URL format and network access
3. **Redis Connection**: Ensure Redis service is running and accessible
4. **Authentication**: Verify NEXTAUTH_* variables are configured

**Debugging:**
- Check Vercel function logs: `npx vercel logs`
- Test database connection: Use Prisma Studio or direct SQL client
- Test Redis connection: Use Redis CLI or management interface

---

**Next Steps:**
1. Configure external database and Redis
2. Set all required environment variables
3. Test the full video streaming functionality in production
4. Set up monitoring and error tracking