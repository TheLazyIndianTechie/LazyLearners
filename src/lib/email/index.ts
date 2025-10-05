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
} from "./service";

// Configuration
export {
  getEmailConfig,
  getProviderConfig,
  isEmailConfigured,
  getActiveProvider,
  isDryRunMode,
  type EmailConfig,
} from "./config";

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
} from "./types";

// Providers
export { ResendProvider } from "./providers/resend";

// Templates
export {
  // Template components
  WelcomeEmail,
  EnrollmentEmail,
  PaymentReceiptEmail,
  LicenseKeyEmail,
  ProgressMilestoneEmail,
  CertificateEmail,
  // Registry and rendering
  emailTemplateRegistry,
  renderEmailTemplate,
  renderEmailHtml,
  renderEmailText,
  getTemplateMetadata,
  getAllTemplates,
  templateExists,
  getTemplatesByCategory,
  validateTemplateData,
  type TemplateMetadata,
  type RenderResult,
  // Theme
  emailTheme,
  emailStyles,
  type EmailTheme,
  type EmailStyles,
  // Components
  BaseLayout,
  Button,
  IconButton,
  type ButtonVariant,
  type ButtonSize,
} from "./templates";
