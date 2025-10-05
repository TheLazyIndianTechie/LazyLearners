# Email Service Setup Guide

## Overview

LazyGameDevs uses **Resend** as the primary email service provider for sending transactional and notification emails. This guide will help you set up and configure the email service.

## Why Resend?

- **Developer-friendly**: Modern API with excellent DX
- **React Email support**: Native integration for beautiful email templates
- **Free tier**: 3,000 emails/month (100/day)
- **Easy setup**: Streamlined domain verification
- **Webhooks**: Real-time delivery tracking
- **Reliable**: High deliverability rates

## Prerequisites

1. **Resend Account**: Sign up at [resend.com](https://resend.com)
2. **Custom Domain** (Optional but recommended for production)
3. **DNS Access** (For domain verification)

## Quick Start (Development)

### 1. Get Your Resend API Key

1. Sign up at [resend.com](https://resend.com)
2. Navigate to **API Keys** in the dashboard
3. Create a new API key
4. Copy the key (starts with `re_`)

### 2. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_your_api_key_here"

# From Email (use resend's test domain for development)
MAIL_FROM_EMAIL="onboarding@resend.dev"
MAIL_FROM_NAME="LazyGameDevs"

# Reply-To (optional)
MAIL_REPLY_TO="support@yourdomain.com"

# Feature Flags
EMAIL_DRY_RUN="false"  # Set to "true" to simulate emails without sending
```

### 3. Test the Email Service

Start your development server:

```bash
npm run dev
```

#### Test with API endpoint:

```bash
# Basic test
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "testType": "basic"}'

# Welcome email test
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "testType": "welcome"}'

# Rich HTML test
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to": "your-email@example.com", "testType": "rich"}'
```

#### Check health status:

```bash
curl http://localhost:3000/api/email/health
```

Expected response:
```json
{
  "success": true,
  "healthy": true,
  "provider": "resend",
  "dryRun": false,
  "latency": 45,
  "domain": {
    "verified": false,
    "spf": false,
    "dkim": false,
    "dmarc": false
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Production Setup

### 1. Add Your Custom Domain

1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `lazygamedevs.com`)
4. Follow the DNS configuration steps

### 2. Configure DNS Records

Add these DNS records to your domain:

#### SPF Record (TXT)
```
Host: @
Value: v=spf1 include:_spf.resend.com ~all
```

#### DKIM Record (TXT)
```
Host: resend._domainkey
Value: [Provided by Resend - copy from dashboard]
```

#### DMARC Record (TXT)
```
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@yourdomain.com
```

### 3. Verify Domain

1. Wait 24-48 hours for DNS propagation (usually faster)
2. Click **Verify** in Resend dashboard
3. Check verification status via API:

```bash
curl http://localhost:3000/api/email/health
```

Look for:
```json
{
  "domain": {
    "verified": true,
    "spf": true,
    "dkim": true,
    "dmarc": true
  }
}
```

### 4. Update Production Environment

Update your production environment variables (e.g., Vercel):

```env
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_production_key_here"
MAIL_FROM_EMAIL="noreply@lazygamedevs.com"
MAIL_FROM_NAME="LazyGameDevs"
MAIL_REPLY_TO="support@lazygamedevs.com"
EMAIL_DRY_RUN="false"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `EMAIL_PROVIDER` | No | `resend` | Email provider (`resend` or `sendgrid`) |
| `RESEND_API_KEY` | Yes* | - | Resend API key (starts with `re_`) |
| `MAIL_FROM_EMAIL` | No | `noreply@lazygamedevs.com` | Default sender email |
| `MAIL_FROM_NAME` | No | `LazyGameDevs` | Default sender name |
| `MAIL_REPLY_TO` | No | - | Reply-to email address |
| `EMAIL_DRY_RUN` | No | `false` | Simulate emails without sending |
| `NEXT_PUBLIC_APP_URL` | No | - | App URL for unsubscribe links |

*Required unless `EMAIL_DRY_RUN` is `true`

## Usage Examples

### Send a Simple Email

```typescript
import { sendEmail, EmailCategory } from '@/lib/email/service';

const result = await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to LazyGameDevs!',
  html: '<h1>Welcome!</h1><p>Thanks for joining.</p>',
  text: 'Welcome! Thanks for joining.',
  category: EmailCategory.TRANSACTIONAL_GENERAL,
});

