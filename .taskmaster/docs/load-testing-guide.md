# Load Testing Guide

## Overview

Load testing ensures the LazyGameDevs platform can handle concurrent users and high traffic volumes. This guide covers load testing setup, execution, and analysis using k6.

## Prerequisites

### Install k6

**macOS:**
```bash
brew install k6
```

**Linux:**
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

**Windows:**
```bash
choco install k6
```

**Alternative - Docker:**
```bash
docker pull grafana/k6
```

## Running Load Tests

### Basic Execution

```bash
# Run against local development server
k6 run tests/load/load-test-scenarios.js

# Run against production (with caution!)
BASE_URL=https://your-production-url.com k6 run tests/load/load-test-scenarios.js

# Run with custom VUs and duration
k6 run --vus 50 --duration 30s tests/load/load-test-scenarios.js
```

### Test Scenarios

The load test includes 7 scenarios:

1. **Homepage Load** - Tests homepage rendering and initial load
2. **Course Catalog** - Tests course browsing performance
3. **API Health Check** - Tests health endpoint under load
4. **Course Detail** - Tests individual course page loading
5. **Video Streaming** - Tests video streaming performance
6. **Authentication** - Tests sign-in page load
7. **Enrollment API** - Tests enrollment API endpoint

### Load Test Stages

Default configuration ramps up load:

1. **Ramp-up (2 min)**: 0 → 10 users
2. **Scale (5 min)**: 10 → 50 users
3. **Peak (5 min)**: 50 → 100 users
4. **Sustained (2 min)**: 100 users constant
5. **Ramp-down (2 min)**: 100 → 0 users

Total duration: ~16 minutes

## Custom Test Configurations

### Quick Smoke Test

```javascript
export const options = {
  vus: 5,
  duration: '1m',
}
```

```bash
k6 run --vus 5 --duration 1m tests/load/load-test-scenarios.js
```

### Stress Test

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 200 },
    { duration: '10m', target: 200 },
    { duration: '5m', target: 0 },
  ],
}
```

### Spike Test

```javascript
export const options = {
  stages: [
    { duration: '10s', target: 100 },
    { duration: '1m', target: 100 },
    { duration: '10s', target: 1000 },
    { duration: '3m', target: 1000 },
    { duration: '10s', target: 100 },
    { duration: '3m', target: 100 },
    { duration: '10s', target: 0 },
  ],
}
```

### Soak Test (Long Duration)

```javascript
export const options = {
  stages: [
    { duration: '5m', target: 50 },
    { duration: '8h', target: 50 }, // 8 hour soak
    { duration: '5m', target: 0 },
  ],
}
```

## Performance Thresholds

Current thresholds:

```javascript
thresholds: {
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% under 500ms
  http_req_failed: ['rate<0.01'],                  // <1% failures
  errors: ['rate<0.1'],                            // <10% error rate
}
```

Adjust based on requirements:

```javascript
thresholds: {
  http_req_duration: ['p(95)<1000', 'p(99)<2000'],
  http_req_failed: ['rate<0.05'],
  'http_req_duration{name:VideoStream}': ['p(95)<3000'],
}
```

## Output Formats

### Console Output (default)

```bash
k6 run tests/load/load-test-scenarios.js
```

### JSON Output

```bash
k6 run --out json=test-results.json tests/load/load-test-scenarios.js
```

### InfluxDB + Grafana

```bash
k6 run --out influxdb=http://localhost:8086/k6db tests/load/load-test-scenarios.js
```

### Cloud (k6 Cloud)

```bash
k6 cloud tests/load/load-test-scenarios.js
```

## Analyzing Results

### Key Metrics

**Request Metrics:**
- `http_req_duration` - Total request time
- `http_req_waiting` - Time to first byte (TTFB)
- `http_req_connecting` - TCP connection time
- `http_req_blocked` - Time blocked before request
- `http_req_failed` - Failed request rate

**Custom Metrics:**
- `api_response_time` - API endpoint response times
- `page_load_time` - Page load duration
- `errors` - Error rate across scenarios
- `video_stream_requests` - Video streaming request count

### Success Criteria

**Passing Test:**
- ✅ 95th percentile response time < 500ms
- ✅ 99th percentile response time < 1000ms
- ✅ Failed requests < 1%
- ✅ Error rate < 10%

**Failing Test:**
- ❌ Response times exceed thresholds
- ❌ High failure rate
- ❌ Memory leaks detected
- ❌ Database connection pool exhausted

### Example Output

```
scenarios: (100.00%) 1 scenario, 100 max VUs, 16m30s max duration
default: 0/100 VUs  16m0s

