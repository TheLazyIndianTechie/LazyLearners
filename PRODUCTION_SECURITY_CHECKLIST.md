# Production Security Checklist

## Critical Security Requirements

### 🔒 Authentication & Authorization
- [ ] **Clerk Production Keys**: Replace all test keys with production keys
  - [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_live_`
  - [ ] `CLERK_SECRET_KEY` starts with `sk_live_`
  - [ ] `CLERK_WEBHOOK_SECRET` configured for production webhook endpoint
- [ ] **OAuth Providers**: Update redirect URIs for production domain
  - [ ] Google OAuth: Add production domain to authorized origins
  - [ ] GitHub OAuth: Update authorization callback URL
  - [ ] Microsoft OAuth: Configure production redirect URIs

### 🛡️ Encryption & Secrets
- [ ] **JWT_SECRET**: Generate new 64+ character secure secret
  ```bash
  openssl rand -base64 64
  ```
- [ ] **ENCRYPTION_KEY**: Generate new 32+ character encryption key
  ```bash
  openssl rand -base64 32
  ```
- [ ] **Database Secrets**: Use strong passwords (20+ characters)
- [ ] **API Keys**: All production API keys configured (no test keys)

### 🔐 Database Security
- [ ] **SSL/TLS**: Database connection uses SSL (`?sslmode=require`)
- [ ] **Connection Pooling**: `DATABASE_POOL_SIZE=20` for production load
- [ ] **Timeout Settings**: `DATABASE_TIMEOUT=15000` (15 seconds)
- [ ] **Access Control**: Database user has minimal required permissions
- [ ] **Network Security**: Database accessible only from Vercel IPs

### 🌐 Network Security
- [ ] **HTTPS Only**: All connections use TLS 1.2+
- [ ] **CORS Configuration**: `CORS_ORIGINS` includes only trusted domains
- [ ] **Rate Limiting**: Enabled with production-appropriate limits
- [ ] **Security Headers**: CSP, HSTS, X-Frame-Options configured
- [ ] **Webhook Security**: All webhook signatures verified

### 💳 Payment Security
- [ ] **Dodo Payments**: Production API keys and webhook secrets
  - [ ] `DODO_ENVIRONMENT=live`
  - [ ] `DODO_API_KEY` is production key
  - [ ] `DODO_WEBHOOK_SECRET` is production webhook secret
- [ ] **Webhook Endpoints**: Production URLs configured in payment provider
- [ ] **PCI Compliance**: No card data stored or logged
- [ ] **Payment Validation**: All transactions verified server-side

### 📊 Monitoring & Logging
- [ ] **Error Tracking**: Sentry or equivalent configured
- [ ] **Log Level**: Set to `info` or `warn` (not `debug`)
- [ ] **Security Monitoring**: Audit logs enabled
- [ ] **Performance Monitoring**: APM tool configured
- [ ] **Uptime Monitoring**: Health check endpoints monitored

### 🏗️ Infrastructure Security
- [ ] **Environment Variables**: No secrets in code or git
- [ ] **Vercel Security**: Environment variables configured in Vercel dashboard
- [ ] **CDN Security**: Asset delivery over HTTPS
- [ ] **Redis Security**: Connection over SSL (`rediss://`)
- [ ] **Backup Strategy**: Database backups automated and tested

## Security Configuration Validation

### Environment Variables Audit
```bash
# Verify no development secrets in production
grep -i "test\|dev\|local" .env.production.template
# Should return no results

# Check for placeholder values
grep -i "your_\|replace_\|example" .env.production.template
# Should return no results after configuration
```

### Network Security Test
```bash
# Test rate limiting
curl -X POST https://your-domain.vercel.app/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{}' \
  --rate 10/s

# Test CORS
curl -H "Origin: https://malicious-site.com" \
  https://your-domain.vercel.app/api/courses

# Test security headers
curl -I https://your-domain.vercel.app/
```

### Database Security Test
```bash
# Verify SSL connection
psql "postgresql://user:pass@host:port/db?sslmode=require" -c "\conninfo"

# Test connection limits
# Monitor active connections during load test
```

## Production Deployment Security

### Pre-Deployment Checklist
- [ ] All environment variables configured in Vercel
- [ ] No test/development keys in production
- [ ] Database migrations tested on staging
- [ ] SSL certificates valid and auto-renewing
- [ ] Monitoring alerts configured
- [ ] Incident response plan documented

### Post-Deployment Verification
- [ ] All API endpoints return expected responses
- [ ] Authentication flow works with production OAuth
- [ ] Payment processing works with real transactions
- [ ] Monitoring dashboards receiving data
- [ ] Security headers present in responses
- [ ] Error tracking receiving events

## Ongoing Security Maintenance

### Weekly Tasks
- [ ] Review error logs for security issues
- [ ] Check monitoring alerts and investigate anomalies
- [ ] Verify backup integrity
- [ ] Review access logs for unusual patterns

### Monthly Tasks
- [ ] Rotate JWT and encryption secrets
- [ ] Update dependencies with security patches
- [ ] Review and update CORS origins
- [ ] Audit user permissions and access levels

### Quarterly Tasks
- [ ] Penetration testing or security audit
- [ ] Review and update incident response procedures
- [ ] Database security assessment
- [ ] SSL certificate renewal (if not automated)

## Emergency Response

### Security Incident Response
1. **Immediate Actions**
   - Enable maintenance mode if needed
   - Rotate compromised secrets immediately
   - Review access logs for breach scope
   - Notify security team and stakeholders

2. **Investigation**
   - Preserve logs and evidence
   - Identify attack vector and timeline
   - Assess data exposure and user impact
   - Document findings and remediation steps

3. **Recovery**
   - Deploy security fixes
   - Reset user sessions if needed
   - Update monitoring and detection rules
   - Conduct post-incident review

### Contact Information
- **Security Team**: security@lazygamedevs.com
- **DevOps Team**: devops@lazygamedevs.com
- **Incident Response**: +1-XXX-XXX-XXXX

## Compliance Requirements

### Data Protection
- [ ] GDPR compliance for EU users
- [ ] User data encryption at rest and in transit
- [ ] Data retention and deletion policies
- [ ] User consent management

### Industry Standards
- [ ] OWASP Top 10 vulnerabilities addressed
- [ ] PCI DSS compliance for payment processing
- [ ] SOC 2 Type II controls (if applicable)
- [ ] ISO 27001 security controls (if applicable)

---

**Last Updated**: Production deployment date
**Next Review**: Monthly security review
**Owner**: Security Team, LazyGameDevs