if (result.success) {
  console.log('Email sent:', result.messageId);
} else {
  console.error('Email failed:', result.error);
}
```

### Send with Custom From Address

```typescript
await sendEmail({
  to: 'user@example.com',
  from: {
    email: 'courses@lazygamedevs.com',
    name: 'LazyGameDevs Courses'
  },
  subject: 'New Course Available',
  html: '<p>Check out our new course!</p>',
  text: 'Check out our new course!',
});
```

### Send with Attachments

```typescript
await sendEmail({
  to: 'user@example.com',
  subject: 'Your Certificate',
  html: '<p>Congratulations! Your certificate is attached.</p>',
  text: 'Congratulations! Your certificate is attached.',
  attachments: [
    {
      filename: 'certificate.pdf',
      content: certificateBuffer,
      contentType: 'application/pdf',
    }
  ],
});
```

### Check Service Health

```typescript
import { checkEmailHealth } from '@/lib/email/service';

const health = await checkEmailHealth();
console.log('Email service healthy:', health.healthy);
console.log('Provider:', health.provider);
console.log('Latency:', health.latency, 'ms');
```

## Dry Run Mode

For testing without sending actual emails:

```env
EMAIL_DRY_RUN="true"
```

In dry run mode:
- No actual emails are sent
- All operations are logged to console
- Success responses are returned with mock message IDs
- Useful for CI/CD and testing

## Email Categories

The system uses categories for preference management:

- `TRANSACTIONAL_ENROLLMENT` - Course enrollment confirmations
- `TRANSACTIONAL_BILLING` - Payment receipts, invoices
- `TRANSACTIONAL_PROGRESS` - Progress milestones
- `TRANSACTIONAL_CERTIFICATE` - Certificate delivery
- `TRANSACTIONAL_GENERAL` - Critical transactional (always sent)
- `PRODUCT_UPDATES` - Product announcements
- `MARKETING` - Marketing emails

## Troubleshooting

### Email Not Sending

1. **Check API Key**: Verify `RESEND_API_KEY` is correct
2. **Check Dry Run**: Ensure `EMAIL_DRY_RUN` is `false`
3. **Check Health**: Visit `/api/email/health`
4. **Check Logs**: Look for errors in console/logs

### Domain Not Verified

1. **DNS Propagation**: Wait 24-48 hours
2. **Check Records**: Use `dig` or `nslookup`:
   ```bash
   dig TXT yourdomain.com
   dig TXT resend._domainkey.yourdomain.com
   dig TXT _dmarc.yourdomain.com
   ```
3. **Verify in Resend**: Click verify button in dashboard
4. **Contact Support**: If issues persist, contact Resend support

### Emails Going to Spam

1. **Verify Domain**: Ensure SPF, DKIM, DMARC are verified
2. **Warm Up**: Gradually increase sending volume
3. **Content Quality**: Avoid spam trigger words
4. **Unsubscribe Link**: Always include for non-transactional
5. **Test Score**: Use [mail-tester.com](https://www.mail-tester.com/)

### Rate Limiting

Free tier limits:
- 100 emails per day
- 3,000 emails per month

If you hit limits:
- Upgrade to paid plan
- Implement queue system (Task 24.3)
- Use batch sending

## Testing Email Templates

### Using React Email Preview

```bash
# Start React Email preview server (coming in Task 24.2)
npm run email:preview
```

### Using Resend Dashboard

1. Go to Resend Dashboard → **Emails**
2. View all sent emails
3. Click any email to see HTML/text versions
4. Check delivery status

### Using Test Endpoint

```bash
# Test different email types
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "testType": "welcome"
  }'
```

Available test types:
- `basic` - Simple text email
- `welcome` - Welcome email with branding
- `rich` - Rich HTML email with full styling

## Security Best Practices

1. **API Key Security**
   - Never commit API keys to git
   - Use environment variables
   - Rotate keys periodically
   - Use different keys for dev/prod

2. **Email Validation**
   - Validate all recipient addresses
   - Sanitize user input in templates
   - Prevent email injection attacks

3. **Rate Limiting**
   - Implement per-user sending limits
   - Monitor for abuse
   - Use queue system for bulk sends

4. **Compliance**
   - Include unsubscribe links (non-transactional)
   - Honor unsubscribe requests immediately
   - Include physical address (CAN-SPAM)
   - Provide privacy policy link

## Next Steps

- **Task 24.2**: Implement React Email templates
- **Task 24.3**: Set up BullMQ email queue
- **Task 24.4**: Configure webhooks for tracking
- **Task 24.5**: Build preference management system

## Support

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Resend Support**: support@resend.com
- **LazyGameDevs**: Check project documentation

## Free Tier Limits

| Feature | Free Tier | Paid Plans |
|---------|-----------|------------|
| Emails/month | 3,000 | Unlimited |
| Emails/day | 100 | Unlimited |
| Domains | 1 | Unlimited |
| API Calls | Unlimited | Unlimited |
| Webhooks | ✅ Included | ✅ Included |
| Support | Community | Priority |

Paid plans start at $20/month for 50,000 emails.