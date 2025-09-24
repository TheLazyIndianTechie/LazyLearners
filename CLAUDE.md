# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**LazyGameDevs GameLearn Platform** - A comprehensive game development Learning Management System (LMS) built with Next.js 15, TypeScript, and modern web technologies. The platform combines Udemy's marketplace model with specialized game development education tools.

The platform is currently ~90% complete with production-ready infrastructure including full Dodo Payments MCP integration, video streaming, authentication, and course management systems.

## Development Commands

**Important:** All development commands should be run from the `gamelearn-platform/` directory.

**Core Development:**
```bash
cd gamelearn-platform            # Navigate to main app directory (REQUIRED)
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
npm run test:integration         # Run integration tests only
npm run test:unit                # Run unit tests only
npm run test:ci                  # Run tests for CI/CD
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

**UI Components:**
```bash
npx shadcn@latest add [component]  # Add shadcn/ui components
```

## Architecture Overview

### Core Technology Stack
- **Framework:** Next.js 15 with App Router and TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js with OAuth providers (Google, GitHub)
- **UI Components:** shadcn/ui with Radix UI and Tailwind CSS
- **Payments:** Dodo Payments with MCP integration
- **Caching:** Redis for sessions and caching
- **Testing:** Jest with Testing Library
- **Deployment:** Vercel with automated deployments

### Directory Structure
**Main Application:** All source code is located in the `gamelearn-platform/` subdirectory.

- **`gamelearn-platform/src/app/`** - Next.js 15 App Router pages and API routes
- **`gamelearn-platform/src/lib/`** - Core business logic, services, and utilities
  - **`payments/`** - Payment processing (Dodo, Stripe, PayPal)
  - **`mcp/`** - Model Context Protocol integration
  - **`config/`** - Environment configuration with Zod validation
  - **`security/`** - Security monitoring and audit logging
  - **`video/`** - Video streaming and quality management
- **`gamelearn-platform/src/components/`** - React components organized by domain
- **`gamelearn-platform/src/hooks/`** - Custom React hooks
- **`gamelearn-platform/prisma/`** - Database schema and migrations

### Key Systems

**Payment Architecture:**
- Dodo Payments as primary processor with MCP integration
- License key-based course access control
- Webhook handling for payment events
- Fallback systems for development/testing

**Video Streaming:**
- Production-ready adaptive bitrate streaming
- Session management with access control
- Quality selection and analytics
- Test mode bypass with `ENABLE_VIDEO_TEST=true`

**Authentication Flow:**
- NextAuth.js with Prisma adapter
- Multi-role system (Student, Instructor, Admin)
- OAuth providers with credentials fallback
- Session management with Redis

**Database Schema:**
- 20+ models covering full LMS functionality
- Course → Module → Lesson hierarchy
- User progress tracking and analytics
- Payment and license key relationships

## Environment Configuration

The project uses comprehensive environment validation with Zod schemas. Copy `.env.example` to `.env.local` and configure:

**Required for Development:**
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="32-char-minimum-secret"
NEXTAUTH_URL="http://localhost:3000"
APP_URL="http://localhost:3000"
```

**Feature Flags:**
```env
ENABLE_VIDEO_TEST=true          # Bypass video access control for testing
ENABLE_PAYMENTS=true            # Enable payment processing
ENABLE_CACHING=true             # Enable Redis caching
ENABLE_COLLABORATION=true       # Enable real-time features
```

**Payment Configuration:**
```env
DODO_API_KEY="your-dodo-api-key"
DODO_WEBHOOK_SECRET="whsec_..."
DODO_ENVIRONMENT="test"         # test or live
```

## Development Workflows

### Working with Payments
1. Configure Dodo Payments environment variables
2. Use test API endpoints at `/api/test/dodo-integration`
3. Test webhook integration with local ngrok or deployed Vercel URL
4. MCP integration provides fallback for development

### Database Changes
1. Modify `prisma/schema.prisma`
2. Run `npx prisma db push` to apply changes
3. Run `npx prisma generate` to update client
4. Update TypeScript types as needed

### Adding API Routes
- Use Next.js App Router format: `src/app/api/[route]/route.ts`
- Include error handling and logging
- Add environment-specific configuration
- Implement proper TypeScript interfaces

### Video Streaming Development
- Set `ENABLE_VIDEO_TEST=true` to bypass access control
- Use `/api/video/stream` endpoint with course enrollment checks
- Test adaptive quality with different network conditions

## Testing Strategy

**Unit Tests:** Components, utilities, and pure functions
**Integration Tests:** API routes, database operations, payment flows
**Security Tests:** Built-in security monitoring and vulnerability scanning

Test files follow the pattern: `*.test.ts` or `*.spec.ts`
Coverage thresholds: 70% for branches, functions, lines, and statements

## Production Deployment

The platform is deployed on Vercel with:
- Automatic deployments from main branch
- Environment variable management via Vercel dashboard
- Prisma client generation during build process
- Webhook endpoints configured for Dodo Payments

**Current Production URL:** `https://gamelearn-platform-[hash]-thelazyindiantechies-projects.vercel.app`

## Key Implementation Notes

**MCP Integration:** The project uses Model Context Protocol for Dodo Payments API calls with development fallbacks
**License Key System:** Course access is controlled via license keys generated on successful payments
**Video Security:** Production video streaming includes enrollment verification and session management
**Environment Validation:** Comprehensive Zod-based validation prevents configuration errors
**Payment Webhooks:** Real webhook handling with signature verification for payment events

## Current Development Status

The MVP is ~90% complete with core infrastructure finished. **Dodo Payments MCP integration is now fully complete and production-ready.** Primary remaining work:
- Content management UI for instructors
- Database seeding with sample courses
- Video-lesson integration connecting streaming API with course content
- Real-time collaboration features

See `MVP_STATUS.md` for detailed completion status and roadmap.