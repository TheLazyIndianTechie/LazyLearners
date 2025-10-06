# CI/CD Pipeline Guide

## Overview

The LazyGameDevs LMS platform uses a comprehensive CI/CD pipeline built with GitHub Actions, providing automated testing, deployment, and rollback capabilities across staging and production environments.

### Pipeline Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Code Push/PR                          │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  CI Workflow (ci.yml)                                        │
│  • Lint & Type Check                                         │
│  • Unit Tests (Node 18/20)                                   │
│  • Integration Tests                                         │
│  • E2E Tests (Playwright)                                    │
│  • Build Verification                                        │
│  • Security Audit                                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ (on main push)
┌─────────────────────────────────────────────────────────────┐
│  Staging Deployment (deploy-staging.yml)                     │
│  • Build Application                                         │
│  • Run Migrations                                            │
│  • Deploy to Vercel                                          │
│  • Health Checks                                             │
│  • Notifications                                             │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼ (manual promotion)
┌─────────────────────────────────────────────────────────────┐
│  Production Deployment (deploy-production.yml)               │
│  • Validate Staging                                          │
│  • Run Critical Tests                                        │
│  • Build & Deploy                                            │
│  • Comprehensive Health Checks                               │
│  • Auto-Rollback on Failure                                  │
└─────────────────────────────────────────────────────────────┘
```

## Workflows

### 1. CI Workflow (`ci.yml`)

**Triggers:**
- Pull requests to `main` or `develop`
- Pushes to `main`

**Jobs:**
1. **Lint** - ESLint validation
2. **Type Check** - TypeScript compilation check
3. **Test** - Unit and integration tests (Node 18 & 20 matrix)
4. **E2E** - Playwright end-to-end tests
5. **Build** - Production build verification
6. **Security** - npm audit and dependency checks
7. **All Checks** - Summary job for branch protection

**Key Features:**
- Concurrency control (cancels in-progress runs)
- Test coverage reporting
- Artifact uploads (coverage, test results, Playwright reports)
- Automated PR comments on success

### 2. Test Suite Workflow (`test.yml`)

**Triggers:**
- Pushes to `main` or `develop`
- Pull requests
- Manual dispatch

**Jobs:**
1. **Lint & Type Check**
2. **Unit Tests** with coverage upload to Codecov
3. **Integration Tests** with PostgreSQL service
4. **Critical Path Tests** with seeded database
5. **E2E Tests** with Playwright
6. **Visual Regression Tests** with snapshot comparison
7. **Accessibility Tests** with automated a11y checks
8. **Security Audit**
9. **Test Summary** - Aggregates all results

**Key Features:**
- Service containers (PostgreSQL) for integration tests
- Comprehensive test matrix
- Visual regression testing
- Accessibility validation (WCAG 2.1)
- 30-day artifact retention

### 3. Staging Deployment (`deploy-staging.yml`)

**Triggers:**
- Pushes to `main` (automatic)
- Manual dispatch with commit SHA selection

**Jobs:**
1. **Build** - Creates production build
2. **Migrate** - Runs Prisma migrations
3. **Deploy** - Deploys to Vercel staging
4. **Health Check** - Validates deployment
5. **Update Deployment** - Updates GitHub deployment status
6. **Notify** - Sends Slack/Discord notifications

**Environment:**
- `staging` environment with URL protection
- Concurrency: `deploy-staging` (prevents concurrent deploys)

**Key Features:**
- GitHub Deployments API integration
- Automated migration execution
- Retry logic for health checks (10 attempts, 10s intervals)
- Smoke tests (homepage, API health, database connectivity)
- Rich notifications with deployment metadata

### 4. Production Deployment (`deploy-production.yml`)

**Triggers:**
- Manual dispatch only

**Input Parameters:**
- `deploy_from`: Choose between `staging-promotion` or `main-branch`
- `commit_sha`: Specific commit to deploy (optional, for main-branch)
- `skip_tests`: Skip test validation (NOT RECOMMENDED)

**Jobs:**
1. **Validate** - Validates deployment request and staging status
2. **Run Tests** - Executes critical and integration tests (unless skipped)
3. **Build** - Creates production build
4. **Migrate** - Runs database migrations with backup markers
5. **Deploy** - Deploys to Vercel production
6. **Health Check** - Comprehensive health validation
7. **Update Deployment** - Updates deployment status
8. **Rollback on Failure** - Auto-triggers rollback if health checks fail
9. **Notify** - Sends detailed notifications

**Environment:**
- `production` environment with required approvals
- Concurrency: `deploy-production` (prevents concurrent deploys)

**Key Features:**
- Staging validation for promotions
- Migration detection warnings
- Extended health checks (15 attempts, 15s intervals)
- Performance baseline checks
- Automatic rollback on failure
- Critical incident creation on failure
- Production environment protection

### 5. Rollback Workflow (`rollback.yml`)

**Triggers:**
- Manual dispatch (or automatic from failed production deployment)

**Input Parameters:**
- `environment`: `staging` or `production`
- `target_version`: Commit SHA to rollback to (or previous deployment)
- `reason`: Reason for rollback (required)

**Jobs:**
1. **Validate** - Validates rollback request and target
2. **Create Deployment** - Creates rollback deployment record
3. **Build** - Builds target version
4. **Deploy** - Deploys rollback version
5. **Health Check** - Verifies rollback success
6. **Finalize** - Updates deployment status
7. **Notify** - Sends notifications and creates incident on failure

**Key Features:**
- Deployment history validation
- SHA existence verification
- Version marker creation
- Rollback health verification
- Automatic incident creation on rollback failure

## Required Secrets

### GitHub Secrets Configuration

Navigate to **Settings → Secrets and variables → Actions** and add:

#### Core Secrets
```
VERCEL_TOKEN                      # Vercel deployment token
VERCEL_ORG_ID                     # Vercel organization ID
```

#### Staging Environment
```
STAGING_DATABASE_URL              # PostgreSQL connection string
STAGING_APP_URL                   # Staging app URL (e.g., https://staging-app.vercel.app)
STAGING_CLERK_SECRET_KEY          # Clerk secret key for staging
```

#### Production Environment
```
PRODUCTION_DATABASE_URL           # PostgreSQL connection string
PRODUCTION_APP_URL                # Production app URL
PRODUCTION_DOMAIN                 # Production domain (e.g., lazygamedevs.vercel.app)
PRODUCTION_CLERK_SECRET_KEY       # Clerk secret key for production
PRODUCTION_CLERK_PUBLISHABLE_KEY  # Clerk publishable key for production
```

#### Shared Secrets
```
RESEND_API_KEY                    # Resend email API key
DODO_API_KEY                      # Dodo Payments API key
CLERK_PUBLISHABLE_KEY             # Clerk publishable key (for tests)
CLERK_SECRET_KEY                  # Clerk secret key (for tests)
```

#### Notification Secrets
```
SLACK_WEBHOOK_URL                 # Slack incoming webhook URL
DISCORD_WEBHOOK_URL               # Discord webhook URL
```

#### Optional Secrets
```
CODECOV_TOKEN                     # Codecov upload token
SENTRY_AUTH_TOKEN                 # Sentry authentication token
```

## Deployment Guide

### Staging Deployment

**Automatic Deployment:**
1. Create a PR to `main`
2. Wait for CI checks to pass
3. Merge PR
4. Staging deployment triggers automatically
5. Monitor workflow in Actions tab
6. Check Slack/Discord for deployment notifications

**Manual Deployment:**
1. Go to **Actions → Deploy to Staging**
2. Click "Run workflow"
3. (Optional) Enter specific commit SHA
4. Click "Run workflow"
5. Monitor progress

**Expected Timeline:**
- Build: 3-5 minutes
- Migration: 30 seconds - 2 minutes
- Deployment: 2-4 minutes
- Health checks: 1-2 minutes
- **Total: ~8-13 minutes**

### Production Deployment

**Recommended: Staging Promotion**
1. Verify staging deployment is successful
2. Test staging thoroughly
3. Go to **Actions → Deploy to Production**
4. Click "Run workflow"
5. Select `deploy_from`: **staging-promotion**
6. Click "Run workflow"
7. **Approve deployment** in the environment protection screen
8. Monitor workflow
9. Verify production health

**Alternative: Direct Main Deployment**
1. Go to **Actions → Deploy to Production**
2. Click "Run workflow"
3. Select `deploy_from`: **main-branch**
4. (Optional) Enter specific commit SHA
5. ⚠️ Check `skip_tests` ONLY if absolutely necessary
6. Click "Run workflow"
7. **Approve deployment**
8. Monitor workflow

**Expected Timeline:**
- Validation: 30 seconds
- Tests (if not skipped): 5-8 minutes
- Build: 3-5 minutes
- Migration: 1-3 minutes
- Deployment: 3-5 minutes
- Health checks: 2-3 minutes
- **Total: ~15-25 minutes**

### Rollback Procedure

**Manual Rollback:**
1. Go to **Actions → Rollback Deployment**
2. Click "Run workflow"
3. Select `environment`: **production** or **staging**
4. (Optional) Enter `target_version` (commit SHA) or leave empty for previous
5. Enter `reason`: Clear description of why rollback is needed
6. Click "Run workflow"
7. Monitor rollback progress
8. Verify health checks pass

**Automatic Rollback:**
- Triggers automatically on production deployment health check failures
- No manual intervention required
- Creates incident issue for tracking
- Sends urgent notifications

**Expected Timeline:**
- Validation: 30 seconds
- Build: 3-5 minutes
- Deployment: 2-4 minutes
- Health checks: 1-2 minutes
- **Total: ~7-12 minutes**

## Health Check Endpoints

### `/api/health`

**Response (200 OK - Healthy):**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": {
      "status": "pass",
      "responseTime": 45
    },
    "redis": {
      "status": "pass",
      "responseTime": 12,
      "stats": {
        "memory": "2.5M",
        "connectedClients": 5,
        "totalCommandsProcessed": "1234"
      }
    },
    "memory": {
      "status": "pass",
      "usage": {
        "used": 67108864,
        "total": 134217728,
        "percentage": 50
      }
    },
    "environment": {
      "status": "pass"
    }
  },
  "environment": "production",
  "configuration": {
    "nodeEnv": "production",
    "features": {
      "caching": true,
      "payments": true,
      "email": true
    }
  }
}
```

