/**
 * Email Template Registry and Renderer
 *
 * Central registry for all email templates with rendering capabilities
 */

import { render } from '@react-email/render';
import {
  EmailTemplateKey,
  EmailTemplateData,
  WelcomeEmailData,
  EnrollmentEmailData,
  PaymentReceiptEmailData,
  LicenseKeyEmailData,
  ProgressMilestoneEmailData,
  CertificateEmailData,
  EmailCategory,
} from '../types';

// Import all templates
import { WelcomeEmail } from './WelcomeEmail';
import { EnrollmentEmail } from './EnrollmentEmail';
import { PaymentReceiptEmail } from './PaymentReceiptEmail';
import { LicenseKeyEmail } from './LicenseKeyEmail';
import { ProgressMilestoneEmail } from './ProgressMilestoneEmail';
import { CertificateEmail } from './CertificateEmail';

/**
 * Template metadata interface
 */
export interface TemplateMetadata {
  key: EmailTemplateKey;
  name: string;
  description: string;
  category: EmailCategory;
  defaultSubject: string;
  component: React.ComponentType<{ data: any }>;
}

/**
 * Email template registry
 * Maps template keys to their metadata and React components
 */
export const emailTemplateRegistry: Record<EmailTemplateKey, TemplateMetadata> = {
  welcome: {
    key: 'welcome',
    name: 'Welcome Email',
    description: 'Sent to new users when they sign up',
    category: EmailCategory.TRANSACTIONAL_GENERAL,
    defaultSubject: '🎮 Welcome to LazyGameDevs!',
    component: WelcomeEmail,
  },
  enrollment: {
    key: 'enrollment',
    name: 'Enrollment Confirmation',
    description: 'Sent when a user enrolls in a course',
    category: EmailCategory.TRANSACTIONAL_ENROLLMENT,
    defaultSubject: "You're enrolled! Start learning today",
    component: EnrollmentEmail,
  },
  'payment-receipt': {
    key: 'payment-receipt',
    name: 'Payment Receipt',
    description: 'Sent when a payment is completed successfully',
    category: EmailCategory.TRANSACTIONAL_BILLING,
    defaultSubject: 'Payment receipt - Your purchase is complete',
    component: PaymentReceiptEmail,
  },
  'license-key': {
    key: 'license-key',
    name: 'License Key Delivery',
    description: 'Sent with course license key after purchase',
    category: EmailCategory.TRANSACTIONAL_ENROLLMENT,
    defaultSubject: '🔑 Your course license key is ready',
    component: LicenseKeyEmail,
  },
  'progress-milestone': {
    key: 'progress-milestone',
    name: 'Progress Milestone',
    description: 'Sent when a user reaches a course progress milestone',
    category: EmailCategory.TRANSACTIONAL_PROGRESS,
    defaultSubject: 'Milestone reached! Keep up the great work',
    component: ProgressMilestoneEmail,
  },
  certificate: {
    key: 'certificate',
    name: 'Certificate Delivery',
    description: 'Sent when a certificate is ready for download',
    category: EmailCategory.TRANSACTIONAL_CERTIFICATE,
    defaultSubject: '🎓 Your certificate is ready!',
    component: CertificateEmail,
  },
};

/**
 * Render result interface
 */
export interface RenderResult {
  html: string;
  text: string;
  subject: string;
  category: EmailCategory;
}

/**
 * Render an email template to HTML and plain text
 */
export async function renderEmailTemplate(
  templateKey: EmailTemplateKey,
  data: EmailTemplateData,
  customSubject?: string
): Promise<RenderResult> {
  try {
    // Get template metadata
    const template = emailTemplateRegistry[templateKey];

    if (!template) {
      throw new Error(`Template not found: ${templateKey}`);
    }

    // Get the component
    const Component = template.component;

    // Render HTML
    const html = render(<Component data={data} />, {
      pretty: true,
    });

    // Render plain text
    const text = render(<Component data={data} />, {
      plainText: true,
    });

    return {
      html,
      text,
      subject: customSubject || template.defaultSubject,
      category: template.category,
    };
  } catch (error) {
    console.error(`[Email Template] Error rendering ${templateKey}:`, error);
    throw new Error(
      `Failed to render email template ${templateKey}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Render only HTML for a template
 */
export async function renderEmailHtml(
  templateKey: EmailTemplateKey,
  data: EmailTemplateData
): Promise<string> {
  const template = emailTemplateRegistry[templateKey];

  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  const Component = template.component;

  return render(<Component data={data} />, {
    pretty: true,
  });
}

/**
 * Render only plain text for a template
 */
export async function renderEmailText(
  templateKey: EmailTemplateKey,
  data: EmailTemplateData
): Promise<string> {
  const template = emailTemplateRegistry[templateKey];

  if (!template) {
    throw new Error(`Template not found: ${templateKey}`);
  }

  const Component = template.component;

  return render(<Component data={data} />, {
    plainText: true,
  });
}

/**
 * Get template metadata by key
 */
export function getTemplateMetadata(
  templateKey: EmailTemplateKey
): TemplateMetadata | undefined {
  return emailTemplateRegistry[templateKey];
}

/**
 * Get all available templates
 */
export function getAllTemplates(): TemplateMetadata[] {
  return Object.values(emailTemplateRegistry);
}

/**
 * Check if a template exists
 */
export function templateExists(templateKey: string): templateKey is EmailTemplateKey {
  return templateKey in emailTemplateRegistry;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(
  category: EmailCategory
): TemplateMetadata[] {
  return Object.values(emailTemplateRegistry).filter(
    (template) => template.category === category
  );
}

/**
 * Type-safe template data validators
 */
export const templateDataValidators = {
  welcome: (data: EmailTemplateData): data is WelcomeEmailData => {
    return (
      'userName' in data && 'userEmail' in data && 'loginUrl' in data
    );
  },
  enrollment: (data: EmailTemplateData): data is EnrollmentEmailData => {
    return (
      'userName' in data &&
      'courseName' in data &&
      'courseUrl' in data &&
      'instructorName' in data &&
      'enrollmentDate' in data
    );
  },
  'payment-receipt': (data: EmailTemplateData): data is PaymentReceiptEmailData => {
    return (
      'userName' in data &&
      'courseName' in data &&
      'amount' in data &&
      'currency' in data &&
      'paymentDate' in data &&
      'transactionId' in data &&
      'items' in data &&
      'subtotal' in data &&
      'total' in data
    );
  },
  'license-key': (data: EmailTemplateData): data is LicenseKeyEmailData => {
    return (
      'userName' in data &&
      'courseName' in data &&
      'licenseKey' in data &&
      'activationUrl' in data
    );
  },
  'progress-milestone': (data: EmailTemplateData): data is ProgressMilestoneEmailData => {
    return (
      'userName' in data &&
      'courseName' in data &&
      'courseUrl' in data &&
      'percentComplete' in data &&
      'milestone' in data &&
      'lessonsCompleted' in data &&
      'totalLessons' in data
    );
  },
  certificate: (data: EmailTemplateData): data is CertificateEmailData => {
    return (
      'userName' in data &&
      'courseName' in data &&
      'certificateUrl' in data &&
      'completionDate' in data &&
      'certificateId' in data &&
      'instructorName' in data
    );
  },
};

/**
 * Validate template data
 */
export function validateTemplateData(
  templateKey: EmailTemplateKey,
  data: EmailTemplateData
): boolean {
  const validator = templateDataValidators[templateKey];
  return validator ? validator(data) : false;
}
