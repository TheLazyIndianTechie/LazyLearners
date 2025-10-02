# Monitoring and Error Tracking Setup

## Overview
Comprehensive monitoring setup for the LazyGameDevs GameLearn Platform video streaming system.

## Current Monitoring Infrastructure

### 1. Application Logging
✅ **Request Logger**: Built-in request logging with timing
- Location: `src/lib/logger.ts`
- Features: Request timing, error tracking, performance metrics
- Format: Structured JSON logging

✅ **Video Analytics**: Real-time video streaming analytics
- Heartbeat monitoring every 10 seconds
- Session tracking and user engagement metrics
- Buffer health and quality adaptation monitoring

### 2. Database Monitoring
✅ **Prisma Integration**: Database connection and query monitoring
- Connection pool monitoring
- Query performance tracking
- Database health checks

✅ **Redis Monitoring**: Cache performance tracking
- In-memory mode for Edge Runtime compatibility
- Cache hit/miss ratio tracking
- Memory usage monitoring

### 3. Error Tracking

#### Built-in Error Handling
- API route error boundaries
- Video player error recovery
- Network failure handling
- Authentication error tracking

#### Recommended External Services

**Sentry (Recommended)**
```bash
npm install @sentry/nextjs @sentry/vercel-edge
```

Configuration:
```javascript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing()
  ]
});
```

**LogRocket (Alternative)**
```bash
npm install logrocket logrocket-react
```

### 4. Performance Monitoring

#### Vercel Analytics (Built-in)
- Real User Monitoring (RUM)
- Core Web Vitals tracking
- Function execution monitoring
- Bandwidth usage tracking

#### Custom Metrics
```javascript
// Performance tracking in video player
const trackPerformanceMetric = (metric, value) => {
  fetch('/api/analytics/performance', {
    method: 'POST',
    body: JSON.stringify({
      metric,
      value,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    })
  });
};
```

### 5. Video-Specific Monitoring

#### Stream Health Monitoring
- **Buffer Health**: Continuous monitoring of video buffer levels
- **Quality Adaptation**: Tracking automatic quality changes
- **Session Duration**: Average watch time and completion rates
- **Error Recovery**: Video player error recovery success rates

#### Network Performance
- **Bandwidth Detection**: Automatic network quality assessment
- **CDN Performance**: Edge location performance monitoring
- **Latency Tracking**: Real-time latency measurements

## Monitoring Dashboard Setup

### 1. Vercel Dashboard
- **Functions**: Monitor serverless function performance
- **Analytics**: Real user monitoring and Core Web Vitals
- **Logs**: Real-time function logs and error tracking

### 2. Database Monitoring
- **Neon Console**: PostgreSQL performance and connection monitoring
- **Query Analysis**: Slow query detection and optimization
- **Connection Pool**: Monitor database connection usage

### 3. Custom Monitoring Dashboard

Create a monitoring page at `/dashboard/monitoring`:

```typescript
// src/app/dashboard/monitoring/page.tsx
export default function MonitoringDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard title="Active Sessions" value={activeSessions} />
        <MetricCard title="Avg Buffer Health" value={avgBufferHealth} />
        <MetricCard title="Error Rate" value={errorRate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <VideoAnalyticsChart />
        <PerformanceMetricsChart />
      </div>
    </div>
  );
}
```

## Alert Configuration

### 1. Critical Alerts
- **Database Connection Failures**
- **High Error Rates** (>5% in 5 minutes)
- **Video Streaming Failures** (>10% failure rate)
- **Authentication System Outages**

### 2. Warning Alerts
- **High Response Times** (>2s average)
- **Low Buffer Health** (<30% average)
- **High Memory Usage** (>80%)
- **Database Query Slowdowns** (>500ms average)

### 3. Notification Channels
- **Email**: Critical alerts to development team
- **Slack**: All alerts to monitoring channel
- **SMS**: Critical production issues only

## Health Check Endpoints

### 1. System Health
```typescript
// /api/health
{
  "status": "healthy",
  "timestamp": "2025-09-21T19:30:00Z",
  "services": {
    "database": "healthy",
    "redis": "healthy",
    "video": "healthy"
  },
  "metrics": {
    "responseTime": 45,
    "uptime": 99.98,
    "activeUsers": 1247
  }
}
```

### 2. Video Service Health
```typescript
// /api/health/video
{
  "status": "healthy",
  "activeSessions": 156,
  "avgBufferHealth": 87.3,
  "errorRate": 0.02,
  "qualityDistribution": {
    "1080p": 45,
    "720p": 78,
    "480p": 23,
    "360p": 10
  }
}
```

## Security Monitoring

### 1. Authentication Monitoring
- Failed login attempts tracking
- Suspicious activity detection
- Rate limiting effectiveness

### 2. API Security
- Unusual request patterns
- DDoS protection monitoring
- SQL injection attempt detection

### 3. Data Protection
- Encryption status monitoring
- PII access logging
- GDPR compliance tracking

## Setup Instructions

### 1. Environment Variables
```bash
# Monitoring Configuration
SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token
LOGROCKET_APP_ID=your_logrocket_app_id

# Alert Configuration
SLACK_WEBHOOK_URL=your_slack_webhook_url
ALERT_EMAIL=alerts@lazygamedevs.com
SMS_API_KEY=your_sms_provider_key
```

### 2. Vercel Integration
1. Enable Vercel Analytics in dashboard
2. Configure function monitoring
3. Set up log streaming to external service

### 3. Database Monitoring
1. Enable Neon monitoring features
2. Configure slow query alerts
3. Set up connection pool monitoring

## Metrics Collection

### 1. Video Streaming Metrics
- **Play Events**: Track when videos start playing
- **Pause Events**: Monitor user engagement patterns
- **Seek Events**: Analyze user viewing behavior
- **Quality Changes**: Monitor network adaptation
- **Completion Rates**: Track course effectiveness

### 2. Performance Metrics
- **Page Load Times**: Monitor application performance
- **API Response Times**: Track backend performance
- **Video Buffer Times**: Monitor streaming quality
- **Error Rates**: Track system reliability

### 3. Business Metrics
- **User Engagement**: Time spent in platform
- **Course Completion**: Learning effectiveness
- **Feature Usage**: Popular platform features
- **Revenue Metrics**: Subscription and purchase tracking

## Troubleshooting Guide

### Common Issues
1. **High Error Rates**: Check database connections and API limits
2. **Slow Video Loading**: Verify CDN performance and network quality
3. **Authentication Issues**: Check NextAuth configuration and JWT secrets
4. **Database Timeouts**: Monitor connection pool and query performance

### Debug Commands
```bash
# Check Vercel logs
npx vercel logs

# Test API endpoints
node scripts/test-video-apis.js production

# Monitor database performance
npx prisma studio

# Check Redis status
# (Monitoring commands depend on Redis provider)
```

## Next Steps
1. Implement Sentry error tracking
2. Set up custom monitoring dashboard
3. Configure alert rules and notifications
4. Implement automated health checks
5. Create monitoring runbooks for common issues