**Response (503 Service Unavailable - Unhealthy):**
```json
{
  "status": "unhealthy",
  "checks": {
    "database": {
      "status": "fail",
      "error": "Connection timeout"
    }
  }
}
```

## Best Practices

### Pull Request Workflow

1. **Create feature branch** from `develop` or `main`
2. **Develop feature** with tests
3. **Run tests locally** before pushing
   ```bash
   npm run lint
   npm run test
   npm run test:e2e
   ```
4. **Push to GitHub** and create PR
5. **Wait for CI** to pass (all checks must be green)
6. **Request review** from team members
7. **Merge to main** after approval

### Deployment Strategy

**Recommended Flow:**
```
Feature Branch → PR → CI Checks → Merge to Main → Staging Deploy → Testing → Production Deploy
```

**Staging Environment:**
- Used for QA and integration testing
- Automatically deployed on `main` push
- Safe environment for breaking changes
- Can be manually redeployed to any commit

**Production Environment:**
- Requires manual approval
- Should only deploy tested code from staging
- Use staging promotion for safest deployments
- Monitor health checks closely

### Migration Safety

**Before Migration:**
1. Review migration files in PR
2. Test migrations on staging first
3. Ensure migrations are backward-compatible when possible
4. Have rollback plan ready

**During Migration:**
1. Workflow checks migration status first
2. Database backup should be automatic (provider-level)
3. Migrations run before application deployment
4. Failure aborts deployment