✓ homepage status is 200
✓ courses page status is 200
✓ health check status is 200
✓ api response time acceptable

checks.........................: 98.50% ✓ 9850    ✗ 150
http_req_duration..............: avg=234ms  min=45ms   med=189ms  max=3.2s   p(95)=456ms p(99)=892ms
http_req_failed................: 0.45%  ✓ 45      ✗ 9955
iterations.....................: 10000  55.5/s
vus............................: 100    min=0     max=100
```

## Performance Optimization Tips

### 1. Database Connection Pooling

Ensure Prisma connection pool is configured:

```javascript
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  pool_timeout = 30
  connection_limit = 20
}
```

### 2. Caching Strategy

Enable Redis caching for frequently accessed data:

```env
ENABLE_CACHING=true
REDIS_URL=redis://localhost:6379
```

### 3. CDN for Static Assets

Use Vercel's edge network or configure CDN for static assets.

### 4. API Rate Limiting

Implement rate limiting to prevent abuse:

```typescript
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})
```

### 5. Database Query Optimization

- Add indexes on frequently queried fields
- Use select to limit returned fields
- Implement pagination for large datasets

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * 0' # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install k6
        run: |
          curl https://github.com/grafana/k6/releases/download/v0.45.0/k6-v0.45.0-linux-amd64.tar.gz -L | tar xvz
          sudo mv k6-v0.45.0-linux-amd64/k6 /usr/bin/k6

      - name: Run load tests
        run: |
          k6 run --out json=results.json tests/load/load-test-scenarios.js
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: load-test-results
          path: results.json
```

## Best Practices

### 1. Test Against Staging First

Never run load tests against production without explicit approval and preparation.

### 2. Gradual Ramp-Up

Always use gradual ramp-up to avoid overwhelming the system suddenly.

### 3. Monitor System Resources

Watch CPU, memory, database connections, and disk I/O during tests.

### 4. Test Different Scenarios

Mix different user behaviors (browsing, watching, enrolling) for realistic load.

### 5. Establish Baselines

Run tests regularly to establish performance baselines and detect regressions.

### 6. Clean Up Test Data

Ensure test data is cleaned up after load testing to avoid database pollution.

## Troubleshooting

### High Response Times

**Symptoms**: p95 > 1s, p99 > 5s

**Solutions:**
- Check database query performance
- Review server logs for slow endpoints
- Enable caching for frequently accessed data
- Optimize database indexes

### Connection Timeouts

**Symptoms**: `http_req_failed` > 5%

**Solutions:**
- Increase database connection pool size
- Check network bandwidth
- Review API gateway limits
- Scale application servers

### Memory Leaks

**Symptoms**: Memory usage increases steadily over time

**Solutions:**
- Profile application with Node.js profiler
- Check for unclosed database connections
- Review event listener cleanup
- Monitor garbage collection

### Database Bottlenecks

**Symptoms**: Slow queries, connection pool exhaustion

**Solutions:**
- Optimize slow queries (use EXPLAIN)
- Add database indexes
- Implement read replicas
- Use caching layer (Redis)

## Tools & Resources

- **k6 Documentation**: https://k6.io/docs/
- **k6 Cloud**: https://k6.io/cloud/
- **Grafana + InfluxDB**: For advanced monitoring
- **New Relic/DataDog**: APM tools for detailed analysis
- **Apache JMeter**: Alternative load testing tool
- **Gatling**: Scala-based load testing tool

## Reporting

After load testing, document:

1. Test configuration (VUs, duration, scenarios)
2. Key metrics (response times, throughput, errors)
3. System resource utilization (CPU, memory, database)
4. Bottlenecks identified
5. Recommendations for optimization
6. Comparison with previous test results

## Maintenance

- Run load tests monthly or before major releases
- Update test scenarios as features are added
- Adjust thresholds based on SLA requirements
- Archive test results for historical comparison
- Review and optimize based on findings
