/**
 * Email Service Configuration
 *
 * Environment-based configuration with Zod validation
 */

import { z } from 'zod';
import { EmailProvider, EmailProviderConfig } from './types';

// Email environment variables schema
const emailEnvSchema = z.object({
  // Provider selection
  EMAIL_PROVIDER: z.enum(['resend', 'sendgrid']).default('resend'),

  // Resend configuration
  RESEND_API_KEY: z.string().optional(),

  // SendGrid configuration (for future support)
  SENDGRID_API_KEY: z.string().optional(),

  // From email configuration
  MAIL_FROM_EMAIL: z.string().email().default('noreply@lazygamedevs.com'),
  MAIL_FROM_NAME: z.string().default('LazyGameDevs'),

  // Reply-to configuration
  MAIL_REPLY_TO: z.string().email().optional(),

  // Feature flags
  EMAIL_DRY_RUN: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  // App URL for unsubscribe links
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

// Parsed email configuration type
export type EmailConfig = z.infer<typeof emailEnvSchema>;

/**
 * Parse and validate email configuration from environment
 */
export function getEmailConfig(): EmailConfig {
  try {
    const config = emailEnvSchema.parse({
      EMAIL_PROVIDER: process.env.EMAIL_PROVIDER,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      SENDGRID_API_KEY: process.env.SENDGRID_API_KEY,
      MAIL_FROM_EMAIL: process.env.MAIL_FROM_EMAIL,
      MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
      MAIL_REPLY_TO: process.env.MAIL_REPLY_TO,
      EMAIL_DRY_RUN: process.env.EMAIL_DRY_RUN,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    });

    // Validate that the selected provider has an API key
    if (config.EMAIL_PROVIDER === 'resend' && !config.RESEND_API_KEY) {
      if (!config.EMAIL_DRY_RUN) {
        throw new Error(
          'RESEND_API_KEY is required when EMAIL_PROVIDER is "resend" and EMAIL_DRY_RUN is not enabled'
        );
      }
      console.warn(
        '[Email Config] Running in DRY RUN mode - no actual emails will be sent'
      );
    }

    if (config.EMAIL_PROVIDER === 'sendgrid' && !config.SENDGRID_API_KEY) {
      if (!config.EMAIL_DRY_RUN) {
        throw new Error(
          'SENDGRID_API_KEY is required when EMAIL_PROVIDER is "sendgrid" and EMAIL_DRY_RUN is not enabled'
        );
      }
      console.warn(
        '[Email Config] Running in DRY RUN mode - no actual emails will be sent'
      );
    }

    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[Email Config] Validation errors:', error.errors);
      throw new Error(
        `Email configuration validation failed: ${error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')}`
      );
    }
    throw error;
  }
}

/**
 * Build provider-specific configuration
 */
export function getProviderConfig(
  provider?: EmailProvider
): EmailProviderConfig {
  const config = getEmailConfig();
  const selectedProvider = provider || config.EMAIL_PROVIDER;

  if (selectedProvider === 'resend') {
    return {
      apiKey: config.RESEND_API_KEY || 'dry-run-key',
      fromEmail: config.MAIL_FROM_EMAIL,
      fromName: config.MAIL_FROM_NAME,
      replyToEmail: config.MAIL_REPLY_TO,
      dryRun: config.EMAIL_DRY_RUN || !config.RESEND_API_KEY,
    };
  }

  if (selectedProvider === 'sendgrid') {
    return {
      apiKey: config.SENDGRID_API_KEY || 'dry-run-key',
      fromEmail: config.MAIL_FROM_EMAIL,
      fromName: config.MAIL_FROM_NAME,
      replyToEmail: config.MAIL_REPLY_TO,
      dryRun: config.EMAIL_DRY_RUN || !config.SENDGRID_API_KEY,
    };
  }

  throw new Error(`Unsupported email provider: ${selectedProvider}`);
}

/**
 * Check if email service is properly configured
 */
export function isEmailConfigured(): boolean {
  try {
    const config = getEmailConfig();

    if (config.EMAIL_PROVIDER === 'resend') {
      return !!config.RESEND_API_KEY || config.EMAIL_DRY_RUN;
    }

    if (config.EMAIL_PROVIDER === 'sendgrid') {
      return !!config.SENDGRID_API_KEY || config.EMAIL_DRY_RUN;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get the active email provider
 */
export function getActiveProvider(): EmailProvider {
  const config = getEmailConfig();
  return config.EMAIL_PROVIDER;
}

/**
 * Check if running in dry-run mode
 */
export function isDryRunMode(): boolean {
  try {
    const config = getEmailConfig();
    return config.EMAIL_DRY_RUN;
  } catch {
    return true; // Default to dry-run if config fails
  }
}
