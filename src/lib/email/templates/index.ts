/**
 * Email Templates Index
 *
 * Central export point for all email templates, registry, and rendering utilities
 */

// Template components
export { WelcomeEmail } from './WelcomeEmail';
export { EnrollmentEmail } from './EnrollmentEmail';
export { PaymentReceiptEmail } from './PaymentReceiptEmail';
export { LicenseKeyEmail } from './LicenseKeyEmail';
export { ProgressMilestoneEmail } from './ProgressMilestoneEmail';
export { CertificateEmail } from './CertificateEmail';

// Template registry and rendering
export {
  emailTemplateRegistry,
  renderEmailTemplate,
  renderEmailHtml,
  renderEmailText,
  getTemplateMetadata,
  getAllTemplates,
  templateExists,
  getTemplatesByCategory,
  validateTemplateData,
  templateDataValidators,
  type TemplateMetadata,
  type RenderResult,
} from './registry';

// Theme
export { emailTheme, emailStyles, type EmailTheme, type EmailStyles } from './theme';

// Reusable components
export { BaseLayout } from './components/BaseLayout';
export { Button, IconButton, type ButtonVariant, type ButtonSize } from './components/Button';
