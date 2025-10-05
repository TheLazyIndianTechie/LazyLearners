#!/usr/bin/env node

/**
 * Email Service Test Script
 *
 * Tests Resend email service configuration and sends a test email
 * Usage: node test-email-service.mjs [your-email@example.com]
 */

import { Resend } from 'resend';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, '.env.local') });
config({ path: join(__dirname, '.env') });

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60));
}

async function testEmailService() {
  logSection('🔍 Email Service Configuration Test');

  // 1. Check environment variables
  log('\n📋 Checking Environment Variables...', 'cyan');

  const config = {
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'resend',
    MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL || 'onboarding@resend.dev',
    MAIL_FROM_NAME: process.env.MAIL_FROM_NAME || 'LazyGameDevs',
    EMAIL_DRY_RUN: process.env.EMAIL_DRY_RUN || 'false',
  };

  console.log(`   Provider: ${config.EMAIL_PROVIDER}`);
  console.log(`   From Email: ${config.MAIL_FROM_EMAIL}`);
  console.log(`   From Name: ${config.MAIL_FROM_NAME}`);
  console.log(`   Dry Run: ${config.EMAIL_DRY_RUN}`);
  console.log(`   API Key: ${config.RESEND_API_KEY ? `${config.RESEND_API_KEY.substring(0, 8)}...` : 'NOT SET'}`);

  if (!config.RESEND_API_KEY) {
    log('\n❌ ERROR: RESEND_API_KEY not found in environment variables', 'red');
    log('   Please add it to your .env.local file:', 'yellow');
    log('   RESEND_API_KEY="re_your_api_key_here"', 'yellow');
    process.exit(1);
  }

  if (!config.RESEND_API_KEY.startsWith('re_')) {
    log('\n⚠️  WARNING: RESEND_API_KEY should start with "re_"', 'yellow');
  }

  log('\n✅ Configuration looks good!', 'green');

  // 2. Initialize Resend client
  logSection('🔌 Initializing Resend Client');

  const resend = new Resend(config.RESEND_API_KEY);
  log('✅ Resend client initialized', 'green');

  // 3. Test API connectivity
  logSection('🏥 Testing API Health');

  try {
    log('   Checking connection to Resend API...', 'cyan');
    const startTime = Date.now();

    // Try to list domains (this validates the API key)
    const domains = await resend.domains.list();
    const latency = Date.now() - startTime;

    log(`✅ Connection successful! (${latency}ms)`, 'green');

    if (domains.data && domains.data.length > 0) {
      log(`   Found ${domains.data.length} domain(s):`, 'cyan');
      domains.data.forEach(domain => {
        const status = domain.status === 'verified' ? '✅' : '⏳';
        console.log(`   ${status} ${domain.name} (${domain.status})`);
      });
    } else {
      log('   No custom domains configured (using Resend test domain)', 'yellow');
    }
  } catch (error) {
    log(`❌ API Health Check Failed: ${error.message}`, 'red');
    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      log('   Your API key appears to be invalid', 'yellow');
    }
    process.exit(1);
  }

  // 4. Get recipient email
  const recipientEmail = process.argv[2];

  if (!recipientEmail) {
    log('\n⚠️  No recipient email provided', 'yellow');
    log('   Usage: node test-email-service.mjs your-email@example.com', 'cyan');
    log('   Skipping email send test...', 'yellow');

    logSection('✅ Configuration Test Complete');
    log('Email service is properly configured!', 'green');
    log('Run with an email address to test actual sending:', 'cyan');
    log('   node test-email-service.mjs your-email@example.com', 'bright');
    return;
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    log(`\n❌ Invalid email address: ${recipientEmail}`, 'red');
    process.exit(1);
  }

  // 5. Send test email
  logSection('📧 Sending Test Email');

  log(`   To: ${recipientEmail}`, 'cyan');
  log(`   From: ${config.MAIL_FROM_NAME} <${config.MAIL_FROM_EMAIL}>`, 'cyan');

  if (config.EMAIL_DRY_RUN === 'true') {
    log('\n⚠️  DRY RUN MODE: Email will not actually be sent', 'yellow');
    return;
  }

  try {
    log('   Sending email...', 'cyan');
    const startTime = Date.now();

    const result = await resend.emails.send({
      from: `${config.MAIL_FROM_NAME} <${config.MAIL_FROM_EMAIL}>`,
      to: recipientEmail,
      subject: '✅ Email Service Test - LazyGameDevs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🎮 LazyGameDevs</h1>
          </div>

          <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #111827; margin-top: 0;">✅ Email Service Test Successful!</h2>

            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Congratulations! Your email service is properly configured and working.
            </p>

            <div style="background: #f3f4f6; padding: 20px; border-radius: 6px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #111827;">📊 Test Details</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Provider:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">Resend</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>From:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">${config.MAIL_FROM_EMAIL}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Timestamp:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleString()}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #6b7280;"><strong>Test Type:</strong></td>
                  <td style="padding: 8px 0; color: #111827;">Configuration Validation</td>
                </tr>
              </table>
            </div>

            <div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 15px; border-radius: 4px; margin: 20px 0;">
              <p style="margin: 0; color: #166534;">
                <strong>✅ Success!</strong> You can now use the email service in your application.
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
              This test email was sent from the LazyGameDevs GameLearn Platform email service.
            </p>
          </div>

          <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
            © ${new Date().getFullYear()} LazyGameDevs. All rights reserved.
          </div>
        </div>
      `,
      text: `
Email Service Test Successful!

Congratulations! Your email service is properly configured and working.

Test Details:
- Provider: Resend
- From: ${config.MAIL_FROM_EMAIL}
- Timestamp: ${new Date().toLocaleString()}
- Test Type: Configuration Validation

✅ Success! You can now use the email service in your application.

This test email was sent from the LazyGameDevs GameLearn Platform email service.

© ${new Date().getFullYear()} LazyGameDevs. All rights reserved.
      `,
      tags: [
        { name: 'category', value: 'test' },
        { name: 'test_type', value: 'configuration' },
      ],
    });

    const latency = Date.now() - startTime;

    if (result.error) {
      log(`\n❌ Email Send Failed: ${result.error.message}`, 'red');
      console.error('Error details:', result.error);
      process.exit(1);
    }

    log(`\n✅ Email sent successfully! (${latency}ms)`, 'green');
    log(`   Message ID: ${result.data?.id || result.id}`, 'cyan');

    logSection('🎉 All Tests Passed!');
    log('Your email service is fully operational!', 'green');
    log('\nNext steps:', 'bright');
    log('1. Check your inbox for the test email', 'cyan');
    log('2. If not in inbox, check spam/junk folder', 'cyan');
    log('3. For production, configure your custom domain in Resend', 'cyan');
    log('4. Continue with Task 24.2 to build email templates', 'cyan');

  } catch (error) {
    log(`\n❌ Unexpected Error: ${error.message}`, 'red');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the test
testEmailService().catch(error => {
  log(`\n❌ Fatal Error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
