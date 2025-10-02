# GameLearn Platform - Setup Guide

This guide covers setting up authentication (Clerk), payments (Dodo Payments), database, and environment configuration.

## Prerequisites

- Node.js 18+ 
- PostgreSQL or SQLite (for development)
- npm or yarn
- Vercel account (for deployment)

## Quick Start

```bash
# Clone and install
git clone <repository>
cd LazyLearners
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your keys

# Initialize database
npx prisma db push
npx prisma generate

# Run development server
npm run dev
```

## Environment Variables

### Required Variables
```env
# Database
DATABASE_URL="postgresql://..." # or file:./dev.db for SQLite

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"

# Application
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Dodo Payments
DODO_API_KEY="your-api-key"
DODO_WEBHOOK_SECRET="whsec_..."
DODO_ENVIRONMENT="test" # or "live"
```

### Optional Variables
```env
# Redis (optional caching)
REDIS_URL="redis://localhost:6379"
ENABLE_CACHING=false

# Sentry (optional monitoring)
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# Feature Flags
ENABLE_VIDEO_TEST=true
ENABLE_PAYMENTS=true
ENABLE_COLLABORATION=false
```

## Clerk Authentication Setup

### 1. Create Clerk Application
1. Go to [clerk.com](https://clerk.com)
2. Create new application
3. Enable Email + Password authentication
4. Add OAuth providers (Google, GitHub)

### 2. Get API Keys
Copy from Clerk Dashboard:
- Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- Secret Key → `CLERK_SECRET_KEY`

### 3. Configure Webhooks
Set up webhook endpoint in Clerk Dashboard:

**Endpoint URL**: `https://your-domain.com/api/webhooks/clerk`

**Events to Subscribe**:
- `user.created`
- `user.updated`
- `user.deleted`

**Get Webhook Secret**: Copy to `CLERK_WEBHOOK_SECRET`

### 4. User Roles
The platform uses role-based access control:
- **STUDENT**: Default role for learners
- **INSTRUCTOR**: Can create and manage courses
- **ADMIN**: Full platform access

Roles are stored in Clerk metadata and synced to the database via webhooks.

## Dodo Payments Setup

### 1. Create Dodo Account
1. Sign up at [dodopayments.com](https://dodopayments.com)
2. Get API credentials from dashboard
3. Set `DODO_API_KEY` in environment

### 2. Configure Webhook
Set webhook URL in Dodo Dashboard:

**Endpoint**: `https://your-domain.com/api/payments/webhooks`

**Events**:
- `payment.succeeded`
- `payment.failed`
- `subscription.created`
- `subscription.cancelled`

**Copy Webhook Secret** to `DODO_WEBHOOK_SECRET`

### 3. Test Mode
For development, set:
```env
DODO_ENVIRONMENT="test"
```

Use test credit cards from Dodo documentation.

### 4. License Key System
The platform uses license keys for course access:
- Keys generated automatically on successful payment
- One license key per course per user
- Keys validated before streaming video content

## Database Setup

### Development (SQLite)
```env
DATABASE_URL="file:./dev.db"
```

```bash
npx prisma db push
npx prisma generate
npm run db:seed  # Optional: seed sample data
```

### Production (PostgreSQL)
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

```bash
npx prisma db push
npx prisma generate
```

### Database Schema
The schema includes:
- User management (synced with Clerk)
- Course/Module/Lesson hierarchy
- Enrollment and progress tracking
- Payment and license keys
- Video streaming sessions
- Quiz and assessment system

## Video Streaming Setup

### Upload Configuration
Max file size: 2GB
Supported formats: MP4, MOV, AVI, WebM

### Quality Profiles
- 1080p: Original quality
- 720p: High quality
- 480p: Standard quality
- 360p: Low quality (mobile)

### Storage
Videos are processed and stored according to configuration in `src/lib/video/processing.ts`

## Development Workflow

### Running the App
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Run production build
```

### Database Operations
```bash
npx prisma studio    # Open database GUI
npx prisma db push   # Apply schema changes
npx prisma generate  # Update Prisma client
npm run db:seed      # Seed database
```

### Testing
```bash
npm test            # Run all tests
npm run test:watch  # Watch mode
npm run test:e2e    # End-to-end tests
```

## Production Deployment

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Post-Deployment
1. Set Clerk production webhooks
2. Set Dodo production webhooks
3. Run database migrations
4. Test critical user flows
5. Monitor error tracking

## Troubleshooting

### Common Issues

**Prisma Client Generation**
```bash
npx prisma generate
```

**Database Connection**
Check DATABASE_URL format and credentials

**Clerk Webhook Errors**
Verify webhook secret and endpoint URL

**Payment Processing**
Check Dodo API key and webhook configuration

### Debug Mode
Enable verbose logging:
```env
NODE_ENV=development
DEBUG=true
```

## Security Checklist

- [ ] All API keys in environment variables (not committed)
- [ ] Webhook secrets configured
- [ ] Database connection uses SSL in production
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] Clerk session validation active

## Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Dodo Payments API](https://dodopayments.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)

---

For more details, see:
- `CLAUDE.md` - Development guide for AI assistants
- `TESTING.md` - Testing strategy and commands
- `README.md` - Project overview