**Backward-Compatible Migrations (Expand/Contract):**
```sql
-- ✅ Good: Add nullable column
ALTER TABLE users ADD COLUMN phone_number TEXT;

-- ❌ Bad: Drop column immediately
-- ALTER TABLE users DROP COLUMN old_field;

-- ✅ Good: Drop column in two steps
-- Step 1 (Deploy): Stop using column in code
-- Step 2 (Later): Drop column after all instances updated
```

### Monitoring Deployments

**During Deployment:**
1. Watch GitHub Actions workflow logs
2. Monitor Slack/Discord notifications
3. Check health endpoint after deployment
4. Verify key functionality manually

**Post-Deployment:**
1. Check error tracking (Sentry if configured)
2. Review application logs
3. Monitor database performance
4. Watch for user-reported issues

**Key Metrics to Monitor:**
- Response times
- Error rates
- Database query performance
- Memory usage
- Active connections

## Troubleshooting

### CI Failures

**Lint Failures:**
```bash
# Run locally to fix
npm run lint -- --fix
```

**Type Check Failures:**
```bash
# Run locally
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/path/to/file.ts
```

**Test Failures:**
```bash
# Run specific test
npm run test -- path/to/test.spec.ts

# Run with watch mode
npm run test:watch

# Debug with verbose output
npm run test -- --verbose
```

