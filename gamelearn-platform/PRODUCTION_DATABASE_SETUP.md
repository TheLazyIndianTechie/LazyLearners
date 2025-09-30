# Production Database Setup Guide

## Database Provider Recommendations

### 1. Vercel Postgres (Recommended)
- **Pros**: Seamless Vercel integration, automatic scaling, built-in connection pooling
- **Setup**: Available in Vercel marketplace
- **Pricing**: Pay-per-use, scales with your application

### 2. Supabase (Alternative)
- **Pros**: PostgreSQL with real-time features, good free tier
- **Setup**: Create project at https://supabase.com
- **Connection**: Provides connection pooling by default

### 3. PlanetScale (Alternative)
- **Pros**: MySQL-compatible, branching for database schema changes
- **Setup**: Create database at https://planetscale.com
- **Note**: Requires MySQL-compatible Prisma schema adjustments

### 4. Railway (Alternative)
- **Pros**: Simple setup, good for smaller applications
- **Setup**: Deploy PostgreSQL instance at https://railway.app

## Production Database Configuration

### Connection String Format
```
postgresql://username:password@host:port/database?options
```

### Required Connection Options
```
DATABASE_URL="postgresql://prod_user:SECURE_PASSWORD@your-db-host:5432/gamelearn_prod?sslmode=require&connection_limit=20&pool_timeout=20&schema_search_path=public"
```

### Connection Pool Settings
```env
DATABASE_POOL_SIZE=20          # Production recommended: 10-20
DATABASE_TIMEOUT=15000         # 15 seconds timeout
```

## Database Security Setup

### 1. SSL/TLS Configuration
- **Requirement**: All production connections MUST use SSL
- **Verification**: Connection string includes `sslmode=require`
- **Certificate**: Most providers handle SSL certificates automatically

### 2. User Access Control
```sql
-- Create dedicated application user
CREATE USER gamelearn_app WITH PASSWORD 'SECURE_RANDOM_PASSWORD';

-- Grant only necessary permissions
GRANT CONNECT ON DATABASE gamelearn_prod TO gamelearn_app;
GRANT USAGE ON SCHEMA public TO gamelearn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO gamelearn_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO gamelearn_app;

-- For new tables created by Prisma
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO gamelearn_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO gamelearn_app;
```

### 3. Network Security
- **Firewall**: Restrict access to Vercel IP ranges only
- **Private Networks**: Use VPC/private networking when available
- **IP Allowlisting**: Configure allowed IP addresses in database provider

## Database Schema Preparation

### 1. Prisma Production Schema
Ensure your `prisma/schema.prisma` is production-ready:

```prisma
generator client {
  provider = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-1.0.x", "debian-openssl-1.1.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2. Migration Strategy
```bash
# Generate migration for production
npx prisma migrate dev --name production_init

# Deploy migrations to production
npx prisma migrate deploy

# Generate Prisma client for production
npx prisma generate
```

### 3. Data Seeding
```bash
# Seed production database with essential data
npm run db:seed
```

## Database Performance Optimization

### 1. Indexes
Ensure critical indexes are in place:
```sql
-- User authentication lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);

-- Course and enrollment queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_courses_published ON courses(published);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_enrollments_user_course ON enrollments(user_id, course_id);

-- Payment and license key lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_license_keys_key ON license_keys(key_value);

