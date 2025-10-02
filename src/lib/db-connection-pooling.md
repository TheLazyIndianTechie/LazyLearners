# Database Connection Pooling Configuration

## Overview

Prisma uses connection pooling to manage database connections efficiently. Connection pooling reuses existing connections instead of creating new ones for each request, significantly improving performance and reducing resource usage.

## Configuration

Connection pooling is configured through the `DATABASE_URL` environment variable using query parameters.

### PostgreSQL Connection Pooling

For PostgreSQL databases, add these parameters to your `DATABASE_URL`:

```env
# Development
DATABASE_URL="postgresql://user:password@localhost:5432/dbname?connection_limit=10&pool_timeout=20"

# Production (Recommended settings)
DATABASE_URL="postgresql://user:password@host:5432/dbname?connection_limit=20&pool_timeout=20&connect_timeout=15"
```

### Connection Pool Parameters

#### `connection_limit`
- **Description**: Maximum number of database connections in the pool
- **Default**:
  - SQLite: 1 (single connection)
  - PostgreSQL/MySQL: Number of CPU cores × 2 + 1
- **Recommended values**:
  - Development: 5-10
  - Production (small): 10-20
  - Production (large): 20-50
- **Example**: `connection_limit=20`

**Note**: Be careful not to exceed your database server's `max_connections` limit. For most PostgreSQL installations, this is 100 by default.

#### `pool_timeout`
- **Description**: Maximum time (in seconds) to wait for an available connection from the pool
- **Default**: 10 seconds
- **Recommended**: 20-30 seconds
- **Example**: `pool_timeout=20`

#### `connect_timeout`
- **Description**: Maximum time (in seconds) to wait when establishing a new connection to the database
- **Default**: 5 seconds (varies by database)
- **Recommended**: 10-15 seconds
- **Example**: `connect_timeout=15`

### SQLite (Development)

SQLite does not support connection pooling in the traditional sense (single writer, multiple readers). For development with SQLite:

```env
DATABASE_URL="file:./dev.db"
```

**Note**: SQLite is recommended for local development only. Always use PostgreSQL or MySQL in production.

## Best Practices

### 1. Calculate Optimal Pool Size

Use this formula as a starting point:
```
connections = ((core_count * 2) + effective_spindle_count)
```

For cloud databases or serverless:
```
connections = min(50, max(5, available_ram_gb * 5))
```

### 2. Environment-Specific Configuration

**Development**:
- Small pool size (5-10 connections)
- Shorter timeouts for faster failure detection
- Enable query logging

**Staging**:
- Medium pool size (10-20 connections)
- Production-like timeouts
- Monitor connection usage

**Production**:
- Larger pool size (20-50 connections)
- Longer timeouts for stability
- Connection monitoring and alerting

### 3. Serverless Considerations

For serverless deployments (Vercel, AWS Lambda):

```env
# Use connection pooler like PgBouncer or Supabase Pooler
DATABASE_URL="postgresql://user:password@pooler.example.com:6543/dbname?connection_limit=5&pool_timeout=10"
```

**Important**: Serverless functions create new connections on each cold start. Use:
- External connection poolers (PgBouncer, pgpool-II)
- Managed database with built-in pooling (Supabase, Neon, PlanetScale)
- Lower `connection_limit` (1-5 per function)

### 4. Monitor Connection Usage

Track these metrics:
- Active connections
- Idle connections
- Connection wait time
- Connection errors
- Pool exhaustion events

Use the DatabaseMonitor utility:
```typescript
import { databaseMonitor } from '@/lib/monitoring/database'

const stats = await databaseMonitor.getDatabaseStats()
console.log('Connection count:', stats.connectionCount)
```

## Prisma Connection Management

### Connection Lifecycle

1. **Request arrives** → Check pool for available connection
2. **Connection available** → Use existing connection
3. **Pool full** → Wait for connection (up to `pool_timeout`)
4. **Timeout exceeded** → Throw error
5. **Request complete** → Return connection to pool

