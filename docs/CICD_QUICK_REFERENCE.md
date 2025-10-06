# CI/CD Quick Reference

## 🚀 Quick Commands

### Local Testing Before Push
```bash
# Run all checks locally
npm run lint                    # ESLint
npx tsc --noEmit               # Type check
npm run test                   # Unit & integration tests
npm run test:e2e               # E2E tests
npm run build                  # Production build

# Fix common issues
npm run lint -- --fix          # Auto-fix lint errors
npm run test:watch             # Watch mode for tests
npm run test:e2e:ui            # Debug E2E with UI
```

### Database Commands
```bash
npx prisma generate            # Generate Prisma client
npx prisma db push             # Push schema changes
npx prisma migrate dev         # Create new migration
npx prisma migrate status      # Check migration status
npx prisma studio              # Open database GUI
```

## 📋 Workflow Triggers

| Workflow | Trigger | Duration | Auto/Manual |
|----------|---------|----------|-------------|
| **CI** | PR to main, push to main | 8-12 min | Auto |
| **Test Suite** | PR, push, manual | 15-20 min | Auto |
| **Staging Deploy** | Push to main | 8-13 min | Auto |
| **Production Deploy** | Manual only | 15-25 min | Manual |
| **Rollback** | Manual or auto on failure | 7-12 min | Both |

## 🎯 Common Workflows

### Deploy to Staging
```
1. Create PR → 2. CI passes → 3. Merge to main → 4. Auto-deploys to staging
```

### Deploy to Production (Recommended)
```
1. Verify staging → 2. Actions → Deploy to Production
3. Select "staging-promotion" → 4. Run workflow → 5. Approve → 6. Monitor
```

### Emergency Rollback
```
1. Actions → Rollback Deployment → 2. Select environment
3. Leave target empty (previous) → 4. Enter reason → 5. Run workflow
```

## 🔑 Required Secrets

### Core
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`

### Staging
- `STAGING_DATABASE_URL`
- `STAGING_APP_URL`
- `STAGING_CLERK_SECRET_KEY`

### Production
- `PRODUCTION_DATABASE_URL`
- `PRODUCTION_APP_URL`
- `PRODUCTION_DOMAIN`
- `PRODUCTION_CLERK_SECRET_KEY`
- `PRODUCTION_CLERK_PUBLISHABLE_KEY`

### Notifications
- `SLACK_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

## 🏥 Health Check Endpoints

```bash
# Check health
curl https://your-app.vercel.app/api/health

# Quick health check (HEAD request)
curl -I https://your-app.vercel.app/api/health

# Check specific component
curl https://your-app.vercel.app/api/health | jq '.checks.database'
```

**Healthy Response:** Status `200`, `"status": "healthy"`  
**Unhealthy Response:** Status `503`, `"status": "unhealthy"`

## 🚨 Emergency Procedures

### Production is Down
```
1. Check /api/health endpoint
2. Review GitHub Actions logs
3. Check Vercel dashboard
4. Rollback immediately if deployment-related
5. Create incident issue
6. Notify team in #incidents
```

### Failed Deployment
```
1. Check workflow logs in Actions tab
2. Look for specific job that failed (build/migrate/deploy/health-check)
3. For health check failures: auto-rollback triggers
4. For migration failures: may need manual DB intervention
5. Fix issue and redeploy or rollback
```

### Database Migration Issues
```
# Check status
npx prisma migrate status

# If stuck in staging:
# 1. Review migration in PR
# 2. Test locally first
# 3. If safe, resolve manually:
npx prisma migrate resolve --applied "MIGRATION_NAME"

# If production migration fails:
# 1. DO NOT resolve automatically
# 2. Coordinate with team
# 3. Consider rollback if breaking
# 4. May need DBA assistance
```

## 🐛 Quick Troubleshooting

| Error | Quick Fix |
|-------|-----------|
| ESLint failures | `npm run lint -- --fix` |
| Type errors | `npx tsc --noEmit` to see details |
| Test failures | `npm run test -- --verbose` |
| E2E failures | `npm run test:e2e:ui` to debug |
| Build failures | Check env vars, run `npm run build` locally |
| Migration failures | `npx prisma migrate status`, check DB connectivity |
| Health check timeout | Check `/api/health` directly, review logs |
| Vercel deployment error | Check Vercel dashboard for detailed logs |

## 📊 Monitoring Checklist

### Post-Deployment
- [ ] Health endpoint returns 200
- [ ] No errors in application logs
- [ ] Database connections stable
- [ ] Key pages load correctly
- [ ] Critical user flows work
- [ ] No spike in error rates

### Daily Monitoring
- [ ] Check Slack notifications for failures
- [ ] Review error tracking dashboard
- [ ] Monitor deployment frequency
- [ ] Check test coverage trends

## 🔐 Security Checklist

- [ ] All secrets configured in GitHub
- [ ] No secrets in code or logs
- [ ] Branch protection rules enabled
- [ ] Required reviewers for production
- [ ] npm audit passes (or known issues documented)
- [ ] Dependencies up to date

## 📞 Quick Links

### GitHub Actions
- **All Workflows:** `https://github.com/[org]/[repo]/actions`
- **CI Runs:** Filter by `ci.yml`
- **Deployments:** Filter by `deploy-*`

### Vercel
- **Dashboard:** `https://vercel.com/dashboard`
- **Staging:** Check deployments for staging project
- **Production:** Check deployments for production project

### Documentation
- **Full CI/CD Guide:** `docs/CICD_GUIDE.md`
- **Health Check API:** `/api/health`
- **Prisma Docs:** `https://www.prisma.io/docs`

## ⚡ Pro Tips

1. **Always test locally first** - Run full test suite before pushing
2. **Use staging liberally** - Test everything in staging before production
3. **Monitor deployments** - Don't walk away, watch the workflow
4. **Read the logs** - Most issues are obvious in workflow logs
5. **Rollback > Debug in production** - When in doubt, rollback first
6. **Document incidents** - Create issues for failed deployments
7. **Keep migrations simple** - One change per migration when possible
8. **Approve carefully** - Production approvals should be thoughtful
9. **Test rollbacks** - Practice rollbacks in staging
10. **Communicate** - Post in #deployments when deploying

## 🎨 Workflow Status Badges

Add to README.md:
```markdown
![CI](https://github.com/[org]/[repo]/actions/workflows/ci.yml/badge.svg)
![Deploy Staging](https://github.com/[org]/[repo]/actions/workflows/deploy-staging.yml/badge.svg)
```

## 📝 Common Commands

### Check Workflow Status
```bash
# Using GitHub CLI
gh run list --workflow=ci.yml
gh run view [RUN_ID] --log
gh run watch
```

### Manual Workflow Trigger
```bash
# Using GitHub CLI
gh workflow run deploy-staging.yml
gh workflow run deploy-production.yml
gh workflow run rollback.yml
```

### View Logs
```bash
# Stream logs for running workflow
gh run watch

# View specific run
gh run view [RUN_ID] --log-failed
```

## 🔄 Deployment Frequency Targets

- **Staging:** Multiple times per day
- **Production:** 1-5 times per week
- **Rollback rate:** <5% of deployments
- **Failed CI rate:** <10% of PRs

## 📈 Success Metrics

- CI pipeline completes in <15 minutes
- Staging deployment in <15 minutes
- Production deployment in <30 minutes
- Zero-downtime deployments
- Health checks pass rate >99%
- Rollback time <15 minutes

---

**Need Help?** Check `docs/CICD_GUIDE.md` for detailed information.  
**Emergency?** Contact DevOps team immediately.

**Last Updated:** January 2024