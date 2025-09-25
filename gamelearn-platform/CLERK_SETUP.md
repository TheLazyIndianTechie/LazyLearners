# Clerk Authentication Setup Guide

This guide will help you complete the Clerk authentication setup for the GameLearn platform.

## Phase 1 Status ✅

**Completed:**
- ✅ Clerk package installation (`@clerk/nextjs`)
- ✅ Basic provider setup with fallback to NextAuth
- ✅ Sign-in and Sign-up page components
- ✅ Middleware configuration (conditional)
- ✅ Environment configuration structure
- ✅ Build validation (passes without actual Clerk keys)

## Next Steps Required

### 1. Clerk Dashboard Setup

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Create a new application
3. Choose "Next.js" as the framework
4. Note down the API keys provided

### 2. Environment Configuration

Update your `.env.local` file with the actual Clerk keys:

```bash
# Replace these commented lines with actual keys from Clerk Dashboard
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key"
CLERK_SECRET_KEY="sk_test_your_actual_secret_key"

# Webhook secret (if setting up user sync)
CLERK_WEBHOOK_SECRET="whsec_your_actual_webhook_secret"
```

### 3. Verification

After adding the keys:

1. Restart your development server: `npm run dev`
2. Visit `/sign-in` to test the Clerk authentication
3. The application will automatically switch from NextAuth to Clerk

## Current Architecture

### Conditional Authentication System

The current setup uses a conditional system:

- **With Clerk Keys**: Uses Clerk for authentication
- **Without Clerk Keys**: Falls back to NextAuth during transition

This allows for a smooth migration without breaking the existing system.

### Protected Routes

The following routes are protected by Clerk middleware (when active):

- `/dashboard/*`
- `/courses/*` (course access)
- `/instructor/*` (instructor dashboard)
- `/profile/*`
- `/settings/*`
- `/api/courses/*`
- `/api/lessons/*`
- `/api/progress/*`
- `/api/video/*`

### Pages Created

- `/sign-in/[[...sign-in]]/page.tsx` - Clerk sign-in component
- `/sign-up/[[...sign-up]]/page.tsx` - Clerk sign-up component

## Features Included

### Sign-In Page Features
- Styled with Tailwind CSS
- Responsive design
- GameLearn branding
- Professional appearance

### Sign-Up Page Features
- Consistent styling with sign-in
- Clear call-to-action
- Game development focused messaging

### Middleware Features
- Route protection
- Conditional activation
- API endpoint protection

## Phase 2 Preparation

Once Clerk is fully configured and tested, Phase 2 will involve:

1. Removing NextAuth dependencies
2. Updating all authentication hooks
3. Migrating user sessions
4. Testing all protected routes

## Troubleshooting

### Build Issues
- The build should pass even without actual Clerk keys
- If you see Clerk-related errors, check that the conditional logic is working

### Development Issues
- Ensure you're running from the `gamelearn-platform/` directory
- Check that all environment variables are properly set
- Verify the Clerk dashboard configuration matches your environment

## Webhook Setup (Optional)

If you want to sync user data between Clerk and your database:

1. In Clerk Dashboard, go to Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/clerk`
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the webhook secret to `CLERK_WEBHOOK_SECRET`

## Next Phase Tasks

- LAZ-105: NextAuth.js Removal & Core Integration
- LAZ-106: User Data Migration & Role System

The current setup provides a solid foundation for the complete Clerk migration while maintaining system stability during the transition.