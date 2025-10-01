# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LazyGameDevs GameLearn Platform** - A comprehensive game development Learning Management System (LMS) built with Next.js 15, TypeScript, and modern web technologies. The platform combines Udemy's marketplace model with specialized game development education tools.

The platform is ~90% complete with production-ready infrastructure including Clerk authentication, Dodo Payments MCP integration, video streaming, and course management systems.

## Development Commands

**Core Development:**
```bash
npm run dev                      # Start development server with Turbopack
npm run build                    # Build for production (includes Prisma generation)
npm start                        # Start production server
npm install                      # Install dependencies (runs postinstall Prisma generation)
```

**Database Operations:**
```bash
npx prisma generate              # Generate Prisma client
npx prisma db push               # Push schema to database
npx prisma studio                # Open Prisma Studio
npm run db:seed                  # Seed database with sample data
```

**Testing:**
```bash
npm run test                     # Run all tests
npm run test:watch               # Run tests in watch mode
npm run test:coverage            # Run tests with coverage report
npm run test:unit                # Run unit tests only
npm run test:integration         # Run integration tests only
npm run test:critical            # Run critical path tests
npm run test:e2e                 # Run Playwright E2E tests
npm run test:e2e:ui              # Run E2E tests with UI
npm run test:video-streaming     # Run video streaming tests
npm run test:full-suite          # Run complete test suite
```

**Code Quality:**
```bash
npm run lint                     # Run ESLint
```

**Security Testing:**
```bash
npm run security:test            # Basic security test
npm run security:test:comprehensive  # Comprehensive security test
npm run security:monitor         # Monitor security endpoints (requires dev server)
npm run security:dashboard       # View database security dashboard (requires dev server)
```

**Production:**
```bash
npm run production:deploy        # Deploy to Vercel production
npm run production:verify        # Verify production deployment health
```

**UI Components:**
```bash
npx shadcn@latest add [component]  # Add shadcn/ui components
```

## Architecture Overview

### Core Technology Stack
- **Framework:** Next.js 15 with App Router and TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** Clerk with multi-role system (Student, Instructor, Admin)
- **UI Components:** shadcn/ui with Radix UI and Tailwind CSS
- **Payments:** Dodo Payments with MCP integration
- **Caching:** Redis for sessions and caching (optional)
- **Testing:** Jest with Testing Library + Playwright for E2E
- **Deployment:** Vercel with automated deployments
- **Monitoring:** Sentry (optional)

### Directory Structure

```
LazyLearners/
├── src/
│   ├── app/                    # Next.js 15 App Router
│   │   ├── api/               # API routes
│   │   ├── (auth)/            # Auth pages (signin, signup)
│   │   ├── courses/           # Course browsing and viewing
│   │   ├── dashboard/         # User dashboard
│   │   ├── instructor/        # Instructor-specific pages
│   │   └── ...                # Other page routes
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   ├── course/           # Course-related components
│   │   ├── video/            # Video player components
│   │   ├── payment/          # Payment UI components
│   │   └── ...
│   ├── lib/                   # Core business logic
│   │   ├── config/           # Environment config with Zod validation
│   │   ├── payments/         # Payment processing (Dodo, Stripe, PayPal)
│   │   ├── mcp/              # Model Context Protocol integration
│   │   ├── security/         # Security monitoring and audit
│   │   ├── video/            # Video streaming and quality management
│   │   ├── validations/      # Zod validation schemas
│   │   └── ...
│   ├── hooks/                 # Custom React hooks
│   └── __tests__/             # Test files
│       ├── unit/
│       ├── integration/
│       └── critical/
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── seed.ts               # Database seeding
│   └── dev.db                # SQLite for local development
├── tests/                     # E2E tests
│   └── e2e/
│       └── user-journeys/
├── .taskmaster/               # Task Master AI integration
├── next.config.ts             # Next.js configuration
└── tailwind.config.js         # Tailwind CSS configuration
```

### Key API Routes

**Authentication:**
- `/api/webhooks/clerk` - Clerk webhook handler for user sync

**Courses:**
- `/api/courses` - List/create courses
- `/api/courses/[id]` - Get/update course details
- `/api/courses/[id]/modules` - Course modules
- `/api/courses/[id]/modules/[moduleId]/lessons` - Module lessons
- `/api/enrollment` - Enroll in courses

**Payments:**
- `/api/payments/checkout` - Initialize checkout
- `/api/payments/status/[paymentId]` - Check payment status
- `/api/payments/webhooks` - Dodo payment webhooks
- `/api/license/validate` - Validate license keys
- `/api/license/activate` - Activate license for course access

**Video:**
- `/api/video/stream` - Video streaming endpoint
- `/api/video/heartbeat` - Session heartbeat
- `/api/video/analytics` - Video analytics
- `/api/video/upload` - Video upload (instructor)

**Progress:**
- `/api/progress` - User progress tracking
- `/api/progress/course/[courseId]` - Course-specific progress

**Monitoring:**
- `/api/health` - Health check
- `/api/monitoring/security` - Security metrics
- `/api/monitoring/database` - Database metrics

### Key Systems

**Authentication Flow:**
- Clerk handles authentication with OAuth providers (Google, GitHub)
- Webhook sync keeps Prisma database in sync with Clerk users
- Multi-role system: Student, Instructor, Admin
- Middleware protects routes based on authentication and roles

**Payment Architecture:**
- Dodo Payments as primary processor with MCP integration
- License key-based course access control
- Webhook handling for payment events (payment.succeeded, payment.failed)
- Automatic license generation and activation on successful payments
- Fallback systems for development/testing

