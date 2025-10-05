/**
 * Email Service Types and Interfaces
 *
 * Provider-agnostic email types supporting Resend and SendGrid
 */

// Email providers
export type EmailProvider = 'resend' | 'sendgrid';

// Email address type
export interface EmailAddress {
  email: string;
  name?: string;
}

// Email attachment
export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  path?: string;
}

// Email headers
export interface EmailHeaders {
  [key: string]: string;
}

// Email categories for tracking
export enum EmailCategory {
  TRANSACTIONAL_ENROLLMENT = 'transactional.enrollment',
  TRANSACTIONAL_BILLING = 'transactional.billing',
  TRANSACTIONAL_PROGRESS = 'transactional.progress',
  TRANSACTIONAL_CERTIFICATE = 'transactional.certificate',
  TRANSACTIONAL_GENERAL = 'transactional.general',
  PRODUCT_UPDATES = 'product.updates',
  MARKETING = 'marketing',
}

// Email send options
export interface SendEmailOptions {
  to: string | EmailAddress | Array<string | EmailAddress>;
  from: string | EmailAddress;
  replyTo?: string | EmailAddress;
  subject: string;
  html: string;
  text?: string;
  cc?: string | EmailAddress | Array<string | EmailAddress>;
  bcc?: string | EmailAddress | Array<string | EmailAddress>;
  attachments?: EmailAttachment[];
  headers?: EmailHeaders;
  tags?: Array<{ name: string; value: string }>;
  category?: EmailCategory;
  customArgs?: Record<string, string>;
  scheduledAt?: Date;
  correlationId?: string;
}

// Email send response
export interface EmailSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: EmailProvider;
}

// Email provider health status
export interface EmailHealthStatus {
  healthy: boolean;
  provider: EmailProvider;
  latency?: number;
  error?: string;
  timestamp: Date;
}

// Email provider configuration
export interface EmailProviderConfig {
  apiKey: string;
  fromEmail: string;
  fromName?: string;
  replyToEmail?: string;
  dryRun?: boolean;
}

// Email provider interface
export interface IEmailProvider {
  readonly provider: EmailProvider;

  /**
   * Send an email
   */
  sendEmail(options: SendEmailOptions): Promise<EmailSendResponse>;

  /**
   * Health check
   */
  healthCheck(): Promise<EmailHealthStatus>;

  /**
   * Verify domain authentication
   */
  verifyDomain?(): Promise<{
    verified: boolean;
    spf: boolean;
    dkim: boolean;
    dmarc: boolean;
  }>;
}

// Email validation result
export interface EmailValidationResult {
  valid: boolean;
  errors: string[];
}

// Email template data payload (generic)
export interface EmailTemplateData {
  [key: string]: any;
}

// Specific template data interfaces
export interface WelcomeEmailData extends EmailTemplateData {
  userName: string;
  userEmail: string;
  loginUrl: string;
}

export interface EnrollmentEmailData extends EmailTemplateData {
  userName: string;
  courseName: string;
  courseUrl: string;
  instructorName: string;
  enrollmentDate: Date;
}

export interface PaymentReceiptEmailData extends EmailTemplateData {
  userName: string;
  courseName: string;
  amount: number;
  currency: string;
  paymentDate: Date;
  transactionId: string;
  invoiceUrl?: string;
  items: Array<{
    description: string;
    amount: number;
  }>;
  subtotal: number;
  tax?: number;
  total: number;
}

export interface LicenseKeyEmailData extends EmailTemplateData {
  userName: string;
  courseName: string;
  licenseKey: string;
  activationUrl: string;
  expiresAt?: Date;
}

export interface ProgressMilestoneEmailData extends EmailTemplateData {
  userName: string;
  courseName: string;
  courseUrl: string;
  percentComplete: number;
  milestone: 25 | 50 | 75 | 100;
  lessonsCompleted: number;
  totalLessons: number;
}

export interface CertificateEmailData extends EmailTemplateData {
  userName: string;
  courseName: string;
  certificateUrl: string;
  completionDate: Date;
  certificateId: string;
  instructorName: string;
}

// Email template registry
export type EmailTemplateKey =
  | 'welcome'
  | 'enrollment'
  | 'payment-receipt'
  | 'license-key'
  | 'progress-milestone'
  | 'certificate';

export interface EmailTemplate {
  key: EmailTemplateKey;
  subject: string;
  category: EmailCategory;
  render: (data: EmailTemplateData) => Promise<{ html: string; text: string }>;
}