-- Progress tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_user ON lesson_progress(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_lesson_progress_lesson ON lesson_progress(lesson_id);
```

### 2. Connection Pooling
Most production database providers include connection pooling:
- **Vercel Postgres**: Built-in pooling
- **Supabase**: Connection pooler included
- **PlanetScale**: Automatic connection management

### 3. Query Optimization
- Use `EXPLAIN ANALYZE` to optimize slow queries
- Monitor query performance with database provider tools
- Implement database query timeouts

## Backup and Recovery

### 1. Automated Backups
- **Frequency**: Daily backups minimum, hourly for critical data
- **Retention**: 30 days for daily, 7 days for hourly
- **Storage**: Cross-region backup storage

### 2. Point-in-Time Recovery
- Enable WAL (Write-Ahead Logging) for PostgreSQL
- Configure retention period (typically 7-30 days)
- Test recovery procedures regularly

### 3. Backup Verification
```bash
# Test backup restoration (on staging environment)
pg_restore --verbose --clean --no-acl --no-owner -h staging-host -U staging-user -d staging_db backup_file.dump
```

## Monitoring and Alerting

### 1. Database Metrics
Monitor these key metrics:
- Connection count and pool utilization
- Query performance and slow queries
- Disk usage and growth rate
- CPU and memory utilization
- Replication lag (if using read replicas)

### 2. Alert Thresholds
```yaml
alerts:
  connection_pool_usage: > 80%
  slow_queries: > 1 second
  disk_usage: > 85%
  failed_connections: > 5 per minute
  replication_lag: > 30 seconds
```

### 3. Monitoring Tools
- **Database Provider**: Use built-in monitoring dashboards
- **Application**: Prisma metrics and logging
- **External**: DataDog, New Relic, or Grafana

## Environment-Specific Configurations

### Development
```env
DATABASE_URL="file:./dev.db"  # SQLite for local development
DATABASE_POOL_SIZE=5
DATABASE_TIMEOUT=5000
```

### Staging
```env
DATABASE_URL="postgresql://staging_user:password@staging-host:5432/gamelearn_staging?sslmode=require"
DATABASE_POOL_SIZE=10
DATABASE_TIMEOUT=10000
```

### Production
```env
DATABASE_URL="postgresql://prod_user:password@prod-host:5432/gamelearn_prod?sslmode=require&connection_limit=20&pool_timeout=20"
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=15000
```

## Database Provider Setup Instructions

### Vercel Postgres Setup
1. Go to Vercel Dashboard → Storage
2. Click "Browse Storage" → "Postgres"
3. Create new database instance
4. Copy connection string to environment variables
5. Add to all environments (Preview, Production)

### Supabase Setup
1. Create account at https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy connection string (use connection pooling URL)
5. Enable Row Level Security if needed

### Railway Setup
1. Create account at https://railway.app
2. Create new project → Add PostgreSQL
3. Go to Variables tab
4. Copy DATABASE_URL value
5. Configure backups in settings

## Database Security Checklist

### Pre-Production
- [ ] SSL/TLS enforced for all connections
- [ ] Database user has minimal required permissions
- [ ] Network access restricted to application servers
- [ ] Strong password policy enforced
- [ ] Database encryption at rest enabled

### Post-Production
- [ ] Monitor connection logs for unauthorized access
- [ ] Regular security updates applied
- [ ] Backup encryption verified
- [ ] Access audit logs reviewed monthly
- [ ] Performance monitoring alerts configured

## Troubleshooting

### Common Issues

#### Connection Pool Exhaustion
```bash
# Check current connections
SELECT count(*) FROM pg_stat_activity;

# Increase pool size temporarily
DATABASE_POOL_SIZE=30
```

#### SSL Certificate Issues
```bash
# Verify SSL connection
psql "postgresql://user:pass@host:port/db?sslmode=require" -c "\conninfo"
```

#### Migration Failures
```bash
# Reset migration state (development only)
npx prisma migrate reset

# Manual migration rollback
npx prisma migrate resolve --rolled-back "migration_name"
```

### Emergency Procedures

#### Database Recovery
1. Stop application to prevent data corruption
2. Restore from most recent backup
3. Apply any missed transactions from WAL
4. Verify data integrity
5. Resume application traffic

#### Performance Issues
1. Identify slow queries with `EXPLAIN ANALYZE`
2. Add missing indexes
3. Optimize query patterns in application
4. Scale database resources if needed

---

**Last Updated**: Production deployment preparation
**Next Review**: After first production deployment
**Owner**: Backend Team, LazyGameDevs