**Video Streaming:**
- Adaptive bitrate streaming for optimal quality
- Session management with access control
- Enrollment verification before streaming
- Quality selection and analytics tracking
- Test mode bypass with `ENABLE_VIDEO_TEST=true`

**Database Schema:**
- 20+ models covering full LMS functionality
- Course → Module → Lesson hierarchy
- User progress tracking with completion status
- Payment and license key relationships
- Quiz system with attempts and scoring

**Environment Configuration:**
The project uses comprehensive environment validation with Zod schemas. Key environment variables:

```env
# Database
DATABASE_URL="postgresql://..." or "file:./dev.db" for SQLite

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
CLERK_WEBHOOK_SECRET="whsec_..."

# Application URLs
APP_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Feature Flags
ENABLE_VIDEO_TEST=true          # Bypass video access control
ENABLE_PAYMENTS=true            # Enable payment processing
ENABLE_CACHING=false            # Enable Redis caching (optional)
ENABLE_COLLABORATION=false      # Enable real-time features (optional)

# Dodo Payments
DODO_API_KEY="your-dodo-api-key"
DODO_WEBHOOK_SECRET="whsec_..."
DODO_ENVIRONMENT="test"         # test or live

# Redis (Optional)
REDIS_URL="redis://localhost:6379"

# Sentry (Optional)
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"
```

## Development Workflows

### Working with Authentication
1. Configure Clerk environment variables (publishable key, secret key, webhook secret)
2. Set up webhook endpoint at `/api/webhooks/clerk` in Clerk dashboard
3. User data syncs automatically via webhooks
4. Use `@clerk/nextjs` components for auth UI

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update client
4. Update TypeScript types as needed
5. Update seed files if adding new models

### Adding API Routes
- Use Next.js App Router format: `src/app/api/[route]/route.ts`
- Include proper error handling and logging
- Add environment-specific configuration
- Implement TypeScript interfaces for request/response
- Add validation using Zod schemas from `src/lib/validations/`

### Working with Payments
1. Configure Dodo Payments environment variables
2. Use test API endpoints at `/api/test/dodo-integration`
3. Test webhook integration with local ngrok or deployed Vercel URL
4. MCP integration provides fallback for development
5. License keys are automatically generated on successful payments

### Video Streaming Development
- Set `ENABLE_VIDEO_TEST=true` to bypass access control during development
- Use `/api/video/stream` endpoint with course enrollment checks
- Test adaptive quality with different network conditions
- Heartbeat system tracks active viewing sessions

### Testing Approach
1. **Unit Tests:** Test individual functions, utilities, and pure logic
2. **Integration Tests:** Test API routes, database operations, payment flows
3. **Critical Tests:** Test critical user journeys (video streaming, payments)
4. **E2E Tests:** Test complete user workflows with Playwright
5. **Security Tests:** Validate security configurations and vulnerability scanning

Test files use pattern: `*.test.ts` or `*.spec.ts`
Coverage thresholds: 70% for branches, functions, lines, and statements

### Adding UI Components
1. Use `npx shadcn@latest add [component]` for new shadcn components
2. Place custom components in appropriate `src/components/` subdirectory
3. Use Tailwind CSS with the design system tokens defined in `tailwind.config.js`
4. Follow accessibility best practices (WCAG 2.1 AA compliance)

## Production Deployment

The platform is deployed on Vercel with:
- Automatic deployments from main branch
- Environment variable management via Vercel dashboard
- Prisma client generation during build process (`npm run build` includes `prisma generate`)
- Webhook endpoints configured for Clerk and Dodo Payments
- Security headers configured in `next.config.ts`

**Current Production URL:** `https://gamelearn-platform-[hash]-thelazyindiantechies-projects.vercel.app`

### Pre-Deployment Checklist
1. All environment variables configured in Vercel
2. Database migrations applied
3. Clerk webhook endpoint configured with production URL
4. Dodo webhook endpoint configured with production URL
5. Test suite passing (`npm run test:full-suite`)
6. Build succeeds locally (`npm run build`)

## Key Implementation Notes

**MCP Integration:** Uses Model Context Protocol for Dodo Payments API calls with development fallbacks

**License Key System:** Course access is controlled via license keys generated on successful payments. Keys are validated before allowing video streaming or content access.

**Clerk Sync:** Clerk webhooks automatically sync user data to Prisma database. The webhook handler (`/api/webhooks/clerk`) processes user.created, user.updated, and user.deleted events.

**Video Security:** Production video streaming includes enrollment verification and session management. Use `ENABLE_VIDEO_TEST=true` to bypass checks in development.

**Environment Validation:** Comprehensive Zod-based validation in `src/lib/config/` prevents configuration errors at runtime.

**Payment Webhooks:** Real webhook handling with signature verification for payment events. Webhooks automatically create/activate license keys.

## Current Development Status

The MVP is ~90% complete with core infrastructure finished. Primary remaining work:
- Content management UI for instructors (upload, edit courses/modules/lessons)
- Database seeding with sample courses for testing
- Enhanced video-lesson integration
- Real-time collaboration features (optional)
- Performance optimizations

See `MVP_STATUS.md` for detailed completion status and roadmap.

## Task Master AI Integration

This project uses Task Master AI for task tracking and project management. See `.taskmaster/CLAUDE.md` for comprehensive Task Master workflows and commands.

**Quick Task Master Commands:**
```bash
task-master list                 # Show all tasks
task-master next                 # Get next available task
task-master show <id>           # View task details
task-master set-status --id=<id> --status=done  # Mark task complete
```

Task Master MCP tools are also available - see `.mcp.json` configuration.