**E2E Test Failures:**
```bash
# Run with UI for debugging
npm run test:e2e:ui

# Run specific test
npm run test:e2e -- tests/e2e/path/to/test.spec.ts

# Update snapshots if UI changed
npm run test:e2e -- --update-snapshots
```

### Deployment Failures

**Build Failures:**
1. Check build logs for specific errors
2. Verify environment variables are set correctly
3. Ensure Prisma client is generated
4. Check for TypeScript errors

**Migration Failures:**
1. Check migration status: `npx prisma migrate status`
2. Review migration files for syntax errors
3. Verify database connectivity
4. Check for conflicting migrations
5. Consider manual intervention for production

**Health Check Failures:**
1. Check `/api/health` endpoint directly
2. Verify database is accessible
3. Check Redis connectivity (if enabled)
4. Review application logs
5. Verify environment variables

**Vercel Deployment Issues:**
1. Check Vercel dashboard for detailed logs
2. Verify secrets are configured in Vercel
3. Check deployment URLs and aliases
4. Verify build output size limits

### Rollback Issues

**Rollback Fails to Deploy:**
1. Verify target commit SHA exists
2. Check if target version builds successfully
3. Ensure environment secrets are correct
4. Review rollback workflow logs

**Post-Rollback Problems:**
1. Verify health checks pass
2. Check database compatibility with rolled-back code
3. Review monitoring for errors
4. Consider rolling forward with fix instead

### Common Errors

**Error: `VERCEL_TOKEN` not found**
- Solution: Add token to GitHub Secrets

**Error: Prisma client not generated**
- Solution: Ensure `npx prisma generate` runs in workflow

**Error: Database connection failed**
- Solution: Verify `DATABASE_URL` secret is correct and database is accessible

**Error: Health check timeout**
- Solution: Check application logs, verify deployment succeeded, check database

**Error: Migration already applied**
- Solution: Normal for re-deployments, workflow should handle gracefully

## Branch Protection Rules

Configure the following branch protection rules for `main`:

1. **Require pull request reviews**
   - Required approvals: 1 (minimum)

2. **Require status checks to pass**
   - Required checks:
     - `All Checks Passed`
     - `Lint`
     - `Type Check`
     - `Test (Node 20)`
     - `E2E Tests`
     - `Build`

3. **Require branches to be up to date**
   - ✅ Enabled

4. **Include administrators**
   - ✅ Enabled (recommended)

5. **Restrict pushes**
   - Allow specific people/teams who can bypass PR requirements

## Environment Protection Rules

### Staging Environment

**Protection rules:**
- No required reviewers (auto-deploy)
- 0 minute wait timer
- Restrict deployments to `main` branch

### Production Environment

**Protection rules:**
- ✅ Required reviewers: 1-2 team members
- ⏱️ Wait timer: 5 minutes (optional)
- ✅ Restrict deployments to `main` branch
- ✅ Require approval from on-call engineer (recommended)

## Notifications

### Slack Notifications

**Channel Recommendations:**
- `#deployments` - All deployment notifications
- `#ci-failures` - CI/test failures
- `#incidents` - Critical production issues

**Configure Webhook:**
1. Go to Slack workspace settings
2. Add "Incoming Webhooks" app
3. Create webhook for target channel
4. Add `SLACK_WEBHOOK_URL` to GitHub Secrets

### Discord Notifications

**Channel Recommendations:**
- `#deployments` - All deployment notifications
- `#ci-status` - CI results
- `#alerts` - Critical issues

**Configure Webhook:**
1. Go to Discord server settings
2. Select channel → Integrations → Webhooks
3. Create webhook
4. Add `DISCORD_WEBHOOK_URL` to GitHub Secrets

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Prisma Migrations](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Playwright Testing](https://playwright.dev/docs/intro)

## Support

For CI/CD issues:
1. Check this documentation
2. Review workflow logs in GitHub Actions
3. Check Slack/Discord notifications
4. Create issue in repository with `ci-cd` label
5. Contact DevOps team

---

**Last Updated:** January 2024  
**Maintained by:** LazyGameDevs Team