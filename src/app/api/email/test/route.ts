/**
 * Test Email API
 * POST /api/email/test
 *
 * Send a test email to verify email service configuration
 * Development/testing only
 */

import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/service';
import { EmailCategory } from '@/lib/email/types';
import { getEmailConfig } from '@/lib/email/config';

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { to, testType = 'basic' } = body;

    // Validate recipient
    if (!to || typeof to !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Recipient email (to) is required',
        },
        { status: 400 }
      );
    }

    // Get config
    const config = getEmailConfig();

    // Build test email content based on type
    let subject: string;
    let html: string;
    let text: string;
    let category: EmailCategory;

    switch (testType) {
      case 'welcome':
        subject = '🎮 Welcome to LazyGameDevs!';
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #6366f1;">Welcome to LazyGameDevs!</h1>
            <p>Hi there,</p>
            <p>This is a test welcome email from the LazyGameDevs platform.</p>
            <p>If you're seeing this, the email service is working correctly! 🎉</p>
            <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-radius: 8px;">
              <h3 style="margin-top: 0;">Test Details</h3>
              <ul style="list-style: none; padding: 0;">
                <li><strong>Provider:</strong> ${config.EMAIL_PROVIDER}</li>
                <li><strong>From:</strong> ${config.MAIL_FROM_EMAIL}</li>
                <li><strong>Dry Run:</strong> ${config.EMAIL_DRY_RUN ? 'Yes' : 'No'}</li>
                <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
              </ul>
            </div>
            <p>Happy game development! 🚀</p>
            <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
              This is a test email from LazyGameDevs GameLearn Platform
            </p>
          </div>
        `;
        text = `
Welcome to LazyGameDevs!

Hi there,

This is a test welcome email from the LazyGameDevs platform.
If you're seeing this, the email service is working correctly!

Test Details:
- Provider: ${config.EMAIL_PROVIDER}
- From: ${config.MAIL_FROM_EMAIL}
- Dry Run: ${config.EMAIL_DRY_RUN ? 'Yes' : 'No'}
- Timestamp: ${new Date().toISOString()}

Happy game development!

This is a test email from LazyGameDevs GameLearn Platform
        `;
        category = EmailCategory.TRANSACTIONAL_GENERAL;
        break;

      case 'rich':
        subject = '🎨 Rich Test Email - LazyGameDevs';
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #f9fafb;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 0;">
                    <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 8px 8px 0 0;">
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-family: Arial, sans-serif;">
                            🎮 LazyGameDevs
                          </h1>
                        </td>
                      </tr>
                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <h2 style="margin: 0 0 20px; color: #111827; font-family: Arial, sans-serif;">
                            Rich Test Email
                          </h2>
                          <p style="margin: 0 0 15px; color: #374151; font-size: 16px; line-height: 1.6; font-family: Arial, sans-serif;">
                            This is a rich HTML test email with styling and layout.
                          </p>
                          <div style="margin: 30px 0; padding: 20px; background-color: #f3f4f6; border-left: 4px solid #6366f1; border-radius: 4px;">
                            <p style="margin: 0 0 10px; color: #111827; font-weight: bold;">✅ Email Service Status</p>
                            <p style="margin: 0; color: #6b7280; font-size: 14px;">All systems operational</p>
                          </div>
                          <table role="presentation" style="width: 100%; margin: 30px 0;">
                            <tr>
                              <td style="padding: 15px; background-color: #fef3c7; border-radius: 4px;">
                                <strong>Provider:</strong> ${config.EMAIL_PROVIDER.toUpperCase()}
                              </td>
                            </tr>
                            <tr>
                              <td style="padding: 15px; background-color: #dbeafe; border-radius: 4px;">
                                <strong>Mode:</strong> ${config.EMAIL_DRY_RUN ? 'Dry Run' : 'Live'}
                              </td>
                            </tr>
                          </table>
                          <div style="text-align: center; margin: 40px 0 20px;">
                            <a href="${config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}" style="display: inline-block; padding: 14px 28px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold; font-family: Arial, sans-serif;">
                              Visit Platform
                            </a>
                          </div>
                        </td>
                      </tr>
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 20px 40px; background-color: #f9fafb; border-radius: 0 0 8px 8px; text-align: center;">
                          <p style="margin: 0; color: #6b7280; font-size: 12px; font-family: Arial, sans-serif;">
                            © ${new Date().getFullYear()} LazyGameDevs. All rights reserved.
                          </p>
                          <p style="margin: 5px 0 0; color: #9ca3af; font-size: 11px; font-family: Arial, sans-serif;">
                            Test email sent at ${new Date().toLocaleString()}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `;
        text = `
LazyGameDevs - Rich Test Email

This is a rich HTML test email with styling and layout.

✅ Email Service Status
All systems operational

Provider: ${config.EMAIL_PROVIDER.toUpperCase()}
Mode: ${config.EMAIL_DRY_RUN ? 'Dry Run' : 'Live'}

Visit Platform: ${config.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}

© ${new Date().getFullYear()} LazyGameDevs. All rights reserved.
Test email sent at ${new Date().toLocaleString()}
        `;
        category = EmailCategory.TRANSACTIONAL_GENERAL;
        break;

      case 'basic':
      default:
        subject = '✅ Test Email - LazyGameDevs';
        html = `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Service Test</h2>
            <p>This is a basic test email from LazyGameDevs.</p>
            <p><strong>Provider:</strong> ${config.EMAIL_PROVIDER}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Dry Run:</strong> ${config.EMAIL_DRY_RUN ? 'Yes' : 'No'}</p>
          </div>
        `;
        text = `
Email Service Test

This is a basic test email from LazyGameDevs.

Provider: ${config.EMAIL_PROVIDER}
Timestamp: ${new Date().toISOString()}
Dry Run: ${config.EMAIL_DRY_RUN ? 'Yes' : 'No'}
        `;
        category = EmailCategory.TRANSACTIONAL_GENERAL;
    }

    // Send the test email
    const result = await sendEmail({
      to,
      subject,
      html,
      text,
      category,
      correlationId: `test-${Date.now()}`,
      tags: [
        { name: 'test', value: 'true' },
        { name: 'test_type', value: testType },
      ],
    });

    // Return response
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        details: {
          messageId: result.messageId,
          provider: result.provider,
          to,
          subject,
          testType,
          dryRun: config.EMAIL_DRY_RUN,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          provider: result.provider,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[Test Email API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send test email',
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/email/test',
    method: 'POST',
    description: 'Send a test email to verify email service configuration',
    body: {
      to: 'recipient@example.com (required)',
      testType: 'basic | welcome | rich (optional, default: basic)',
    },
    example: {
      to: 'test@example.com',
      testType: 'welcome',
    },
  });
}
