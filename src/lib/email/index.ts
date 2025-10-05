/**
 * Email Service
 *
 * Main entry point for email functionality
 */

// Service and utilities
export {
  EmailService,
  getEmailService,
  resetEmailService,
  sendEmail,
  checkEmailHealth,
  verifyEmailDomain,
  createEmailProvider,
} from './service';

// Configuration
export {
  getEmailConfig,
  getProviderConfig,
  isEmailConfigured,
  getActiveProvider,
  isDryRunMode,
  type EmailConfig,
} from './config';

// Types
export {
  type EmailProvider,
  type EmailAddress,
  type EmailAttachment,
  type EmailHeaders,
  type SendEmailOptions,
  type EmailSendResponse,
  type EmailHealthStatus,
  type EmailProviderConfig,
  type IEmailProvider,
  type EmailValidationResult,
  type EmailTemplateData,
  type WelcomeEmailData,
  type EnrollmentEmailData,
  type PaymentReceiptEmailData,
  type LicenseKeyEmailData,
  type ProgressMilestoneEmailData,
  type CertificateEmailData,
  type EmailTemplateKey,
  type EmailTemplate,
  EmailCategory,
} from './types';

// Providers
export { ResendProvider } from './providers/resend';