### Prisma Client Instantiation

```typescript
// Singleton pattern (recommended)
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

**Why singleton?** Prevents connection pool exhaustion by reusing a single Prisma Client instance across requests.

### Graceful Shutdown

Always disconnect Prisma Client on application shutdown:

```typescript
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

process.on('SIGINT', async () => {
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})
```

## Troubleshooting

### Error: "Can't reach database server"

**Causes**:
- Database is down
- Network issues
- Incorrect connection string
- Firewall blocking connection

**Solutions**:
- Verify `DATABASE_URL` is correct
- Check database is running
- Increase `connect_timeout`
- Check firewall rules

### Error: "Timed out fetching a new connection from the pool"

**Causes**:
- Pool exhausted (all connections in use)
- Slow queries blocking connections
- `connection_limit` too low
- Connection leak

**Solutions**:
- Increase `connection_limit`
- Increase `pool_timeout`
- Optimize slow queries (see query monitoring)
- Check for long-running transactions
- Review connection usage patterns

### Error: "Too many connections"

**Causes**:
- Multiple Prisma Client instances
- `connection_limit` exceeds database's `max_connections`
- Connection leak

**Solutions**:
- Use singleton Prisma Client pattern
- Reduce `connection_limit`
- Increase database's `max_connections`
- Audit connection lifecycle

### High Connection Wait Times

**Causes**:
- Slow queries
- Insufficient pool size
- High request concurrency

**Solutions**:
- Add database indexes (see schema optimization)
- Optimize queries with Prisma includes
- Increase `connection_limit`
- Scale database vertically or horizontally

## External Connection Poolers

For production deployments, consider using external connection poolers:

### PgBouncer

```env
# Application connects to PgBouncer
DATABASE_URL="postgresql://user:password@pgbouncer:6432/dbname?connection_limit=5"

# PgBouncer connects to PostgreSQL
# pgbouncer.ini:
# [databases]
# dbname = host=postgres port=5432 dbname=dbname
# [pgbouncer]
# pool_mode = transaction
# max_client_conn = 1000
# default_pool_size = 20
```

**Benefits**:
- Handles thousands of client connections
- Efficient connection multiplexing
- Transaction-level pooling
- Lower memory footprint

### Supabase Pooler

```env
DATABASE_URL="postgresql://postgres.xxx:6543/postgres?connection_limit=1"
```

**Benefits**:
- Built-in connection pooling
- Optimized for serverless
- Automatic scaling
- No additional setup

## Performance Impact

Properly configured connection pooling provides:

### Performance Gains
- **10-50x faster** connection establishment
- **Reduced latency** for database operations
- **Lower CPU usage** on database server
- **Better resource utilization**

### Resource Savings
- **Memory**: Fewer connection objects
- **CPU**: No connection handshake overhead
- **Network**: Reused TCP connections
- **Database**: Reduced authentication overhead

### Scalability
- Handle **10-100x more requests** with same resources
- Predictable performance under load
- Graceful degradation when pool exhausted
- Better resource limits enforcement

## Monitoring and Alerts

Set up alerts for:

1. **Pool utilization > 80%**
   - Action: Consider increasing `connection_limit`

2. **Average wait time > 1 second**
   - Action: Optimize queries or increase pool size

3. **Connection errors > 1% of requests**
   - Action: Check database health and connection string

4. **Slow queries > 100ms**
   - Action: Add indexes or optimize query patterns

## Next Steps

1. **Review**: Check your current `DATABASE_URL` configuration
2. **Calculate**: Determine optimal pool size for your application
3. **Test**: Load test with different pool sizes
4. **Monitor**: Track connection metrics in production
5. **Optimize**: Adjust based on actual usage patterns

## References

- [Prisma Connection Management](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [PostgreSQL Connection Pooling](https://www.postgresql.org/docs/current/runtime-config-connection.html)
- [PgBouncer Documentation](https://www.pgbouncer.org/)
